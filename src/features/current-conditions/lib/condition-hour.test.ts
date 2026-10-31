import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { HourlyConditions } from '../../../shared/api/index.ts';
import {
  chooseBestHour,
  describeFactor,
  describeSky,
  describeVisibility,
  toConditionHour,
} from './condition-hour.ts';

const hour: HourlyConditions = {
  forecastAt: '2026-10-13T01:00:00.000Z',
  sunAltitudeDegrees: -40,
  weather: {
    temperatureCelsius: 17.4,
    cloudCoverPercent: 12,
    precipitationProbabilityPercent: 5,
    visibilityMeters: 24_000,
    windSpeedKilometersPerHour: 9,
    relativeHumidityPercent: 61,
    precipitationMillimeters: null,
  },
  rating: 'good',
  factors: [
    { code: 'darkness', status: 'good' },
    { code: 'cloud-cover', status: 'good' },
  ],
};

describe('condition hours', () => {
  it('maps a forecast hour to the view model with derived labels', () => {
    const view = toConditionHour(hour);

    assert.equal(view.observedAt, hour.forecastAt);
    assert.equal(view.skyLabel, 'Limpo');
    assert.equal(view.visibilityLabel, 'Excelente');
    assert.equal(view.temperatureCelsius, 17.4);
  });

  it('keeps missing weather values as null and labels them unavailable', () => {
    const view = toConditionHour({ ...hour, weather: {} });

    assert.equal(view.temperatureCelsius, null);
    assert.equal(view.skyLabel, 'Indisponível');
    assert.equal(view.visibilityLabel, 'Indisponível');
  });

  it('describes sky and visibility ranges', () => {
    assert.equal(describeSky(35), 'Poucas nuvens');
    assert.equal(describeSky(70), 'Nublado em partes');
    assert.equal(describeSky(95), 'Nublado');
    assert.equal(describeVisibility(12_000), 'Boa');
    assert.equal(describeVisibility(5_000), 'Regular');
    assert.equal(describeVisibility(900), 'Baixa');
  });

  it('chooses the best hour by rating, then clouds, ignoring missing data last', () => {
    const clear = toConditionHour(hour);
    const cloudy = toConditionHour({
      ...hour,
      forecastAt: '2026-10-13T02:00:00.000Z',
      weather: { ...hour.weather, cloudCoverPercent: 40 },
    });
    const unknown = toConditionHour({
      ...hour,
      forecastAt: '2026-10-13T03:00:00.000Z',
      weather: {},
    });
    const worse = toConditionHour({
      ...hour,
      forecastAt: '2026-10-13T04:00:00.000Z',
      rating: 'fair',
    });

    assert.equal(chooseBestHour([worse, unknown, cloudy, clear])?.observedAt, clear.observedAt);
    assert.equal(chooseBestHour([unknown, cloudy])?.observedAt, cloudy.observedAt);
    assert.equal(chooseBestHour([]), null);
  });

  it('explains factors from the hour data and handles unknown status', () => {
    const view = toConditionHour(hour);

    assert.match(describeFactor({ code: 'cloud-cover', status: 'good' }, view), /12%/);
    assert.match(describeFactor({ code: 'wind', status: 'good' }, view), /9 km\/h/);
    assert.match(describeFactor({ code: 'darkness', status: 'poor' }, view), /Sol está acima/);
    assert.match(describeFactor({ code: 'humidity', status: 'unknown' }, view), /Sem dados/);
  });
});
