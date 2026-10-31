import { useAuthSessionContext } from '../../../features/auth/index.ts';
import { ObservationHistoryPage } from './ObservationHistoryPage.tsx';

export function ObservationHistoryScreen() {
  const auth = useAuthSessionContext();

  if (!auth.session) return null;

  return <ObservationHistoryPage accessToken={auth.session.accessToken} />;
}
