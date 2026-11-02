import { equatorialToHorizontal } from '../../celestial-projection/index.ts';

const DEGREES_TO_RADIANS = Math.PI / 180;
const J2000_UNIX_MS = Date.UTC(2000, 0, 1, 12, 0, 0);
const MS_PER_DAY = 86_400_000;

/** Low-precision solar altitude (about 0.01 degrees), enough to tell day from night. */
export function sunAltitudeDegrees(
  at: Date,
  observer: { latitudeDegrees: number; longitudeDegrees: number },
): number {
  const days = (at.getTime() - J2000_UNIX_MS) / MS_PER_DAY;
  const meanLongitude = 280.46 + 0.9856474 * days;
  const meanAnomaly = (357.528 + 0.9856003 * days) * DEGREES_TO_RADIANS;
  const eclipticLongitude =
    (meanLongitude + 1.915 * Math.sin(meanAnomaly) + 0.02 * Math.sin(2 * meanAnomaly)) *
    DEGREES_TO_RADIANS;
  const obliquity = (23.439 - 0.0000004 * days) * DEGREES_TO_RADIANS;

  const rightAscension =
    Math.atan2(Math.cos(obliquity) * Math.sin(eclipticLongitude), Math.cos(eclipticLongitude)) /
    DEGREES_TO_RADIANS;
  const declination =
    Math.asin(Math.sin(obliquity) * Math.sin(eclipticLongitude)) / DEGREES_TO_RADIANS;

  return equatorialToHorizontal(
    {
      rightAscensionDegrees: ((rightAscension % 360) + 360) % 360,
      declinationDegrees: declination,
    },
    observer,
    at,
  ).altitudeDegrees;
}
