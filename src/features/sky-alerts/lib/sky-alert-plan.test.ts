import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { SkyRiseSetData } from '../../../shared/api/index.ts';
import { leadLabel, planSkyAlerts } from './sky-alert-plan.ts';

const observer = { latitudeDegrees: -23.55, longitudeDegrees: -46.63 };
const NOW = new Date('2026-01-15T12:00:00.000Z');
const formatTime = (value: Date) => value.toISOString().slice(11, 16);

function rise(id: string, name: string, type: 'moon' | 'planet', at: string, azimuth = 90) {
  return {
    id,
    name,
    type,
    horizon: 'rises-and-sets' as const,
    events: [{ type: 'rise' as const, at, azimuthDegrees: azimuth, altitudeDegrees: 0 }],
  };
}

function day(...objects: SkyRiseSetData['objects']): SkyRiseSetData {
  return { from: NOW.toISOString(), to: '2026-01-16T12:00:00.000Z', objects, unavailable: [] };
}

describe('planSkyAlerts', () => {
  it('schedules a night rise ahead of the event by the lead time', () => {
    const [alert] = planSkyAlerts({
      days: [day(rise('jupiter', 'Júpiter', 'planet', '2026-01-16T01:00:00.000Z', 80))],
      now: NOW,
      leadMinutes: 30,
      observer,
      formatTime,
    });

    assert.ok(alert);
    assert.equal(alert.triggerAt.toISOString(), '2026-01-16T00:30:00.000Z');
    assert.equal(alert.title, 'Júpiter nasce em 30 min');
    assert.equal(alert.body, 'Nasce às 01:00, na direção leste.');
  });

  it('skips objects that rise during the day', () => {
    const alerts = planSkyAlerts({
      days: [day(rise('mars', 'Marte', 'planet', '2026-01-15T17:00:00.000Z'))],
      now: NOW,
      leadMinutes: 30,
      observer,
      formatTime,
    });

    assert.deepEqual(alerts, []);
  });

  it('skips alerts whose trigger time already passed and non-planet objects', () => {
    const alerts = planSkyAlerts({
      days: [
        day(
          rise('venus', 'Vênus', 'planet', '2026-01-15T12:10:00.000Z'),
          rise('sirius', 'Sírius', 'planet', '2026-01-16T02:00:00.000Z'),
          {
            ...rise('orion', 'Órion', 'planet', '2026-01-16T02:00:00.000Z'),
            type: 'constellation',
          },
        ),
      ],
      now: new Date('2026-01-15T23:50:00.000Z'),
      leadMinutes: 30,
      observer,
      formatTime,
    });

    assert.deepEqual(
      alerts.map((alert) => alert.objectId),
      ['sirius'],
    );
  });

  it('orders alerts by trigger time and removes duplicates across windows', () => {
    const late = rise('saturn', 'Saturno', 'planet', '2026-01-16T05:00:00.000Z');
    const early = rise('moon', 'Lua', 'moon', '2026-01-16T01:00:00.000Z');
    const alerts = planSkyAlerts({
      days: [day(late, early), day(early)],
      now: NOW,
      leadMinutes: 60,
      observer,
      formatTime,
    });

    assert.deepEqual(
      alerts.map((alert) => alert.objectId),
      ['moon', 'saturn'],
    );
    assert.equal(alerts[0]?.title, 'Lua nasce em 1 h');
  });
});

describe('leadLabel', () => {
  it('uses minutes below one hour and hours otherwise', () => {
    assert.equal(leadLabel(15), '15 min');
    assert.equal(leadLabel(60), '1 h');
  });
});
