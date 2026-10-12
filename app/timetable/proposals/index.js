import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '@/lib/api';

const STATUS_COLORS = {
  OPEN:     { bg: '#FFF5E5', text: '#B8860B', dot: '#C9A961' },
  APPROVED: { bg: '#EAF5EF', text: '#2E7D5B', dot: '#2E7D5B' },
  REJECTED: { bg: '#F5E5E5', text: '#A93B3B', dot: '#A93B3B' },
  EXPIRED:  { bg: '#F0EDE5', text: '#8A93A5', dot: '#8A93A5' },
};

const TYPE_LABELS = {
  TIME_SHIFT:    'Time change',
  ROOM_CHANGE:   'Room change',
  LECTURER_SWAP: 'Lecturer swap',
  DAY_CHANGE:    'Day change',
  CANCELLED:     'Cancellation',
};

export default function ProposalInbox() {
  const router = useRouter();
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('OPEN');

  async function load() {
    try {
      setError('');
      const url = filter === 'ALL'
        ? '/api/timetables/proposals'
        : `/api/timetables/proposals?status=${filter}`;
      const res = await api.get(url);
      setProposals(res.proposals || []);
    } catch (err) {
      setError(err.message || 'Failed to load proposals');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    setLoading(true);
    load();
  }, [filter]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [filter]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
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
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>

          <View style={styles.brandRow}>
            <View style={styles.brandDot} />
            <Text style={styles.brandText}>PROPOSALS</Text>
          </View>
          <Text style={styles.title}>Timetable changes</Text>
          <Text style={styles.subtitle}>
            Vote on proposed schedule changes for your courses
          </Text>
        </View>

        {/* Filter tabs */}
        <View style={styles.tabs}>
          {['OPEN', 'APPROVED', 'REJECTED', 'ALL'].map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.tab, filter === f && styles.tabActive]}
              onPress={() => setFilter(f)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, filter === f && styles.tabTextActive]}>
                {f.charAt(0) + f.slice(1).toLowerCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Empty state */}
        {proposals.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>
              {filter === 'OPEN' ? 'No active proposals' : 'Nothing here'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {filter === 'OPEN'
                ? 'When the AI finds a good schedule change, it will appear here for everyone to vote on.'
                : 'Try a different filter.'}
            </Text>
          </View>
        ) : (
          proposals.map(p => {
            const statusColor = STATUS_COLORS[p.status] || STATUS_COLORS.OPEN;
            const yesCount = p.votes.filter(v => v.vote === 'YES').length;
            const noCount = p.votes.filter(v => v.vote === 'NO').length;
            const totalVotes = yesCount + noCount;

            return (
              <TouchableOpacity
                key={p.id}
                style={styles.card}
                activeOpacity={0.85}
                onPress={() => router.push(`/timetable/proposals/${p.id}`)}
              >
                <View style={styles.cardHeader}>
                  <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
                    <View style={[styles.statusDot, { backgroundColor: statusColor.dot }]} />
                    <Text style={[styles.statusText, { color: statusColor.text }]}>
                      {p.status}
                    </Text>
                  </View>
                  <Text style={styles.typeLabel}>
                    {TYPE_LABELS[p.type] || p.type}
                  </Text>
                </View>

                <Text style={styles.courseCode}>{p.course?.code}</Text>
                <Text style={styles.courseName} numberOfLines={1}>
                  {p.course?.name}
                </Text>

                <Text style={styles.reason} numberOfLines={2}>
                  {p.reason}
                </Text>

                <View style={styles.cardFooter}>
                  <View style={styles.votesRow}>
                    <View style={styles.voteItem}>
                      <View style={[styles.voteDot, { backgroundColor: '#2E7D5B' }]} />
                      <Text style={styles.voteText}>{yesCount} yes</Text>
                    </View>
                    <View style={styles.voteItem}>
                      <View style={[styles.voteDot, { backgroundColor: '#A93B3B' }]} />
                      <Text style={styles.voteText}>{noCount} no</Text>
                    </View>
                  </View>
                  <Text style={styles.chevron}>→</Text>
                </View>
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
  scroll: { paddingTop: 8, paddingBottom: 40 },
  header: { paddingHorizontal: 20, marginBottom: 16 },
  backButton: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#E8E6E1', marginBottom: 20,
  },
  backText: { fontSize: 20, color: '#1B2A4E', fontWeight: '500' },
  brandRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  brandDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#C9A961', marginRight: 8 },
  brandText: { color: '#C9A961', fontSize: 11, fontWeight: '700', letterSpacing: 2 },
  title: { color: '#1B2A4E', fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  subtitle: { color: '#6B7383', fontSize: 14, marginTop: 4 },
  tabs: {
    flexDirection: 'row', marginHorizontal: 20, marginBottom: 20,
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: 4,
    borderWidth: 1.5, borderColor: '#E8E6E1',
  },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  tabActive: { backgroundColor: '#1B2A4E' },
  tabText: { color: '#6B7383', fontSize: 12, fontWeight: '600' },
  tabTextActive: { color: '#F8F7F5' },
  errorBox: {
    backgroundColor: '#F5E5E5', borderRadius: 12, padding: 12,
    marginHorizontal: 20, marginBottom: 16,
  },
  errorText: { color: '#A93B3B', fontSize: 13 },
  empty: {
    alignItems: 'center', paddingHorizontal: 40, paddingVertical: 60,
  },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#1B2A4E', marginBottom: 8 },
  emptySubtitle: {
    fontSize: 13, color: '#8A93A5', textAlign: 'center', lineHeight: 19,
  },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 18,
    padding: 18, marginHorizontal: 20, marginBottom: 12,
    borderWidth: 1.5, borderColor: '#E8E6E1',
  },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  statusText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },
  typeLabel: {
    fontSize: 10, fontWeight: '600', color: '#8A93A5',
    letterSpacing: 1, textTransform: 'uppercase',
  },
  courseCode: { color: '#1B2A4E', fontSize: 16, fontWeight: '700' },
  courseName: { color: '#6B7383', fontSize: 13, marginTop: 2 },
  reason: {
    color: '#6B7383', fontSize: 13, lineHeight: 19, marginTop: 12,
  },
  cardFooter: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginTop: 16, paddingTop: 14,
    borderTopWidth: 1, borderTopColor: '#F0EDE5',
  },
  votesRow: { flexDirection: 'row', gap: 16 },
  voteItem: { flexDirection: 'row', alignItems: 'center' },
  voteDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  voteText: { color: '#6B7383', fontSize: 12, fontWeight: '500' },
  chevron: { color: '#C9A961', fontSize: 18, fontWeight: '600' },
});