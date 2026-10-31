import { useAuthSessionContext } from '../../../features/auth/index.ts';
import { LearnPage } from './LearnPage.tsx';

export function LearnScreen() {
  const auth = useAuthSessionContext();

  if (!auth.session) return null;

  return <LearnPage accessToken={auth.session.accessToken} />;
}
