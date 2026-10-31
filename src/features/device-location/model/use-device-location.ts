import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';

import { readFreshLocation, storeLocation } from './location-cache.ts';
import type { DeviceLocation, DeviceLocationState } from './location.types.ts';

const initialState: DeviceLocationState = {
  status: 'requesting-permission',
  location: null,
  fallbackMessage: null,
};

function activeState(location: DeviceLocation): DeviceLocationState {
  return { status: 'active', location, fallbackMessage: null };
}

function createInitialState(enabled: boolean): DeviceLocationState {
  const cached = enabled ? readFreshLocation() : null;
  return cached ? activeState(cached) : initialState;
}

export function useDeviceLocation(enabled = true) {
  const [state, setState] = useState<DeviceLocationState>(() => createInitialState(enabled));
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    let disposed = false;

    const locate = async () => {
      // A retry always asks the device again; first loads reuse a recent shared fix.
      const cached = attempt === 0 ? readFreshLocation() : null;
      if (cached) {
        setState(activeState(cached));
        return;
      }

      setState(initialState);
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (!permission.granted) {
          if (!disposed) {
            setState({
              status: 'permission-denied',
              location: null,
              fallbackMessage:
                'Permita o acesso à localização para calcular quais objetos estão no seu céu.',
            });
          }
          return;
        }

        if (!(await Location.hasServicesEnabledAsync())) {
          if (!disposed) {
            setState({
              status: 'services-disabled',
              location: null,
              fallbackMessage: 'Ative a localização do aparelho para alinhar o guia celeste.',
            });
          }
          return;
        }

        if (!disposed) setState({ status: 'locating', location: null, fallbackMessage: null });
        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const location: DeviceLocation = {
          latitudeDegrees: position.coords.latitude,
          longitudeDegrees: position.coords.longitude,
          elevationMeters: position.coords.altitude ?? 0,
          accuracyMeters: position.coords.accuracy,
          timestamp: position.timestamp,
        };
        storeLocation(location);
        if (!disposed) setState(activeState(location));
      } catch {
        if (!disposed) {
          setState({
            status: 'error',
            location: null,
            fallbackMessage: 'Não foi possível obter sua localização. Tente novamente.',
          });
        }
      }
    };

    void locate();
    return () => {
      disposed = true;
    };
  }, [attempt, enabled]);

  const retry = useCallback(() => setAttempt((value) => value + 1), []);
  return { ...state, retry };
}
