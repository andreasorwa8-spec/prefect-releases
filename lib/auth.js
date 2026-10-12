import * as SecureStore from 'expo-secure-store';

const MOBILE_SESSION_KEY = 'prefect.mobile.session.v1';
const DEVICE_KEY = 'prefect.device.v1';

export async function saveMobileSession(data) {
  try {
    await SecureStore.setItemAsync(MOBILE_SESSION_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export async function getMobileSession() {
  try {
    const raw = await SecureStore.getItemAsync(MOBILE_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function clearMobileSession() {
  try {
    await SecureStore.deleteItemAsync(MOBILE_SESSION_KEY);
    return true;
  } catch {
    return false;
  }
}

export async function saveDeviceId(deviceId) {
  try {
    await SecureStore.setItemAsync(DEVICE_KEY, deviceId);
    return true;
  } catch {
    return false;
  }
}

export async function getDeviceId() {
  try {
    return await SecureStore.getItemAsync(DEVICE_KEY);
  } catch {
    return null;
  }
}