import assert from 'node:assert/strict';
import { afterEach, beforeEach, test } from 'node:test';

import { ApiError, apiRequest } from './client.ts';

const originalFetch = globalThis.fetch;
const originalApiUrl = process.env.EXPO_PUBLIC_API_URL;

beforeEach(() => {
  process.env.EXPO_PUBLIC_API_URL = 'https://api.example.test';
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalApiUrl === undefined) delete process.env.EXPO_PUBLIC_API_URL;
  else process.env.EXPO_PUBLIC_API_URL = originalApiUrl;
});

function hangUntilAborted(): typeof fetch {
  return (_input, init) =>
    new Promise((_resolve, reject) => {
      const abort = () => reject(new DOMException('aborted', 'AbortError'));
      if (init?.signal?.aborted) abort();
      else init?.signal?.addEventListener('abort', abort);
    });
}

test('apiRequest returns parsed json for successful responses', async () => {
  globalThis.fetch = async () => Response.json({ data: 1 });

  assert.deepEqual(await apiRequest('/ok'), { data: 1 });
});

test('apiRequest maps error bodies to ApiError', async () => {
  globalThis.fetch = async () =>
    Response.json({ error: { code: 'NOPE', message: 'denied' } }, { status: 403 });

  await assert.rejects(apiRequest('/denied'), (error: unknown) => {
    assert.ok(error instanceof ApiError);
    assert.equal(error.status, 403);
    assert.equal(error.code, 'NOPE');
    return true;
  });
});

test('apiRequest rejects with REQUEST_TIMEOUT when the server never answers', async () => {
  globalThis.fetch = hangUntilAborted();

  await assert.rejects(apiRequest('/slow', {}, { timeoutMs: 20 }), (error: unknown) => {
    assert.ok(error instanceof ApiError);
    assert.equal(error.code, 'REQUEST_TIMEOUT');
    return true;
  });
});

test('apiRequest propagates caller aborts without reporting a timeout', async () => {
  globalThis.fetch = hangUntilAborted();
  const controller = new AbortController();
  const pending = apiRequest('/cancel', { signal: controller.signal });
  controller.abort();

  await assert.rejects(pending, (error: unknown) => {
    assert.ok(!(error instanceof ApiError));
    return true;
  });
});

test('apiRequest rejects immediately when the caller signal is already aborted', async () => {
  globalThis.fetch = hangUntilAborted();
  const controller = new AbortController();
  controller.abort();

  await assert.rejects(apiRequest('/aborted', { signal: controller.signal }));
});
