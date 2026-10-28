import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

import { getRecoveryAccessToken, useAuthSessionContext } from '../features/auth/index.ts';
import { AuthPage } from '../pages/auth/index.ts';
import { HomePage } from '../pages/home/index.ts';
import { LoadingScreen } from '../widgets/loading-screen/index.ts';

export default function IndexScreen() {
  const auth = useAuthSessionContext();
  const router = useRouter();
  const [recoveryAccessToken, setRecoveryAccessToken] = useState<string | null>(null);

  useEffect(() => {
    const handleUrl = (url: string | null) => setRecoveryAccessToken(getRecoveryAccessToken(url));
    void Linking.getInitialURL().then(handleUrl);
    const subscription = Linking.addEventListener('url', ({ url }) => handleUrl(url));
    return () => subscription.remove();
  }, []);

  if (auth.status === 'restoring') {
    return <LoadingScreen />;
  }

  if (auth.status === 'authenticated' && auth.session) {
    return (
      <HomePage
        accessToken={auth.session.accessToken}
        displayName={auth.session.user.displayName}
        email={auth.session.user.email}
        onOpenCamera={() => undefined}
        onOpenEvent={(eventId) => router.push(`/events/${eventId}`)}
        onOpenEvents={() => router.push('/events')}
        onOpenHistory={() => undefined}
        onOpenConditionSimulation={() => undefined}
      />
    );
  }

  return (
    <AuthPage
      key={recoveryAccessToken ?? 'authentication'}
      onGoogleSignIn={auth.authenticateWithGoogle}
      recoveryAccessToken={recoveryAccessToken}
      onRequestRecovery={auth.requestPasswordRecovery}
      onResetComplete={() => setRecoveryAccessToken(null)}
      onSignIn={auth.authenticate}
      onSignUp={auth.register}
      onUpdatePassword={auth.updatePassword}
    />
  );
}
