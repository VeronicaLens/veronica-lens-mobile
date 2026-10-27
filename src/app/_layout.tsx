import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import '../../global.css';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack>
        <Stack.Screen name="index" options={{ title: 'Veronica Lens' }} />
        <Stack.Screen name="auth/reset-password" options={{ title: 'Redefinir senha' }} />
      </Stack>
    </>
  );
}
