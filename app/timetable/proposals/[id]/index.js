import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, SafeAreaView, Alert,
  TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

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

const DAY_NAMES = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function ProposalDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { session } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');

  async function load() {
    try {
      setError('');
      const res = await api.get(`/api/timetables/proposals/${id}`);
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to load');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [id]);

  async function vote(value) {
    setSubmitting(true);
    try {
      await api.post(`/api/timetables/proposals/${id}/vote`, {
        vote: value,
        comment: comment.trim() || null,
      });
      Alert.alert('Vote recorded', `You voted ${value}`);
      setComment('');
      await load();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to vote');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator color="#C9A961" />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !data) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.errorText}>{error || 'Proposal not found'}</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const { proposal, evaluation, myVote, enrolledCount } = data;
  const statusColor = STATUS_COLORS[proposal.status] || STATUS_COLORS.OPEN;
  const from = proposal.fromSlot || {};
  const to = proposal.toSlot || {};

  const canVote =
    proposal.status === 'OPEN' &&
    new Date(proposal.expiresAt) > new Date();

  const daysLeft = Math.max(
    0,
    Math.floor((new Date(proposal.expiresAt) - new Date()) / (1000 * 60 * 60 * 24))
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#C9A961" />
        }
      >
        {/* Back */}
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.brandRow}>
          <View style={styles.brandDot} />
          <Text style={styles.brandText}>{proposal.course?.code}</Text>
        </View>
        <Text style={styles.title}>{proposal.course?.name}</Text>
        <Text style={styles.subtitle}>Timetable change proposal</Text>

        {/* Status badge */}
        <View style={styles.headerMeta}>
          <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor.dot }]} />
            <Text style={[styles.statusText, { color: statusColor.text }]}>
              {proposal.status}
            </Text>
          </View>
          <Text style={styles.typeLabel}>{TYPE_LABELS[proposal.type] || proposal.type}</Text>
        </View>

        {/* Countdown */}
        {canVote && (
          <View style={styles.countdown}>
            <Text style={styles.countdownLabel}>VOTING CLOSES IN</Text>
            <Text style={styles.countdownValue}>{daysLeft} days</Text>
          </View>
        )}

        {/* Change comparison */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>The change</Text>

          <View style={styles.compare}>
            <View style={styles.compareSide}>
              <Text style={styles.compareLabel}>FROM</Text>
              <Text style={styles.compareDay}>{DAY_NAMES[from.day]}</Text>
              <Text style={styles.compareTime}>{from.startTime}–{from.endTime}</Text>
              <Text style={styles.compareRoom}>{from.roomName || 'N/A'}</Text>
            </View>

            <Text style={styles.compareArrow}>→</Text>

            <View style={styles.compareSide}>
              <Text style={styles.compareLabel}>TO</Text>
              <Text style={styles.compareDay}>{DAY_NAMES[to.day]}</Text>
              <Text style={styles.compareTime}>{to.startTime}–{to.endTime}</Text>
              <Text style={styles.compareRoom}>{to.roomName || 'N/A'}</Text>
            </View>
          </View>

          <View style={styles.reasonBox}>
            <Text style={styles.reasonLabel}>WHY</Text>
            <Text style={styles.reasonText}>{proposal.reason}</Text>
          </View>

          {proposal.expectedImpact && (
            <View style={styles.impactBox}>
              <Text style={styles.impactLabel}>EXPECTED IMPACT</Text>
              <Text style={styles.impactText}>{proposal.expectedImpact}</Text>
            </View>
          )}
        </View>

        {/* Tally */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Current tally</Text>

          {evaluation?.tally?.byRole ? (
            Object.entries(evaluation.tally.byRole).map(([role, counts]) => (
              <View key={role} style={styles.tallyRow}>
                <Text style={styles.tallyRole}>{role}</Text>
                <View style={styles.tallyBar}>
                  <View
                    style={[
                      styles.tallyBarYes,
                      { flex: counts.yes || 0 },
                    ]}
                  />
                  <View
                    style={[
                      styles.tallyBarNo,
                      { flex: counts.no || 0 },
                    ]}
                  />
                  <View style={{ flex: 1 }} />
                </View>
                <Text style={styles.tallyCount}>
                  {counts.yes || 0} / {counts.no || 0}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.noVotes}>No votes yet. Be the first!</Text>
          )}

          {/* Blockers */}
          {evaluation?.blockers?.length > 0 && (
            <View style={styles.blockersBox}>
              {evaluation.blockers.map((b, i) => (
                <Text key={i} style={styles.blockerText}>⚠ {b}</Text>
              ))}
            </View>
          )}
        </View>

        {/* Voting */}
        {canVote && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>
              {myVote ? 'Change your vote' : 'Cast your vote'}
            </Text>

            {myVote && (
              <View style={styles.myVoteBanner}>
                <Text style={styles.myVoteText}>
                  You voted: <Text style={styles.myVoteValue}>{myVote.vote}</Text>
                </Text>
              </View>
            )}

            <TextInput
              style={styles.commentInput}
              placeholder="Add a comment (optional)"
              placeholderTextColor="#9AA2B1"
              value={comment}
              onChangeText={setComment}
              multiline
              numberOfLines={3}
              editable={!submitting}
            />

            <View style={styles.voteButtons}>
              <TouchableOpacity
                style={[styles.voteBtn, styles.voteYes]}
                onPress={() => vote('YES')}
                disabled={submitting}
                activeOpacity={0.85}
              >
                <Text style={styles.voteBtnText}>✓ Yes</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.voteBtn, styles.voteNo]}
                onPress={() => vote('NO')}
                disabled={submitting}
                activeOpacity={0.85}
              >
                <Text style={styles.voteBtnText}>✕ No</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.voteBtn, styles.voteAbstain]}
                onPress={() => vote('ABSTAIN')}
                disabled={submitting}
                activeOpacity={0.85}
              >
                <Text style={[styles.voteBtnText, { color: '#6B7383' }]}>—</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.voteHint}>
              Students: {enrolledCount} enrolled · Quorum {proposal.quorumPercent}% · Approval {proposal.approvalPercent}%
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8F7F5' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  scroll: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40 },
  backButton: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#E8E6E1', marginBottom: 20,
  },
  backText: { fontSize: 20, color: '#1B2A4E', fontWeight: '500' },
  brandRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  brandDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#C9A961', marginRight: 8 },
  brandText: { color: '#C9A961', fontSize: 12, fontWeight: '700', letterSpacing: 2 },
  title: { color: '#1B2A4E', fontSize: 26, fontWeight: '700', letterSpacing: -0.5 },
  subtitle: { color: '#8A93A5', fontSize: 13, marginTop: 4, marginBottom: 20 },
  headerMeta: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 20,
  },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 5, paddingHorizontal: 12, borderRadius: 14,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  statusText: { fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  typeLabel: {
    fontSize: 10, fontWeight: '600', color: '#8A93A5',
    letterSpacing: 1, textTransform: 'uppercase',
  },
  countdown: {
    backgroundColor: '#FFF5E5',
    borderRadius: 12, padding: 16, marginBottom: 20,
    borderWidth: 1, borderColor: '#C9A961',
    alignItems: 'center',
  },
  countdownLabel: { color: '#B8860B', fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
  countdownValue: { color: '#1B2A4E', fontSize: 24, fontWeight: '700', marginTop: 4 },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 18,
    padding: 20, marginBottom: 16,
    borderWidth: 1.5, borderColor: '#E8E6E1',
  },
  sectionTitle: {
    color: '#C9A961', fontSize: 11, fontWeight: '700',
    letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16,
  },
  compare: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 20,
  },
  compareSide: { flex: 1 },
  compareLabel: {
    color: '#8A93A5', fontSize: 10, fontWeight: '700',
    letterSpacing: 1, marginBottom: 8,
  },
  compareDay: { color: '#1B2A4E', fontSize: 16, fontWeight: '700' },
  compareTime: { color: '#1B2A4E', fontSize: 14, fontWeight: '500', marginTop: 4 },
  compareRoom: { color: '#8A93A5', fontSize: 12, marginTop: 4 },
  compareArrow: { color: '#C9A961', fontSize: 24, fontWeight: '600', paddingHorizontal: 8 },
  reasonBox: {
    backgroundColor: '#F8F7F5', borderRadius: 12, padding: 14, marginBottom: 12,
  },
  reasonLabel: {
    color: '#8A93A5', fontSize: 10, fontWeight: '700',
    letterSpacing: 1, marginBottom: 6,
  },
  reasonText: { color: '#14192B', fontSize: 14, lineHeight: 20 },
  impactBox: {
    backgroundColor: '#EAF5EF', borderRadius: 12, padding: 14,
    borderLeftWidth: 3, borderLeftColor: '#2E7D5B',
  },
  impactLabel: {
    color: '#2E7D5B', fontSize: 10, fontWeight: '700',
    letterSpacing: 1, marginBottom: 6,
  },
  impactText: { color: '#2E7D5B', fontSize: 14, lineHeight: 20, fontWeight: '500' },
  tallyRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  tallyRole: {
    width: 100, fontSize: 11, fontWeight: '600',
    color: '#6B7383', textTransform: 'capitalize',
  },
  tallyBar: {
    flex: 1, height: 8, backgroundColor: '#F0EDE5',
    borderRadius: 4, flexDirection: 'row', overflow: 'hidden',
    marginHorizontal: 12,
  },
  tallyBarYes: { backgroundColor: '#2E7D5B' },
  tallyBarNo: { backgroundColor: '#A93B3B' },
  tallyCount: { color: '#1B2A4E', fontSize: 11, fontWeight: '700' },
  noVotes: { color: '#8A93A5', fontSize: 13, fontStyle: 'italic' },
  blockersBox: {
    marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F0EDE5',
  },
  blockerText: { color: '#B8860B', fontSize: 12, marginBottom: 4, fontWeight: '500' },
  myVoteBanner: {
    backgroundColor: '#F8F7F5', borderRadius: 10, padding: 12,
    marginBottom: 12, alignItems: 'center',
  },
  myVoteText: { color: '#6B7383', fontSize: 13 },
  myVoteValue: { color: '#1B2A4E', fontWeight: '700' },
  commentInput: {
    backgroundColor: '#F8F7F5', borderRadius: 12, padding: 14,
    color: '#14192B', fontSize: 14, minHeight: 80,
    textAlignVertical: 'top', marginBottom: 16,
  },
  voteButtons: { flexDirection: 'row', gap: 10 },
  voteBtn: {
    flex: 1, paddingVertical: 16, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  voteYes: { backgroundColor: '#2E7D5B' },
  voteNo: { backgroundColor: '#A93B3B' },
  voteAbstain: { backgroundColor: '#F0EDE5' },
  voteBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  voteHint: {
    color: '#8A93A5', fontSize: 11, marginTop: 14,
    textAlign: 'center', lineHeight: 16,
  },
  errorText: { color: '#A93B3B', fontSize: 14, marginBottom: 20, textAlign: 'center' },
  backBtn: {
    paddingVertical: 12, paddingHorizontal: 24,
    backgroundColor: '#1B2A4E', borderRadius: 12,
  },
  backBtnText: { color: '#F8F7F5', fontSize: 14, fontWeight: '600' },
});