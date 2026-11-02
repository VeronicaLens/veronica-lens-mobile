import { Lucide } from '@react-native-vector-icons/lucide';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import type { DeviceLocation } from '../../../features/device-location/index.ts';
import { getEventTypeInfo } from '../../../features/astronomical-events/index.ts';
import { useSkyToday, type SkyTodayItem } from '../../../features/sky-guide/index.ts';
import type { AstronomicalEvent } from '../../../shared/api/index.ts';
import { theme } from '../../../shared/config/index.ts';
import {
  buildRowEntries,
  formatCountdown,
  groupForNow,
  sortItemsForDay,
  type RowEntry,
} from '../lib/row-entries.ts';

export interface SkyTodayCardProps {
  accessToken: string;
  location: DeviceLocation | null;
  locationMessage: string | null;
  onRetryLocation(): void;
  /** Curated events listed inside the card; the section is hidden when there are none. */
  events?: AstronomicalEvent[];
  onOpenEvent?(eventId: string): void;
  onOpenEvents?(): void;
  /** Local start of the day to show; null shows the next 24 hours from now. */
  day?: Date | null;
}

export function SkyTodayCard({
  accessToken,
  location,
  locationMessage,
  onRetryLocation,
  events = [],
  onOpenEvent,
  onOpenEvents,
  day = null,
}: SkyTodayCardProps) {
  const sky = useSkyToday(accessToken, location, day);

  return (
    <View className="gap-4 rounded-card border border-border bg-surface p-5">
      <View className="gap-1">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <Lucide color={theme.colors.accent} name="telescope" size={16} />
            <Text className="font-label text-[11px] uppercase tracking-[2px] text-accent">
              {day ? `No céu em ${formatDay(day)}` : 'Hoje no seu céu'}
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
        <SkyList dayMode={day !== null} items={sky.items} />
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

function SkyList({ items, dayMode }: { items: SkyTodayItem[]; dayMode: boolean }) {
  if (dayMode) {
    return (
      <View className="gap-3">
        {sortItemsForDay(items).map((item) => (
          <SkyRow key={item.id} dayMode item={item} />
        ))}
      </View>
    );
  }

  const groups = groupForNow(items);
  return (
    <View className="gap-5">
      <SkyGroup items={groups.visible} title="No céu agora" />
      <SkyGroup items={groups.upcoming} title="Ainda abaixo do horizonte" />
      <SkyGroup items={groups.hidden} title="Fora do alcance hoje" />
    </View>
  );
}

function SkyGroup({ items, title }: { items: SkyTodayItem[]; title: string }) {
  if (items.length === 0) return null;
  return (
    <View className="gap-3">
      <Text className="font-label text-[11px] uppercase tracking-[2px] text-muted">{title}</Text>
      {items.map((item) => (
        <SkyRow key={item.id} dayMode={false} item={item} />
      ))}
    </View>
  );
}

const BODY_COLORS: Record<string, string> = {
  moon: '#E8E6D9',
  mercury: '#B4B4B4',
  venus: '#F2D98D',
  mars: '#E0674A',
  jupiter: '#D9B38C',
  saturn: '#E3C77A',
};

function BodyBadge({ item, dimmed }: { item: SkyTodayItem; dimmed: boolean }) {
  const color = BODY_COLORS[item.id] ?? theme.colors.accent;
  return (
    <View
      className="h-12 w-12 items-center justify-center rounded-full bg-canvas"
      style={{ opacity: dimmed ? 0.55 : 1 }}
    >
      {item.type === 'moon' ? (
        <Lucide color={color} name="moon" size={24} />
      ) : (
        <View className="h-6 w-6 rounded-full" style={{ backgroundColor: color }} />
      )}
    </View>
  );
}

function SkyRow({ item, dayMode }: { item: SkyTodayItem; dayMode: boolean }) {
  const visible = item.status === 'up' || item.status === 'always-up';
  const entries = buildRowEntries(item, dayMode);
  const note = describeStatus(item, dayMode);
  const now = new Date();

  return (
    <View className="gap-3 rounded-control bg-surface-2 p-3">
      <View className="flex-row items-center gap-3">
        <BodyBadge dimmed={item.status === 'never-up'} item={item} />
        <View className="flex-1 gap-0.5">
          <Text className="font-display text-base text-ink">{item.name}</Text>
          {note ? <Text className="font-body text-xs text-muted">{note}</Text> : null}
        </View>
        {dayMode || item.status === 'never-up' ? null : (
          <View
            className="rounded-pill border px-3 py-1"
            style={{ borderColor: visible ? theme.colors.info : theme.colors.border }}
          >
            <Text
              className="font-label text-[10px] uppercase tracking-[1px]"
              style={{ color: visible ? theme.colors.info : theme.colors.muted }}
            >
              {visible ? 'Visível' : 'Abaixo'}
            </Text>
          </View>
        )}
      </View>

      {entries.length > 0 ? (
        <View className="flex-row gap-2">
          {entries.map((entry) => (
            <EntryCell
              key={`${entry.kind}-${entry.at.getTime()}`}
              countdown={dayMode ? null : formatCountdown(entry.at, now)}
              entry={entry}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const ENTRY_META = {
  rise: { label: 'Nasce', icon: 'sunrise' },
  transit: { label: 'Mais alto', icon: 'arrow-up' },
  set: { label: 'Põe-se', icon: 'sunset' },
} as const;

function EntryCell({ entry, countdown }: { entry: RowEntry; countdown: string | null }) {
  const meta = ENTRY_META[entry.kind];
  return (
    <View className="flex-1 gap-1 rounded-control bg-canvas px-3 py-2">
      <View className="flex-row items-center gap-1.5">
        <Lucide color={theme.colors.accent} name={meta.icon} size={13} />
        <Text className="font-label text-[10px] uppercase tracking-[1px] text-muted">
          {meta.label}
        </Text>
      </View>
      <Text className="font-display text-xl text-ink">{formatClock(entry.at)}</Text>
      {entry.kind === 'transit' ? null : (
        <View className="flex-row items-center gap-1">
          <View style={{ transform: [{ rotate: `${entry.azimuthDegrees}deg` }] }}>
            <Lucide color={theme.colors.info} name="arrow-up" size={13} />
          </View>
          <Text className="font-label text-xs text-info">{entry.direction}</Text>
        </View>
      )}
      {countdown ? <Text className="font-body text-[10px] text-muted">{countdown}</Text> : null}
    </View>
  );
}

function describeStatus(item: SkyTodayItem, dayMode: boolean): string | null {
  if (item.status === 'always-up') return 'Acima do horizonte o dia todo';
  if (item.status === 'never-up') {
    return dayMode ? 'Não aparece no seu horizonte neste dia' : 'Não aparece no seu horizonte hoje';
  }
  if (item.timeline.length === 0 && !item.nextChange) {
    return dayMode ? 'Sem nascer ou pôr neste dia' : 'Sem nascer ou pôr nas próximas 24 h';
  }
  return null;
}

function formatClock(value: Date): string {
  return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(value);
}

function formatDay(value: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
  }).format(value);
}
