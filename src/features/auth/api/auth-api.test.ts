import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { Session } from '../../../shared/api/index.ts';
import { requestPasswordRecovery, signIn, signOut, updatePassword } from './auth-api.ts';

const session = {
  user: {
    id: '40000000-0000-4000-8000-000000000001',
    email: 'user@example.com',
    displayName: null,
  },
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
  tokenType: 'bearer',
  expiresAt: '2026-09-05T13:00:00.000Z',
} satisfies Session;

describe('authentication API', () => {
  it('sends credentials only to the backend login endpoint', async () => {
    let capturedPath = '';
    let capturedInit: RequestInit | undefined;
    const request = <T>(path: string, init?: RequestInit): Promise<T> => {
      capturedPath = path;
      capturedInit = init;
      return Promise.resolve({ data: session } as T);
    };
    const result = await signIn({ email: 'user@example.com', password: 'secret123' }, request);

    assert.equal(capturedPath, '/auth/sign-in');
    assert.equal(capturedInit?.method, 'POST');
    assert.deepEqual(JSON.parse(String(capturedInit?.body)), {
      email: 'user@example.com',
      password: 'secret123',
    });
    assert.equal(result.user.id, session.user.id);
  });

  it('sends the bearer token when signing out', async () => {
    let capturedInit: RequestInit | undefined;
    const request = <T>(_path: string, init?: RequestInit): Promise<T> => {
      capturedInit = init;
      return Promise.resolve(undefined as T);
    };
    await signOut(session, request);

    assert.deepEqual(capturedInit?.headers, { Authorization: 'Bearer access-token' });
  });

  it('requests recovery and updates a recovered password through the backend', async () => {
    const calls: { path: string; init: RequestInit | undefined }[] = [];
    const request = <T>(path: string, init?: RequestInit): Promise<T> => {
      calls.push({ path, init });
      return Promise.resolve(
        (path.endsWith('recovery') ? { data: { message: 'accepted' } } : undefined) as T,
      );
    };

    assert.equal(await requestPasswordRecovery('user@example.com', request), 'accepted');
    await updatePassword(
      { accessToken: 'recovery-token', refreshToken: 'recovery-refresh' },
      'new-secret',
      request,
    );

    assert.deepEqual(
      calls.map((call) => call.path),
      ['/auth/password/recovery', '/auth/password'],
    );
    const update = calls[1]?.init;
    assert.equal(update?.method, 'PUT');
    assert.deepEqual(JSON.parse(String(update?.body)), {
      password: 'new-secret',
      refreshToken: 'recovery-refresh',
    });
    assert.deepEqual(update?.headers, { Authorization: `Bearer recovery-token` });
  });
});
