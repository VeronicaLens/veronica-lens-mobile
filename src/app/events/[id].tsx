import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { useAuthSessionContext } from '../../features/auth/index.ts';
import { EventsPage } from '../../pages/events/index.ts';

export default function EventDetailScreen() {
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
