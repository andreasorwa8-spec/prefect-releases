import * as Crypto from 'expo-crypto';
import * as Application from 'expo-application';
import { getDeviceId, saveDeviceId } from './auth';

/**
 * Returns a stable device fingerprint for this install.
 * Uses a persisted random ID — not a hardware ID (privacy-safe).
 */
export async function getOrCreateDeviceId() {
  let id = await getDeviceId();
  if (id) return id;

  // Generate a random 16-byte ID
  const bytes = await Crypto.getRandomBytesAsync(16);
  id = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  await saveDeviceId(id);
  return id;
}

/**
 * Hashes a device ID (for server-side storage without raw value).
 */
export async function hashDeviceId(deviceId) {
  return await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, deviceId);
}