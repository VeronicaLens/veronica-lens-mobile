import { useCallback, useEffect, useState } from 'react';

import type { AstronomicalEvent } from '../../../shared/api/index.ts';
import { useRequestGuard } from '../../../shared/lib/index.ts';
import { getUpcomingEvents } from '../api/events-api.ts';

const EVENTS_LIMIT = 100;

export function useUpcomingEvents(accessToken: string, periodDays: number) {
  const [events, setEvents] = useState<AstronomicalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const guard = useRequestGuard();

  useEffect(() => {
    const request = guard.begin();
    const load = async () => {
      setLoading(true);
      setError(null);
      const from = startOfUtcDay(new Date());
      const to = new Date(from.getTime() + periodDays * 86_400_000);
      try {
        const result = await getUpcomingEvents(accessToken, {
          from: from.toISOString(),
          to: to.toISOString(),
          limit: EVENTS_LIMIT,
        });
        if (guard.isCurrent(request)) setEvents(result);
      } catch {
        if (guard.isCurrent(request)) {
          setError('Não foi possível consultar os eventos. Tente novamente.');
        }
      } finally {
        if (guard.isCurrent(request)) setLoading(false);
      }
    };
    void load();
  }, [accessToken, attempt, guard, periodDays]);

  const refresh = useCallback(() => setAttempt((value) => value + 1), []);
  return { events, loading, error, refresh };
}

function startOfUtcDay(value: Date): Date {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}
