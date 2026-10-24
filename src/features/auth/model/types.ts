export interface RecoverySession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export type RecoveryLink =
  | { status: 'missing' }
  | { status: 'expired' }
  | { status: 'invalid' }
  | { status: 'ready'; session: RecoverySession };