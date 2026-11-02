import { useIsFocused } from 'expo-router';

import { useAuthSessionContext } from '../../../features/auth/index.ts';
import { ObservationHistoryPage } from './ObservationHistoryPage.tsx';

export function ObservationHistoryScreen() {
  const auth = useAuthSessionContext();
  const focused = useIsFocused();

  if (!auth.session) return null;

  return <ObservationHistoryPage accessToken={auth.session.accessToken} focused={focused} />;
}
