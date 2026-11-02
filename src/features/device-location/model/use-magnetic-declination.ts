import * as Location from 'expo-location';
import { useEffect, useState } from 'react';

import type { DeviceLocation } from './location.types.ts';
import { declinationFromHeading } from './magnetic-declination.ts';

const READ_TIMEOUT_MS = 3_000;
const READ_ATTEMPTS = 3;

let cached: { key: string; declination: number } | null = null;

function cacheKey(location: DeviceLocation): string {
  return `${Math.round(location.latitudeDegrees)}:${Math.round(location.longitudeDegrees)}`;
}

async function readOnce(): Promise<number | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), READ_TIMEOUT_MS);
  });
  try {
    const reading = await Promise.race([Location.getHeadingAsync(), timeout]);
    return reading ? declinationFromHeading(reading) : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * The platform location module reports both magnetic and true heading using the device's
 * geomagnetic model; their difference is the local magnetic declination.
 */
async function readMagneticDeclination(): Promise<number | null> {
  for (let attempt = 0; attempt < READ_ATTEMPTS; attempt += 1) {
    const declination = await readOnce();
    if (declination !== null) return declination;
  }
  return null;
}

export function useMagneticDeclination(location: DeviceLocation | null, enabled = true) {
  const key = location ? cacheKey(location) : null;
  const [declination, setDeclination] = useState<number | null>(() =>
    cached && cached.key === key ? cached.declination : null,
  );

  useEffect(() => {
    if (!enabled || key === null) return;
    let disposed = false;
    void readMagneticDeclination().then((value) => {
      if (value === null) return;
      cached = { key, declination: value };
      if (!disposed) setDeclination(value);
    });
    return () => {
      disposed = true;
    };
  }, [enabled, key]);

  return declination;
}
