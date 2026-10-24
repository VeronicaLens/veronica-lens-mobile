import { useState } from 'react';
import { Text } from 'react-native';

import { Button, Screen } from '@/shared/ui';

export function HomeScreen() {
  const [count, setCount] = useState(0);

  return (
    <Screen centered>
      <Text className="text-3xl font-bold text-primary">Veronica Lens</Text>

      <Text className="text-base text-foreground">Observações: {count}</Text>

      <Button
        title="Registrar observação"
        onPress={() => setCount((current) => current + 1)}
      />
    </Screen>
  );
}
