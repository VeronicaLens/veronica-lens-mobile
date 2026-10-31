import { useCallback, useEffect, useMemo, useState } from 'react';

import { useRequestGuard } from '../../../shared/lib/index.ts';
import type { DeviceLocation } from '../../device-location/index.ts';
import { getConditionsForecast } from '../api/current-conditions-api.ts';
import { toConditionHour, type ConditionHour } from '../lib/condition-hour.ts';

export function useConditionsForecast(accessToken: string, location: DeviceLocation | null) {
  const [hours, setHours] = useState<ConditionHour[] | null>(null);
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
      setHours(null);
      try {
        const result = await getConditionsForecast(accessToken, location);
        if (guard.isCurrent(request)) setHours(result.hours.map(toConditionHour));
      } catch {
        if (guard.isCurrent(request)) {
          setError('Não foi possível carregar a previsão para os próximos dias.');
        }
      } finally {
        if (guard.isCurrent(request)) setLoading(false);
      }
    };
    void load();
  }, [accessToken, attempt, guard, location]);

  const refresh = useCallback(() => setAttempt((value) => value + 1), []);
  return useMemo(
    () => ({
      hours: location ? hours : null,
      loading: Boolean(location && loading),
      error: location ? error : null,
      refresh,
    }),
    [error, hours, loading, location, refresh],
  );
}
