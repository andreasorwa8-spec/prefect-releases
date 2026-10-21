import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '@/lib/api';

const STATUS_TONE = {
  SUBMITTED: { bg: '#E4EEF9', fg: '#2A4B7C' },
  UNDER_REVIEW: { bg: '#F5EAD2', fg: '#8A6D2A' },
  ACCEPTED: { bg: '#E1F1EB', fg: '#1A7A5E' },
  SHIPPED: { bg: '#DCEFE0', fg: '#1F6B3A' },
  REJECTED: { bg: '#F0EDE5', fg: '#6B7383' },
};

const BOUNTY_TONE = {
  NONE: null,
  PENDING: { bg: '#F5EAD2', fg: '#8A6D2A', label: 'Bounty pending' },
  APPROVED: { bg: '#E4EEF9', fg: '#2A4B7C', label: 'Bounty approved' },
  PAID: { bg: '#E1F1EB', fg: '#1A7A5E', label: 'Bounty paid' },
  REJECTED: { bg: '#F0EDE5', fg: '#6B7383', label: 'Bounty declined' },
};

function ksh(cents) {
  return 'KSh ' + (cents / 100).toFixed(2);
}

export default function SuggestionsList() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    try {
      setError('');
      const res = await api.get('/api/suggestions');
      setItems(res.suggestions || []);
    } catch (err) {
      setError(err.message || 'Failed to load');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { load(); }, []);
  const onRefresh = useCallback(() => { setRefreshing(true); load(); }, []);

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
          <View>
            <Text style={styles.title}>Suggestions</Text>
            <Text style={styles.subtitle}>
              Share ideas to improve Prefect. Accepted ideas can earn a bounty.
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.newBtn}
          onPress={() => router.push('/student/suggestions/new')}
          activeOpacity={0.85}
        >
          <Text style={styles.newBtnText}>+ New suggestion</Text>
        </TouchableOpacity>

        {error ? (
          <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View>
        ) : null}

        {items.length === 0 ? (
          <Text style={styles.emptyText}>You have not submitted any suggestions yet.</Text>
        ) : (
          items.map((s) => {
            const tone = STATUS_TONE[s.status] || STATUS_TONE.SUBMITTED;
            const bTone = BOUNTY_TONE[s.bountyStatus];
            return (
              <TouchableOpacity
                key={s.id}
                style={styles.card}
                onPress={() => router.push(`/student/suggestions/${s.id}`)}
                activeOpacity={0.85}
              >
                <View style={styles.cardTop}>
                  <Text style={styles.cardSubject} numberOfLines={2}>{s.title}</Text>
                  <View style={[styles.badge, { backgroundColor: tone.bg }]}>
                    <Text style={[styles.badgeText, { color: tone.fg }]}>
                      {s.status.replace('_', ' ')}
                    </Text>
                  </View>
                </View>

                {bTone ? (
                  <View style={[styles.badge, { backgroundColor: bTone.bg, marginTop: 8, alignSelf: 'flex-start' }]}>
                    <Text style={[styles.badgeText, { color: bTone.fg }]}>
                      {bTone.label}
                      {s.bountyCents > 0 ? ' - ' + ksh(s.bountyCents) : ''}
                    </Text>
                  </View>
                ) : null}

                <Text style={styles.cardTime}>{new Date(s.createdAt).toDateString()}</Text>
              </TouchableOpacity>
            );
          })
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8F7F5' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },
  headerRow: { marginBottom: 16 },
  title: { color: '#1B2A4E', fontSize: 26, fontWeight: '700', letterSpacing: -0.4 },
  subtitle: { color: '#6B7383', fontSize: 13, marginTop: 4 },
  newBtn: { backgroundColor: '#1B2A4E', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginBottom: 20 },
  newBtnText: { color: '#F8F7F5', fontSize: 14, fontWeight: '700' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1.5, borderColor: '#E8E6E1' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  cardSubject: { color: '#1B2A4E', fontSize: 15, fontWeight: '700', flex: 1 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  cardTime: { color: '#B0B6C2', fontSize: 11, marginTop: 8 },
  emptyText: { color: '#8A93A5', fontSize: 14, textAlign: 'center', paddingVertical: 40 },
  errorBox: { backgroundColor: '#F5E5E5', borderRadius: 12, padding: 12, marginBottom: 16 },
  errorText: { color: '#A93B3B', fontSize: 13 },
});