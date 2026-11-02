import { DEFAULT_SKY_ALERT_LEAD_MINUTES, SKY_ALERT_LEAD_OPTIONS } from './sky-alert-plan.ts';

export interface SkyAlertPreferences {
  enabled: boolean;
  leadMinutes: number;
}

export function isValidLead(value: unknown): value is number {
  return SKY_ALERT_LEAD_OPTIONS.some((option) => option === value);
}

/** Returns null when nothing valid was stored, so callers can apply their own default. */
export function parseSkyAlertPreferences(raw: string | null): SkyAlertPreferences | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as { enabled?: unknown; leadMinutes?: unknown };
    if (typeof value.enabled !== 'boolean') return null;
    return {
      enabled: value.enabled,
      leadMinutes: isValidLead(value.leadMinutes)
        ? value.leadMinutes
        : DEFAULT_SKY_ALERT_LEAD_MINUTES,
    };
  } catch {
    return null;
  }
}
