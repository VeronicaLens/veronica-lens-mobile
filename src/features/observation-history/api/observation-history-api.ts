import type { DataResponse, ObservationHistoryPage } from '../../../shared/api/index.ts';
import { apiRequest } from '../../../shared/api/index.ts';

type Request = <T>(path: string, init?: RequestInit) => Promise<T>;

function authorization(accessToken: string) {
  return { Authorization: `Bearer ${accessToken}` };
}

export async function getObservationHistory(
  accessToken: string,
  page = 1,
  pageSize = 20,
  request: Request = apiRequest,
): Promise<ObservationHistoryPage> {
  const query = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  const response = await request<DataResponse<ObservationHistoryPage>>(
    `/observations?${query.toString()}`,
    { headers: authorization(accessToken) },
  );
  return response.data;
}

export async function deleteObservationPhoto(
  accessToken: string,
  observationId: string,
  photoId: string,
  request: Request = apiRequest,
): Promise<{ observationDeleted: boolean }> {
  const response = await request<DataResponse<{ observationDeleted: boolean }>>(
    `/observations/${encodeURIComponent(observationId)}/photos/${encodeURIComponent(photoId)}`,
    { method: 'DELETE', headers: authorization(accessToken) },
  );
  return response.data;
}

export async function deleteObservation(
  accessToken: string,
  observationId: string,
  request: Request = apiRequest,
): Promise<void> {
  await request<void>(`/observations/${encodeURIComponent(observationId)}`, {
    method: 'DELETE',
    headers: authorization(accessToken),
  });
}
