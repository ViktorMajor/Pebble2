import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';

import { registerDevicePushToken } from './pushTokenService';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: false,
    shouldShowList: false,
  }),
});

async function registerPushToken(userId: string): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('pebbles', {
      name: 'Pebbles',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const permissions = await Notifications.getPermissionsAsync();
  const status = permissions.granted
    ? permissions.status
    : (await Notifications.requestPermissionsAsync()).status;

  if (status !== 'granted') {
    return;
  }

  const projectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID;
  const token = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
  const platform = Platform.OS === 'ios' ? 'ios' : 'android';
  await registerDevicePushToken(userId, token.data, platform);
}

function refreshForPebbleNotification(notification: Notifications.Notification, onNotificationOpen: () => void) {
  if (notification.request.content.data?.type === 'pebble') {
    onNotificationOpen();
  }
}

export function usePushNotifications(userId: string | null, onNotificationOpen: () => void) {
  useEffect(() => {
    if (!userId) {
      return;
    }

    void registerPushToken(userId).catch(() => undefined);

    const tokenSubscription = Notifications.addPushTokenListener((token) => {
      const platform = Platform.OS === 'ios' ? 'ios' : 'android';
      void registerDevicePushToken(userId, token.data, platform).catch(() => undefined);
    });
    const foregroundSubscription = Notifications.addNotificationReceivedListener((notification) => {
      refreshForPebbleNotification(notification, onNotificationOpen);
    });
    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      refreshForPebbleNotification(response.notification, onNotificationOpen);
    });
    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        refreshForPebbleNotification(response.notification, onNotificationOpen);
      }
    });
    const appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        void registerPushToken(userId).catch(() => undefined);
      }
    });

    return () => {
      tokenSubscription.remove();
      foregroundSubscription.remove();
      responseSubscription.remove();
      appStateSubscription.remove();
    };
  }, [onNotificationOpen, userId]);
}
