// src/hooks/useNotifications.ts
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { api } from '../api/client';

// Configuration du comportement des notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export function useNotifications(isAuthenticated: boolean) {
  const router = useRouter();
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    if (!isAuthenticated) return;

    registerForPushNotificationsAsync().then(token => {
      if (token) {
        // Envoyer le token au backend
        api.post('/push-token', { pushToken: token }).catch(err => {
          console.log('Error saving push token:', err);
        });
      }
    });

    // Listener pour les notifications reçues pendant que l'app est au premier plan
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    // Listener pour quand l'utilisateur tape sur une notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      
      if (data.type === 'new_message' && data.eventId) {
        // Naviguer vers le chat de l'événement
        router.push({
          pathname: '/events/[id]/chat',
          params: { id: String(data.eventId) },
        });
      }
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [isAuthenticated]);
}

async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#6366F1',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }
    
    token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log('Push token:', token);
  } else {
    // Mock token pour développement sur émulateur
    console.log('Using mock push token for emulator');
    token = 'ExponentPushToken[MOCK_TOKEN_FOR_DEVELOPMENT]';
  }

  return token;
}