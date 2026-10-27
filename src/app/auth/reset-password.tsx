import * as Linking from 'expo-linking';
import { Text, View } from 'react-native';

import { getRecoveryAccessToken } from '../../features/auth/index.ts';

export default function ResetPasswordScreen() {
  const accessToken = getRecoveryAccessToken(Linking.useLinkingURL());

  return (
    <View className="flex-1 items-center justify-center bg-canvas px-6">
      <Text className="font-body text-base text-muted">
        {accessToken ? 'Link de recuperação válido.' : 'Link de recuperação inválido ou expirado.'}
      </Text>
    </View>
  );
}
