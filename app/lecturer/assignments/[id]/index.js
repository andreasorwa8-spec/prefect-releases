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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '@/lib/api';

const STATUS_LABEL = {
  PENDING: 'Not submitted',
  SUBMITTED: 'Submitted',
  LATE: 'Late',
  MISSING: 'Missing',
  GRADED: 'Graded',
};

const STATUS_COLOR = {
  PENDING: '#8A93A5',
  SUBMITTED: '#2E7D5B',
  LATE: '#B8860B',
  MISSING: '#A93B3B',
  GRADED: '#1B2A4E',
};

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'ungraded', label: 'Ungraded' },
  { key: 'late', label: 'Late' },
  { key: 'missing', label: 'Missing' },
];

export default function AssignmentSubmissions() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('all');

  async function load() {
    try {
      setError('');
      const res = await api.get(`/api/assignments/${id}`);
      setAssignment(res.assignment);
    } catch (err) {
      setError(err.message || 'Failed to load');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { load(); }, [id]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [id]);

  function filterSubs(subs, t) {
    if (t === 'all') return subs;
    if (t === 'ungraded') return subs.filter((s) => s.status !== 'GRADED' && s.status !== 'PENDING');
    if (t === 'late') return subs.filter((s) => s.status === 'LATE');
    if (t === 'missing') return subs.filter((s) => s.status === 'MISSING' || s.status === 'PENDING');
    return subs;
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

  if (error || !assignment) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.scroll}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error || 'Assignment not found'}</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const submissions = assignment.submissions || [];
  const visible = filterSubs(submissions, tab);

  const counts = {
    all: submissions.length,
    ungraded: submissions.filter((s) => s.status !== 'GRADED' && s.status !== 'PENDING').length,
    late: submissions.filter((s) => s.status === 'LATE').length,
    missing: submissions.filter((s) => s.status === 'MISSING' || s.status === 'PENDING').length,
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#C9A961" />
        }
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>

        <Text style={styles.courseCode}>{assignment.course?.code}</Text>
        <Text style={styles.title}>{assignment.title}</Text>
        <Text style={styles.meta}>
          Due {new Date(assignment.dueAt).toLocaleString(undefined, {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
          })} · Max {assignment.maxScore}
        </Text>

        {!assignment.publishedAt ? (
          <View style={styles.draftBanner}>
            <Text style={styles.draftText}>DRAFT — students cannot see this yet</Text>
          </View>
        ) : null}

        <View style={styles.tabsRow}>
          {TABS.map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[styles.tab, tab === t.key && styles.tabActive]}
              onPress={() => setTab(t.key)}
            >
              <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>
                {t.label} ({counts[t.key]})
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {visible.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No submissions here</Text>
            <Text style={styles.emptyHint}>
              {tab === 'all'
                ? 'Students will appear here once they submit.'
                : `No submissions match the "${tab}" filter.`}
            </Text>
          </View>
        ) : (
          visible.map((s) => {
            const status = s.status || 'PENDING';
            return (
              <TouchableOpacity
                key={s.id}
                style={styles.row}
                activeOpacity={0.85}
                onPress={() => router.push(`/lecturer/submissions/${s.id}`)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.studentName} numberOfLines={1}>
                    {s.student?.name || s.student?.admissionNumber || 'Student'}
                  </Text>
                  <Text style={styles.studentMeta}>
                    {s.student?.admissionNumber || s.student?.email}
                  </Text>
                  <View style={styles.rowMeta}>
                    <View
                      style={[
                        styles.statusPill,
                        { backgroundColor: STATUS_COLOR[status] + '22' },
                      ]}
                    >
                      <Text style={[styles.statusText, { color: STATUS_COLOR[status] }]}>
                        {STATUS_LABEL[status]}
                      </Text>
                    </View>
                    {s.submittedAt ? (
                      <Text style={styles.submittedText}>
                        {new Date(s.submittedAt).toLocaleDateString(undefined, {
                          month: 'short', day: 'numeric',
                        })}
                      </Text>
                    ) : null}
                  </View>
                </View>

                {s.score != null ? (
                  <View style={styles.scoreBubble}>
                    <Text style={styles.scoreValue}>{s.score}</Text>
                    <Text style={styles.scoreMax}>/{assignment.maxScore}</Text>
                  </View>
                ) : (
                  <Text style={styles.chevron}>→</Text>
                )}
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
  scroll: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40 },
  backButton: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#E8E6E1', marginBottom: 20,
  },
  backText: { fontSize: 20, color: '#1B2A4E', fontWeight: '500' },
  courseCode: { color: '#C9A961', fontSize: 11, fontWeight: '700', letterSpacing: 2, marginBottom: 8 },
  title: { color: '#1B2A4E', fontSize: 24, fontWeight: '700', letterSpacing: -0.4, lineHeight: 32 },
  meta: { color: '#6B7383', fontSize: 13, marginTop: 6, marginBottom: 16 },
  draftBanner: {
    backgroundColor: '#F0EDE5', borderRadius: 12, padding: 12, marginBottom: 16,
  },
  draftText: { color: '#8A93A5', fontSize: 12, fontWeight: '600', letterSpacing: 0.5 },
  tabsRow: {
    flexDirection: 'row', marginBottom: 16,
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: 4,
    borderWidth: 1.5, borderColor: '#E8E6E1',
  },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  tabActive: { backgroundColor: '#1B2A4E' },
  tabText: { color: '#6B7383', fontSize: 11, fontWeight: '600' },
  tabTextActive: { color: '#F8F7F5' },
  errorBox: {
    backgroundColor: '#F5E5E5', borderRadius: 12, padding: 12, marginBottom: 16,
  },
  errorText: { color: '#A93B3B', fontSize: 13 },
  emptyBox: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 32,
    borderWidth: 1.5, borderColor: '#E8E6E1', alignItems: 'center',
  },
  emptyText: { color: '#1B2A4E', fontSize: 15, fontWeight: '600', marginBottom: 6 },
  emptyHint: { color: '#8A93A5', fontSize: 13, textAlign: 'center' },
  row: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 14,
    padding: 14, marginBottom: 10,
    borderWidth: 1.5, borderColor: '#E8E6E1',
  },
  studentName: { color: '#1B2A4E', fontSize: 15, fontWeight: '700' },
  studentMeta: { color: '#8A93A5', fontSize: 12, marginTop: 2 },
  rowMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
  submittedText: { color: '#8A93A5', fontSize: 11 },
  scoreBubble: {
    backgroundColor: '#EAF5EF', borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 8, marginLeft: 12,
    flexDirection: 'row', alignItems: 'baseline',
  },
  scoreValue: { color: '#2E7D5B', fontSize: 18, fontWeight: '700' },
  scoreMax: { color: '#2E7D5B', fontSize: 12, fontWeight: '600', marginLeft: 2 },
  chevron: { color: '#C9A961', fontSize: 18, fontWeight: '600', marginLeft: 12 },
});