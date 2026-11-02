import type {
  SkyRiseSetData,
  SkyRiseSetEvent,
  SkyRiseSetObject,
} from '../../../shared/api/index.ts';

export const SKY_TODAY_OBJECT_IDS = [
  'moon',
  'mercury',
  'venus',
  'mars',
  'jupiter',
  'saturn',
] as const;

export type SkyTodayTimelineEvent = SkyTodayEvent & { kind: 'rise' | 'transit' | 'set' };

export type SkyTodayStatus = 'up' | 'down' | 'always-up' | 'never-up';

export interface SkyTodayEvent {
  at: Date;
  azimuthDegrees: number;
  altitudeDegrees: number;
  direction: string;
}

export interface SkyTodayItem {
  id: string;
  name: string;
  type: SkyRiseSetObject['type'];
  status: SkyTodayStatus;
  /** Next rise (when below the horizon) or set (when above it) within the window. */
  nextChange: (SkyTodayEvent & { kind: 'rise' | 'set' }) | null;
  /** Next moment the object reaches its highest point, when it is still ahead. */
  nextTransit: SkyTodayEvent | null;
  /** Every rise, transit and set from the start of the window, in time order. */
  timeline: SkyTodayTimelineEvent[];
}

const COMPASS_POINTS = ['N', 'NE', 'L', 'SE', 'S', 'SO', 'O', 'NO'] as const;

export function compassDirection(azimuthDegrees: number): string {
  const normalized = ((azimuthDegrees % 360) + 360) % 360;
  return COMPASS_POINTS[Math.round(normalized / 45) % 8] ?? 'N';
}

export function summarizeSkyToday(data: SkyRiseSetData, now: Date): SkyTodayItem[] {
  const items = data.objects.map((object) => summarizeObject(object, now));
  return items.sort(compareItems);
}

function summarizeObject(object: SkyRiseSetObject, now: Date): SkyTodayItem {
  const base = { id: object.id, name: object.name, type: object.type };
  if (object.horizon === 'always-above') {
    return { ...base, status: 'always-up', nextChange: null, nextTransit: null, timeline: [] };
  }
  if (object.horizon === 'always-below') {
    return { ...base, status: 'never-up', nextChange: null, nextTransit: null, timeline: [] };
  }

  const upcoming = object.events
    .map((event) => ({ event, at: new Date(event.at) }))
    .filter(({ at }) => at.getTime() >= now.getTime())
    .sort((a, b) => a.at.getTime() - b.at.getTime());

  const change = upcoming.find(({ event }) => event.type !== 'transit');
  const transit = upcoming.find(({ event }) => event.type === 'transit');

  return {
    ...base,
    // The next horizon crossing tells whether the object is currently above (set) or below (rise).
    status: change?.event.type === 'set' ? 'up' : 'down',
    nextChange: change
      ? { ...toSkyTodayEvent(change.event, change.at), kind: change.event.type as 'rise' | 'set' }
      : null,
    nextTransit: transit ? toSkyTodayEvent(transit.event, transit.at) : null,
    timeline: object.events
      .map((event) => ({ ...toSkyTodayEvent(event, new Date(event.at)), kind: event.type }))
      .sort((a, b) => a.at.getTime() - b.at.getTime()),
  };
}

function toSkyTodayEvent(event: SkyRiseSetEvent, at: Date): SkyTodayEvent {
  return {
    at,
    azimuthDegrees: event.azimuthDegrees,
    altitudeDegrees: event.altitudeDegrees,
    direction: compassDirection(event.azimuthDegrees),
  };
}

const STATUS_ORDER: Record<SkyTodayStatus, number> = {
  up: 0,
  'always-up': 0,
  down: 1,
  'never-up': 2,
};

function compareItems(a: SkyTodayItem, b: SkyTodayItem): number {
  const byStatus = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
  if (byStatus !== 0) return byStatus;
  const aTime = a.nextChange?.at.getTime() ?? Number.POSITIVE_INFINITY;
  const bTime = b.nextChange?.at.getTime() ?? Number.POSITIVE_INFINITY;
  return aTime - bTime;
}
