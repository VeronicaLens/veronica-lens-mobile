import { useRouter } from 'expo-router';

import { useAuthSessionContext } from '../../../features/auth/index.ts';
import { toConditionObserverParams } from '../../../features/current-conditions/index.ts';
import { useProfileDisplayName } from '../../../features/profile/index.ts';
import { HomePage } from './HomePage.tsx';

export function HomeScreen() {
  const auth = useAuthSessionContext();
  const router = useRouter();
  const { displayName } = useProfileDisplayName();

  if (!auth.session) return null;

  return (
    <HomePage
      accessToken={auth.session.accessToken}
      displayName={displayName ?? auth.session.user.displayName}
      email={auth.session.user.email}
      onOpenEvent={(eventId) => router.push(`/events/${eventId}`)}
      onOpenEvents={() => router.push('/events')}
      onOpenConditionSimulation={(location) =>
        router.push({
          pathname: '/conditions',
          params: location ? toConditionObserverParams(location) : {},
        })
      }
    />
  );
}
