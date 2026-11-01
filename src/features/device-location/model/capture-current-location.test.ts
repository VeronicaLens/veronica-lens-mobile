import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { captureCurrentLocation, type LocationSource } from './capture-current-location.ts';

function source(overrides: Partial<LocationSource> = {}): LocationSource {
  return {
    requestPermission: async () => true,
    hasServicesEnabled: async () => true,
    getPosition: async () => ({
      latitude: -23.0902,
      longitude: -47.2172,
      altitude: 540,
      accuracy: 15,
      timestamp: 1_700_000_000_000,
    }),
    reverseGeocode: async () => ({
      city: 'Indaiatuba',
      district: null,
      subregion: null,
      region: 'São Paulo',
      country: 'Brasil',
      isoCountryCode: 'BR',
    }),
    ...overrides,
  };
}

describe('captureCurrentLocation', () => {
  it('captures the position and a friendly place name', async () => {
    const result = await captureCurrentLocation(source());

    assert.equal(result.status, 'captured');
    if (result.status !== 'captured') return;
    assert.equal(result.location.latitudeDegrees, -23.0902);
    assert.equal(result.location.elevationMeters, 540);
    assert.equal(result.placeName, 'Indaiatuba, SP · Brasil');
  });

  it('still captures the position when the place name cannot be resolved', async () => {
    const failing = await captureCurrentLocation(
      source({
        reverseGeocode: async () => {
          throw new Error('no network');
        },
      }),
    );
    const empty = await captureCurrentLocation(source({ reverseGeocode: async () => null }));

    assert.equal(failing.status === 'captured' && failing.placeName, null);
    assert.equal(empty.status === 'captured' && empty.placeName, null);
  });

  it('uses zero elevation when the device does not report altitude', async () => {
    const result = await captureCurrentLocation(
      source({
        getPosition: async () => ({
          latitude: 10,
          longitude: 20,
          altitude: null,
          accuracy: null,
          timestamp: 1,
        }),
      }),
    );

    assert.equal(result.status === 'captured' && result.location.elevationMeters, 0);
  });

  it('explains a denied permission without reading the position', async () => {
    let read = false;
    const result = await captureCurrentLocation(
      source({
        requestPermission: async () => false,
        getPosition: async () => {
          read = true;
          throw new Error('must not be called');
        },
      }),
    );

    assert.equal(result.status, 'permission-denied');
    assert.equal(read, false);
  });

  it('reports disabled location services', async () => {
    const result = await captureCurrentLocation(source({ hasServicesEnabled: async () => false }));

    assert.equal(result.status, 'services-disabled');
  });

  it('reports unavailable when reading the position fails', async () => {
    const result = await captureCurrentLocation(
      source({
        getPosition: async () => {
          throw new Error('timeout');
        },
      }),
    );

    assert.equal(result.status, 'unavailable');
  });
});
