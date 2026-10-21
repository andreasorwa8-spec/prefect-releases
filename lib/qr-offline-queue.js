// lib/qr-offline-queue.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';

const KEY = 'prefect.qr.queue.v1';
const MAX_QUEUE = 500;

export async function readQueue() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

export async function enqueue(scan) {
  const cur = await readQueue();
  const next = cur.concat([Object.assign({}, scan, { queuedAt: new Date().toISOString() })]);
  const trimmed = next.length > MAX_QUEUE ? next.slice(next.length - MAX_QUEUE) : next;
  await AsyncStorage.setItem(KEY, JSON.stringify(trimmed));
  return trimmed.length;
}

export async function clearQueue() {
  await AsyncStorage.removeItem(KEY);
}

export async function queueSize() {
  const q = await readQueue();
  return q.length;
}

export async function flushQueue() {
  const q = await readQueue();
  if (q.length === 0) return { flushed: 0, remaining: 0, results: [] };

  const chunks = [];
  for (let i = 0; i < q.length; i += 500) chunks.push(q.slice(i, i + 500));

  let flushed = 0;
  const allResults = [];
  const keep = [];

  for (const chunk of chunks) {
    try {
      const res = await api.post('/api/qr/scan/batch', { scans: chunk });
      const accepted = Number(res && res.accepted) || 0;
      flushed += accepted;
      allResults.push.apply(allResults, (res && res.results) || []);
      const results = (res && res.results) || [];
      for (let i = 0; i < results.length; i++) {
        if (!results[i].ok) {
          const reason = results[i].reason;
          const permanent = ['bad_payload','code_not_found','payload_invalid','code_not_active','forbidden_role'];
          if (!permanent.includes(reason)) keep.push(chunk[i]);
        }
      }
    } catch (err) {
      keep.push.apply(keep, chunk);
    }
  }

  if (keep.length === 0) await clearQueue();
  else await AsyncStorage.setItem(KEY, JSON.stringify(keep));

  return { flushed, remaining: keep.length, results: allResults };
}
