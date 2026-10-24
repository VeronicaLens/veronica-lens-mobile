import '../styles/global.css';

import { StatusBar } from 'expo-status-bar';
import type { PropsWithChildren } from 'react';

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <>
      <StatusBar style="dark" />
      {children}
    </>
  );
}
