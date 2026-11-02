import { useCallback, useEffect, useState } from 'react';

import { ApiError, type AstronomicalEvent } from '../../../shared/api/index.ts';
import { useRequestGuard } from '../../../shared/lib/index.ts';
import { getEventById } from '../api/events-api.ts';

export function useEvent(accessToken: string, eventId: string | null) {
  const [event, setEvent] = useState<AstronomicalEvent | null>(null);
  const [loading, setLoading] = useState(Boolean(eventId));
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const guard = useRequestGuard();

  useEffect(() => {
    if (!eventId) return;
    const request = guard.begin();
    const load = async () => {
      setLoading(true);
      setError(null);
      setNotFound(false);
      try {
        const result = await getEventById(accessToken, eventId);
        if (guard.isCurrent(request)) setEvent(result);
      } catch (cause) {
        if (!guard.isCurrent(request)) return;
        if (cause instanceof ApiError && cause.status === 404) setNotFound(true);
        else setError('Não foi possível carregar o evento. Tente novamente.');
      } finally {
        if (guard.isCurrent(request)) setLoading(false);
      }
    };
    void load();
  }, [accessToken, attempt, eventId, guard]);

  const refresh = useCallback(() => setAttempt((value) => value + 1), []);
  return {
    event: eventId ? event : null,
    loading: Boolean(eventId) && loading,
    error,
    notFound,
    refresh,
  };
}
