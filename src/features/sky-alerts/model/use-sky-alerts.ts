import { useEffect, useState } from 'react';

import { useDeviceLocation } from '../../device-location/index.ts';
import { useIsAppActive } from '../../../shared/lib/index.ts';
import type { SkyAlertPreferences } from '../lib/sky-alert-preferences.ts';
import {
  loadSkyAlertPreferences,
  subscribeToSkyAlertPreferences,
} from './sky-alert-preferences-store.ts';
import { cancelSkyAlerts, syncSkyAlerts } from './sync-sky-alerts.ts';

export function useSkyAlertPreferences(accessToken: string | null): SkyAlertPreferences | null {
  const [preferences, setPreferences] = useState<SkyAlertPreferences | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    let disposed = false;
    void loadSkyAlertPreferences(accessToken).then((loaded) => {
      if (!disposed) setPreferences(loaded);
    });
    const unsubscribe = subscribeToSkyAlertPreferences(setPreferences);
    return () => {
      disposed = true;
      unsubscribe();
    };
  }, [accessToken]);

  return preferences;
}

/** Keeps the pending local sky alerts in sync with the user's position and preferences. */
export function useSkyAlertScheduler(accessToken: string | null): void {
  const preferences = useSkyAlertPreferences(accessToken);
  const active = useIsAppActive();
  const enabled = preferences?.enabled === true && accessToken !== null;
  const location = useDeviceLocation(enabled);
  const observer = location.location;
  const leadMinutes = preferences?.leadMinutes;

  useEffect(() => {
    if (preferences === null) return;
    if (!preferences.enabled) {
      void cancelSkyAlerts().catch(() => undefined);
      return;
    }
    if (!accessToken || !observer || leadMinutes === undefined || !active) return;
    void syncSkyAlerts({ accessToken, location: observer, leadMinutes }).catch((cause: unknown) => {
      if (__DEV__) console.warn('Sky alerts sync failed', cause);
    });
  }, [accessToken, active, leadMinutes, observer, preferences]);
}
