import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, SafeAreaView,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { api } from '@/lib/api';

const STATUS_COLORS = {
  PENDING: { bg: '#FEF3C7', fg: '#92400E', border: '#F59E0B' },
  APPROVED: { bg: '#D1FAE5', fg: '#065F46', border: '#10B981' },
  DECLINED: { bg: '#FEE2E2', fg: '#991B1B', border: '#EF4444' },
  CANCELLED: { bg: '#F3F4F6', fg: '#374151', border: '#9CA3AF' },
  COMPLETED: { bg: '#DBEAFE', fg: '#1E3A8A', border: '#3B82F6' },
};

export default function MakeupListScreen() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    try {
      setError('');
      const res = await api.get('/api/school/makeup');
      setRequests(res.requests || []);
    } catch (err) {
      setError(err.message || 'Failed to load requests');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useFocusEffect(useCallback(() => { load(); }, []));

  const onRefresh = useCallback(() => { setRefreshing(true); load(); }, []);

  function fmtDate(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
  }

  const groups = {
    PENDING: requests.filter((r) => r.status === 'PENDING'),
    APPROVED: requests.filter((r) => r.status === 'APPROVED'),
    DECLINED: requests.filter((r) => r.status === 'DECLINED'),
    OTHER: requests.filter((r) => !['PENDING', 'APPROVED', 'DECLINED'].includes(r.status)),
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}><ActivityIndicator color="#C9A961" /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#C9A961" />}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backArrow}>{'\u2190'}</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Make-up requests</Text>
            <Text style={styles.subtitle}>Requests for rescheduled lessons</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.newBtn} onPress={() => router.push('/lecturer/makeup/new')}>
          <Text style={styles.newBtnText}>+ New request</Text>
        </TouchableOpacity>

        {error ? (
          <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View>
        ) : null}

        {requests.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No requests yet.</Text>
            <Text style={styles.emptyHint}>Tap "+ New request" to create one.</Text>
          </View>
        ) : null}

        {['PENDING', 'APPROVED', 'DECLINED', 'OTHER'].map((status) => {
          const list = groups[status];
          if (!list || list.length === 0) return null;
          const colors = STATUS_COLORS[status] || STATUS_COLORS.PENDING;
          return (
            <View key={status} style={{ marginTop: 16 }}>
              <Text style={styles.groupLabel}>{status === 'OTHER' ? 'OTHER' : status} ({list.length})</Text>
              {list.map((r) => (
                <TouchableOpacity
                  key={r.id}
                  style={styles.card}
                  onPress={() => router.push(`/lecturer/makeup/${r.id}`)}
                  activeOpacity={0.85}
                >
                  <View style={styles.cardTop}>
                    <Text style={styles.cardDate}>{fmtDate(r.proposedDate)} · {r.proposedStart}-{r.proposedEnd}</Text>
                    <View style={[styles.badge, { backgroundColor: colors.bg, borderColor: colors.border }]}>
                      <Text style={[styles.badgeText, { color: colors.fg }]}>{r.status}</Text>
                    </View>
                  </View>
                  <Text style={styles.cardReason} numberOfLines={2}>{r.reason}</Text>
                </TouchableOpacity>
              ))}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAF8F3' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 16, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  backBtn: { padding: 4, marginRight: 8 },
  backArrow: { fontSize: 22, color: '#1E293B' },
  title: { fontSize: 22, fontWeight: '600', color: '#0F172A' },
  subtitle: { fontSize: 12, color: '#64748B', marginTop: 2 },
  newBtn: { backgroundColor: '#C9A961', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginBottom: 12 },
  newBtnText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
  errorBox: { backgroundColor: '#FEE2E2', borderColor: '#EF4444', borderWidth: 1, padding: 12, borderRadius: 8, marginTop: 8 },
  errorText: { color: '#991B1B', fontSize: 13 },
  emptyBox: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 15, color: '#64748B', fontWeight: '500' },
  emptyHint: { fontSize: 12, color: '#94A3B8', marginTop: 6 },
  groupLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 0.5, color: '#64748B', marginBottom: 6, textTransform: 'uppercase' },
  card: { backgroundColor: '#FFF', borderColor: '#E2E8F0', borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 8 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardDate: { fontSize: 13, fontWeight: '600', color: '#0F172A', flex: 1 },
  badge: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
  cardReason: { fontSize: 12, color: '#475569', lineHeight: 17 },
});
