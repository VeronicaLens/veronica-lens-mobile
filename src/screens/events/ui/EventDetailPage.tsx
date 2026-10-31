import { Lucide, type LucideIconName } from '@react-native-vector-icons/lucide';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getEventTypeInfo } from '../../../features/astronomical-events/index.ts';
import { useCelestialObjectId } from '../../../features/celestial-catalog/index.ts';
import { useDeviceLocation } from '../../../features/device-location/index.ts';
import {
  describeRecommendation,
  useObservationRecommendation,
  type RecommendationDetails,
} from '../../../features/observation-planning/index.ts';
import type { AstronomicalEvent } from '../../../shared/api/index.ts';
import { theme } from '../../../shared/config/index.ts';

interface EventDetailPageProps {
  accessToken: string;
  event: AstronomicalEvent;
  onBack(): void;
}

export function EventDetailPage({ accessToken, event, onBack }: EventDetailPageProps) {
  const location = useDeviceLocation();
  const catalog = useCelestialObjectId(accessToken, event.celestialObjectName);
  const [reference] = useState(() => {
    const now = Date.now();
    const startsAt = Date.parse(event.startsAt);
    const endsAt = Date.parse(event.endsAt ?? event.startsAt);
    return { ended: endsAt < now, windowFrom: new Date(Math.max(now, startsAt)).toISOString() };
  });
  const planning = useObservationRecommendation(
    accessToken,
    reference.ended ? null : catalog.objectId,
    location.location,
    reference.windowFrom,
  );
  const config = getEventTypeInfo(event.type);
  const recommendation = planning.recommendation;
  const details = recommendation ? describeRecommendation(recommendation) : null;
  const window = recommendation?.status === 'recommended' ? recommendation.window : null;

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top', 'left', 'right']}>
      <ScrollView contentContainerClassName="gap-5 px-5 pb-28 pt-5">
        <View className="flex-row items-center justify-between">
          <Pressable
            accessibilityLabel="Voltar para eventos"
            accessibilityRole="button"
            className="h-11 w-11 items-center justify-center rounded-full border border-border bg-surface"
            onPress={onBack}
          >
            <Lucide color={theme.colors.text} name="chevron-left" size={20} />
          </Pressable>
          <Text className="font-label text-[10px] uppercase tracking-[2px] text-muted">
            Evento astronômico
          </Text>
        </View>

        <View className="gap-4 rounded-card border border-border bg-surface p-5">
          <View className="flex-row items-center gap-3">
            <View
              className="h-12 w-12 items-center justify-center rounded-full border bg-surface-2"
              style={{ borderColor: config.color }}
            >
              <Lucide color={config.color} name={config.icon} size={22} />
            </View>
            <View className="flex-1 gap-1">
              <Text
                className="font-label text-[10px] uppercase tracking-[2px]"
                style={{ color: config.color }}
              >
                {config.label}
              </Text>
              <Text className="font-body text-xs text-muted">
                {event.celestialObjectName ?? 'Acompanhe o melhor momento'}
              </Text>
            </View>
          </View>
          <Text accessibilityRole="header" className="font-display text-[30px] leading-9 text-ink">
            {event.title}
          </Text>
          <Text className="font-body text-sm leading-6 text-muted">{event.description}</Text>
          <View className="gap-2 border-t border-border pt-3">
            <DateRow icon="calendar-clock" label="Início" value={event.startsAt} />
            {event.peaksAt ? <DateRow icon="sparkles" label="Pico" value={event.peaksAt} /> : null}
            {event.endsAt ? (
              <DateRow icon="calendar-check" label="Fim" value={event.endsAt} />
            ) : null}
          </View>
        </View>

        <View className="gap-4 rounded-card border border-primary/40 bg-elevated p-5">
          <View className="flex-row items-center gap-3">
            <View className="h-10 w-10 items-center justify-center rounded-full bg-surface-2">
              <Lucide color={theme.colors.accent} name="telescope" size={19} />
            </View>
            <View className="flex-1 gap-1">
              <Text className="font-label text-[10px] uppercase tracking-[2px] text-accent">
                Planejamento de observação
              </Text>
              <Text className="font-display text-lg text-ink">Seu melhor momento</Text>
            </View>
            <View className="rounded-pill border border-border bg-surface px-2.5 py-1">
              <Text className="font-label text-[9px] text-muted">24 HORAS</Text>
            </View>
          </View>
          {window ? (
            <View className="flex-row items-center gap-3 rounded-control border border-primary/30 bg-surface px-4 py-3">
              <Lucide color={theme.colors.accent} name="clock-3" size={19} />
              <View className="flex-1 gap-1">
                <Text className="font-body text-[10px] uppercase tracking-[1px] text-muted">
                  Janela recomendada
                </Text>
                <Text className="font-display text-2xl text-ink">
                  {formatTime(window.from)} – {formatTime(window.to)}
                </Text>
              </View>
            </View>
          ) : null}
          {!event.celestialObjectName ? (
            <PlanningMessage icon="orbit">
              Este evento não está ligado a um astro específico para calcular uma janela.
            </PlanningMessage>
          ) : reference.ended ? (
            <PlanningMessage icon="calendar-check">Este evento já aconteceu.</PlanningMessage>
          ) : catalog.loading ? (
            <Loading title="Localizando o astro" message="Consultando o catálogo celeste." />
          ) : !catalog.objectId ? (
            <PlanningMessage icon="orbit">
              Não encontramos este astro no catálogo para calcular um plano de observação.
            </PlanningMessage>
          ) : !location.location ? (
            <PlanningMessage icon="map-pin-off">
              {location.fallbackMessage ??
                'Ative a localização para calcular um plano personalizado para o seu céu.'}
            </PlanningMessage>
          ) : planning.loading ? (
            <Loading
              title="Analisando o céu"
              message="Verificando posição do astro e previsão do tempo."
            />
          ) : planning.error ? (
            <View className="flex-row items-center gap-3 rounded-control bg-surface px-3 py-3">
              <Lucide color={theme.colors.event} name="cloud-alert" size={18} />
              <Text className="flex-1 font-body text-xs leading-5 text-muted">
                {planning.error}
              </Text>
              <Pressable accessibilityRole="button" onPress={planning.refresh}>
                <Text className="font-label text-xs text-accent">Tentar</Text>
              </Pressable>
            </View>
          ) : recommendation && details ? (
            <View className="gap-2">
              <View className="flex-row items-center gap-2">
                <Lucide
                  color={
                    recommendation.status === 'recommended' ? theme.colors.info : theme.colors.event
                  }
                  name={recommendation.status === 'recommended' ? 'circle-check' : 'circle-alert'}
                  size={16}
                />
                <Text className="flex-1 font-label text-xs text-ink">
                  {recommendation.status === 'recommended'
                    ? 'Condições avaliadas'
                    : 'Nenhuma janela favorável'}
                </Text>
              </View>
              <Text className="font-body text-xs leading-5 text-muted">{details.summary}</Text>
            </View>
          ) : (
            <PlanningMessage icon="orbit">
              Selecione um objeto com dados de posição para encontrar uma janela favorável.
            </PlanningMessage>
          )}
        </View>

        {details ? (
          <DetailCard icon="scan-eye" title="Fatores considerados">
            <VisibilityDetails
              details={details}
              intervalMinutes={recommendation?.sampleIntervalMinutes}
            />
          </DetailCard>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function VisibilityDetails({
  details,
  intervalMinutes,
}: {
  details: RecommendationDetails;
  intervalMinutes: number | undefined;
}) {
  return (
    <View className="gap-3">
      <View className="overflow-hidden rounded-control bg-surface-2">
        <StatRow
          left={{
            icon: 'triangle',
            label: 'Altitude máxima',
            value: details.peakAltitudeDegrees !== null ? `${details.peakAltitudeDegrees}°` : '—',
          }}
          right={{
            icon: 'settings',
            label: 'Mínimo configurado',
            value: `${details.minimumAltitudeDegrees}°`,
          }}
        />
        <View className="h-px bg-border" />
        <StatRow
          left={{
            icon: 'circle-check',
            label: 'Horários favoráveis',
            value: `${details.favorableSamples} de ${details.totalSamples}`,
          }}
          right={
            intervalMinutes !== undefined
              ? { icon: 'clock-3', label: 'Intervalo analisado', value: `${intervalMinutes} min` }
              : undefined
          }
        />
      </View>

      {!details.weatherAvailable ? (
        <Text className="font-body text-[11px] text-event">Previsão climática indisponível.</Text>
      ) : null}
    </View>
  );
}

function DateRow({ icon, label, value }: { icon: LucideIconName; label: string; value: string }) {
  return (
    <View className="flex-row items-center gap-2">
      <Lucide color={theme.colors.accent} name={icon} size={16} />
      <Text className="font-body text-xs text-muted">{label}</Text>
      <Text className="flex-1 text-right font-label text-xs text-ink">
        {formatEventDate(value)}
      </Text>
    </View>
  );
}

function Loading({ title, message }: { title: string; message: string }) {
  return (
    <View className="flex-row items-center gap-3 rounded-control bg-surface px-3 py-3">
      <ActivityIndicator color={theme.colors.accent} size="small" />
      <View className="flex-1 gap-1">
        <Text className="font-label text-xs text-ink">{title}</Text>
        <Text className="font-body text-[11px] text-muted">{message}</Text>
      </View>
    </View>
  );
}

function PlanningMessage({ icon, children }: { icon: LucideIconName; children: string }) {
  return (
    <View className="flex-row items-center gap-3 rounded-control bg-surface px-3 py-3">
      <Lucide color={theme.colors.muted} name={icon} size={18} />
      <Text className="flex-1 font-body text-xs leading-5 text-muted">{children}</Text>
    </View>
  );
}

interface StatItem {
  icon: LucideIconName;
  label: string;
  value: string;
}

function StatRow({ left, right }: { left: StatItem; right?: StatItem | undefined }) {
  return (
    <View className="flex-row">
      <Stat item={left} />
      {right ? (
        <>
          <View className="w-px bg-border" />
          <Stat item={right} />
        </>
      ) : null}
    </View>
  );
}

function Stat({ item }: { item: StatItem }) {
  return (
    <View className="flex-1 flex-row items-center gap-2.5 px-3 py-3">
      <Lucide color={theme.colors.accent} name={item.icon} size={17} />
      <View className="flex-1">
        <Text className="font-body text-[10px] leading-3 text-muted" numberOfLines={2}>
          {item.label}
        </Text>
        <Text className="font-label text-sm text-ink">{item.value}</Text>
      </View>
    </View>
  );
}

function DetailCard({
  icon,
  title,
  children,
}: {
  icon: LucideIconName;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View className="gap-3 rounded-card border border-border bg-surface p-4">
      <View className="flex-row items-center gap-2">
        <Lucide color={theme.colors.accent} name={icon} size={17} />
        <Text className="font-label text-sm text-ink">{title}</Text>
      </View>
      {children}
    </View>
  );
}

function formatEventDate(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(new Date(value));
}

function formatTime(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(
    new Date(value),
  );
}
