import { useRouter } from 'expo-router';

import { useAuthSessionContext } from '../../features/auth/index.ts';
import { SkyGuidePage } from '../../pages/camera/index.ts';

export default function CameraTab() {
  const auth = useAuthSessionContext();
  const router = useRouter();

  if (!auth.session) return null;

  return (
    <SkyGuidePage accessToken={auth.session.accessToken} onClose={() => router.navigate('/')} />
  );
}
