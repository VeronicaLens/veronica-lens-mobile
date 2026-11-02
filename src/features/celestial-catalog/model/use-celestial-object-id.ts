import { useEffect, useState } from 'react';

import { useRequestGuard } from '../../../shared/lib/index.ts';
import { searchCelestialObjects } from '../api/catalog-api.ts';
import { pickCelestialObject } from '../lib/pick-celestial-object.ts';

// Names resolve to the same catalog id for the whole session, so lookups are shared.
const resolvedIds = new Map<string, string | null>();

export function useCelestialObjectId(accessToken: string, name: string | null) {
  const [resolved, setResolved] = useState<{ name: string; objectId: string | null } | null>(null);
  const guard = useRequestGuard();

  useEffect(() => {
    if (!name || resolvedIds.has(name)) return;
    const request = guard.begin();
    void searchCelestialObjects(accessToken, name)
      .then((objects) => {
        const objectId = pickCelestialObject(objects, name)?.id ?? null;
        resolvedIds.set(name, objectId);
        if (guard.isCurrent(request)) setResolved({ name, objectId });
      })
      .catch(() => {
        if (guard.isCurrent(request)) setResolved({ name, objectId: null });
      });
  }, [accessToken, guard, name]);

  if (!name) return { objectId: null, loading: false };
  const cached = resolvedIds.get(name);
  if (cached !== undefined) return { objectId: cached, loading: false };
  if (resolved?.name === name) return { objectId: resolved.objectId, loading: false };
  return { objectId: null, loading: true };
}
