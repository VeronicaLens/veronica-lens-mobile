import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { useAuthSessionContext } from '../../features/auth/index.ts';
import { parseConditionObserverParams } from '../../features/current-conditions/index.ts';
import { ObservationConditionsPage } from '../../pages/conditions/index.ts';

export default function ConditionsScreen() {
  const auth = useAuthSessionContext();
  const router = useRouter();
  const params = useLocalSearchParams<{
    latitude?: string;
    longitude?: string;
    elevation?: string;
    accuracy?: string;
    timestamp?: string;
  }>();

  if (auth.status !== 'authenticated' || !auth.session) {
    return <Redirect href="/" />;
  }

  return (
    <ObservationConditionsPage
      accessToken={auth.session.accessToken}
      initialLocation={parseConditionObserverParams(params)}
      onBack={() => router.navigate('/')}
    />
  );
}
