import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { getRecoverySession } from './recovery-link.ts';

describe('getRecoverySession', () => {
  it('reads both tokens from a recovery deep-link fragment', () => {
    assert.deepEqual(
      getRecoverySession(
        'veronicalens://auth/reset-password#access_token=access&refresh_token=refresh&type=recovery',
      ),
      { accessToken: 'access', refreshToken: 'refresh' },
    );
  });

  it('ignores links that are not recovery links or miss a token', () => {
    assert.equal(
      getRecoverySession(
        'veronicalens://auth/reset-password#access_token=access&refresh_token=refresh&type=signup',
      ),
      null,
    );
    assert.equal(
      getRecoverySession('veronicalens://auth/reset-password#access_token=access&type=recovery'),
      null,
    );
    assert.equal(getRecoverySession('veronicalens://auth/reset-password'), null);
    assert.equal(getRecoverySession(null), null);
  });
});
