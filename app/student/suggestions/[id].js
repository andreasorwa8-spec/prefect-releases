import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { api } from '@/lib/api';

const STATUS_TONE = {
  SUBMITTED: { bg: '#E4EEF9', fg: '#2A4B7C' },
  UNDER_REVIEW: { bg: '#F5EAD2', fg: '#8A6D2A' },
  ACCEPTED: { bg: '#E1F1EB', fg: '#1A7A5E' },
  SHIPPED: { bg: '#DCEFE0', fg: '#1F6B3A' },
  REJECTED: { bg: '#F0EDE5', fg: '#6B7383' },
};

function ksh(cents) {
  return 'KSh ' + (cents / 100).toFixed(2);
}

export default function SuggestionDetail() {
  const { id } = useLocalSearchParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    try {
      setError('');
      const res = await api.get(`/api/suggestions/${id}`);
      setItem(res.suggestion);
    } catch (err) {
      setError(err.message || 'Failed to load');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { load(); }, [id]);
  const onRefresh = useCallback(() => { setRefreshing(true); load(); }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}><ActivityIndicator color="#C9A961" /></View>
      </SafeAreaView>
    );
  }

  if (error || !item) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}><Text style={styles.errorText}>{error || 'Not found'}</Text></View>
      </SafeAreaView>
    );
  }

  const tone = STATUS_TONE[item.status] || STATUS_TONE.SUBMITTED;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#C9A961" />}
      >
        <View style={[styles.badge, { backgroundColor: tone.bg, alignSelf: 'flex-start' }]}>
          <Text style={[styles.badgeText, { color: tone.fg }]}>{item.status.replace('_', ' ')}</Text>
        </View>

        <Text style={styles.title}>{item.title}</Text>

        {item.category ? (
          <Text style={styles.category}>Category: {item.category}</Text>
        ) : null}

        <Text style={styles.sectionLabel}>Your idea</Text>
        <View style={styles.bodyBox}>
          <Text style={styles.bodyText}>{item.body}</Text>
        </View>

        {item.bountyCents > 0 ? (
          <>
            <Text style={styles.sectionLabel}>Bounty</Text>
            <View style={[styles.bodyBox, styles.bountyBox]}>
              <Text style={styles.bountyAmount}>{ksh(item.bountyCents)}</Text>
              <Text style={styles.bountyStatus}>Status: {item.bountyStatus}</Text>
              {item.bountyStatus === 'PAID' ? (
                <Text style={styles.bountyNote}>This has been credited to your wallet.</Text>
              ) : item.bountyStatus === 'APPROVED' || item.bountyStatus === 'PENDING' ? (
                <Text style={styles.bountyNote}>Approved by the Prefect team. Payout processing.</Text>
              ) : null}
            </View>
          </>
        ) : null}

        {item.reviewNotes ? (
          <>
            <Text style={styles.sectionLabel}>Team notes</Text>
            <View style={styles.bodyBox}>
              <Text style={styles.bodyText}>{item.reviewNotes}</Text>
            </View>
          </>
        ) : null}

        <Text style={styles.filedAt}>Submitted {new Date(item.createdAt).toLocaleString()}</Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8F7F5' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginBottom: 12 },
  badgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  title: { color: '#1B2A4E', fontSize: 22, fontWeight: '700', marginBottom: 6 },
  category: { color: '#8A93A5', fontSize: 12, marginBottom: 8 },
  sectionLabel: { color: '#1B2A4E', fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginTop: 24, marginBottom: 8 },
  bodyBox: { backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1.5, borderColor: '#E8E6E1', padding: 14 },
  bodyText: { color: '#1B2A4E', fontSize: 14, lineHeight: 20 },
  bountyBox: { borderColor: '#C9A961' },
  bountyAmount: { color: '#1B2A4E', fontSize: 24, fontWeight: '700' },
  bountyStatus: { color: '#6B7383', fontSize: 12, marginTop: 4, textTransform: 'capitalize' },
  bountyNote: { color: '#8A93A5', fontSize: 12, marginTop: 8, lineHeight: 16 },
  filedAt: { color: '#B0B6C2', fontSize: 11, marginTop: 24, textAlign: 'center' },
  errorText: { color: '#A93B3B', fontSize: 14 },
});