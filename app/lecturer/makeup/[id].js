import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, SafeAreaView,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { api } from '@/lib/api';

const STATUS_COLORS = {
  PENDING: { bg: '#FEF3C7', fg: '#92400E', border: '#F59E0B' },
  APPROVED: { bg: '#D1FAE5', fg: '#065F46', border: '#10B981' },
  DECLINED: { bg: '#FEE2E2', fg: '#991B1B', border: '#EF4444' },
};

const DAY_NAMES = { 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat', 7: 'Sun' };

export default function MakeupDetailScreen() {
  const { id } = useLocalSearchParams();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/api/school/makeup');
        const found = (res.requests || []).find((r) => r.id === id);
        if (!found) throw new Error('Request not found');
        setRequest(found);
      } catch (e) {
        setErr(e.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}><ActivityIndicator color="#C9A961" /></View>
      </SafeAreaView>
    );
  }

  if (!request) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}><Text style={styles.errText}>{err || 'Not found'}</Text></View>
      </SafeAreaView>
    );
  }

  const colors = STATUS_COLORS[request.status] || STATUS_COLORS.PENDING;
  const dateStr = new Date(request.proposedDate).toLocaleDateString('en-GB', {
    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
  });

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backArrow}>{'\u2190'}</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Make-up request</Text>
        </View>

        <View style={[styles.statusCard, { backgroundColor: colors.bg, borderColor: colors.border }]}>
          <Text style={[styles.statusLabel, { color: colors.fg }]}>{request.status}</Text>
        </View>

        <View style={styles.section}>
          <Row label="Date" value={dateStr} />
          <Row label="Time" value={request.proposedStart + '-' + request.proposedEnd} />
          <Row label="Reason" value={request.reason} multiline />
        </View>

        {request.status === 'PENDING' && (
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>Awaiting approval from your department admin.</Text>
          </View>
        )}

        {request.status === 'APPROVED' && request.slot && (
          <View style={styles.successBox}>
            <Text style={styles.successTitle}>Slot created</Text>
            <Text style={styles.successBody}>
              {DAY_NAMES[request.slot.dayOfWeek]} · {request.slot.startTime}-{request.slot.endTime}
            </Text>
            <Text style={styles.successHint}>Scan the class QR at that time.</Text>
          </View>
        )}

        {request.status === 'DECLINED' && (
          <View style={styles.errBox}>
            <Text style={styles.errTitle}>Declined</Text>
            {request.decisionNote ? <Text style={styles.errBody}>Note: {request.decisionNote}</Text> : null}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value, multiline }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, multiline && { lineHeight: 20 }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAF8F3' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 16, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  backBtn: { padding: 4, marginRight: 8 },
  backArrow: { fontSize: 22, color: '#1E293B' },
  title: { fontSize: 20, fontWeight: '600', color: '#0F172A' },
  errText: { fontSize: 14, color: '#991B1B' },
  statusCard: { borderWidth: 1, borderRadius: 10, padding: 14, alignItems: 'center', marginBottom: 16 },
  statusLabel: { fontSize: 14, fontWeight: '700', letterSpacing: 1 },
  section: { backgroundColor: '#FFF', borderColor: '#E2E8F0', borderWidth: 1, borderRadius: 12, padding: 16, marginBottom: 16 },
  row: { marginBottom: 12 },
  rowLabel: { fontSize: 11, fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 },
  rowValue: { fontSize: 14, color: '#0F172A' },
  infoBox: { backgroundColor: '#EFF6FF', borderColor: '#93C5FD', borderWidth: 1, borderRadius: 10, padding: 14 },
  infoText: { fontSize: 13, color: '#1E40AF' },
  successBox: { backgroundColor: '#D1FAE5', borderColor: '#10B981', borderWidth: 1, borderRadius: 10, padding: 14 },
  successTitle: { fontSize: 14, fontWeight: '700', color: '#065F46', marginBottom: 4 },
  successBody: { fontSize: 13, color: '#047857' },
  successHint: { fontSize: 12, color: '#059669', marginTop: 6 },
  errBox: { backgroundColor: '#FEE2E2', borderColor: '#EF4444', borderWidth: 1, borderRadius: 10, padding: 14 },
  errTitle: { fontSize: 14, fontWeight: '700', color: '#991B1B', marginBottom: 4 },
  errBody: { fontSize: 13, color: '#B91C1C' },
});
