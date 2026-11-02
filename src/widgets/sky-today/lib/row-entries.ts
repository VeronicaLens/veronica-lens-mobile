import type { SkyTodayItem, SkyTodayTimelineEvent } from '../../../features/sky-guide/index.ts';

export type RowEntry = Pick<SkyTodayTimelineEvent, 'kind' | 'at' | 'direction' | 'azimuthDegrees'>;

const MINUTE_MS = 60_000;

/** The times shown on a row: what is coming next, or the whole day when browsing a date. */
export function buildRowEntries(item: SkyTodayItem, dayMode: boolean): RowEntry[] {
  if (dayMode) return item.timeline;
  const entries: RowEntry[] = [];
  if (item.nextChange) entries.push(item.nextChange);
  if (item.nextTransit) entries.push({ ...item.nextTransit, kind: 'transit' });
  return entries.sort((a, b) => a.at.getTime() - b.at.getTime());
}

/** "em 25 min", "em 2 h 05 min"; null once the moment has passed. */
export function formatCountdown(target: Date, now: Date): string | null {
  const minutes = Math.round((target.getTime() - now.getTime()) / MINUTE_MS);
  if (minutes < 1) return null;
  if (minutes < 60) return `em ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `em ${hours} h` : `em ${hours} h ${String(rest).padStart(2, '0')} min`;
}

export interface NowGroups {
  visible: SkyTodayItem[];
  upcoming: SkyTodayItem[];
  hidden: SkyTodayItem[];
}

export function groupForNow(items: SkyTodayItem[]): NowGroups {
  return {
    visible: items.filter((item) => item.status === 'up' || item.status === 'always-up'),
    upcoming: items.filter((item) => item.status === 'down'),
    hidden: items.filter((item) => item.status === 'never-up'),
  };
}

/** Orders a browsed day by the first thing that happens, keeping unreachable objects last. */
export function sortItemsForDay(items: SkyTodayItem[]): SkyTodayItem[] {
  const key = (item: SkyTodayItem): number => {
    if (item.status === 'always-up') return -1;
    if (item.status === 'never-up') return Number.MAX_SAFE_INTEGER;
    return item.timeline[0]?.at.getTime() ?? Number.MAX_SAFE_INTEGER - 1;
  };
  return [...items].sort((a, b) => key(a) - key(b));
}
