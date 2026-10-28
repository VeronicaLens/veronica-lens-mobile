import { Text, View } from 'react-native';

interface ComingSoonScreenProps {
  title: string;
}

export function ComingSoonScreen({ title }: ComingSoonScreenProps) {
  return (
    <View className="flex-1 items-center justify-center bg-canvas px-6">
      <Text className="font-display text-xl text-ink">{title}</Text>
      <Text className="mt-2 font-body text-sm text-muted">Em portagem para o app novo.</Text>
    </View>
  );
}
