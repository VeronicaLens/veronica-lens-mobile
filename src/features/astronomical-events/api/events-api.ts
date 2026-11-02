import type { AstronomicalEvent, DataResponse, UpcomingEvents } from '../../../shared/api/index.ts';
import { apiRequest } from '../../../shared/api/index.ts';

type Request = <T>(path: string, init?: RequestInit) => Promise<T>;

export interface UpcomingEventsFilters {
  from: string;
  to: string;
  type?: string;
  limit?: number;
}

function authorization(accessToken: string) {
  return { Authorization: `Bearer ${accessToken}` };
}

export async function getUpcomingEvents(
  accessToken: string,
  filters: UpcomingEventsFilters,
  request: Request = apiRequest,
): Promise<AstronomicalEvent[]> {
  const query = new URLSearchParams({ from: filters.from, to: filters.to });
  if (filters.type) query.set('type', filters.type);
  if (filters.limit) query.set('limit', String(filters.limit));
  const response = await request<DataResponse<UpcomingEvents>>(`/events?${query.toString()}`, {
    headers: authorization(accessToken),
  });
  return response.data.events;
}

export async function getEventById(
  accessToken: string,
  eventId: string,
  request: Request = apiRequest,
): Promise<AstronomicalEvent> {
  const response = await request<DataResponse<{ event: AstronomicalEvent }>>(
    `/events/${encodeURIComponent(eventId)}`,
    { headers: authorization(accessToken) },
  );
  return response.data.event;
}
