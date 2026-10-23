import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, SafeAreaView, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';

const ICON_BACK = '\u2190';

function money(cents) {
  return 'KSh ' + (cents / 100).toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export default function PartnerScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [applying, setApplying] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  async function load() {
    try {
      setError('');
      const res = await api.get('/api/affiliate/me');
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to load');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { load(); }, []);
  const onRefresh = useCallback(() => { setRefreshing(true); load(); }, []);

  async function apply() {
    setApplying(true);
    try {
      const res = await api.post('/api/affiliate/apply', {});
      if (res?.created) {
        Alert.alert('Applied', 'Your affiliate application was submitted. An admin will review it shortly.');
      }
      await load();
    } catch (err) {
      Alert.alert('Could not apply', err.message || 'Please try again.');
    } finally {
      setApplying(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator color="#C9A961" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#C9A961" />
        }
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
            <Text style={styles.back}>{ICON_BACK}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Partner Program</Text>
          <View style={{ width: 24 }} />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {!data || !data.partner ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Earn 10% referring to Prefect</Text>
            <Text style={styles.cardBody}>
              Share Prefect with students, lecturers, and merchants. When they sign up with your code and pay for anything on the platform, you earn 10% of that spend.
            </Text>
            <Text style={styles.cardBody}>
              At 5,000 valid referrals you become a Partner (20%). At 10,000+, Elite Partner (30%) with custom solutions.
            </Text>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={apply}
              disabled={applying}
            >
              <Text style={styles.primaryBtnText}>
                {applying ? 'Submitting...' : 'Become an affiliate'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.card}>
              <View style={styles.rowBetween}>
                <Text style={styles.smallLabel}>YOUR REFERRAL CODE</Text>
                <View style={[
                  styles.statusBadge,
                  data.partner.status === 'ACTIVE' ? styles.statusActive :
                  data.partner.status === 'PENDING' ? styles.statusPending :
                  data.partner.status === 'SUSPENDED' ? styles.statusSuspended : styles.statusRejected
                ]}>
                  <Text style={styles.statusText}>{data.partner.status}</Text>
                </View>
              </View>
              <Text selectable style={styles.code}>{data.partner.referralCode}</Text>
              <Text style={styles.muted}>
                Share this code. Anyone who signs up with it is attributed to you permanently after their first payment.
              </Text>
              <Text style={styles.muted}>
                Tier: {data.partner.tier} | Referrals: {data.partner.validReferralCount}
              </Text>
            </View>

            <View style={styles.metricsRow}>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Paid</Text>
                <Text style={styles.metricValue}>{money(data.paid.cents)}</Text>
                <Text style={styles.metricSub}>{data.paid.count} conversion{data.paid.count === 1 ? '' : 's'}</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Pending</Text>
                <Text style={styles.metricValue}>{money(data.pending.cents)}</Text>
                <Text style={styles.metricSub}>{data.pending.count} conversion{data.pending.count === 1 ? '' : 's'}</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>On hold</Text>
                <Text style={styles.metricValue}>{money(data.onHold.cents)}</Text>
                <Text style={styles.metricSub}>{data.onHold.count} conversion{data.onHold.count === 1 ? '' : 's'}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => router.push('/affiliate/links')}
            >
              <Text style={styles.secondaryBtnText}>Browse affiliate products</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8F7F5' },
  scroll: { padding: 16, paddingBottom: 40 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  back: { fontSize: 22, color: '#1B2A4E' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1B2A4E' },
  error: { color: '#B00020', marginBottom: 12 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#EEE' },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#1B2A4E', marginBottom: 8 },
  cardBody: { fontSize: 14, color: '#4A5260', lineHeight: 20, marginBottom: 10 },
  primaryBtn: { backgroundColor: '#1B2A4E', paddingVertical: 14, borderRadius: 999, alignItems: 'center', marginTop: 8 },
  primaryBtnText: { color: '#FFFFFF', fontWeight: '600', fontSize: 15 },
  secondaryBtn: { backgroundColor: '#FFFFFF', paddingVertical: 14, borderRadius: 999, alignItems: 'center', borderWidth: 1, borderColor: '#1B2A4E', marginBottom: 16 },
  secondaryBtnText: { color: '#1B2A4E', fontWeight: '600', fontSize: 15 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  smallLabel: { fontSize: 11, letterSpacing: 1, color: '#8A909C', fontWeight: '600' },
  code: { fontSize: 28, fontWeight: '700', color: '#1B2A4E', letterSpacing: 2, marginBottom: 10 },
  muted: { fontSize: 12, color: '#8A909C', lineHeight: 18, marginBottom: 6 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  statusActive: { backgroundColor: '#DCFCE7' },
  statusPending: { backgroundColor: '#FEF3C7' },
  statusSuspended: { backgroundColor: '#FFEDD5' },
  statusRejected: { backgroundColor: '#FEE2E2' },
  statusText: { fontSize: 11, fontWeight: '600', color: '#1B2A4E' },
  metricsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  metricCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: '#EEE' },
  metricLabel: { fontSize: 10, color: '#8A909C', letterSpacing: 1, fontWeight: '600', marginBottom: 4 },
  metricValue: { fontSize: 14, fontWeight: '700', color: '#1B2A4E', marginBottom: 2 },
  metricSub: { fontSize: 11, color: '#8A909C' },
});
