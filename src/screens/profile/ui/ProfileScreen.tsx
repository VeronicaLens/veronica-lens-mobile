import { useRouter } from 'expo-router';

import { useAuthSessionContext } from '../../../features/auth/index.ts';
import { deactivateStoredPushDevice } from '../../../features/notifications/index.ts';
import { useProfileDisplayName } from '../../../features/profile/index.ts';
import { ProfilePage } from './ProfilePage.tsx';

export function ProfileScreen() {
  const auth = useAuthSessionContext();
  const router = useRouter();
  const { setDisplayName } = useProfileDisplayName();

  if (!auth.session) return null;
  const { accessToken, user } = auth.session;

  return (
    <ProfilePage
      accessToken={accessToken}
      email={user.email}
      onAccountDeleted={async () => {
        setDisplayName(null);
        await auth.logout();
      }}
      onLogout={async () => {
        setDisplayName(null);
        await deactivateStoredPushDevice(accessToken);
        await auth.logout();
      }}
      onOpenHistory={() => router.navigate('/history')}
      onSaved={(profile) => setDisplayName(profile.displayName)}
    />
  );
}
