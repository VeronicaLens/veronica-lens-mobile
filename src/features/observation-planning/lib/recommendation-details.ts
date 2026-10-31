import type { ObservationRecommendation } from '../../../shared/api/index.ts';

export type LimitingFactor = 'altitude' | 'weather' | 'both';

export interface RecommendationDetails {
  summary: string;
  peakAltitudeDegrees: number | null;
  minimumAltitudeDegrees: number;
  favorableSamples: number;
  totalSamples: number;
  weatherAvailable: boolean;
  limitingFactor: LimitingFactor | null;
}

export function describeRecommendation(
  recommendation: ObservationRecommendation,
): RecommendationDetails {
  const { rejections, samples, window } = recommendation;
  const minimum = Math.round(recommendation.minimumAltitudeDegrees);
  const limitingFactor: LimitingFactor | null =
    rejections.belowMinimumAltitude > 0 && rejections.poorConditions > 0
      ? 'both'
      : rejections.belowMinimumAltitude > 0
        ? 'altitude'
        : rejections.poorConditions > 0
          ? 'weather'
          : null;
  const peak = window ? Math.round(window.peakAltitudeDegrees) : null;

  let summary: string;
  if (recommendation.status === 'recommended' && peak !== null) {
    summary = `Há uma janela favorável, com o astro chegando a ${peak}° de altitude.`;
  } else if (limitingFactor === 'altitude') {
    summary = `O astro não alcança a altitude mínima de ${minimum}° nesse período.`;
  } else if (limitingFactor === 'weather') {
    summary = 'A previsão do tempo é desfavorável nesse período.';
  } else if (limitingFactor === 'both') {
    summary = 'Altitude baixa e previsão desfavorável impedem uma boa janela nesse período.';
  } else {
    summary = 'Não há dados suficientes para recomendar uma janela nesse período.';
  }

  return {
    summary,
    peakAltitudeDegrees: peak,
    minimumAltitudeDegrees: minimum,
    favorableSamples: samples.filter((sample) => sample.favorable).length,
    totalSamples: samples.length,
    weatherAvailable: recommendation.weatherAvailable,
    limitingFactor: recommendation.status === 'recommended' ? null : limitingFactor,
  };
}
