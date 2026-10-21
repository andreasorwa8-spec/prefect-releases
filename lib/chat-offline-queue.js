// ============================================================
// lib/chat-offline-queue.js
// Session 25 -- 25.9
//
// AsyncStorage-backed queue for chat messages composed offline.
// On successful flush, the item is removed and the caller
// reconciles via a refetch.
//
// Queue entry shape:
//   { tempId, conversationId, body, attachmentUrl, createdAt }
//
// Called by:
//   app/chat/[id].js   -- on mount + on AppState focus
//
// Non-retryable failures (ApiError.status in 400..499) drop the
// queued item and report the reason so the UI can show an error
// on the failed bubble.
// ============================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, ApiError } from './api';

const QUEUE_KEY = 'prefect.chat.queue.v1';
const MAX_QUEUE = 200;

async function readAll() {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeAll(list) {
  try {
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(list));
  } catch {}
}

export async function listQueued() {
  return readAll();
}

export async function enqueueMessage({ conversationId, body, attachmentUrl }) {
  const list = await readAll();
  const tempId = `t_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const entry = {
    tempId,
    conversationId,
    body: body || '',
    attachmentUrl: attachmentUrl || null,
    createdAt: new Date().toISOString(),
  };
  const next = [...list, entry];
  const capped = next.length > MAX_QUEUE ? next.slice(next.length - MAX_QUEUE) : next;
  await writeAll(capped);
  return entry;
}

export async function dequeueById(tempId) {
  const list = await readAll();
  const next = list.filter((x) => x.tempId !== tempId);
  await writeAll(next);
}

// Flush all queued messages through the API.
// onSent(tempId, serverMessage)  -- called on 2xx
// onFailed(tempId, apiError)     -- called on non-retryable failure (4xx)
// Retryable (network / 5xx) items are kept for the next flush.
export async function flushQueue({ onSent, onFailed } = {}) {
  const list = await readAll();
  if (list.length === 0) return { flushed: 0, kept: 0, failed: 0 };

  const keep = [];
  let flushed = 0;
  let failed = 0;

  for (const item of list) {
    try {
      const res = await api.post(`/api/chat/conversations/${item.conversationId}/messages`, {
        body: item.body,
        attachmentUrl: item.attachmentUrl,
      });
      flushed += 1;
      if (typeof onSent === 'function') {
        try { onSent(item.tempId, res); } catch {}
      }
    } catch (err) {
      if (err instanceof ApiError && err.status >= 400 && err.status < 500) {
        failed += 1;
        if (typeof onFailed === 'function') {
          try { onFailed(item.tempId, err); } catch {}
        }
        // drop non-retryable
      } else {
        keep.push(item);
      }
    }
  }

  await writeAll(keep);
  return { flushed, kept: keep.length, failed };
}