import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type {
  ConditionsForecastResult,
  CurrentConditionsResult,
  HourlyConditions,
} from '../../../shared/api/index.ts';
import { getConditionsForecast, getCurrentConditions } from './current-conditions-api.ts';

const observer = { latitudeDegrees: -23.55, longitudeDegrees: -46.63, elevationMeters: 760 };

const hour: HourlyConditions = {
  forecastAt: '2026-10-04T00:00:00.000Z',
  sunAltitudeDegrees: -35,
  weather: { temperatureCelsius: 18, cloudCoverPercent: 10 },
  rating: 'good',
  factors: [{ code: 'darkness', status: 'good' }],
};

describe('current conditions API', () => {
  it('posts the observer to the authenticated current conditions endpoint', async () => {
    let path = '';
    let init: RequestInit | undefined;
    const current: CurrentConditionsResult = {
      requestedAt: '2026-10-04T00:00:00.000Z',
      conditions: hour,
    };
    const request = <T>(receivedPath: string, receivedInit?: RequestInit) => {
      path = receivedPath;
      init = receivedInit;
      return Promise.resolve({ data: current } as T);
    };

    const result = await getCurrentConditions('token', observer, undefined, request);

    assert.equal(path, '/conditions/current');
    assert.equal(init?.method, 'POST');
    assert.deepEqual(init?.headers, { Authorization: 'Bearer token' });
    assert.deepEqual(JSON.parse(String(init?.body)), { observer });
    assert.equal(result.conditions.rating, 'good');
  });

  it('sends a requested future time as an ISO timestamp in the body', async () => {
    let body: unknown;
    const request = <T>(_path: string, init?: RequestInit) => {
      body = JSON.parse(String(init?.body));
      return Promise.resolve({ data: { requestedAt: '', conditions: hour } } as T);
    };
    const requestedAt = '2026-10-04T22:00:00.000Z';

    await getCurrentConditions('token', observer, requestedAt, request);

    assert.deepEqual(body, { observer, at: requestedAt });
  });

  it('posts the observer to the hourly forecast endpoint', async () => {
    let path = '';
    let init: RequestInit | undefined;
    const forecast: ConditionsForecastResult = {
      from: '2026-10-04T00:00:00.000Z',
      to: '2026-10-11T00:00:00.000Z',
      hours: [hour],
    };
    const request = <T>(receivedPath: string, receivedInit?: RequestInit) => {
      path = receivedPath;
      init = receivedInit;
      return Promise.resolve({ data: forecast } as T);
    };

    const result = await getConditionsForecast('token', observer, request);

    assert.equal(path, '/conditions/forecast');
    assert.equal(init?.method, 'POST');
    assert.deepEqual(JSON.parse(String(init?.body)), { observer });
    assert.equal(result.hours.length, 1);
  });
});
