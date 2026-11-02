import { Lucide } from '@react-native-vector-icons/lucide';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import type { DeviceLocation } from '../../../features/device-location/index.ts';
import { getEventTypeInfo } from '../../../features/astronomical-events/index.ts';
import { useSkyToday, type SkyTodayItem } from '../../../features/sky-guide/index.ts';
import type { AstronomicalEvent } from '../../../shared/api/index.ts';
import { theme } from '../../../shared/config/index.ts';

export interface SkyTodayCardProps {
  accessToken: string;
  location: DeviceLocation | null;
  locationMessage: string | null;
  onRetryLocation(): void;
  /** Curated events listed inside the card; the section is hidden when there are none. */
  events?: AstronomicalEvent[];
  onOpenEvent?(eventId: string): void;
  onOpenEvents?(): void;
}

export function SkyTodayCard({
  accessToken,
  location,
  locationMessage,
  onRetryLocation,
  events = [],
  onOpenEvent,
  onOpenEvents,
}: SkyTodayCardProps) {
  const sky = useSkyToday(accessToken, location);

  return (
    <View className="gap-4 rounded-card border border-border bg-surface p-5">
      <View className="gap-1">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <Lucide color={theme.colors.accent} name="telescope" size={16} />
            <Text className="font-label text-[11px] uppercase tracking-[2px] text-accent">
              Hoje no seu céu
            </Text>
          </View>
          {onOpenEvents ? (
            <Pressable
              accessibilityLabel="Ver agenda de eventos astronômicos"
              accessibilityRole="button"
              className="flex-row items-center gap-1 active:opacity-80"
              onPress={onOpenEvents}
            >
              <Text className="font-label text-xs text-accent">Agenda</Text>
              <Lucide color={theme.colors.accent} name="chevron-right" size={16} />
            </Pressable>
          ) : null}
        </View>
        <Text className="font-body text-xs leading-4 text-muted">
          Horários calculados para a sua localização. Direções em relação ao norte verdadeiro.
        </Text>
      </View>

      {!location ? (
        <Pressable
          accessibilityRole="button"
          className="flex-row items-center gap-3 active:opacity-80"
          onPress={onRetryLocation}
        >
          <Lucide color={theme.colors.muted} name="map-pin-off" size={18} />
          <Text className="flex-1 font-body text-sm leading-5 text-muted">
            {locationMessage ?? 'Obtendo sua localização para calcular o céu.'}
          </Text>
        </Pressable>
      ) : sky.loading && sky.items.length === 0 ? (
        <View className="flex-row items-center gap-3">
          <ActivityIndicator color={theme.colors.primary} />
          <Text className="flex-1 font-body text-sm text-muted">Calculando posições...</Text>
        </View>
      ) : sky.error ? (
        <Pressable
          accessibilityRole="button"
          className="flex-row items-center gap-3 active:opacity-80"
          onPress={sky.refresh}
        >
          <Lucide color={theme.colors.event} name="cloud-off" size={18} />
          <Text className="flex-1 font-body text-sm leading-5 text-muted">{sky.error}</Text>
        </Pressable>
      ) : sky.items.length === 0 ? (
        <Text className="font-body text-sm text-muted">Nenhum astro disponível agora.</Text>
      ) : (
        <View className="gap-3">
          {sky.items.map((item) => (
            <SkyTodayRow key={item.id} item={item} />
          ))}
        </View>
      )}

      {events.length > 0 && onOpenEvent ? (
        <View className="gap-3 border-t border-border pt-4">
          <Text className="font-label text-[11px] uppercase tracking-[2px] text-muted">
            Eventos especiais
          </Text>
          {events.map((event) => {
            const config = getEventTypeInfo(event.type);
            return (
              <Pressable
                key={event.id}
                accessibilityLabel={`Abrir detalhes de ${event.title}`}
                accessibilityRole="button"
                className="flex-row items-center gap-3 active:opacity-80"
                onPress={() => onOpenEvent(event.id)}
              >
                <View className="h-10 w-10 items-center justify-center rounded-full bg-surface-2">
                  <Lucide color={config.color} name={config.icon} size={18} />
                </View>
                <View className="flex-1 gap-0.5">
                  <Text className="font-label text-sm text-ink" numberOfLines={1}>
                    {event.title}
                  </Text>
                  <Text className="font-body text-xs text-muted">
                    {new Date(event.startsAt).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'short',
                    })}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

function SkyTodayRow({ item }: { item: SkyTodayItem }) {
  const visible = item.status === 'up' || item.status === 'always-up';

  return (
    <View className="flex-row items-center gap-3">
      <View className="h-10 w-10 items-center justify-center rounded-full bg-surface-2">
        <Lucide
          color={visible ? theme.colors.accent : theme.colors.muted}
          name={item.type === 'moon' ? 'moon' : 'orbit'}
          size={18}
        />
      </View>
      <View className="flex-1 gap-0.5">
        <Text className="font-label text-sm text-ink">{item.name}</Text>
        <Text className="font-body text-xs leading-4 text-muted">{describe(item)}</Text>
      </View>
      <Text
        className="font-label text-[10px] uppercase tracking-[1px]"
        style={{ color: visible ? theme.colors.info : theme.colors.muted }}
      >
        {visible ? 'Visível' : 'Abaixo'}
      </Text>
    </View>
  );
}

function describe(item: SkyTodayItem): string {
  if (item.status === 'always-up') return 'Acima do horizonte o dia todo.';
  if (item.status === 'never-up') return 'Não aparece no seu horizonte hoje.';
  if (!item.nextChange) return 'Sem nascer ou pôr nas próximas 24 h.';

  const verb = item.nextChange.kind === 'rise' ? 'Nasce' : 'Põe-se';
  const change = `${verb} ${formatWhen(item.nextChange.at)} (${item.nextChange.direction})`;
  if (item.status === 'up' && item.nextTransit) {
    return `${change} · ponto mais alto ${formatWhen(item.nextTransit.at)}`;
  }
  return change;
}

function formatWhen(value: Date): string {
  const time = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(
    value,
  );
  const today = new Date();
  if (value.toDateString() === today.toDateString()) return `às ${time}`;
  const tomorrow = new Date(today.getTime() + 86_400_000);
  if (value.toDateString() === tomorrow.toDateString()) return `amanhã às ${time}`;
  return `${value.toLocaleDateString('pt-BR')} às ${time}`;
}
