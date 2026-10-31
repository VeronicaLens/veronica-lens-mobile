import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk/700Bold';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';

import { AuthSessionProvider } from '../../features/auth/index.ts';
import { LoadingScreen } from '../../widgets/loading-screen/index.ts';

import '../../../global.css';

const MIN_LOADING_MS = 1500;

function AppBootGate() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    SpaceGrotesk_700Bold,
  });
  const [minLoadingElapsed, setMinLoadingElapsed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMinLoadingElapsed(true), MIN_LOADING_MS);
    return () => clearTimeout(timer);
  }, []);

  if (!minLoadingElapsed || (!fontsLoaded && !fontError)) {
    return <LoadingScreen />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="auth/reset-password" />
    </Stack>
  );
}

export function RootLayout() {
  return (
    <AuthSessionProvider>
      <StatusBar style="light" />
      <AppBootGate />
    </AuthSessionProvider>
  );
}
