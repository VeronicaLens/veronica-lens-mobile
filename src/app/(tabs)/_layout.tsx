import { Lucide, type LucideIconName } from '@react-native-vector-icons/lucide';
import * as Linking from 'expo-linking';
import { Tabs } from 'expo-router';
import { useEffect, useState } from 'react';

import { getRecoveryAccessToken, useAuthSessionContext } from '../../features/auth/index.ts';
import { AuthPage } from '../../pages/auth/index.ts';
import { theme } from '../../shared/config/index.ts';
import { LoadingScreen } from '../../widgets/loading-screen/index.ts';

const tabs: { name: string; title: string; icon: LucideIconName }[] = [
  { name: 'index', title: 'Início', icon: 'house' },
  { name: 'history', title: 'Galeria', icon: 'images' },
  { name: 'camera', title: 'Câmera', icon: 'camera' },
  { name: 'learn', title: 'Aprender', icon: 'book-open' },
  { name: 'profile', title: 'Perfil', icon: 'user-round' },
];

export default function TabsLayout() {
  const auth = useAuthSessionContext();
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

  if (auth.status !== 'authenticated' || !auth.session) {
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

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: theme.colors.muted,
        tabBarStyle: { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border },
        tabBarLabelStyle: { fontSize: 9 },
      }}
    >
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ color }) => <Lucide color={color} name={tab.icon} size={19} />,
          }}
        />
      ))}
    </Tabs>
  );
}
