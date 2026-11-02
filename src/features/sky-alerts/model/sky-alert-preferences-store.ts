import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';

import { getProfile } from '../../profile/index.ts';
import { DEFAULT_SKY_ALERT_LEAD_MINUTES } from '../lib/sky-alert-plan.ts';
import {
  parseSkyAlertPreferences,
  type SkyAlertPreferences,
} from '../lib/sky-alert-preferences.ts';

const STORAGE_KEY = 'veronica_lens_sky_alerts_v1';

type Listener = (preferences: SkyAlertPreferences) => void;
const listeners = new Set<Listener>();

async function readStored(): Promise<SkyAlertPreferences | null> {
  return parseSkyAlertPreferences(await SecureStore.getItemAsync(STORAGE_KEY));
}

/**
 * Without stored preferences, the profile switch decides (it was the only notification
 * control before local alerts existed), and alerts need the OS permission.
 */
export async function loadSkyAlertPreferences(accessToken: string): Promise<SkyAlertPreferences> {
  const stored = await readStored();
  if (stored) return stored;

  const [permission, profile] = await Promise.all([
    Notifications.getPermissionsAsync(),
    getProfile(accessToken).catch(() => null),
  ]);
  return {
    enabled: permission.granted && profile?.notificationsEnabled === true,
    leadMinutes: DEFAULT_SKY_ALERT_LEAD_MINUTES,
  };
}

export async function updateSkyAlertPreferences(
  patch: Partial<SkyAlertPreferences>,
): Promise<SkyAlertPreferences> {
  const current = (await readStored()) ?? {
    enabled: false,
    leadMinutes: DEFAULT_SKY_ALERT_LEAD_MINUTES,
  };
  const next = { ...current, ...patch };
  await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(next));
  listeners.forEach((listener) => listener(next));
  return next;
}

export function subscribeToSkyAlertPreferences(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export async function clearSkyAlertPreferences(): Promise<void> {
  await SecureStore.deleteItemAsync(STORAGE_KEY);
}
