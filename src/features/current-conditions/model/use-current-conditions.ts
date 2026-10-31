import { useCallback, useEffect, useState } from 'react';

import { useRequestGuard } from '../../../shared/lib/index.ts';
import type { DeviceLocation } from '../../device-location/index.ts';
import { getCurrentConditions } from '../api/current-conditions-api.ts';
import { toConditionHour, type ConditionHour } from '../lib/condition-hour.ts';

export function useCurrentConditions(
  accessToken: string,
  location: DeviceLocation | null,
  at?: string,
) {
  const [conditions, setConditions] = useState<ConditionHour | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const guard = useRequestGuard();

  useEffect(() => {
    if (!location) return;
    const request = guard.begin();
    const load = async () => {
      setLoading(true);
      setError(null);
      setConditions(null);
      try {
        const result = await getCurrentConditions(accessToken, location, at);
        if (guard.isCurrent(request)) setConditions(toConditionHour(result.conditions));
      } catch {
        if (guard.isCurrent(request)) {
          setError('Não foi possível consultar as condições de observação.');
        }
      } finally {
        if (guard.isCurrent(request)) setLoading(false);
      }
    };
    void load();
  }, [accessToken, at, attempt, guard, location]);

  const refresh = useCallback(() => setAttempt((value) => value + 1), []);
  return { conditions, loading, error, refresh };
}
