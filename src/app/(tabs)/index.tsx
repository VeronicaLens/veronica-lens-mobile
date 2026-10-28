import { useRouter } from 'expo-router';

import { useAuthSessionContext } from '../../features/auth/index.ts';
import { HomePage } from '../../pages/home/index.ts';

export default function HomeTab() {
  const auth = useAuthSessionContext();
  const router = useRouter();

  if (!auth.session) return null;

  return (
    <HomePage
      accessToken={auth.session.accessToken}
      displayName={auth.session.user.displayName}
      email={auth.session.user.email}
      onOpenCamera={() => router.navigate('/camera')}
      onOpenEvent={(eventId) => router.push(`/events/${eventId}`)}
      onOpenEvents={() => router.push('/events')}
      onOpenHistory={() => router.navigate('/history')}
      onOpenConditionSimulation={() => undefined}
    />
  );
}
