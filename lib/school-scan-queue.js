import AsyncStorage from '@react-native-async-storage/async-storage';

const QUEUE_KEY = 'prefect.school.scan.queue.v1';
const MAX_QUEUE = 200;

function randomId() {
  return 'sch_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
}

export async function enqueueScan({ shortCode, hmac8, scannedAt }) {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    const entry = {
      offlineId: randomId(),
      shortCode,
      hmac8,
      scannedAt: scannedAt || new Date().toISOString(),
      enqueuedAt: new Date().toISOString(),
    };
    list.push(entry);
    if (list.length > MAX_QUEUE) list.splice(0, list.length - MAX_QUEUE);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(list));
    return entry;
  } catch (_) { return null; }
}

export async function listQueued() {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (_) { return []; }
}

export async function removeQueued(offlineId) {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    const filtered = list.filter((e) => e.offlineId !== offlineId);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(filtered));
  } catch (_) {}
}

// api is the named-export object from lib/api.js (has .post())
export async function flushQueue(api) {
  const list = await listQueued();
  if (list.length === 0) return { flushed: 0, kept: 0 };

  try {
    const data = await api.post('/api/school/scan/offline-sync', {
      scans: list.map((e) => ({
        offlineId: e.offlineId,
        shortCode: e.shortCode,
        hmac8: e.hmac8,
        scannedAt: e.scannedAt,
      })),
    });
    const okIds = new Set((data?.results || []).filter((r) => r.ok).map((r) => r.offlineId));
    const kept = list.filter((e) => !okIds.has(e.offlineId));
    if (kept.length === 0) await AsyncStorage.removeItem(QUEUE_KEY);
    else await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(kept));
    return { flushed: okIds.size, kept: kept.length };
  } catch (_) {
    return { flushed: 0, kept: list.length };
  }
}