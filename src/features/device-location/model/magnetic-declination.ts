export interface HeadingReading {
  magHeading: number;
  trueHeading: number;
}

// Declination beyond this is not physically plausible for inhabited areas, so the reading is rejected.
const MAX_PLAUSIBLE_DECLINATION_DEGREES = 60;

/**
 * Magnetic declination (east positive) derived from a heading reading that carries both the
 * magnetic and the true heading. Returns null when the platform could not provide true north.
 */
export function declinationFromHeading(reading: HeadingReading): number | null {
  const { magHeading, trueHeading } = reading;
  if (!Number.isFinite(magHeading) || !Number.isFinite(trueHeading)) return null;
  if (magHeading < 0 || trueHeading < 0) return null;

  const difference = ((((trueHeading - magHeading) % 360) + 540) % 360) - 180;
  return Math.abs(difference) <= MAX_PLAUSIBLE_DECLINATION_DEGREES ? difference : null;
}

export function applyDeclination(
  magneticHeadingDegrees: number,
  declinationDegrees: number,
): number {
  return (((magneticHeadingDegrees + declinationDegrees) % 360) + 360) % 360;
}
