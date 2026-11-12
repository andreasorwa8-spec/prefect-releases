// lib/push.js -- Expo push notification registration
// Call registerForPush() after successful login.
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import api from './api';

export async function registerForPush() {
  try {
    if (!Device.isDevice) {
      console.log('[push] not a physical device -- skipping');
      return { ok: false, reason: 'NOT_PHYSICAL_DEVICE' };
    }

    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('[push] permission denied');
      return { ok: false, reason: 'PERMISSION_DENIED' };
    }

    const tokenResponse = await Notifications.getExpoPushTokenAsync();
    const token = tokenResponse.data;
    console.log('[push] token:', token);

    await api.post('/api/push/register', {
      token,
      platform: Platform.OS,
    });

    return { ok: true, token };
  } catch (err) {
    console.warn('[push] registration failed:', err && err.message ? err.message : err);
    return { ok: false, reason: (err && err.message) ? err.message : String(err) };
  }
}