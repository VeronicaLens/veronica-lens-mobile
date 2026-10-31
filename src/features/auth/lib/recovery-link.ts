export interface RecoverySession {
  accessToken: string;
  refreshToken: string;
}

export function getRecoverySession(url: string | null): RecoverySession | null {
  if (!url) return null;

  try {
    const fragment = url.split('#')[1];
    if (!fragment) return null;
    const params = new URLSearchParams(fragment);
    if (params.get('type') !== 'recovery') return null;
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    return accessToken && refreshToken ? { accessToken, refreshToken } : null;
  } catch {
    return null;
  }
}
