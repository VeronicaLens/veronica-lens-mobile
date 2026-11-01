import type { DataResponse, SkyRiseSetData, SkyRiseSetRequest } from '../../../shared/api/index.ts';
import { apiRequest } from '../../../shared/api/index.ts';

type Request = <T>(path: string, init?: RequestInit) => Promise<T>;

export async function getSkyRiseSet(
  accessToken: string,
  input: SkyRiseSetRequest,
  request: Request = apiRequest,
): Promise<SkyRiseSetData> {
  const response = await request<DataResponse<SkyRiseSetData>>('/sky-guide/rise-set', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(input),
  });
  return response.data;
}
