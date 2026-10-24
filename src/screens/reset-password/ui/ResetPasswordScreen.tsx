import { router } from 'expo-router';
import { Text } from 'react-native';

import { useRecoveryLink, type RecoveryLink } from '@/features/auth';
import { Button, Screen } from '@/shared/ui';

const messages: Record<RecoveryLink['status'], string> = {
  missing: 'Abra o link de recuperação enviado para o seu email.',
  expired: 'Este link expirou. Solicite um novo email de recuperação.',
  invalid: 'Este link de recuperação é inválido. Solicite um novo email.',
  ready:
    'Link de recuperação recebido. A definição da nova senha será habilitada em breve.',
};

export function ResetPasswordScreen() {
  const link = useRecoveryLink();

  return (
    <Screen>
      <Text className="text-center text-base text-foreground">
        {messages[link.status]}
      </Text>

      <Button title="Voltar ao início" onPress={() => router.replace('/')} />
    </Screen>
  );
}
