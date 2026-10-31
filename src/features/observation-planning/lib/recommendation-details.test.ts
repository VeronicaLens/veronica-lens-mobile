import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { ObservationRecommendation } from '../../../shared/api/index.ts';
import { describeRecommendation } from './recommendation-details.ts';

const base: ObservationRecommendation = {
  objectId: 'moon',
  objectName: 'Moon',
  status: 'recommended',
  window: {
    from: '2026-10-13T00:00:00.000Z',
    to: '2026-10-13T02:00:00.000Z',
    peakAt: '2026-10-13T01:00:00.000Z',
    peakAltitudeDegrees: 61.6,
  },
  weatherAvailable: true,
  minimumAltitudeDegrees: 30,
  sampleIntervalMinutes: 30,
  rejections: { belowMinimumAltitude: 0, poorConditions: 0 },
  samples: [
    {
      at: '2026-10-13T00:00:00.000Z',
      altitudeDegrees: 50,
      sunAltitudeDegrees: -30,
      rating: 'good',
      favorable: true,
    },
    {
      at: '2026-10-13T00:30:00.000Z',
      altitudeDegrees: 20,
      sunAltitudeDegrees: -30,
      rating: 'poor',
      favorable: false,
    },
  ],
};

describe('describeRecommendation', () => {
  it('summarizes a recommended window with the rounded peak altitude', () => {
    const details = describeRecommendation(base);

    assert.equal(details.peakAltitudeDegrees, 62);
    assert.match(details.summary, /62°/);
    assert.equal(details.favorableSamples, 1);
    assert.equal(details.totalSamples, 2);
    assert.equal(details.limitingFactor, null);
  });

  it('explains a missing window by the dominant rejection reasons', () => {
    const noWindow = { ...base, status: 'no_favorable_window' as const, window: null };

    assert.equal(
      describeRecommendation({
        ...noWindow,
        rejections: { belowMinimumAltitude: 6, poorConditions: 0 },
      }).limitingFactor,
      'altitude',
    );
    assert.equal(
      describeRecommendation({
        ...noWindow,
        rejections: { belowMinimumAltitude: 0, poorConditions: 3 },
      }).limitingFactor,
      'weather',
    );
    assert.equal(
      describeRecommendation({
        ...noWindow,
        rejections: { belowMinimumAltitude: 2, poorConditions: 2 },
      }).limitingFactor,
      'both',
    );
  });

  it('mentions the minimum altitude when the object stays too low', () => {
    const details = describeRecommendation({
      ...base,
      status: 'no_favorable_window',
      window: null,
      rejections: { belowMinimumAltitude: 6, poorConditions: 0 },
    });

    assert.match(details.summary, /30°/);
    assert.equal(details.peakAltitudeDegrees, null);
  });

  it('reports insufficient data when nothing was rejected and there is no window', () => {
    const details = describeRecommendation({
      ...base,
      status: 'no_favorable_window',
      window: null,
    });

    assert.match(details.summary, /dados suficientes/);
    assert.equal(details.limitingFactor, null);
  });
});
