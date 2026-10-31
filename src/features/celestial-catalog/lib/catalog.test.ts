import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { CelestialObject } from '../../../shared/api/index.ts';
import { searchCelestialObjects } from '../api/catalog-api.ts';
import { pickCelestialObject } from './pick-celestial-object.ts';

function object(id: string, name: string, aliases: string[] = []): CelestialObject {
  return {
    id,
    name,
    aliases,
    type: 'planet',
    magnitude: null,
    coordinates: { kind: 'ephemeris', provider: 'jpl-horizons', providerObjectId: id },
  } as unknown as CelestialObject;
}

describe('celestial catalog', () => {
  it('matches names and aliases ignoring case and accents', () => {
    const objects = [object('mars', 'Mars', ['Marte']), object('jupiter', 'Jupiter', ['Júpiter'])];

    assert.equal(pickCelestialObject(objects, 'JÚPITER')?.id, 'jupiter');
    assert.equal(pickCelestialObject(objects, 'marte')?.id, 'mars');
  });

  it('does not guess when several objects match loosely', () => {
    const objects = [object('mars', 'Mars'), object('jupiter', 'Jupiter')];

    assert.equal(pickCelestialObject(objects, 'Saturno'), null);
  });

  it('accepts a single search result as the match', () => {
    assert.equal(pickCelestialObject([object('moon', 'Moon')], 'Lua')?.id, 'moon');
  });

  it('searches the catalog with an authenticated request', async () => {
    let path = '';
    let init: RequestInit | undefined;
    const request = <T>(receivedPath: string, receivedInit?: RequestInit) => {
      path = receivedPath;
      init = receivedInit;
      return Promise.resolve({ data: { objects: [object('moon', 'Moon')] } } as T);
    };

    const result = await searchCelestialObjects('token', 'Lua', request);

    assert.match(path, /^\/catalog\/celestial-objects\?/);
    assert.match(path, /q=Lua/);
    assert.deepEqual(init?.headers, { Authorization: 'Bearer token' });
    assert.equal(result[0]?.id, 'moon');
  });
});
