import type { DeviceLocation } from './location.types.ts';

export const LOCATION_CACHE_TTL_MS = 2 * 60 * 1000;

interface CachedLocation {
  location: DeviceLocation;
  storedAt: number;
}

let cached: CachedLocation | null = null;

export function storeLocation(location: DeviceLocation, now = Date.now()): void {
  cached = { location, storedAt: now };
}

export function readFreshLocation(
  now = Date.now(),
  ttlMs = LOCATION_CACHE_TTL_MS,
): DeviceLocation | null {
  if (!cached || now - cached.storedAt > ttlMs || now < cached.storedAt) return null;
  return cached.location;
}

export function clearLocationCache(): void {
  cached = null;
}
