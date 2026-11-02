import type { CelestialObject, DataResponse } from '../../../shared/api/index.ts';
import { apiRequest } from '../../../shared/api/index.ts';

type Request = <T>(path: string, init?: RequestInit) => Promise<T>;

export async function searchCelestialObjects(
  accessToken: string,
  query: string,
  request: Request = apiRequest,
): Promise<CelestialObject[]> {
  const params = new URLSearchParams({ q: query, limit: '10' });
  const response = await request<DataResponse<{ objects: CelestialObject[] }>>(
    `/catalog/celestial-objects?${params.toString()}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  return response.data.objects;
}
