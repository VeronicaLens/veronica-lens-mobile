import { useCallback, useEffect, useState } from 'react';

import { useRequestGuard } from '../../../shared/lib/index.ts';
import type { DeviceLocation } from '../../device-location/index.ts';
import { getSkyRiseSet } from '../api/rise-set-api.ts';
import { SKY_TODAY_OBJECT_IDS, summarizeSkyToday, type SkyTodayItem } from '../lib/sky-today.ts';

/** dayStart null means the next 24 hours from now; otherwise the 24 hours from that instant. */
export function useSkyToday(
  accessToken: string,
  location: DeviceLocation | null,
  dayStart: Date | null = null,
) {
  const [items, setItems] = useState<SkyTodayItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const guard = useRequestGuard();
  const dayStartMs = dayStart?.getTime() ?? null;

  useEffect(() => {
    if (!location) return;
    const request = guard.begin();
    const load = async () => {
      setLoading(true);
      setError(null);
      setItems([]);
      try {
        const now = dayStartMs === null ? new Date() : new Date(dayStartMs);
        const result = await getSkyRiseSet(accessToken, {
          objectIds: [...SKY_TODAY_OBJECT_IDS],
          from: now.toISOString(),
          observer: {
            latitudeDegrees: location.latitudeDegrees,
            longitudeDegrees: location.longitudeDegrees,
            elevationMeters: location.elevationMeters,
          },
        });
        if (guard.isCurrent(request)) setItems(summarizeSkyToday(result, now));
      } catch {
        if (guard.isCurrent(request)) {
          setError('Não foi possível calcular o céu. Tente novamente.');
        }
      } finally {
        if (guard.isCurrent(request)) setLoading(false);
      }
    };
    void load();
  }, [accessToken, attempt, dayStartMs, guard, location]);

  const refresh = useCallback(() => setAttempt((value) => value + 1), []);
  return { items, loading, error, refresh };
}
