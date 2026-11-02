import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import { getEventIdFromNotificationData } from '../lib/notification-event-link.ts';
import {
  clearStoredPushDevice,
  configureNotificationPresentation,
  refreshStoredPushDevice,
} from './push-device.ts';

interface NotificationBootstrapOptions {
  accessToken: string | null;
  isAnonymous: boolean;
  onOpenEvent(eventId: string): void;
}

export function useNotificationBootstrap({
  accessToken,
  isAnonymous,
  onOpenEvent,
}: NotificationBootstrapOptions): void {
  const onOpenEventRef = useRef(onOpenEvent);

  useEffect(() => {
    onOpenEventRef.current = onOpenEvent;
  }, [onOpenEvent]);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    configureNotificationPresentation();
    const handleResponse = (response: Notifications.NotificationResponse | null) => {
      const eventId = getEventIdFromNotificationData(response?.notification.request.content.data);
      if (eventId) onOpenEventRef.current(eventId);
    };
    let active = true;
    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (active) handleResponse(response);
    });
    const subscription = Notifications.addNotificationResponseReceivedListener(handleResponse);
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (isAnonymous) void clearStoredPushDevice();
  }, [isAnonymous]);

  useEffect(() => {
    if (!accessToken) return;
    refreshStoredPushDevice(accessToken).catch((cause: unknown) => {
      if (__DEV__) console.warn('Push device refresh failed', cause);
    });
  }, [accessToken]);
}
