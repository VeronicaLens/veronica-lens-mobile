import assert from 'node:assert/strict';
import test from 'node:test';

import type { ObservationRecommendation } from '../../../shared/api/index.ts';
import { getObservationRecommendation } from './observation-planning-api.ts';

test('requests an authenticated observation recommendation', async () => {
  const input = {
    objectId: 'sirius',
    windowFrom: '2026-10-12T22:00:00.000Z',
    windowTo: '2026-10-13T22:00:00.000Z',
    observer: {
      latitudeDegrees: -23.5505,
      longitudeDegrees: -46.6333,
      elevationMeters: 760,
    },
    minimumAltitudeDegrees: 30,
  };
  const recommendation: ObservationRecommendation = {
    objectId: 'sirius',
    objectName: 'Sirius',
    status: 'recommended',
    window: {
      from: '2026-10-13T00:00:00.000Z',
      to: '2026-10-13T02:00:00.000Z',
      peakAt: '2026-10-13T01:00:00.000Z',
      peakAltitudeDegrees: 62,
    },
    weatherAvailable: true,
    minimumAltitudeDegrees: 30,
    sampleIntervalMinutes: 30,
    rejections: { belowMinimumAltitude: 4, poorConditions: 0 },
    samples: [],
  };
  let capturedPath = '';
  let capturedInit: RequestInit | undefined;
  const request = <T>(path: string, init?: RequestInit) => {
    capturedPath = path;
    capturedInit = init;
    return Promise.resolve({ data: recommendation } as T);
  };

  const result = await getObservationRecommendation('access-token', input, request);

  assert.deepEqual(result, recommendation);
  assert.equal(capturedPath, '/planning/recommendation');
  assert.equal(capturedInit?.method, 'POST');
  assert.deepEqual(capturedInit?.headers, { Authorization: 'Bearer access-token' });
  assert.deepEqual(JSON.parse(capturedInit?.body as string), input);
});
