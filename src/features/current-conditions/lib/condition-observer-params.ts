import type { DeviceLocation } from '../../device-location/index.ts';

export interface ConditionObserverParams {
  [key: string]: string;
  latitude: string;
  longitude: string;
  elevation: string;
  accuracy: string;
  timestamp: string;
}

export function toConditionObserverParams(location: DeviceLocation): ConditionObserverParams {
  return {
    latitude: String(location.latitudeDegrees),
    longitude: String(location.longitudeDegrees),
    elevation: String(location.elevationMeters),
    accuracy: location.accuracyMeters === null ? '' : String(location.accuracyMeters),
    timestamp: String(location.timestamp),
  };
}

function toFiniteNumber(value: string | undefined): number | null {
  if (value === undefined || value.trim() === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function parseConditionObserverParams(
  params: Partial<Record<keyof ConditionObserverParams, string | string[]>>,
): DeviceLocation | null {
  const latitude = toFiniteNumber(firstValue(params.latitude));
  const longitude = toFiniteNumber(firstValue(params.longitude));
  if (latitude === null || longitude === null) return null;
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;

  return {
    latitudeDegrees: latitude,
    longitudeDegrees: longitude,
    elevationMeters: toFiniteNumber(firstValue(params.elevation)) ?? 0,
    accuracyMeters: toFiniteNumber(firstValue(params.accuracy)),
    timestamp: toFiniteNumber(firstValue(params.timestamp)) ?? Date.now(),
  };
}
