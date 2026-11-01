import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { SkyRiseSetData } from '../../../shared/api/index.ts';
import { getSkyRiseSet } from './rise-set-api.ts';

describe('getSkyRiseSet', () => {
  it('requests rise, transit and set times for the observer', async () => {
    let capturedPath = '';
    let capturedInit: RequestInit | undefined;
    const data: SkyRiseSetData = {
      from: '2026-09-06T12:00:00.000Z',
      to: '2026-09-07T12:00:00.000Z',
      objects: [
        {
          id: 'moon',
          name: 'Lua',
          type: 'moon',
          horizon: 'rises-and-sets',
          events: [
            {
              type: 'rise',
              at: '2026-09-06T20:00:00.000Z',
              azimuthDegrees: 80,
              altitudeDegrees: 0,
            },
          ],
        },
      ],
      unavailable: [],
    };
    const request = <T>(path: string, init?: RequestInit) => {
      capturedPath = path;
      capturedInit = init;
      return Promise.resolve({ data } as T);
    };
    const input = {
      objectIds: ['moon'],
      observer: { latitudeDegrees: -23.55, longitudeDegrees: -46.63, elevationMeters: 760 },
    };

    const result = await getSkyRiseSet('access-token', input, request);

    assert.equal(capturedPath, '/sky-guide/rise-set');
    assert.equal(capturedInit?.method, 'POST');
    assert.deepEqual(capturedInit?.headers, { Authorization: 'Bearer access-token' });
    assert.equal(capturedInit?.body, JSON.stringify(input));
    assert.equal(result.objects[0]?.id, 'moon');
  });
});
