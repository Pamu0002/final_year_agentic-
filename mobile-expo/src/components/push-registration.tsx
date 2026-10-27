import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
});

export function PushRegistration() {
  const { user } = useAuth();
  useEffect(() => {
    if (!user || !Device.isDevice) return;
    let active = true;
    (async () => {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('booking-updates', { name: 'Booking updates', importance: Notifications.AndroidImportance.HIGH });
      }
      const current = await Notifications.getPermissionsAsync();
      const permission = current.status === 'granted' ? current : await Notifications.requestPermissionsAsync();
      if (permission.status !== 'granted' || !active) return;
      const nativeToken = await Notifications.getDevicePushTokenAsync();
      await api('/api/users/me/device-token', { method: 'POST', body: { token: String(nativeToken.data), platform: Platform.OS } });
    })().catch((error) => console.warn('Push registration unavailable in this build', error));
    return () => { active = false; };
  }, [user]);
  return null;
}
