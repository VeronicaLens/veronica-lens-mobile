import type {
  ConditionFactor,
  HourlyConditions,
  ObservationRating,
} from '../../../shared/api/index.ts';

export interface ConditionHour {
  observedAt: string;
  rating: ObservationRating;
  sunAltitudeDegrees: number;
  temperatureCelsius: number | null;
  cloudCoverPercent: number | null;
  precipitationProbabilityPercent: number | null;
  visibilityMeters: number | null;
  windSpeedKilometersPerHour: number | null;
  relativeHumidityPercent: number | null;
  skyLabel: string;
  visibilityLabel: string;
  factors: ConditionFactor[];
}

export function describeSky(cloudCoverPercent: number | null): string {
  if (cloudCoverPercent === null) return 'Indisponível';
  if (cloudCoverPercent <= 20) return 'Limpo';
  if (cloudCoverPercent <= 50) return 'Poucas nuvens';
  if (cloudCoverPercent <= 80) return 'Nublado em partes';
  return 'Nublado';
}

export function describeVisibility(visibilityMeters: number | null): string {
  if (visibilityMeters === null) return 'Indisponível';
  if (visibilityMeters >= 20_000) return 'Excelente';
  if (visibilityMeters >= 10_000) return 'Boa';
  if (visibilityMeters >= 4_000) return 'Regular';
  return 'Baixa';
}

export function toConditionHour(hour: HourlyConditions): ConditionHour {
  const weather = hour.weather;
  const cloudCoverPercent = weather.cloudCoverPercent ?? null;
  const visibilityMeters = weather.visibilityMeters ?? null;
  return {
    observedAt: hour.forecastAt,
    rating: hour.rating,
    sunAltitudeDegrees: hour.sunAltitudeDegrees,
    temperatureCelsius: weather.temperatureCelsius ?? null,
    cloudCoverPercent,
    precipitationProbabilityPercent: weather.precipitationProbabilityPercent ?? null,
    visibilityMeters,
    windSpeedKilometersPerHour: weather.windSpeedKilometersPerHour ?? null,
    relativeHumidityPercent: weather.relativeHumidityPercent ?? null,
    skyLabel: describeSky(cloudCoverPercent),
    visibilityLabel: describeVisibility(visibilityMeters),
    factors: hour.factors,
  };
}

const ratingOrder: Record<ObservationRating, number> = { good: 2, fair: 1, poor: 0 };

// Missing values sort last so hours with real data win ties.
function compareNullable(left: number | null, right: number | null): number {
  if (left === null && right === null) return 0;
  if (left === null) return 1;
  if (right === null) return -1;
  return left - right;
}

/** Prefers better ratings, then clearer skies, less rain and less wind. */
export function chooseBestHour(hours: ConditionHour[]): ConditionHour | null {
  return (
    [...hours].sort(
      (left, right) =>
        ratingOrder[right.rating] - ratingOrder[left.rating] ||
        compareNullable(left.cloudCoverPercent, right.cloudCoverPercent) ||
        compareNullable(
          left.precipitationProbabilityPercent,
          right.precipitationProbabilityPercent,
        ) ||
        compareNullable(left.windSpeedKilometersPerHour, right.windSpeedKilometersPerHour),
    )[0] ?? null
  );
}

export function describeFactor(factor: ConditionFactor, hour: ConditionHour): string {
  if (factor.status === 'unknown') return 'Sem dados de previsão para este fator.';

  switch (factor.code) {
    case 'darkness':
      return factor.status === 'good'
        ? 'Noite escura, com o Sol bem abaixo do horizonte.'
        : factor.status === 'caution'
          ? 'Crepúsculo: o céu ainda não está totalmente escuro.'
          : 'O Sol está acima do horizonte.';
    case 'cloud-cover':
      return `Cobertura de nuvens de ${Math.round(hour.cloudCoverPercent ?? 0)}%.`;
    case 'precipitation':
      return `Probabilidade de chuva de ${Math.round(hour.precipitationProbabilityPercent ?? 0)}%.`;
    case 'visibility':
      return `Visibilidade ${describeVisibility(hour.visibilityMeters).toLocaleLowerCase('pt-BR')} (${Math.round((hour.visibilityMeters ?? 0) / 1000)} km).`;
    case 'wind':
      return `Vento de ${Math.round(hour.windSpeedKilometersPerHour ?? 0)} km/h.`;
    case 'humidity':
      return `Umidade relativa de ${Math.round(hour.relativeHumidityPercent ?? 0)}%.`;
  }
}
