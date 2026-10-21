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

const STATUS_LABEL = {
  PENDING: 'Not started',
  SUBMITTED: 'Submitted',
  LATE: 'Submitted late',
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

export default function StudentAssignments() {
  const router = useRouter();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    try {
      setError('');
      const res = await api.get('/api/assignments/me');
      setAssignments(res.assignments || []);
    } catch (err) {
      setError(err.message || 'Failed to load assignments');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, []);

  function formatDue(dateStr) {
    const d = new Date(dateStr);
    const now = new Date();
    const days = Math.round((d - now) / (1000 * 60 * 60 * 24));
    const label = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    if (days < 0) return `Overdue Â· ${label}`;
    if (days === 0) return `Due today`;
    if (days === 1) return `Due tomorrow`;
    if (days < 7) return `Due in ${days} days`;
    return `Due ${label}`;
  }

  function isOverdue(a) {
    return new Date(a.dueAt) < new Date() && a.mySubmission?.status !== 'SUBMITTED' && a.mySubmission?.status !== 'GRADED';
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

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#C9A961" />
        }
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>â†</Text>
          </TouchableOpacity>

          <View style={styles.brandRow}>
            <View style={styles.brandDot} />
            <Text style={styles.brandText}>ASSIGNMENTS</Text>
          </View>
          <Text style={styles.title}>Your work</Text>
          <Text style={styles.subtitle}>
            {assignments.length} assignment{assignments.length === 1 ? '' : 's'} across your courses
          </Text>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {assignments.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No assignments yet</Text>
            <Text style={styles.emptyHint}>
              When your lecturers post work, it will appear here.
            </Text>
          </View>
        ) : (
          assignments.map((a) => {
            const status = a.mySubmission?.status || 'PENDING';
            const overdue = isOverdue(a);
            return (
              <TouchableOpacity
                key={a.id}
                style={[styles.card, overdue && styles.cardOverdue]}
                activeOpacity={0.85}
                onPress={() => router.push(`/student/assignments/${a.id}`)}
              >
                <View style={styles.cardTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.courseCode}>{a.course?.code}</Text>
                    <Text style={styles.cardTitle} numberOfLines={2}>{a.title}</Text>
                    <Text style={styles.courseName} numberOfLines={1}>
                      {a.course?.name}
                    </Text>
                  </View>
                  {a.mySubmission?.score != null ? (
                    <View style={styles.scoreBubble}>
                      <Text style={styles.scoreValue}>
                        {a.mySubmission.score}
                      </Text>
                      <Text style={styles.scoreMax}>/{a.maxScore}</Text>
                    </View>
                  ) : null}
                </View>

                <View style={styles.cardFooter}>
                  <View
                    style={[
                      styles.statusPill,
                      { backgroundColor: `${STATUS_COLOR[status]}22` },
                    ]}
                  >
                    <Text style={[styles.statusText, { color: STATUS_COLOR[status] }]}>
                      {STATUS_LABEL[status]}
                    </Text>
                  </View>
                  <Text style={[styles.dueText, overdue && styles.dueTextOverdue]}>
                    {formatDue(a.dueAt)}
                  </Text>
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
  scroll: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40 },
  header: { marginBottom: 20 },
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
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16,
    marginBottom: 12, borderWidth: 1.5, borderColor: '#E8E6E1',
  },
  cardOverdue: { borderColor: '#B8860B' },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  courseCode: { color: '#C9A961', fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 4 },
  cardTitle: { color: '#1B2A4E', fontSize: 16, fontWeight: '700', lineHeight: 22 },
  courseName: { color: '#8A93A5', fontSize: 12, marginTop: 4 },
  scoreBubble: {
    backgroundColor: '#EAF5EF', borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 8, marginLeft: 12,
    flexDirection: 'row', alignItems: 'baseline',
  },
  scoreValue: { color: '#2E7D5B', fontSize: 18, fontWeight: '700' },
  scoreMax: { color: '#2E7D5B', fontSize: 12, fontWeight: '600', marginLeft: 2 },
  cardFooter: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderTopWidth: 1, borderTopColor: '#F0EDE5', paddingTop: 12,
  },
  statusPill: {
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12,
  },
  statusText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
  dueText: { color: '#8A93A5', fontSize: 12, fontWeight: '500' },
  dueTextOverdue: { color: '#B8860B', fontWeight: '700' },
});
