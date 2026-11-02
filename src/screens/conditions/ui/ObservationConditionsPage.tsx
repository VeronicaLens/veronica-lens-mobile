import { Lucide, type LucideIconName } from '@react-native-vector-icons/lucide';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  chooseBestHour,
  describeFactor,
  isNightHour,
  skyIconFor,
  useConditionsForecast,
  type ConditionHour,
} from '../../../features/current-conditions/index.ts';
import { useDeviceLocation, type DeviceLocation } from '../../../features/device-location/index.ts';
import type { ConditionFactor, ObservationRating } from '../../../shared/api/index.ts';
import { theme } from '../../../shared/config/index.ts';

interface ObservationConditionsPageProps {
  accessToken: string;
  initialLocation: DeviceLocation | null;
  onBack(): void;
}

const ratingConfig: Record<ObservationRating, { label: string; color: string }> = {
  good: { label: 'Favoráveis', color: theme.colors.info },
  fair: { label: 'Atenção a alguns fatores', color: theme.colors.event },
  poor: { label: 'Desfavoráveis', color: theme.colors.muted },
};

const legend: { label: string; rating: ObservationRating }[] = [
  { label: 'Favorável', rating: 'good' },
  { label: 'Atenção', rating: 'fair' },
  { label: 'Desfavorável', rating: 'poor' },
];

const factorConfig: Record<ConditionFactor['code'], { label: string; icon: LucideIconName }> = {
  darkness: { label: 'Escuridão', icon: 'moon' },
  'cloud-cover': { label: 'Nuvens', icon: 'cloud' },
  precipitation: { label: 'Chuva', icon: 'cloud-rain' },
  visibility: { label: 'Visibilidade', icon: 'eye' },
  wind: { label: 'Vento', icon: 'wind' },
  humidity: { label: 'Umidade', icon: 'droplets' },
};

const statusLabels = {
  good: 'Favorável',
  caution: 'Atenção',
  poor: 'Desfavorável',
  unknown: 'Sem dados',
} as const;

const DAY_COUNT = 7;
const HOUR_COLUMNS = 4;

export function ObservationConditionsPage({
  accessToken,
  initialLocation,
  onBack,
}: ObservationConditionsPageProps) {
  const deviceLocation = useDeviceLocation(!initialLocation);
  const observer = initialLocation ?? deviceLocation.location;
  const forecast = useConditionsForecast(accessToken, observer);
  const [selectedDayKey, setSelectedDayKey] = useState(() => localDateKey(new Date()));
  const [selectedSampleAt, setSelectedSampleAt] = useState<string | null>(null);
  const [showAllHours, setShowAllHours] = useState(false);
  const now = new Date();

  const days = Array.from({ length: DAY_COUNT }, (_, offset) => {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset, 12);
    const dateKey = localDateKey(date);
    const samples = (forecast.hours ?? []).filter((sample) =>
      isSameLocalDay(new Date(sample.observedAt), date),
    );
    const nightSamples = samples.filter((sample) => isNightHour(sample.observedAt));
    const bestSample = chooseBestHour(nightSamples.length > 0 ? nightSamples : samples);
    return { date, dateKey, samples, nightSamples, bestSample };
  });

  const selectedDay = days.find((day) => day.dateKey === selectedDayKey) ?? days[0] ?? null;
  const selectedSample =
    selectedDay?.samples.find((sample) => sample.observedAt === selectedSampleAt) ??
    selectedDay?.bestSample ??
    null;
  const visibleSamples = selectedDay
    ? showAllHours || selectedDay.nightSamples.length === 0
      ? selectedDay.samples
      : selectedDay.nightSamples
    : [];

  const chooseDay = (dateKey: string, bestSample: ConditionHour | null) => {
    setSelectedDayKey(dateKey);
    setSelectedSampleAt(bestSample?.observedAt ?? null);
  };

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top', 'left', 'right']}>
      <ScrollView contentContainerClassName="gap-5 px-5 pb-10 pt-5">
        <View className="flex-row items-center gap-3">
          <Pressable
            accessibilityLabel="Voltar para o início"
            accessibilityRole="button"
            className="h-11 w-11 items-center justify-center rounded-full border border-border bg-surface"
            onPress={onBack}
          >
            <Lucide color={theme.colors.text} name="chevron-left" size={20} />
          </Pressable>
          <View className="flex-1 gap-1">
            <Text className="font-label text-[10px] uppercase tracking-[2px] text-accent">
              Planejamento
            </Text>
            <Text accessibilityRole="header" className="font-display text-xl text-ink">
              Próximos 7 dias
            </Text>
          </View>
          <Lucide color={theme.colors.accent} name="calendar-clock" size={22} />
        </View>

        {!observer ? (
          <View className="items-center gap-3 rounded-panel border border-border bg-surface p-6">
            {deviceLocation.status === 'requesting-permission' ||
            deviceLocation.status === 'locating' ? (
              <>
                <ActivityIndicator color={theme.colors.primary} />
                <Text className="font-body text-sm text-muted">Obtendo sua localização...</Text>
              </>
            ) : (
              <>
                <Lucide color={theme.colors.event} name="map-pin-off" size={24} />
                <Text className="text-center font-body text-sm leading-5 text-muted">
                  {deviceLocation.fallbackMessage ??
                    'Ative a localização para consultar a previsão neste ponto.'}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  className="rounded-pill bg-brand px-5 py-3 active:opacity-80"
                  onPress={deviceLocation.retry}
                >
                  <Text className="font-label text-xs text-ink">Tentar novamente</Text>
                </Pressable>
              </>
            )}
          </View>
        ) : forecast.loading ? (
          <View className="items-center gap-3 rounded-panel border border-border bg-surface p-8">
            <ActivityIndicator color={theme.colors.primary} />
            <Text className="font-body text-sm text-muted">
              Carregando a previsão horária dos próximos 7 dias...
            </Text>
          </View>
        ) : forecast.error ? (
          <View className="items-center gap-3 rounded-panel border border-border bg-surface p-6">
            <Lucide color={theme.colors.event} name="cloud-off" size={24} />
            <Text accessibilityRole="alert" className="text-center font-body text-sm text-muted">
              {forecast.error}
            </Text>
            <Pressable
              accessibilityRole="button"
              className="rounded-pill bg-brand px-5 py-3 active:opacity-80"
              onPress={forecast.refresh}
            >
              <Text className="font-label text-xs text-ink">Tentar novamente</Text>
            </Pressable>
          </View>
        ) : forecast.hours ? (
          <>
            <View className="gap-3 rounded-panel border border-border bg-surface p-3">
              <View className="flex-row items-center justify-between px-1">
                <View className="flex-row items-center gap-2">
                  <Lucide color={theme.colors.accent} name="calendar-days" size={16} />
                  <Text className="font-label text-xs text-ink">{formatRange(days)}</Text>
                </View>
                <Text className="font-body text-[10px] text-muted">Melhor horário da noite</Text>
              </View>
              <View className="flex-row gap-1.5">
                {days.map((day, index) => (
                  <WeekDayCell
                    key={day.dateKey}
                    bestSample={day.bestSample}
                    date={day.date}
                    isSelected={selectedDay?.dateKey === day.dateKey}
                    isToday={index === 0}
                    onPress={() => chooseDay(day.dateKey, day.bestSample)}
                  />
                ))}
              </View>
              <View className="flex-row items-center justify-center gap-4 pt-1">
                {legend.map((item) => (
                  <View key={item.rating} className="flex-row items-center gap-1.5">
                    <View
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: ratingConfig[item.rating].color }}
                    />
                    <Text className="font-body text-[10px] text-muted">{item.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            {selectedDay ? (
              <View className="gap-5 rounded-panel border border-border bg-surface p-5">
                <View className="gap-1">
                  <Text className="font-label text-[11px] uppercase tracking-[1.5px] text-accent">
                    {formatLongDate(selectedDay.date)}
                  </Text>
                  {selectedDay.bestSample ? (
                    <BestHourBanner sample={selectedDay.bestSample} />
                  ) : (
                    <Text className="font-body text-sm leading-5 text-muted">
                      Não há horários disponíveis para esse dia na previsão atual.
                    </Text>
                  )}
                </View>

                {selectedDay.samples.length > 0 ? (
                  <View className="gap-3">
                    <View className="flex-row items-center justify-between">
                      <Text className="font-label text-xs text-ink">
                        {showAllHours || selectedDay.nightSamples.length === 0
                          ? 'Dia todo'
                          : 'Noite (18h às 6h)'}
                      </Text>
                      {selectedDay.nightSamples.length > 0 ? (
                        <Pressable
                          accessibilityRole="button"
                          className="active:opacity-70"
                          onPress={() => setShowAllHours((value) => !value)}
                        >
                          <Text className="font-label text-xs text-accent">
                            {showAllHours ? 'Só a noite' : 'Mostrar o dia todo'}
                          </Text>
                        </Pressable>
                      ) : null}
                    </View>
                    <HourGrid
                      onSelect={setSelectedSampleAt}
                      samples={visibleSamples}
                      selectedAt={selectedSample?.observedAt ?? null}
                    />
                  </View>
                ) : null}

                {selectedSample ? <ForecastResult sample={selectedSample} /> : null}
              </View>
            ) : null}
          </>
        ) : (
          <View className="rounded-panel border border-border bg-surface p-5">
            <Text className="font-body text-sm leading-5 text-muted">
              Ainda não há dados de previsão disponíveis para sua localização.
            </Text>
          </View>
        )}

        <Text className="px-1 text-center font-body text-[11px] leading-4 text-muted">
          Previsão para a sua localização, em horário local. A avaliação considera o clima, não a
          posição de um astro específico.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function WeekDayCell({
  bestSample,
  date,
  isSelected,
  isToday,
  onPress,
}: {
  bestSample: ConditionHour | null;
  date: Date;
  isSelected: boolean;
  isToday: boolean;
  onPress(): void;
}) {
  const color = bestSample ? ratingConfig[bestSample.rating].color : theme.colors.border;
  const weekday = isToday ? 'hoje' : formatWeekday(date);

  return (
    <Pressable
      accessibilityLabel={`${formatLongDate(date)}${
        bestSample ? `: ${ratingConfig[bestSample.rating].label}` : ': sem previsão'
      }`}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      className="flex-1 items-center gap-2 rounded-control border py-3 active:opacity-80"
      onPress={onPress}
      style={{
        borderColor: isSelected ? theme.colors.primary : 'transparent',
        backgroundColor: isSelected ? theme.colors.surface2 : 'transparent',
      }}
    >
      <Text
        className="font-label text-[9px] uppercase tracking-[1px]"
        style={{ color: isToday ? theme.colors.accent : theme.colors.muted }}
      >
        {weekday}
      </Text>
      <Text className="font-display text-lg text-ink">{date.getDate()}</Text>
      {bestSample ? (
        <Lucide color={color} name={skyIconFor(bestSample)} size={18} />
      ) : (
        <Lucide color={color} name="minus" size={18} />
      )}
      <View className="h-1 w-6 rounded-full" style={{ backgroundColor: color }} />
    </Pressable>
  );
}

function BestHourBanner({ sample }: { sample: ConditionHour }) {
  const rating = ratingConfig[sample.rating];
  return (
    <View
      className="mt-1 flex-row items-center gap-3 rounded-control border-l-4 bg-canvas p-3"
      style={{ borderLeftColor: rating.color }}
    >
      <Lucide color={rating.color} name={skyIconFor(sample)} size={26} />
      <View className="flex-1 gap-0.5">
        <Text className="font-label text-sm text-ink">{rating.label}</Text>
        <Text className="font-body text-xs text-muted">
          Melhor horário: {formatTime(new Date(sample.observedAt))} · {sample.skyLabel}
        </Text>
      </View>
      {sample.temperatureCelsius !== null ? (
        <Text className="font-display text-xl text-ink">
          {Math.round(sample.temperatureCelsius)}°
        </Text>
      ) : null}
    </View>
  );
}

function HourGrid({
  samples,
  selectedAt,
  onSelect,
}: {
  samples: ConditionHour[];
  selectedAt: string | null;
  onSelect(observedAt: string): void;
}) {
  const rows: ConditionHour[][] = [];
  for (let index = 0; index < samples.length; index += HOUR_COLUMNS) {
    rows.push(samples.slice(index, index + HOUR_COLUMNS));
  }

  return (
    <View className="gap-2">
      {rows.map((row) => (
        <View key={row[0]?.observedAt} className="flex-row gap-2">
          {row.map((sample) => (
            <HourTile
              key={sample.observedAt}
              isSelected={selectedAt === sample.observedAt}
              onPress={() => onSelect(sample.observedAt)}
              sample={sample}
            />
          ))}
          {Array.from({ length: HOUR_COLUMNS - row.length }, (_, filler) => (
            <View key={`filler-${filler}`} className="flex-1" />
          ))}
        </View>
      ))}
    </View>
  );
}

function HourTile({
  isSelected,
  onPress,
  sample,
}: {
  isSelected: boolean;
  onPress(): void;
  sample: ConditionHour;
}) {
  const color = ratingConfig[sample.rating].color;
  const time = formatTime(new Date(sample.observedAt));

  return (
    <Pressable
      accessibilityLabel={`${time}, ${ratingConfig[sample.rating].label}`}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      className="flex-1 items-center gap-1.5 overflow-hidden rounded-control border bg-surface-2 pb-2.5"
      onPress={onPress}
      style={{ borderColor: isSelected ? theme.colors.primary : theme.colors.border }}
    >
      <View className="h-1 self-stretch" style={{ backgroundColor: color }} />
      <Text className="pt-1 font-label text-xs text-ink">{time}</Text>
      <Lucide color={color} name={skyIconFor(sample)} size={16} />
      <Text className="font-body text-[10px] text-muted">
        {sample.cloudCoverPercent !== null ? `${Math.round(sample.cloudCoverPercent)}%` : '—'}
      </Text>
    </Pressable>
  );
}

function ForecastResult({ sample }: { sample: ConditionHour }) {
  const ratingDetails = ratingConfig[sample.rating];
  const statusOf = (code: ConditionFactor['code']) =>
    sample.factors.find((factor) => factor.code === code)?.status ?? 'unknown';

  return (
    <View className="gap-4 rounded-control border border-border bg-canvas p-4">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <View
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: ratingDetails.color }}
          />
          <Text className="font-label text-sm text-ink">{ratingDetails.label}</Text>
        </View>
        <Text className="font-body text-xs text-muted">
          {formatDateTime(new Date(sample.observedAt))}
        </Text>
      </View>

      <View className="flex-row gap-2">
        <StatTile
          icon="thermometer"
          label="Temperatura"
          value={formatNumber(sample.temperatureCelsius, '°')}
        />
        <StatTile
          icon="cloud"
          label="Nuvens"
          status={statusOf('cloud-cover')}
          value={formatNumber(sample.cloudCoverPercent, '%')}
        />
        <StatTile
          icon="cloud-rain"
          label="Chuva"
          status={statusOf('precipitation')}
          value={formatNumber(sample.precipitationProbabilityPercent, '%')}
        />
      </View>
      <View className="flex-row gap-2">
        <StatTile
          icon="wind"
          label="Vento"
          status={statusOf('wind')}
          value={formatNumber(sample.windSpeedKilometersPerHour, ' km/h')}
        />
        <StatTile
          icon="droplets"
          label="Umidade"
          status={statusOf('humidity')}
          value={formatNumber(sample.relativeHumidityPercent, '%')}
        />
        <StatTile
          icon="eye"
          label="Visibilidade"
          status={statusOf('visibility')}
          value={
            sample.visibilityMeters !== null
              ? `${Math.round(sample.visibilityMeters / 1000)} km`
              : '—'
          }
        />
      </View>

      <View className="h-px bg-border" />
      <View className="gap-3">
        {sample.factors.map((factor) => (
          <FactorRow key={factor.code} factor={factor} sample={sample} />
        ))}
      </View>
    </View>
  );
}

function statusColor(status: ConditionFactor['status'] | 'unknown'): string {
  if (status === 'good') return theme.colors.info;
  if (status === 'caution') return theme.colors.event;
  return theme.colors.muted;
}

function StatTile({
  icon,
  label,
  value,
  status = 'unknown',
}: {
  icon: LucideIconName;
  label: string;
  value: string;
  status?: ConditionFactor['status'] | 'unknown';
}) {
  return (
    <View className="flex-1 items-center gap-1 rounded-control bg-surface px-1 py-3">
      <Lucide color={statusColor(status)} name={icon} size={18} />
      <Text className="font-display text-base text-ink">{value}</Text>
      <Text className="font-body text-[10px] text-muted">{label}</Text>
    </View>
  );
}

function FactorRow({ factor, sample }: { factor: ConditionFactor; sample: ConditionHour }) {
  const config = factorConfig[factor.code];
  const color = statusColor(factor.status);

  return (
    <View className="flex-row items-start gap-3">
      <Lucide color={color} name={config.icon} size={17} />
      <View className="flex-1 gap-1">
        <View className="flex-row items-center justify-between gap-2">
          <Text className="font-label text-xs text-ink">{config.label}</Text>
          <Text className="font-label text-[10px]" style={{ color }}>
            {statusLabels[factor.status]}
          </Text>
        </View>
        <Text className="font-body text-xs leading-5 text-muted">
          {describeFactor(factor, sample)}
        </Text>
      </View>
    </View>
  );
}

function formatNumber(value: number | null, suffix: string): string {
  return value === null ? '—' : `${Math.round(value)}${suffix}`;
}

function localDateKey(value: Date): string {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(
    value.getDate(),
  ).padStart(2, '0')}`;
}

function isSameLocalDay(left: Date, right: Date): boolean {
  return localDateKey(left) === localDateKey(right);
}

function formatWeekday(value: Date): string {
  return new Intl.DateTimeFormat('pt-BR', { weekday: 'short' }).format(value).replace('.', '');
}

function formatRange(days: { date: Date }[]): string {
  const first = days[0]?.date;
  const last = days[days.length - 1]?.date;
  if (!first || !last) return '';
  const month = (value: Date) =>
    new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(value).replace('.', '');
  return first.getMonth() === last.getMonth()
    ? `${capitalize(new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(first))}`
    : `${capitalize(month(first))} – ${capitalize(month(last))} ${last.getFullYear()}`;
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatLongDate(value: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  }).format(value);
}

function formatDateTime(value: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(value);
}

function formatTime(value: Date): string {
  return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(value);
}
