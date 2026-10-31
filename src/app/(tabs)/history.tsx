import { useAuthSessionContext } from '../../features/auth/index.ts';
import { ObservationHistoryPage } from '../../pages/observation-history/index.ts';

export default function HistoryTab() {
  const auth = useAuthSessionContext();

  if (!auth.session) return null;

  return <ObservationHistoryPage accessToken={auth.session.accessToken} />;
}
