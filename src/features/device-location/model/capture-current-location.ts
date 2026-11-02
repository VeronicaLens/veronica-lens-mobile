import type { DeviceLocation } from './location.types.ts';
import { formatPlaceName, type GeocodedPlace } from './place-name.ts';

export interface DevicePosition {
  latitude: number;
  longitude: number;
  altitude: number | null;
  accuracy: number | null;
  timestamp: number;
}

/** Device capabilities needed to capture a location, injected so the flow is testable. */
export interface LocationSource {
  requestPermission(): Promise<boolean>;
  hasServicesEnabled(): Promise<boolean>;
  getPosition(): Promise<DevicePosition>;
  reverseGeocode(latitude: number, longitude: number): Promise<GeocodedPlace | null>;
}

export type CapturedLocation =
  | { status: 'captured'; location: DeviceLocation; placeName: string | null }
  | { status: 'permission-denied' | 'services-disabled' | 'unavailable'; message: string };

export async function captureCurrentLocation(source: LocationSource): Promise<CapturedLocation> {
  try {
    if (!(await source.requestPermission())) {
      return {
        status: 'permission-denied',
        message: 'Permita o acesso à localização para salvá-la no seu perfil.',
      };
    }
    if (!(await source.hasServicesEnabled())) {
      return {
        status: 'services-disabled',
        message: 'Ative a localização do aparelho e tente novamente.',
      };
    }

    const position = await source.getPosition();
    const place = await source
      .reverseGeocode(position.latitude, position.longitude)
      .catch(() => null);
    return {
      status: 'captured',
      location: {
        latitudeDegrees: position.latitude,
        longitudeDegrees: position.longitude,
        elevationMeters: position.altitude ?? 0,
        accuracyMeters: position.accuracy,
        timestamp: position.timestamp,
      },
      placeName: place ? formatPlaceName(place) : null,
    };
  } catch {
    return {
      status: 'unavailable',
      message: 'Não foi possível obter sua localização. Tente novamente.',
    };
  }
}
