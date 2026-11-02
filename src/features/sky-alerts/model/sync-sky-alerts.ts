import * as Notifications from 'expo-notifications';

import type { DeviceLocation } from '../../device-location/index.ts';
import { ensureAlertsChannel, ASTRONOMY_ALERTS_CHANNEL_ID } from '../../notifications/index.ts';
import { getSkyRiseSet } from '../../sky-guide/index.ts';
import type { SkyRiseSetData } from '../../../shared/api/index.ts';
import { planSkyAlerts, SKY_ALERT_KIND } from '../lib/sky-alert-plan.ts';

const SCHEDULE_DAYS = 7;
const DAY_MS = 86_400_000;
const RESYNC_AFTER_MS = 6 * 3_600_000;
const OBJECT_IDS = ['moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn'];

let lastSync: { at: number; signature: string } | null = null;

export interface SyncSkyAlertsInput {
  accessToken: string;
  location: DeviceLocation;
  leadMinutes: number;
}

export async function cancelSkyAlerts(): Promise<void> {
  lastSync = null;
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((item) => (item.content.data as { kind?: unknown } | null)?.kind === SKY_ALERT_KIND)
      .map((item) => Notifications.cancelScheduledNotificationAsync(item.identifier)),
  );
}

/**
 * Replaces the pending local alerts with the next 7 days of Moon and planet rises for the
 * current position. Skips work when nothing relevant changed in the last few hours.
 */
export async function syncSkyAlerts(
  input: SyncSkyAlertsInput,
  now: Date = new Date(),
): Promise<void> {
  const permission = await Notifications.getPermissionsAsync();
  if (!permission.granted) {
    await cancelSkyAlerts();
    return;
  }

  const { location, leadMinutes } = input;
  const signature = [
    location.latitudeDegrees.toFixed(1),
    location.longitudeDegrees.toFixed(1),
    leadMinutes,
  ].join(':');
  if (
    lastSync &&
    lastSync.signature === signature &&
    now.getTime() - lastSync.at < RESYNC_AFTER_MS
  ) {
    return;
  }

  const days: SkyRiseSetData[] = [];
  for (let day = 0; day < SCHEDULE_DAYS; day += 1) {
    try {
      days.push(
        await getSkyRiseSet(input.accessToken, {
          objectIds: OBJECT_IDS,
          from: new Date(now.getTime() + day * DAY_MS).toISOString(),
          observer: {
            latitudeDegrees: location.latitudeDegrees,
            longitudeDegrees: location.longitudeDegrees,
            elevationMeters: location.elevationMeters,
          },
        }),
      );
    } catch {
      // A failed day only leaves a gap; the next sync fills it.
    }
  }
  // Keep the current schedule when nothing could be computed (offline, API down).
  if (days.length === 0) return;

  const alerts = planSkyAlerts({
    days,
    now,
    leadMinutes,
    observer: location,
  });

  await ensureAlertsChannel();
  await cancelSkyAlerts();
  await Promise.all(
    alerts.map((alert) =>
      Notifications.scheduleNotificationAsync({
        content: {
          title: alert.title,
          body: alert.body,
          data: { kind: SKY_ALERT_KIND, objectId: alert.objectId },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: alert.triggerAt,
          channelId: ASTRONOMY_ALERTS_CHANNEL_ID,
        },
      }),
    ),
  );
  lastSync = { at: now.getTime(), signature };
}
