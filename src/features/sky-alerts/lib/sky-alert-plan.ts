import type { SkyRiseSetData } from '../../../shared/api/index.ts';
import { sunAltitudeDegrees } from './sun-altitude.ts';

export const SKY_ALERT_KIND = 'sky-rise';
export const SKY_ALERT_LEAD_OPTIONS = [15, 30, 60] as const;
export const DEFAULT_SKY_ALERT_LEAD_MINUTES = 30;

// iOS keeps at most 64 pending local notifications.
const MAX_ALERTS = 48;
const MINUTE_MS = 60_000;
// The object must rise after the end of civil twilight to be worth a heads-up.
const DARK_SUN_ALTITUDE_DEGREES = -6;
const COMPASS = ['norte', 'nordeste', 'leste', 'sudeste', 'sul', 'sudoeste', 'oeste', 'noroeste'];

export interface PlannedSkyAlert {
  key: string;
  objectId: string;
  triggerAt: Date;
  riseAt: Date;
  title: string;
  body: string;
}

export interface PlanSkyAlertsInput {
  days: SkyRiseSetData[];
  now: Date;
  leadMinutes: number;
  observer: { latitudeDegrees: number; longitudeDegrees: number };
  formatTime?(value: Date): string;
}

export function leadLabel(leadMinutes: number): string {
  return leadMinutes % 60 === 0 ? `${leadMinutes / 60} h` : `${leadMinutes} min`;
}

function defaultFormatTime(value: Date): string {
  return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(value);
}

function direction(azimuthDegrees: number): string {
  const normalized = ((azimuthDegrees % 360) + 360) % 360;
  return COMPASS[Math.round(normalized / 45) % 8] ?? 'norte';
}

/** Turns rise events into local alerts for the Moon and planets that rise in the dark. */
export function planSkyAlerts(input: PlanSkyAlertsInput): PlannedSkyAlert[] {
  const { days, now, leadMinutes, observer } = input;
  const formatTime = input.formatTime ?? defaultFormatTime;
  const planned = new Map<string, PlannedSkyAlert>();

  for (const day of days) {
    for (const object of day.objects) {
      if (object.type !== 'moon' && object.type !== 'planet') continue;
      for (const event of object.events) {
        if (event.type !== 'rise') continue;
        const riseAt = new Date(event.at);
        const triggerAt = new Date(riseAt.getTime() - leadMinutes * MINUTE_MS);
        if (!Number.isFinite(riseAt.getTime()) || triggerAt.getTime() <= now.getTime()) continue;
        if (sunAltitudeDegrees(riseAt, observer) > DARK_SUN_ALTITUDE_DEGREES) continue;

        const key = `${object.id}:${Math.round(riseAt.getTime() / MINUTE_MS)}`;
        planned.set(key, {
          key,
          objectId: object.id,
          triggerAt,
          riseAt,
          title: `${object.name} nasce em ${leadLabel(leadMinutes)}`,
          body: `Nasce às ${formatTime(riseAt)}, na direção ${direction(event.azimuthDegrees)}.`,
        });
      }
    }
  }

  return [...planned.values()]
    .sort((a, b) => a.triggerAt.getTime() - b.triggerAt.getTime())
    .slice(0, MAX_ALERTS);
}
