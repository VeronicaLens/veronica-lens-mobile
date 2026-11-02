import { Lucide, type LucideIconName } from '@react-native-vector-icons/lucide';
import { useState } from 'react';
import {
  ActivityIndicator,
  ImageBackground,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useEvent } from '../../../features/astronomical-events/index.ts';
import { useDeviceLocation } from '../../../features/device-location/index.ts';
import { theme } from '../../../shared/config/index.ts';
import { SkyCalendar, SkyTodayCard } from '../../../widgets/sky-today/index.ts';
import { EventDetailPage } from './EventDetailPage.tsx';

const backgroundImage = require('../../../../assets/loading-background.jpeg') as number;

interface EventsPageProps {
  accessToken: string;
  initialEventId?: string | null;
  onInitialEventHandled?(): void;
}

export function EventsPage({
  accessToken,
  initialEventId,
  onInitialEventHandled,
}: EventsPageProps) {
  const deviceLocation = useDeviceLocation();
  const [skyDay, setSkyDay] = useState<Date | null>(null);
  const linkedEvent = useEvent(accessToken, initialEventId ?? null);

  if (linkedEvent.event) {
    return (
      <EventDetailPage
        accessToken={accessToken}
        event={linkedEvent.event}
        onBack={() => onInitialEventHandled?.()}
      />
    );
  }

  if (initialEventId && (linkedEvent.loading || linkedEvent.notFound || linkedEvent.error)) {
    return (
      <SafeAreaView className="flex-1 bg-canvas px-5 pt-5" edges={['top', 'left', 'right']}>
        {linkedEvent.loading ? (
          <View className="items-center gap-3 rounded-card bg-surface p-8">
            <ActivityIndicator color={theme.colors.primary} />
            <Text className="font-body text-sm text-muted">Abrindo evento...</Text>
          </View>
        ) : linkedEvent.notFound ? (
          <EmptyState
            icon="calendar-x"
            title="Evento não encontrado"
            message="Este evento não está mais disponível na agenda atual."
            action="Voltar para eventos"
            onPress={() => onInitialEventHandled?.()}
          />
        ) : (
          <EmptyState
            icon="cloud-off"
            title="Evento indisponível"
            message={linkedEvent.error ?? 'Não foi possível carregar o evento.'}
            action="Tentar novamente"
            onPress={linkedEvent.refresh}
          />
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top', 'left', 'right']}>
      <ScrollView contentContainerClassName="pb-8" showsVerticalScrollIndicator={false}>
        <ImageBackground resizeMode="cover" source={backgroundImage}>
          <View className="gap-2 bg-canvas/40 px-5 pb-6 pt-6">
            <Text className="font-label text-[11px] uppercase tracking-[3px] text-accent">
              Planeje sua observação
            </Text>
            <Text accessibilityRole="header" className="font-display text-[28px] text-ink">
              Eventos astronômicos
            </Text>
            <Text className="font-body text-sm leading-5 text-muted">
              Veja quando a Lua e os planetas nascem e se põem na sua localização.
            </Text>
          </View>
        </ImageBackground>

        <View className="gap-5 px-5 pt-5">
          <SkyCalendar selected={skyDay} onSelect={setSkyDay} />
          <SkyTodayCard
            accessToken={accessToken}
            day={skyDay}
            location={deviceLocation.location}
            locationMessage={deviceLocation.fallbackMessage}
            onRetryLocation={deviceLocation.retry}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function EmptyState({
  icon,
  title,
  message,
  action,
  onPress,
}: {
  icon: LucideIconName;
  title: string;
  message: string;
  action?: string;
  onPress?(): void;
}) {
  return (
    <View className="items-center gap-3 rounded-card border border-border bg-surface p-7">
      <Lucide color={theme.colors.accent} name={icon} size={28} />
      <Text className="font-display text-lg text-ink">{title}</Text>
      <Text className="text-center font-body text-sm leading-5 text-muted">{message}</Text>
      {action && onPress ? (
        <Pressable
          className="mt-2 rounded-pill bg-brand px-5 py-3 active:opacity-80"
          onPress={onPress}
        >
          <Text className="font-label text-xs text-ink">{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
