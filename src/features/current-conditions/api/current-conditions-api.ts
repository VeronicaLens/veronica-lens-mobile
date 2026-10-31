import type {
  ConditionsForecastResult,
  CurrentConditionsResult,
  DataResponse,
  Observer,
} from '../../../shared/api/index.ts';
import { apiRequest } from '../../../shared/api/index.ts';

type Request = <T>(path: string, init?: RequestInit) => Promise<T>;

export interface CurrentConditionsObserver {
  latitudeDegrees: number;
  longitudeDegrees: number;
  elevationMeters: number;
}

function toObserver(observer: CurrentConditionsObserver): Observer {
  return {
    latitudeDegrees: observer.latitudeDegrees,
    longitudeDegrees: observer.longitudeDegrees,
    elevationMeters: observer.elevationMeters,
  };
}

export async function getCurrentConditions(
  accessToken: string,
  observer: CurrentConditionsObserver,
  at?: string,
  request: Request = apiRequest,
): Promise<CurrentConditionsResult> {
  const response = await request<DataResponse<CurrentConditionsResult>>('/conditions/current', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ observer: toObserver(observer), ...(at ? { at } : {}) }),
  });
  return response.data;
}

export async function getConditionsForecast(
  accessToken: string,
  observer: CurrentConditionsObserver,
  request: Request = apiRequest,
): Promise<ConditionsForecastResult> {
  const response = await request<DataResponse<ConditionsForecastResult>>('/conditions/forecast', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ observer: toObserver(observer) }),
  });
  return response.data;
}
