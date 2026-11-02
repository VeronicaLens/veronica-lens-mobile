import type {
  DataResponse,
  SkyGuideObjectPosition,
  SkyGuidePositionsData,
  SkyGuidePositionsRequest,
} from '../../../shared/api/index.ts';
import { apiRequest } from '../../../shared/api/index.ts';

type Request = <T>(path: string, init?: RequestInit) => Promise<T>;

export interface SkyGuidePositionsResult {
  observedAt: string;
  positions: SkyGuideObjectPosition[];
  unavailableObjectIds: string[];
}

export async function getSkyGuidePositions(
  accessToken: string,
  input: SkyGuidePositionsRequest,
  request: Request = apiRequest,
): Promise<SkyGuidePositionsResult> {
  const response = await request<DataResponse<SkyGuidePositionsData>>('/sky-guide/positions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(input),
  });

  return {
    observedAt: response.data.observedAt,
    positions: response.data.positions,
    unavailableObjectIds: response.data.unavailable.map((object) => object.id),
  };
}
