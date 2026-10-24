import type { RecoveryLink } from '../model/types';

const RECOVERY_PATH = 'auth/reset-password';

function readParams(part: string, target: Map<string, string>): boolean {
  for (const pair of part.split('&')) {
    if (pair.length === 0) {
      continue;
    }

    const separator = pair.indexOf('=');
    const rawKey = separator === -1 ? pair : pair.slice(0, separator);
    const rawValue = separator === -1 ? '' : pair.slice(separator + 1);

    try {
      target.set(
        decodeURIComponent(rawKey),
        decodeURIComponent(rawValue.replace(/\+/g, ' ')),
      );
    } catch {
      return false;
    }
  }

  return true;
}

// Supabase's implicit flow returns tokens or errors in the URL fragment.
export function parseRecoveryLink(url: string | null): RecoveryLink {
  if (!url) {
    return { status: 'missing' };
  }

  const hashIndex = url.indexOf('#');
  const beforeHash = hashIndex === -1 ? url : url.slice(0, hashIndex);
  const fragment = hashIndex === -1 ? '' : url.slice(hashIndex + 1);
  const queryIndex = beforeHash.indexOf('?');
  const path =
    queryIndex === -1 ? beforeHash : beforeHash.slice(0, queryIndex);
  const query = queryIndex === -1 ? '' : beforeHash.slice(queryIndex + 1);

  if (!path.replace(/\/+$/, '').endsWith(RECOVERY_PATH)) {
    return { status: 'missing' };
  }

  const params = new Map<string, string>();

  if (!readParams(query, params) || !readParams(fragment, params)) {
    return { status: 'invalid' };
  }

  if (params.has('error') || params.has('error_code')) {
    return params.get('error_code') === 'otp_expired'
      ? { status: 'expired' }
      : { status: 'invalid' };
  }

  if (params.size === 0) {
    return { status: 'missing' };
  }

  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  const expiresAt = Number(params.get('expires_at'));

  if (
    params.get('type') !== 'recovery' ||
    !accessToken ||
    !refreshToken ||
    !Number.isInteger(expiresAt) ||
    expiresAt <= 0
  ) {
    return { status: 'invalid' };
  }

  return {
    status: 'ready',
    session: { accessToken, refreshToken, expiresAt },
  };
}
