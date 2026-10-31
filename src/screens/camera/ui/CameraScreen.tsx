import { useIsFocused, useRouter } from 'expo-router';

import { useAuthSessionContext } from '../../../features/auth/index.ts';
import { useIsAppActive } from '../../../shared/lib/index.ts';
import { SkyGuidePage } from './SkyGuidePage.tsx';

export function CameraScreen() {
  const auth = useAuthSessionContext();
  const router = useRouter();
  const focused = useIsFocused();
  const appActive = useIsAppActive();

  // Tabs stay mounted after the first visit; unmount so the camera and sensors stop off-screen.
  if (!focused || !auth.session) return null;

  return (
    <SkyGuidePage
      accessToken={auth.session.accessToken}
      isActive={appActive}
      onClose={() => router.navigate('/')}
    />
  );
}
