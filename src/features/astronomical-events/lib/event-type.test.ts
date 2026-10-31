import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { getEventTypeInfo, humanizeEventType } from './event-type.ts';

describe('event types', () => {
  it('uses curated labels for known types', () => {
    assert.equal(getEventTypeInfo('meteor-shower').label, 'Chuva de meteoros');
    assert.equal(getEventTypeInfo('eclipse').label, 'Eclipse');
  });

  it('humanizes unknown slugs and keeps a generic icon', () => {
    const info = getEventTypeInfo('planetary-alignment');

    assert.equal(info.label, 'Planetary alignment');
    assert.equal(info.icon, 'calendar-days');
  });

  it('never returns an empty label', () => {
    assert.equal(humanizeEventType('  '), 'Evento');
    assert.equal(humanizeEventType('super_moon'), 'Super moon');
  });
});
