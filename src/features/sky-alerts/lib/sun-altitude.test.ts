import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { sunAltitudeDegrees } from './sun-altitude.ts';

const saoPaulo = { latitudeDegrees: -23.55, longitudeDegrees: -46.63 };

describe('sunAltitudeDegrees', () => {
  it('puts the sun high around local noon in the southern summer', () => {
    // 15:30 UTC is about local solar noon in Sao Paulo (UTC-3, longitude -46.6).
    const altitude = sunAltitudeDegrees(new Date('2026-01-15T15:10:00.000Z'), saoPaulo);
    assert.ok(altitude > 85 && altitude < 90, `altitude ${altitude}`);
  });

  it('puts the sun well below the horizon at local midnight', () => {
    // Lower culmination: -(90 - |latitude + declination|) = about -45 degrees in mid-January.
    const altitude = sunAltitudeDegrees(new Date('2026-01-15T03:00:00.000Z'), saoPaulo);
    assert.ok(Math.abs(altitude + 45.2) < 1.0, `altitude ${altitude}`);
  });

  it('matches the winter noon altitude for the latitude and solar declination', () => {
    // On the June solstice the declination is +23.44, so noon altitude = 90 - (23.55 + 23.44).
    const altitude = sunAltitudeDegrees(new Date('2026-06-21T15:10:00.000Z'), saoPaulo);
    assert.ok(Math.abs(altitude - 43.0) < 1.0, `altitude ${altitude}`);
  });
});
