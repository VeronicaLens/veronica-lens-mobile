import { Lucide, type LucideIconName } from '@react-native-vector-icons/lucide';
import { memo, useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ImageBackground,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  getEventTypeInfo,
  useEvent,
  useUpcomingEvents,
} from '../../../features/astronomical-events/index.ts';
import { useDeviceLocation } from '../../../features/device-location/index.ts';
import type { AstronomicalEvent } from '../../../shared/api/index.ts';
import { theme } from '../../../shared/config/index.ts';
import { SkyTodayCard } from '../../../widgets/sky-today/index.ts';
import { EventDetailPage } from './EventDetailPage.tsx';

const backgroundImage = require('../../../../assets/loading-background.jpeg') as number;

interface EventsPageProps {
  accessToken: string;
  initialEventId?: string | null;
  onInitialEventHandled?(): void;
}

const DEFAULT_PERIOD_DAYS = 30;
const periods = [7, 30, 90, 365] as const;

function periodLabel(days: number): string {
  return days === 365 ? '1 ano' : `${days} dias`;
}

function keyExtractor(event: AstronomicalEvent): string {
  return event.id;
}

function ItemSeparator() {
  return <View className="h-3" />;
}

export function EventsPage({
  accessToken,
  initialEventId,
  onInitialEventHandled,
}: EventsPageProps) {
  const [periodDays, setPeriodDays] = useState<number>(DEFAULT_PERIOD_DAYS);
  const [type, setType] = useState<string | undefined>();
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const insets = useSafeAreaInsets();
  const events = useUpcomingEvents(accessToken, periodDays);
  const deviceLocation = useDeviceLocation();
  const linkedEvent = useEvent(accessToken, initialEventId ?? null);
  const normalizedSearch = search.trim().toLocaleLowerCase('pt-BR');
  const availableTypes = useMemo(
    () => Array.from(new Set(events.events.map((event) => event.type))).sort(),
    [events.events],
  );
  const visibleEvents = useMemo(
    () =>
      events.events.filter(
        (event) =>
          (!type || event.type === type) &&
          (!normalizedSearch || event.title.toLocaleLowerCase('pt-BR').includes(normalizedSearch)),
      ),
    [events.events, normalizedSearch, type],
  );
  const canShowEvents = !events.loading && !events.error && visibleEvents.length > 0;
  const filtersActive = Boolean(type) || periodDays !== DEFAULT_PERIOD_DAYS;
  const activeEvent =
    linkedEvent.event ?? events.events.find((event) => event.id === selectedEventId) ?? null;
  const openEvent = useCallback((eventId: string) => setSelectedEventId(eventId), []);
  const renderItem = useCallback(
    ({ item }: { item: AstronomicalEvent }) => (
      <View className="px-5">
        <EventCard event={item} onPress={openEvent} />
      </View>
    ),
    [openEvent],
  );

  if (activeEvent) {
    return (
      <EventDetailPage
        accessToken={accessToken}
        event={activeEvent}
        onBack={() => {
          setSelectedEventId(null);
          onInitialEventHandled?.();
        }}
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
      <FlatList
        contentContainerClassName="pb-8"
        data={canShowEvents ? visibleEvents : []}
        initialNumToRender={8}
        ItemSeparatorComponent={ItemSeparator}
        keyExtractor={keyExtractor}
        windowSize={7}
        ListHeaderComponent={
          <View className="mb-5 gap-5">
            <ImageBackground resizeMode="cover" source={backgroundImage}>
              <View className="gap-2 bg-canvas/40 px-5 pb-6 pt-6">
                <Text className="font-label text-[11px] uppercase tracking-[3px] text-accent">
                  Planeje sua observação
                </Text>
                <Text accessibilityRole="header" className="font-display text-[28px] text-ink">
                  Eventos astronômicos
                </Text>
                <Text className="font-body text-sm leading-5 text-muted">
                  Eclipses, chuvas de meteoros e outros eventos do céu para planejar suas
                  observações.
                </Text>
              </View>
            </ImageBackground>

            <View className="gap-5 px-5">
              <SkyTodayCard
                accessToken={accessToken}
                location={deviceLocation.location}
                locationMessage={deviceLocation.fallbackMessage}
                onRetryLocation={deviceLocation.retry}
              />
              <View className="flex-row items-center gap-3">
                <Pressable
                  accessibilityLabel="Buscar eventos"
                  accessibilityRole="button"
                  className="h-11 flex-1 flex-row items-center gap-2 rounded-control border border-border bg-surface px-4"
                  onPress={() => setSearchVisible((value) => !value)}
                >
                  <Lucide color={theme.colors.muted} name="search" size={16} />
                  {searchVisible ? (
                    <TextInput
                      accessibilityLabel="Buscar eventos pelo título"
                      autoFocus
                      className="flex-1 font-body text-xs text-ink"
                      onChangeText={setSearch}
                      placeholder="Buscar evento..."
                      placeholderTextColor={theme.colors.muted}
                      value={search}
                    />
                  ) : (
                    <Text className="flex-1 font-body text-xs text-muted">Buscar evento...</Text>
                  )}
                </Pressable>

                <Pressable
                  accessibilityLabel="Filtrar eventos"
                  accessibilityRole="button"
                  className="h-11 w-11 items-center justify-center rounded-control border bg-surface"
                  onPress={() => setFiltersVisible(true)}
                  style={{
                    borderColor: filtersActive ? theme.colors.primary : theme.colors.border,
                  }}
                >
                  <Lucide
                    color={filtersActive ? theme.colors.accent : theme.colors.muted}
                    name="sliders-horizontal"
                    size={18}
                  />
                </Pressable>
              </View>

              {events.loading ? (
                <View className="items-center gap-3 rounded-card bg-surface p-8">
                  <ActivityIndicator color={theme.colors.primary} />
                  <Text className="font-body text-sm text-muted">Buscando eventos...</Text>
                </View>
              ) : events.error ? (
                <EmptyState
                  icon="cloud-off"
                  title="Eventos indisponíveis"
                  message={events.error}
                  action="Tentar novamente"
                  onPress={events.refresh}
                />
              ) : events.events.length === 0 ? (
                <EmptyState
                  icon="calendar-search"
                  title="Nenhum evento encontrado"
                  message="Ajuste o período ou o tipo para ampliar sua busca."
                />
              ) : visibleEvents.length === 0 ? (
                <EmptyState
                  icon="calendar-search"
                  title="Nenhum evento para essa busca"
                  message="Tente outro termo ou limpe a busca."
                />
              ) : (
                <View className="flex-row items-center justify-between">
                  <Text className="font-display text-xl text-ink">Próximos eventos</Text>
                  <Text className="font-body text-xs text-muted">
                    {visibleEvents.length} resultados
                  </Text>
                </View>
              )}
            </View>
          </View>
        }
        ListHeaderComponentStyle={{ marginBottom: canShowEvents ? 12 : 0 }}
        renderItem={renderItem}
      />

      <Modal
        animationType="slide"
        onRequestClose={() => setFiltersVisible(false)}
        transparent
        visible={filtersVisible}
      >
        <Pressable
          accessibilityLabel="Fechar filtros"
          accessibilityRole="button"
          className="flex-1 justify-end bg-canvas/70"
          onPress={() => setFiltersVisible(false)}
        >
          <Pressable
            className="gap-5 rounded-t-panel border-t border-border bg-surface px-5 pt-5"
            style={{ paddingBottom: 24 + insets.bottom }}
          >
            <View className="h-1 w-12 self-center rounded-pill bg-border" />
            <View className="flex-row items-center justify-between">
              <Text className="font-display text-lg text-ink">Filtrar eventos</Text>
              <View className="flex-row items-center gap-4">
                {filtersActive ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => {
                      setPeriodDays(DEFAULT_PERIOD_DAYS);
                      setType(undefined);
                    }}
                  >
                    <Text className="font-label text-[11px] text-accent">Limpar</Text>
                  </Pressable>
                ) : null}
                <Pressable
                  accessibilityLabel="Fechar"
                  accessibilityRole="button"
                  onPress={() => setFiltersVisible(false)}
                >
                  <Lucide color={theme.colors.muted} name="x" size={20} />
                </Pressable>
              </View>
            </View>

            <View className="gap-3">
              <Text className="font-label text-xs text-ink">Período</Text>
              <View accessibilityRole="radiogroup" className="flex-row flex-wrap gap-2">
                {periods.map((days) => (
                  <FilterChip
                    key={days}
                    icon="calendar-days"
                    label={periodLabel(days)}
                    selected={periodDays === days}
                    onPress={() => setPeriodDays(days)}
                  />
                ))}
              </View>
            </View>

            <View className="gap-3">
              <Text className="font-label text-xs text-ink">Tipo de evento</Text>
              <View accessibilityRole="radiogroup" className="flex-row flex-wrap gap-2">
                <FilterChip
                  icon="grid-2x2"
                  label="Todos"
                  selected={type === undefined}
                  onPress={() => setType(undefined)}
                />
                {availableTypes.map((option) => {
                  const info = getEventTypeInfo(option);
                  return (
                    <FilterChip
                      key={option}
                      icon={info.icon}
                      label={info.label}
                      selected={type === option}
                      onPress={() => setType(option)}
                    />
                  );
                })}
              </View>
            </View>

            <Pressable
              accessibilityRole="button"
              className="mt-2 h-12 items-center justify-center rounded-pill bg-brand active:opacity-80"
              onPress={() => setFiltersVisible(false)}
            >
              <Text className="font-label text-xs text-ink">
                Ver {visibleEvents.length} resultado{visibleEvents.length === 1 ? '' : 's'}
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function FilterChip({
  icon,
  label,
  selected,
  onPress,
}: {
  icon: LucideIconName;
  label: string;
  selected: boolean;
  onPress(): void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      className={`flex-row items-center gap-2 rounded-pill border px-4 py-2.5 ${selected ? 'border-brand bg-brand' : 'border-border bg-surface'}`}
      onPress={onPress}
    >
      <Lucide color={selected ? theme.colors.text : theme.colors.muted} name={icon} size={14} />
      <Text className="font-label text-[11px] text-ink">{label}</Text>
    </Pressable>
  );
}

const EventCard = memo(function EventCard({
  event,
  onPress,
}: {
  event: AstronomicalEvent;
  onPress(eventId: string): void;
}) {
  const config = getEventTypeInfo(event.type);
  const date = new Date(event.startsAt);
  return (
    <Pressable
      accessibilityLabel={`Abrir detalhes de ${event.title}`}
      accessibilityRole="button"
      className="flex-row gap-4 rounded-card border border-border bg-surface p-4 active:opacity-80"
      onPress={() => onPress(event.id)}
    >
      <View
        className="h-14 w-14 items-center justify-center rounded-full border-2 bg-surface-2"
        style={{ borderColor: config.color }}
      >
        <Lucide color={config.color} name={config.icon} size={22} />
      </View>
      <View className="flex-1 gap-1">
        <Text className="font-label text-sm text-ink">{event.title}</Text>
        <Text
          className="font-label text-[10px] uppercase tracking-wide"
          style={{ color: config.color }}
        >
          {config.label} · {formatDate(date)} às {formatTime(date)}
        </Text>
        <Text className="font-body text-xs leading-5 text-muted">{event.description}</Text>
      </View>
      <Lucide color={theme.colors.muted} name="chevron-right" size={18} />
    </Pressable>
  );
});

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

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(value);
}

function formatTime(value: Date): string {
  return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(value);
}
