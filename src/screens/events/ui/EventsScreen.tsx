import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { useAuthSessionContext } from '../../../features/auth/index.ts';
import { EventsPage } from './EventsPage.tsx';

export function EventsScreen() {
  const auth = useAuthSessionContext();
  const router = useRouter();

  if (auth.status !== 'authenticated' || !auth.session) {
    return <Redirect href="/" />;
  }

  return (
    <EventsPage
      accessToken={auth.session.accessToken}
      onInitialEventHandled={() => router.back()}
    />
  );
}

export function EventDetailScreen() {
  const auth = useAuthSessionContext();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  if (auth.status !== 'authenticated' || !auth.session) {
    return <Redirect href="/" />;
  }

  return (
    <EventsPage
      accessToken={auth.session.accessToken}
      initialEventId={id}
      onInitialEventHandled={() => router.back()}
    />
  );
}
