import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { SkyGuidePositionsData } from '../../../shared/api/index.ts';
import { getSkyGuidePositions } from './sky-guide-api.ts';

describe('getSkyGuidePositions', () => {
  it('requests observer positions from the authenticated backend', async () => {
    let capturedPath = '';
    let capturedInit: RequestInit | undefined;
    const data: SkyGuidePositionsData = {
      observedAt: '2026-09-06T00:00:00.000Z',
      positions: [
        {
          id: 'jupiter',
          name: 'Júpiter',
          type: 'planet',
          magnitude: -2.1,
          horizontal: { altitudeDegrees: 42, azimuthDegrees: 315 },
          aboveHorizon: true,
        },
      ],
      unavailable: [{ id: 'moon', reason: 'PROVIDER_UNAVAILABLE' }],
    };
    const request = <T>(path: string, init?: RequestInit) => {
      capturedPath = path;
      capturedInit = init;
      return Promise.resolve({ data } as T);
    };
    const input = {
      objectIds: ['jupiter'],
      observedAt: '2026-09-06T00:00:00.000Z',
      observer: { latitudeDegrees: -23.55, longitudeDegrees: -46.63, elevationMeters: 760 },
    };

    const result = await getSkyGuidePositions('access-token', input, request);

    assert.equal(capturedPath, '/sky-guide/positions');
    assert.equal(capturedInit?.method, 'POST');
    assert.deepEqual(capturedInit?.headers, { Authorization: 'Bearer access-token' });
    assert.equal(capturedInit?.body, JSON.stringify(input));
    assert.equal(result.positions[0]?.id, 'jupiter');
    assert.equal(result.observedAt, data.observedAt);
    assert.deepEqual(result.unavailableObjectIds, ['moon']);
  });
});
