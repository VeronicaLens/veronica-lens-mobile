import { Stack } from 'expo-router';

import { AppProviders } from '@/core';

export default function RootLayout() {
  return (
    <AppProviders>
      <Stack>
        <Stack.Screen name="index" options={{ title: 'Veronica Lens' }} />
        <Stack.Screen
          name="auth/reset-password"
          options={{ title: 'Redefinir senha' }}
        />
      </Stack>
    </AppProviders>
  );
}