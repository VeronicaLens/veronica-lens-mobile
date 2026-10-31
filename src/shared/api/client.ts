import { getPublicEnvironment } from '../config/index.ts';

export class ApiError extends Error {
  public readonly status: number;
  public readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export const API_REQUEST_TIMEOUT_MS = 15_000;

interface ApiRequestOptions {
  timeoutMs?: number;
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  { timeoutMs = API_REQUEST_TIMEOUT_MS }: ApiRequestOptions = {},
): Promise<T> {
  const { apiUrl } = getPublicEnvironment();
  const controller = new AbortController();
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  const callerSignal = init.signal;
  const abortFromCaller = () => controller.abort();
  if (callerSignal?.aborted) controller.abort();
  else callerSignal?.addEventListener('abort', abortFromCaller);

  try {
    const response = await fetch(`${apiUrl}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...init.headers,
      },
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as {
        error?: { code?: unknown; message?: unknown };
      } | null;
      const code = typeof body?.error?.code === 'string' ? body.error.code : 'API_REQUEST_FAILED';
      const message =
        typeof body?.error?.message === 'string'
          ? body.error.message
          : `API request failed with status ${response.status}`;
      throw new ApiError(response.status, code, message);
    }

    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  } catch (error) {
    if (timedOut) {
      throw new ApiError(0, 'REQUEST_TIMEOUT', 'A requisição demorou demais para responder.');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
    callerSignal?.removeEventListener('abort', abortFromCaller);
  }
}
