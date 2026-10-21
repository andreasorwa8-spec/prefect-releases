// app/chat/[id].js
// Session 25 -- 25.9
//
// Mobile chat thread. Design notes:
//   - Polling every 3s (RN has no EventSource; react-native-sse is not
//     installed). Polls ?since=<lastCreatedAt>&includePending=1.
//   - Composer sends optimistically. If offline, message is queued via
//     lib/chat-offline-queue and shown as "sending". Flush on mount and
//     on AppState active.
//   - 451 TERMS_NOT_ACCEPTED -> banner + "Review Terms" button.
//   - 451 POLICY_VIOLATION   -> banner with action/warnings.
//   - 403 BANNED_*           -> inline alert.
//   - Read receipt: POST /api/chat/conversations/[id]/read on mount.

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  ActivityIndicator, SafeAreaView, KeyboardAvoidingView, Platform, AppState, Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { api, ApiError } from '@/lib/api';
import {
  enqueueMessage, flushQueue, listQueued, dequeueById,
} from '@/lib/chat-offline-queue';

const POLL_MS = 3000;
const MAX_BODY_LEN = 4000;

function tempBubble(q) {
  return {
    id: q.tempId,
    senderId: 'me',
    sender: { id: 'me', name: null, role: null },
    body: q.body,
    attachmentUrl: q.attachmentUrl,
    aiScore: null,
    moderationState: 'SENDING',
    createdAt: q.createdAt,
    _temp: true,
  };
}

export default function ChatThreadScreen() {
  const router = useRouter();
  const { id: conversationId } = useLocalSearchParams();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [banner, setBanner] = useState(null); // { kind: 'terms'|'policy'|'ban', ... }
  const [meId, setMeId] = useState(null);
  const [headerTitle, setHeaderTitle] = useState('Chat');
  const [headerSub, setHeaderSub] = useState('');

  const pollTimer = useRef(null);
  const lastTs = useRef(null);
  const appStateRef = useRef(AppState.currentState);

  // ---- Load thread + mark read ----
  const initialLoad = useCallback(async () => {
    try {
      setError('');
      // We don't have a dedicated "conversation meta" endpoint; reuse messages list header via conversations.
      const convList = await api.get('/api/chat/conversations');
      const all = [
        convList.general ? { ...convList.general, type: 'GENERAL' } : null,
        ...(convList.dms || []).map((d) => ({ ...d, type: 'DM' })),
        ...(convList.groups || []).map((g) => ({ ...g, type: 'GROUP' })),
      ].filter(Boolean);
      const meta = all.find((c) => c.id === conversationId);
      if (meta) {
        if (meta.type === 'DM') {
          setHeaderTitle(meta.other?.name || 'Direct message');
          setHeaderSub(meta.other?.role || '');
        } else if (meta.type === 'GENERAL') {
          setHeaderTitle(meta.title || 'General');
          setHeaderSub('Everyone with your role');
        } else {
          setHeaderTitle(meta.title || 'Group');
          setHeaderSub('');
        }
      }

      const res = await api.get(`/api/chat/conversations/${conversationId}/messages?includePending=1&limit=200`);
      const list = (res.messages || []).map((m) => ({
        id: m.id,
        senderId: m.senderId,
        sender: m.sender,
        body: m.body,
        attachmentUrl: m.attachmentUrl,
        aiScore: m.aiScore,
        moderationState: m.moderationState,
        createdAt: m.createdAt,
      }));

      // Determine "me" from the local session
      // (we can infer from any message whose senderId matches our own id
      //  only if we know our id -- use /api/profile which is cheap.)
      try {
        const prof = await api.get('/api/profile');
        if (prof?.self?.id) setMeId(prof.self.id);
      } catch {}

      // Merge in any queued items for this conversation
      const queued = (await listQueued()).filter((q) => q.conversationId === conversationId);
      const queuedBubbles = queued.map(tempBubble);
      const combined = [...list, ...queuedBubbles].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      setMessages(combined);
      lastTs.current = list.length > 0 ? list[list.length - 1].createdAt : null;

      // Mark read
      try {
        await api.post(`/api/chat/conversations/${conversationId}/read`, {});
      } catch {}
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setError('Conversation not found');
      } else {
        setError(err?.message || 'Could not load messages');
      }
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  // ---- Poll for new messages ----
  const poll = useCallback(async () => {
    if (appStateRef.current !== 'active') return;
    try {
      const since = lastTs.current ? `&since=${encodeURIComponent(lastTs.current)}` : '';
      const res = await api.get(`/api/chat/conversations/${conversationId}/messages?includePending=1&limit=200${since}`);
      const incoming = (res.messages || []).map((m) => ({
        id: m.id,
        senderId: m.senderId,
        sender: m.sender,
        body: m.body,
        attachmentUrl: m.attachmentUrl,
        aiScore: m.aiScore,
        moderationState: m.moderationState,
        createdAt: m.createdAt,
      }));
      if (incoming.length === 0) return;
      setMessages((cur) => {
        const byId = new Map(cur.map((m) => [m.id, m]));
        for (const m of incoming) byId.set(m.id, m);
        const out = Array.from(byId.values()).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        return out;
      });
      lastTs.current = incoming[incoming.length - 1].createdAt;
    } catch {}
  }, [conversationId]);

  // ---- Flush offline queue ----
  const flush = useCallback(async () => {
    await flushQueue({
      onSent: (tempId, res) => {
        setMessages((cur) => cur.map((m) => {
          if (m.id !== tempId) return m;
          return {
            id: res.id || m.id,
            senderId: 'me',
            sender: { id: 'me', name: null, role: null },
            body: m.body,
            attachmentUrl: m.attachmentUrl,
            aiScore: res.aiScore,
            moderationState: res.moderationState || 'DELIVERED',
            createdAt: res.createdAt || m.createdAt,
            _temp: false,
          };
        }));
      },
      onFailed: (tempId, err) => {
        const reason = err?.data?.error || err?.message || 'Send failed';
        setMessages((cur) => cur.map((m) => m.id === tempId ? { ...m, moderationState: 'FAILED' } : m));
        setBanner({ kind: 'policy', message: `Message failed: ${reason}` });
      },
    });
  }, []);

  useEffect(() => {
    (async () => {
      await initialLoad();
      await flush();
      // Start polling
      pollTimer.current = setInterval(poll, POLL_MS);
    })();

    const sub = AppState.addEventListener('change', (next) => {
      appStateRef.current = next;
      if (next === 'active') {
        poll();
        flush();
      }
    });

    return () => {
      if (pollTimer.current) clearInterval(pollTimer.current);
      sub.remove();
    };
  }, [initialLoad, poll, flush]);

  // ---- Send ----
  async function send() {
    const body = text.trim();
    if (!body) return;
    setText('');
    setError('');

    // Optimistic bubble
    const tempId = `t_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const optimistic = {
      id: tempId,
      senderId: 'me',
      sender: { id: 'me', name: null, role: null },
      body,
      attachmentUrl: null,
      aiScore: null,
      moderationState: 'SENDING',
      createdAt: new Date().toISOString(),
      _temp: true,
    };
    setMessages((cur) => [...cur, optimistic]);

    try {
      const res = await api.post(`/api/chat/conversations/${conversationId}/messages`, { body });
      // Replace optimistic with server row
      setMessages((cur) => cur.map((m) => {
        if (m.id !== tempId) return m;
        return {
          id: res.id || m.id,
          senderId: 'me',
          sender: { id: 'me', name: null, role: null },
          body,
          attachmentUrl: null,
          aiScore: res.aiScore,
          moderationState: res.moderationState || 'DELIVERED',
          createdAt: res.createdAt || m.createdAt,
          _temp: false,
        };
      }));
      lastTs.current = res.createdAt || lastTs.current;
    } catch (err) {
      // Remove optimistic; queue; show reason
      setMessages((cur) => cur.filter((m) => m.id !== tempId));
      const status = err instanceof ApiError ? err.status : 0;
      const code = err?.data?.error;

      if (status === 451 && code === 'TERMS_NOT_ACCEPTED') {
        setBanner({ kind: 'terms', version: err.data.version });
      } else if (status === 451 && code === 'POLICY_VIOLATION') {
        setBanner({
          kind: 'policy',
          message: `Blocked: ${err.data.action || 'policy'}. Warnings: ${err.data.warningCount ?? '?'}`,
        });
      } else if (status === 403 && (code === 'BANNED_PERMANENT' || code === 'BANNED_TEMP')) {
        setBanner({ kind: 'ban', message: code === 'BANNED_PERMANENT' ? 'You are permanently banned.' : 'You are temporarily banned.' });
      } else if (status === 0) {
        // Network error -> queue and show sending
        const q = await enqueueMessage({ conversationId, body });
        setMessages((cur) => [...cur, tempBubble(q)]);
        setBanner({ kind: 'offline' });
      } else {
        setError(err?.message || 'Send failed');
      }
    }
  }

  function renderBubble({ item }) {
    const mine = item.senderId === 'me' || item.senderId === meId;
    const pending = item.moderationState === 'PENDING';
    const failed = item.moderationState === 'FAILED';
    const sending = item.moderationState === 'SENDING';
    const t = new Date(item.createdAt);
    const label = `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`;

    return (
      <View style={[styles.bubbleRow, mine ? styles.bubbleRowMine : styles.bubbleRowOther]}>
        <View style={[
          styles.bubble,
          mine ? styles.bubbleMine : styles.bubbleOther,
          pending && styles.bubblePending,
          sending && styles.bubbleSending,
          failed && styles.bubbleFailed,
        ]}>
          {!mine && item.sender?.name ? (
            <Text style={styles.senderName}>{item.sender.name}</Text>
          ) : null}
          <Text style={[styles.bubbleBody, mine && styles.bubbleBodyMine]}>{item.body}</Text>
          <Text style={[styles.bubbleMeta, mine && styles.bubbleMetaMine]}>
            {label}
            {pending ? '  · pending' : ''}
            {sending ? '  · sending' : ''}
            {failed ? '  · failed' : ''}
            {mine && item.aiScore != null ? `  · score ${item.aiScore}/5` : ''}
          </Text>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
            <Text style={styles.headerBtnText}>{'\u2190'}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Loading...</Text>
          <View style={styles.headerBtn} />
        </View>
        <View style={styles.center}><ActivityIndicator color="#1B2A4E" /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
            <Text style={styles.headerBtnText}>{'\u2190'}</Text>
          </TouchableOpacity>
          <View style={{ alignItems: 'center', flex: 1 }}>
            <Text style={styles.headerTitle} numberOfLines={1}>{headerTitle}</Text>
            {headerSub ? <Text style={styles.headerSub} numberOfLines={1}>{headerSub}</Text> : null}
          </View>
          <View style={styles.headerBtn} />
        </View>

        {banner ? (
          <View style={[
            styles.banner,
            banner.kind === 'terms' && styles.bannerTerms,
            banner.kind === 'policy' && styles.bannerPolicy,
            banner.kind === 'ban' && styles.bannerBan,
            banner.kind === 'offline' && styles.bannerOffline,
          ]}>
            {banner.kind === 'terms' ? (
              <>
                <Text style={styles.bannerText}>Accept the current Terms to chat.</Text>
                <TouchableOpacity onPress={() => router.push('/terms')} style={styles.bannerBtn}>
                  <Text style={styles.bannerBtnText}>Review Terms</Text>
                </TouchableOpacity>
              </>
            ) : (
              <Text style={styles.bannerText}>{banner.message || 'Action required.'}</Text>
            )}
          </View>
        ) : null}

        {error ? (
          <View style={styles.errorBar}><Text style={styles.errorBarText}>{error}</Text></View>
        ) : null}

        <FlatList
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={renderBubble}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={() => {}}
        />

        <View style={styles.composer}>
          <TextInput
            style={styles.composerInput}
            value={text}
            onChangeText={setText}
            placeholder="Write a message..."
            placeholderTextColor="#9CA3AF"
            multiline
            maxLength={MAX_BODY_LEN}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!text.trim()) && styles.sendBtnDisabled]}
            onPress={send}
            disabled={!text.trim()}
            activeOpacity={0.85}
          >
            <Text style={styles.sendBtnText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F4EC' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#EFE9DA', backgroundColor: '#FFFFFF',
  },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerBtnText: { fontSize: 22, color: '#1B2A4E', fontWeight: '600' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#1B2A4E' },
  headerSub: { fontSize: 11, color: '#6B7280', marginTop: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { padding: 12, paddingBottom: 8 },
  bubbleRow: { marginBottom: 8, flexDirection: 'row' },
  bubbleRowMine: { justifyContent: 'flex-end' },
  bubbleRowOther: { justifyContent: 'flex-start' },
  bubble: {
    maxWidth: '78%', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 14,
  },
  bubbleMine: { backgroundColor: '#1B2A4E' },
  bubbleOther: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EFE9DA' },
  bubblePending: { opacity: 0.75 },
  bubbleSending: { opacity: 0.6 },
  bubbleFailed: { borderColor: '#EF4444', borderWidth: 1 },
  senderName: { fontSize: 11, color: '#6B7280', marginBottom: 2, fontWeight: '600' },
  bubbleBody: { fontSize: 14, color: '#1B2A4E', lineHeight: 20 },
  bubbleBodyMine: { color: '#FFFFFF' },
  bubbleMeta: { fontSize: 10, color: '#9CA3AF', marginTop: 4 },
  bubbleMetaMine: { color: 'rgba(255,255,255,0.65)' },
  composer: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    padding: 12, borderTopWidth: 1, borderTopColor: '#EFE9DA', backgroundColor: '#FFFFFF',
  },
  composerInput: {
    flex: 1, minHeight: 40, maxHeight: 120,
    backgroundColor: '#F7F4EC', borderRadius: 20, borderWidth: 1, borderColor: '#EFE9DA',
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: '#1B2A4E',
  },
  sendBtn: {
    paddingHorizontal: 18, paddingVertical: 10, backgroundColor: '#1B2A4E',
    borderRadius: 20, alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.5 },
  sendBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  banner: {
    paddingVertical: 10, paddingHorizontal: 14, margin: 12, borderRadius: 10,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  bannerTerms: { backgroundColor: '#FEF3C7' },
  bannerPolicy: { backgroundColor: '#FEE2E2' },
  bannerBan: { backgroundColor: '#FEE2E2' },
  bannerOffline: { backgroundColor: '#E0E7FF' },
  bannerText: { fontSize: 12, color: '#1B2A4E', flex: 1 },
  bannerBtn: {
    backgroundColor: '#1B2A4E', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, marginLeft: 8,
  },
  bannerBtnText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  errorBar: { backgroundColor: '#FEE2E2', padding: 8, marginHorizontal: 12, marginTop: 8, borderRadius: 8 },
  errorBarText: { color: '#991B1B', fontSize: 12 },
});