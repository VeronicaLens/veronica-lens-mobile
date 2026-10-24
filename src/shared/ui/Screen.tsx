import type { PropsWithChildren } from 'react';
import { View } from 'react-native';

interface ScreenProps extends PropsWithChildren {
  centered?: boolean;
}

export function Screen({ centered = false, children }: ScreenProps) {
  return (
    <View
      className={`flex-1 justify-center gap-6 bg-background p-6 ${
        centered ? 'items-center' : ''
      }`}
    >
      {children}
    </View>
  );
}
