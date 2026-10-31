import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';

import type { DeviceLocation } from './location.types.ts';
import {
  LOCATION_CACHE_TTL_MS,
  clearLocationCache,
  readFreshLocation,
  storeLocation,
} from './location-cache.ts';

const location: DeviceLocation = {
  latitudeDegrees: -23.55,
  longitudeDegrees: -46.63,
  elevationMeters: 760,
  accuracyMeters: 12,
  timestamp: 1_000,
};

beforeEach(() => clearLocationCache());

test('location cache is empty until a location is stored', () => {
  assert.equal(readFreshLocation(1_000), null);
});

test('location cache returns a stored location within the ttl', () => {
  storeLocation(location, 1_000);

  assert.deepEqual(readFreshLocation(1_000 + LOCATION_CACHE_TTL_MS), location);
});

test('location cache expires after the ttl', () => {
  storeLocation(location, 1_000);

  assert.equal(readFreshLocation(1_001 + LOCATION_CACHE_TTL_MS), null);
});

test('location cache ignores entries stored in the future', () => {
  storeLocation(location, 5_000);

  assert.equal(readFreshLocation(1_000), null);
});

test('location cache can be cleared', () => {
  storeLocation(location, 1_000);
  clearLocationCache();

  assert.equal(readFreshLocation(1_000), null);
});
