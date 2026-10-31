import type { PushDevicePlatform } from '../../../shared/api/index.ts';
import { apiRequest } from '../../../shared/api/index.ts';

type Request = <T>(path: string, init?: RequestInit) => Promise<T>;

function authorization(accessToken: string) {
  return { Authorization: `Bearer ${accessToken}` };
}

export async function registerPushDevice(
  accessToken: string,
  token: string,
  platform: PushDevicePlatform,
  request: Request = apiRequest,
): Promise<void> {
  await request<unknown>('/notifications/devices', {
    method: 'PUT',
    headers: authorization(accessToken),
    body: JSON.stringify({ token, platform }),
  });
}

export async function unregisterPushDevice(
  accessToken: string,
  token: string,
  request: Request = apiRequest,
): Promise<void> {
  await request<void>(`/notifications/devices/${encodeURIComponent(token)}`, {
    method: 'DELETE',
    headers: authorization(accessToken),
  });
}
