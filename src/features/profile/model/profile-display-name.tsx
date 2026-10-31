import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

interface ProfileDisplayNameValue {
  displayName: string | null;
  setDisplayName(displayName: string | null): void;
}

const ProfileDisplayNameContext = createContext<ProfileDisplayNameValue | null>(null);

export function ProfileDisplayNameProvider({ children }: { children: ReactNode }) {
  const [displayName, setDisplayName] = useState<string | null>(null);
  const value = useMemo(() => ({ displayName, setDisplayName }), [displayName]);

  return (
    <ProfileDisplayNameContext.Provider value={value}>
      {children}
    </ProfileDisplayNameContext.Provider>
  );
}

export function useProfileDisplayName(): ProfileDisplayNameValue {
  const value = useContext(ProfileDisplayNameContext);
  if (!value) {
    throw new Error('useProfileDisplayName must be used within ProfileDisplayNameProvider');
  }
  return value;
}
