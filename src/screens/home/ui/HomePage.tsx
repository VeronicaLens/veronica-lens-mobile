import { Lucide, type LucideIconName } from '@react-native-vector-icons/lucide';
import {
  ActivityIndicator,
  ImageBackground,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useUpcomingEvents } from '../../../features/astronomical-events/index.ts';
import { useCurrentConditions } from '../../../features/current-conditions/index.ts';
import { useDeviceLocation, type DeviceLocation } from '../../../features/device-location/index.ts';
import type { ObservationRating } from '../../../shared/api/index.ts';
import { theme } from '../../../shared/config/index.ts';
import { SkyTodayCard } from '../../../widgets/sky-today/index.ts';

const backgroundImage = require('../../../../assets/loading-background.jpeg') as number;

const EVENT_PREVIEW_PERIOD_DAYS = 30;
const EVENT_PREVIEW_COUNT = 2;

const ratingConfig: Record<ObservationRating, { label: string; color: string }> = {
  good: { label: 'Boas condições', color: theme.colors.info },
  fair: { label: 'Condições regulares', color: theme.colors.event },
  poor: { label: 'Condições desfavoráveis', color: theme.colors.muted },
};

export interface HomePageProps {
  accessToken: string;
  displayName: string | null;
  email: string;
  onOpenEvent(eventId: string): void;
  onOpenEvents(): void;
  onOpenConditionSimulation(location: DeviceLocation | null): void;
}

export function HomePage({
  accessToken,
  displayName,
  email,
  onOpenEvent,
  onOpenEvents,
  onOpenConditionSimulation,
}: HomePageProps) {
  const location = useDeviceLocation();
  const events = useUpcomingEvents(accessToken, EVENT_PREVIEW_PERIOD_DAYS);
  const conditions = useCurrentConditions(accessToken, location.location);
  const upcomingEvents = events.events.slice(0, EVENT_PREVIEW_COUNT);

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top', 'left', 'right']}>
      <ScrollView contentContainerClassName="pb-8" showsVerticalScrollIndicator={false}>
        <ImageBackground resizeMode="cover" source={backgroundImage}>
          <View className="gap-2 bg-canvas/40 px-6 pb-8 pt-6">
            <Text className="font-label text-[11px] uppercase tracking-[3px] text-accent">
              VeronicaLens
            </Text>
            <Text
              accessibilityRole="header"
              className="font-display text-[34px] leading-10 text-ink"
            >
              Descubra{'\n'}
              <Text className="text-accent">o céu.</Text>
            </Text>
            <View className="pt-3">
              <Text className="font-label text-base text-ink">Olá, {displayName ?? email}.</Text>
              <Text className="font-body text-sm leading-5 text-muted">
                O universo está te esperando hoje.
              </Text>
            </View>
          </View>
        </ImageBackground>

        <View className="gap-8 px-6 pt-8">
          <View className="gap-4 rounded-card border border-border bg-surface p-5">
            <Pressable
              accessibilityLabel="Ver previsão das condições de observação para os próximos 7 dias"
              accessibilityRole="button"
              className="flex-row items-center justify-between active:opacity-80"
              onPress={() => onOpenConditionSimulation(location.location)}
            >
              <View className="flex-row items-center gap-2">
                <Lucide color={theme.colors.accent} name="sparkles" size={16} />
                <Text className="font-label text-[11px] uppercase tracking-[2px] text-accent">
                  Condições de observação
                </Text>
              </View>
            </Pressable>

            {conditions.conditions ? (
              <>
                <View className="flex-row items-center gap-2">
                  <View
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: ratingConfig[conditions.conditions.rating].color }}
                  />
                  <Text className="font-label text-base text-ink">
                    {ratingConfig[conditions.conditions.rating].label}
                  </Text>
                </View>
                <View className="flex-row">
                  <ConditionStat
                    icon="thermometer"
                    label="Temperatura"
                    value={
                      conditions.conditions.temperatureCelsius !== null
                        ? `${Math.round(conditions.conditions.temperatureCelsius)}°`
                        : '—'
                    }
                  />
                  <ConditionStat
                    icon="cloud-sun"
                    label="Céu"
                    value={conditions.conditions.skyLabel}
                  />
                  <ConditionStat
                    icon="cloud-rain"
                    label="Chance de chuva"
                    value={
                      conditions.conditions.precipitationProbabilityPercent !== null
                        ? `${Math.round(conditions.conditions.precipitationProbabilityPercent)}%`
                        : '—'
                    }
                  />
                  <ConditionStat
                    icon="eye"
                    label="Visibilidade"
                    value={conditions.conditions.visibilityLabel}
                  />
                </View>
                <Text className="text-center font-body text-[10px] text-muted">
                  Previsão horária para {formatTime(new Date(conditions.conditions.observedAt))}
                </Text>
              </>
            ) : conditions.loading ? (
              <View className="flex-row items-center gap-3">
                <ActivityIndicator color={theme.colors.primary} />
                <Text className="flex-1 font-body text-sm leading-5 text-muted">
                  Calculando condições de observação...
                </Text>
              </View>
            ) : conditions.error ? (
              <Pressable
                accessibilityRole="button"
                className="flex-row items-center gap-3"
                onPress={conditions.refresh}
              >
                <Lucide color={theme.colors.event} name="cloud-off" size={18} />
                <Text className="flex-1 font-body text-sm leading-5 text-muted">
                  {conditions.error}
                </Text>
              </Pressable>
            ) : (
              <Pressable
                accessibilityRole="button"
                className="flex-row items-center gap-3"
                onPress={location.retry}
              >
                <Lucide color={theme.colors.muted} name="map-pin-off" size={18} />
                <Text className="flex-1 font-body text-sm leading-5 text-muted">
                  {location.fallbackMessage ?? 'Obtendo sua localização para consultar o clima.'}
                </Text>
              </Pressable>
            )}
            <Pressable
              accessibilityRole="button"
              className="flex-row items-center justify-center gap-2 rounded-pill border border-border bg-surface-2 px-4 py-3 active:opacity-80"
              onPress={() => onOpenConditionSimulation(location.location)}
            >
              <Lucide color={theme.colors.accent} name="calendar-clock" size={16} />
              <Text className="font-label text-xs text-accent">Simular outro dia e horário</Text>
            </Pressable>
          </View>

          <SkyTodayCard
            accessToken={accessToken}
            events={upcomingEvents}
            location={location.location}
            locationMessage={location.fallbackMessage}
            onOpenEvent={onOpenEvent}
            onOpenEvents={onOpenEvents}
            onRetryLocation={location.retry}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ConditionStat({
  icon,
  label,
  value,
}: {
  icon: LucideIconName;
  label: string;
  value: string;
}) {
  return (
    <View className="flex-1 items-center gap-1.5">
      <Lucide color={theme.colors.info} name={icon} size={18} />
      {value ? <Text className="font-display text-base text-ink">{value}</Text> : null}
      <Text className="text-center font-body text-[10px] leading-3 text-muted" numberOfLines={2}>
        {label}
      </Text>
    </View>
  );
}

function formatTime(value: Date): string {
  return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(value);
}
