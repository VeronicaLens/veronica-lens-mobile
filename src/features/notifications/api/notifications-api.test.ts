import assert from 'node:assert/strict';
import test from 'node:test';

import { registerPushDevice, unregisterPushDevice } from './notifications-api.ts';

test('registers and removes the authenticated push device', async () => {
  const calls: { path: string; init?: RequestInit }[] = [];
  const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
    calls.push(init ? { path, init } : { path });
    return undefined as T;
  };

  await registerPushDevice('access-token', 'ExponentPushToken[device-token]', 'android', request);
  await unregisterPushDevice('access-token', 'ExponentPushToken[device-token]', request);

  assert.equal(calls.length, 2);
  assert.equal(calls[0]?.path, '/notifications/devices');
  assert.equal(calls[0]?.init?.method, 'PUT');
  assert.deepEqual(JSON.parse(String(calls[0]?.init?.body)), {
    token: 'ExponentPushToken[device-token]',
    platform: 'android',
  });
  assert.deepEqual(calls[0]?.init?.headers, { Authorization: 'Bearer access-token' });
  assert.equal(calls[1]?.path, '/notifications/devices/ExponentPushToken%5Bdevice-token%5D');
  assert.equal(calls[1]?.init?.method, 'DELETE');
  assert.equal(calls[1]?.init?.body, undefined);
});
