import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { AstronomicalEvent } from '../../../shared/api/index.ts';
import { getEventById, getUpcomingEvents } from './events-api.ts';

const event: AstronomicalEvent = {
  id: '8d0f0c1e-0000-4000-8000-000000000001',
  slug: 'eclipse-lunar-2026-03-03',
  title: 'Eclipse lunar total',
  description: 'A Lua atravessa a sombra da Terra.',
  type: 'eclipse',
  celestialObjectName: 'Lua',
  startsAt: '2026-03-03T08:00:00.000Z',
  endsAt: '2026-03-03T12:00:00.000Z',
  peaksAt: '2026-03-03T11:33:00.000Z',
};

describe('events API', () => {
  it('requests the curated events for a period through the authenticated backend', async () => {
    let path = '';
    let init: RequestInit | undefined;
    const request = <T>(receivedPath: string, receivedInit?: RequestInit) => {
      path = receivedPath;
      init = receivedInit;
      return Promise.resolve({
        data: { from: '2026-10-04T00:00:00.000Z', to: '2026-11-04T00:00:00.000Z', events: [event] },
        meta: { count: 1 },
      } as T);
    };

    const result = await getUpcomingEvents(
      'token',
      { from: '2026-10-04T00:00:00.000Z', to: '2026-11-04T00:00:00.000Z', limit: 100 },
      request,
    );

    assert.match(path, /^\/events\?/);
    assert.match(path, /from=2026-10-04/);
    assert.match(path, /limit=100/);
    assert.ok(!path.includes('type='));
    assert.deepEqual(init?.headers, { Authorization: 'Bearer token' });
    assert.deepEqual(result, [event]);
  });

  it('forwards an optional type filter', async () => {
    let path = '';
    const request = <T>(receivedPath: string) => {
      path = receivedPath;
      return Promise.resolve({ data: { from: '', to: '', events: [] } } as T);
    };

    await getUpcomingEvents(
      'token',
      { from: '2026-10-04T00:00:00.000Z', to: '2026-10-05T00:00:00.000Z', type: 'meteor-shower' },
      request,
    );

    assert.match(path, /type=meteor-shower/);
  });

  it('loads one event by id', async () => {
    let path = '';
    const request = <T>(receivedPath: string) => {
      path = receivedPath;
      return Promise.resolve({ data: { event } } as T);
    };

    assert.deepEqual(await getEventById('token', event.id, request), event);
    assert.equal(path, `/events/${event.id}`);
  });
});
