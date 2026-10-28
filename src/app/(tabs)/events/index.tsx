import { Redirect, useRouter } from 'expo-router';

import { useAuthSessionContext } from '../../../features/auth/index.ts';
import { EventsPage } from '../../../pages/events/index.ts';

export default function EventsScreen() {
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
