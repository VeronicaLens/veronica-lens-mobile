import * as Linking from 'expo-linking';
import { useMemo } from 'react';

import { parseRecoveryLink } from '../lib/parseRecoveryLink';
import type { RecoveryLink } from './types';

// Tokens stay in memory only; never log, render or persist them.
export function useRecoveryLink(): RecoveryLink {
  const url = Linking.useLinkingURL();

  return useMemo(() => parseRecoveryLink(url), [url]);
}
