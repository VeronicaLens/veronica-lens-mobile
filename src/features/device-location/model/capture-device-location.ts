import * as Location from 'expo-location';

import { captureCurrentLocation, type LocationSource } from './capture-current-location.ts';
import { storeLocation } from './location-cache.ts';

const expoLocationSource: LocationSource = {
  async requestPermission() {
    return (await Location.requestForegroundPermissionsAsync()).granted;
  },
  hasServicesEnabled: () => Location.hasServicesEnabledAsync(),
  async getPosition() {
    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      altitude: position.coords.altitude,
      accuracy: position.coords.accuracy,
      timestamp: position.timestamp,
    };
  },
  async reverseGeocode(latitude, longitude) {
    const [address] = await Location.reverseGeocodeAsync({ latitude, longitude });
    return address ?? null;
  },
};

/** Reads the device GPS and resolves the place name; the fix is shared with other screens. */
export async function captureDeviceLocation() {
  const result = await captureCurrentLocation(expoLocationSource);
  if (result.status === 'captured') storeLocation(result.location);
  return result;
}
