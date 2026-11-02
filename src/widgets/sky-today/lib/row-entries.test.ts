import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { SkyTodayItem } from '../../../features/sky-guide/index.ts';
import { buildRowEntries, formatCountdown, groupForNow, sortItemsForDay } from './row-entries.ts';

const at = (iso: string) => new Date(iso);

function item(overrides: Partial<SkyTodayItem> & Pick<SkyTodayItem, 'id'>): SkyTodayItem {
  return {
    name: overrides.id,
    type: 'planet',
    status: 'down',
    nextChange: null,
    nextTransit: null,
    timeline: [],
    ...overrides,
  };
}

describe('buildRowEntries', () => {
  const mars = item({
    id: 'mars',
    nextTransit: {
      at: at('2026-11-02T04:00:00.000Z'),
      azimuthDegrees: 0,
      altitudeDegrees: 60,
      direction: 'N',
    },
    nextChange: {
      kind: 'rise',
      at: at('2026-11-02T00:00:00.000Z'),
      azimuthDegrees: 85,
      altitudeDegrees: 0,
      direction: 'L',
    },
    timeline: [
      {
        kind: 'rise',
        at: at('2026-11-02T00:00:00.000Z'),
        azimuthDegrees: 85,
        altitudeDegrees: 0,
        direction: 'L',
      },
    ],
  });

  it('lists the next changes in time order when showing the current moment', () => {
    assert.deepEqual(
      buildRowEntries(mars, false).map((entry) => entry.kind),
      ['rise', 'transit'],
    );
  });

  it('uses the whole timeline when browsing a date', () => {
    assert.equal(buildRowEntries(mars, true).length, 1);
  });
});

describe('formatCountdown', () => {
  const now = at('2026-11-02T00:00:00.000Z');

  it('formats minutes and hours', () => {
    assert.equal(formatCountdown(at('2026-11-02T00:25:00.000Z'), now), 'em 25 min');
    assert.equal(formatCountdown(at('2026-11-02T02:05:00.000Z'), now), 'em 2 h 05 min');
    assert.equal(formatCountdown(at('2026-11-02T03:00:00.000Z'), now), 'em 3 h');
  });

  it('returns null when the moment already passed', () => {
    assert.equal(formatCountdown(at('2026-11-01T23:59:00.000Z'), now), null);
  });
});

describe('groupForNow and sortItemsForDay', () => {
  const items = [
    item({ id: 'saturn', status: 'never-up' }),
    item({ id: 'jupiter', status: 'always-up' }),
    item({ id: 'mars', status: 'down' }),
    item({ id: 'moon', status: 'up' }),
  ];

  it('splits objects into visible, upcoming and unreachable', () => {
    const groups = groupForNow(items);
    assert.deepEqual(
      groups.visible.map((entry) => entry.id),
      ['jupiter', 'moon'],
    );
    assert.deepEqual(
      groups.upcoming.map((entry) => entry.id),
      ['mars'],
    );
    assert.deepEqual(
      groups.hidden.map((entry) => entry.id),
      ['saturn'],
    );
  });

  it('orders a browsed day by first event, with unreachable objects last', () => {
    const timeline = (iso: string) => [
      {
        kind: 'rise' as const,
        at: at(iso),
        azimuthDegrees: 90,
        altitudeDegrees: 0,
        direction: 'L',
      },
    ];
    const sorted = sortItemsForDay([
      item({ id: 'saturn', status: 'never-up' }),
      item({ id: 'venus', timeline: timeline('2026-11-02T20:00:00.000Z') }),
      item({ id: 'moon', timeline: timeline('2026-11-02T10:00:00.000Z') }),
      item({ id: 'jupiter', status: 'always-up' }),
    ]);

    assert.deepEqual(
      sorted.map((entry) => entry.id),
      ['jupiter', 'moon', 'venus', 'saturn'],
    );
  });
});
