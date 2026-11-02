import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { SkyRiseSetData } from '../../../shared/api/index.ts';
import { compassDirection, summarizeSkyToday } from './sky-today.ts';

const NOW = new Date('2026-09-06T18:00:00.000Z');

function event(type: 'rise' | 'transit' | 'set', at: string, azimuthDegrees: number) {
  return { type, at, azimuthDegrees, altitudeDegrees: type === 'transit' ? 60 : 0 };
}

const data: SkyRiseSetData = {
  from: NOW.toISOString(),
  to: '2026-09-07T18:00:00.000Z',
  objects: [
    {
      id: 'mars',
      name: 'Marte',
      type: 'planet',
      horizon: 'rises-and-sets',
      events: [
        event('rise', '2026-09-06T20:00:00.000Z', 85),
        event('transit', '2026-09-07T01:00:00.000Z', 0),
      ],
    },
    {
      id: 'moon',
      name: 'Lua',
      type: 'moon',
      horizon: 'rises-and-sets',
      events: [
        event('transit', '2026-09-06T17:00:00.000Z', 0),
        event('set', '2026-09-06T23:00:00.000Z', 275),
      ],
    },
    { id: 'saturn', name: 'Saturno', type: 'planet', horizon: 'always-below', events: [] },
    { id: 'jupiter', name: 'Júpiter', type: 'planet', horizon: 'always-above', events: [] },
  ],
  unavailable: [],
};

describe('summarizeSkyToday', () => {
  const items = summarizeSkyToday(data, NOW);
  const byId = Object.fromEntries(items.map((item) => [item.id, item]));

  it('marks an object as up when its next horizon crossing is a set', () => {
    assert.equal(byId.moon?.status, 'up');
    assert.equal(byId.moon?.nextChange?.kind, 'set');
    assert.equal(byId.moon?.nextChange?.direction, 'O');
  });

  it('marks an object as down when its next horizon crossing is a rise', () => {
    assert.equal(byId.mars?.status, 'down');
    assert.equal(byId.mars?.nextChange?.kind, 'rise');
    assert.equal(byId.mars?.nextChange?.direction, 'L');
    assert.equal(byId.mars?.nextTransit?.at.toISOString(), '2026-09-07T01:00:00.000Z');
  });

  it('ignores events that already happened', () => {
    assert.equal(byId.moon?.nextTransit, null);
  });

  it('keeps the full ordered timeline for day-by-day browsing', () => {
    assert.deepEqual(
      byId.moon?.timeline.map((entry) => entry.kind),
      ['transit', 'set'],
    );
    assert.equal(byId.jupiter?.timeline.length, 0);
  });

  it('handles objects that never cross the horizon', () => {
    assert.equal(byId.jupiter?.status, 'always-up');
    assert.equal(byId.saturn?.status, 'never-up');
    assert.equal(byId.saturn?.nextChange, null);
  });

  it('lists visible objects first and unreachable ones last', () => {
    assert.deepEqual(
      items.map((item) => item.id),
      ['moon', 'jupiter', 'mars', 'saturn'],
    );
  });
});

describe('compassDirection', () => {
  it('maps azimuths to the nearest cardinal or intercardinal point', () => {
    assert.equal(compassDirection(0), 'N');
    assert.equal(compassDirection(359), 'N');
    assert.equal(compassDirection(46), 'NE');
    assert.equal(compassDirection(180), 'S');
    assert.equal(compassDirection(270), 'O');
    assert.equal(compassDirection(-90), 'O');
  });
});
