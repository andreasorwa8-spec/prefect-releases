// app/chat/pending.js
// Session 25 -- 25.9
//
// Global pending-review queue for the caller.
// Approve -> DELIVERED; Reject -> REJECTED. Both via
// /api/chat/messages/[messageId]/{approve,reject}.

import { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, SafeAreaView, RefreshControl,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { api } from '@/lib/api';

export default function PendingScreen() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');

  async function load() {
    try {
      setError('');
      const res = await api.get('/api/chat/pending');
      setItems(res.items || []);
    } catch (err) {
      setError(err?.message || 'Could not load pending messages');
    }
  }

  useFocusEffect(
    useCallback(() => {
      (async () => {
        setLoading(true);
        await load();
        setLoading(false);
      })();
    }, [])
  );

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  async function decide(id, verb) {
    setBusyId(id);
    setError('');
    try {
      await api.post(`/api/chat/messages/${id}/${verb}`, {});
      setItems((cur) => cur.filter((x) => x.id !== id));
    } catch (err) {
      setError(err?.message || `${verb} failed`);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Text style={styles.headerBtnText}>{'\u2190'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pending review</Text>
        <View style={styles.headerBtn} />
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color="#1B2A4E" /></View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <Text style={styles.intro}>
            These messages were held because they scored below your academic-content threshold. Approve to deliver, reject to discard.
          </Text>
          {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}

          {items.length === 0 && !error ? (
            <Text style={styles.empty}>Nothing pending. You are all caught up.</Text>
          ) : (
            items.map((it) => (
              <View key={it.id} style={styles.card}>
                <View style={styles.cardMetaRow}>
                  <Text style={styles.cardMeta}>
                    {it.conversationLabel}  ·  from {it.senderName || 'unknown'} ({it.senderRole})
                    {it.aiScore != null ? `  ·  score ${it.aiScore}/5` : ''}
                  </Text>
                </View>
                <Text style={styles.cardBody}>{it.body || '(attachment)'}</Text>
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={[styles.approveBtn, busyId === it.id && styles.btnDisabled]}
                    onPress={() => decide(it.id, 'approve')}
                    disabled={busyId === it.id}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.approveText}>{busyId === it.id ? '...' : 'Approve'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.rejectBtn, busyId === it.id && styles.btnDisabled]}
                    onPress={() => decide(it.id, 'reject')}
                    disabled={busyId === it.id}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.rejectText}>Reject</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F4EC' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#EFE9DA', backgroundColor: '#FFFFFF',
  },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerBtnText: { fontSize: 22, color: '#1B2A4E', fontWeight: '600' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#1B2A4E' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16, paddingBottom: 40 },
  intro: { fontSize: 12, color: '#6B7280', marginBottom: 14, lineHeight: 18 },
  empty: { fontSize: 14, color: '#6B7280', textAlign: 'center', paddingVertical: 40 },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, marginBottom: 12,
    borderWidth: 1, borderColor: '#EFE9DA',
  },
  cardMetaRow: { flexDirection: 'row', marginBottom: 8 },
  cardMeta: { fontSize: 11, color: '#6B7280', flex: 1 },
  cardBody: { fontSize: 14, color: '#1B2A4E', lineHeight: 20 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  approveBtn: {
    backgroundColor: '#16A34A', borderRadius: 10,
    paddingHorizontal: 16, paddingVertical: 10,
  },
  approveText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  rejectBtn: {
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EFE9DA', borderRadius: 10,
    paddingHorizontal: 16, paddingVertical: 10,
  },
  rejectText: { color: '#1B2A4E', fontSize: 13, fontWeight: '600' },
  btnDisabled: { opacity: 0.55 },
  errorBox: { backgroundColor: '#FEE2E2', borderRadius: 10, padding: 12, marginBottom: 12 },
  errorText: { color: '#991B1B', fontSize: 13 },
});