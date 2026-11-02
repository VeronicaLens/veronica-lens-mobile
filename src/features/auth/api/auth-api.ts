import type {
  DataResponse,
  GoogleSignInRequest,
  PasswordRecoveryRequest,
  PasswordUpdateRequest,
  RefreshSessionRequest,
  Session,
  SignInRequest,
  SignUpRequest,
  SignUpResult,
} from '../../../shared/api/index.ts';
import { apiRequest } from '../../../shared/api/index.ts';
import type { RecoverySession } from '../lib/recovery-link.ts';

type Request = <T>(path: string, init?: RequestInit) => Promise<T>;

function jsonRequest<T>(path: string, body: unknown, request: Request): Promise<T> {
  return request<T>(path, { method: 'POST', body: JSON.stringify(body) });
}

export async function signUp(
  input: SignUpRequest,
  request: Request = apiRequest,
): Promise<SignUpResult> {
  return (await jsonRequest<DataResponse<SignUpResult>>('/auth/sign-up', input, request)).data;
}

export async function signIn(
  input: SignInRequest,
  request: Request = apiRequest,
): Promise<Session> {
  return (await jsonRequest<DataResponse<Session>>('/auth/sign-in', input, request)).data;
}

export async function signInWithGoogle(
  idToken: string,
  request: Request = apiRequest,
): Promise<Session> {
  const body: GoogleSignInRequest = { idToken };
  return (await jsonRequest<DataResponse<Session>>('/auth/google', body, request)).data;
}

export async function refreshSession(
  refreshToken: string,
  request: Request = apiRequest,
): Promise<Session> {
  const body: RefreshSessionRequest = { refreshToken };
  return (await jsonRequest<DataResponse<Session>>('/auth/refresh', body, request)).data;
}

export async function requestPasswordRecovery(
  email: string,
  request: Request = apiRequest,
): Promise<string> {
  const body: PasswordRecoveryRequest = { email };
  const response = await jsonRequest<DataResponse<{ message: string }>>(
    '/auth/password/recovery',
    body,
    request,
  );
  return response.data.message;
}

export async function signOut(session: Session, request: Request = apiRequest): Promise<void> {
  await request<void>('/auth/sign-out', {
    method: 'POST',
    headers: { Authorization: `Bearer ${session.accessToken}` },
  });
}

export async function updatePassword(
  recovery: RecoverySession,
  password: string,
  request: Request = apiRequest,
): Promise<void> {
  const { accessToken, refreshToken } = recovery;
  const body: PasswordUpdateRequest = { password, refreshToken };
  await request<unknown>('/auth/password', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(body),
  });
}
