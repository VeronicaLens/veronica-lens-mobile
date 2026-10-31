import { useAuthSessionContext } from '../../features/auth/index.ts';
import { LearnPage } from '../../pages/learn/index.ts';

export default function LearnTab() {
  const auth = useAuthSessionContext();

  if (!auth.session) return null;

  return <LearnPage accessToken={auth.session.accessToken} />;
}
