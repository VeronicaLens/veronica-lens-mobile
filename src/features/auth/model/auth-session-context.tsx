import { createContext, useContext, type ReactNode } from 'react';

import { useAuthSession } from './use-auth-session.ts';

type AuthSessionValue = ReturnType<typeof useAuthSession>;

const AuthSessionContext = createContext<AuthSessionValue | null>(null);

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const auth = useAuthSession();

  return <AuthSessionContext.Provider value={auth}>{children}</AuthSessionContext.Provider>;
}

export function useAuthSessionContext(): AuthSessionValue {
  const value = useContext(AuthSessionContext);
  if (!value) {
    throw new Error('useAuthSessionContext must be used within AuthSessionProvider');
  }
  return value;
}
