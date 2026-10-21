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
  IN_PROGRESS: 'In progress',
  SUBMITTED: 'Submitted',
  AUTO_SUBMITTED: 'Auto-submitted',
  GRADED: 'Graded',
};

const STATUS_COLOR = {
  IN_PROGRESS: '#C9A961',
  SUBMITTED: '#2E7D5B',
  AUTO_SUBMITTED: '#B8860B',
  GRADED: '#1B2A4E',
};

const REASON_LABEL = {
  MANUAL: 'Submitted',
  LEFT_APP: 'Left the app',
  HEARTBEAT_LOST: 'Lost connection',
  TIMEOUT: 'Time ran out',
};

export default function CATDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [cat, setCat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    try {
      setError('');
      const res = await api.get(`/api/cats/${id}`);
      setCat(res.cat);
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

  async function publishCAT() {
    try {
      await api.patch(`/api/cats/${id}`, { publish: true });
      load();
    } catch (err) {
      setError(err.message || 'Publish failed');
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

  if (error && !cat) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.scroll}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const attempts = cat.attempts || [];
  const now = new Date();
  const windowOpen = now >= new Date(cat.windowStart) && now <= new Date(cat.windowEnd);

  const stats = {
    total: attempts.length,
    submitted: attempts.filter((a) => a.status === 'SUBMITTED' || a.status === 'GRADED').length,
    auto: attempts.filter((a) => a.status === 'AUTO_SUBMITTED').length,
    inProgress: attempts.filter((a) => a.status === 'IN_PROGRESS').length,
    avgScore:
      attempts.filter((a) => a.score != null).length > 0
        ? Math.round(
            attempts
              .filter((a) => a.score != null)
              .reduce((sum, a) => sum + a.score, 0) /
              attempts.filter((a) => a.score != null).length
          )
        : null,
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

        <Text style={styles.courseCode}>{cat.course?.code}</Text>
        <Text style={styles.title}>{cat.title}</Text>
        <Text style={styles.meta}>
          {cat.durationMin} min · {cat.questions?.length || 0} question{cat.questions?.length === 1 ? '' : 's'} · Max {cat.maxScore}
        </Text>

        {!cat.publishedAt ? (
          <TouchableOpacity
            style={styles.publishBanner}
            onPress={publishCAT}
            activeOpacity={0.85}
          >
            <Text style={styles.publishText}>
              DRAFT — tap to publish to students
            </Text>
          </TouchableOpacity>
        ) : windowOpen ? (
          <View style={styles.liveBanner}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>OPEN NOW</Text>
          </View>
        ) : null}

        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>ATTEMPTS</Text>
            <Text style={styles.statValue}>{stats.total}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>SUBMITTED</Text>
            <Text style={styles.statValue}>{stats.submitted}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>IN PROGRESS</Text>
            <Text style={styles.statValue}>{stats.inProgress}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>AUTO</Text>
            <Text style={styles.statValue}>{stats.auto}</Text>
          </View>
        </View>

        {stats.avgScore !== null ? (
          <View style={styles.avgBox}>
            <Text style={styles.avgLabel}>AVERAGE SCORE</Text>
            <Text style={styles.avgValue}>{stats.avgScore} / {cat.maxScore}</Text>
          </View>
        ) : null}

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>ATTEMPTS</Text>
          <Text style={styles.sectionCount}>{attempts.length}</Text>
        </View>

        {attempts.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No attempts yet</Text>
            <Text style={styles.emptyHint}>
              Students appear here once they start the CAT.
            </Text>
          </View>
        ) : (
          attempts.map((a) => {
            const status = a.status || 'IN_PROGRESS';
            return (
              <View key={a.id} style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.studentName} numberOfLines={1}>
                    {a.student?.name || a.student?.admissionNumber || 'Student'}
                  </Text>
                  <Text style={styles.studentMeta}>
                    {a.student?.admissionNumber || a.student?.email}
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
                    {a.submitReason ? (
                      <Text style={styles.reasonText}>
                        {REASON_LABEL[a.submitReason] || a.submitReason}
                      </Text>
                    ) : null}
                  </View>
                  {a.submittedAt ? (
                    <Text style={styles.timeText}>
                      {new Date(a.submittedAt).toLocaleString(undefined, {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                      })}
                    </Text>
                  ) : null}
                </View>
                {a.score != null ? (
                  <View style={styles.scoreBubble}>
                    <Text style={styles.scoreValue}>{a.score}</Text>
                    <Text style={styles.scoreMax}>/{cat.maxScore}</Text>
                  </View>
                ) : null}
              </View>
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
  courseCode: { color: '#C9A961', fontSize: 11, fontWeight: '700', letterSpacing: 2, marginBottom: 6 },
  title: { color: '#1B2A4E', fontSize: 24, fontWeight: '700', letterSpacing: -0.4, lineHeight: 32 },
  meta: { color: '#6B7383', fontSize: 13, marginTop: 6, marginBottom: 16 },
  publishBanner: {
    backgroundColor: '#F0EDE5', borderRadius: 12, padding: 14,
    borderWidth: 1.5, borderColor: '#C9A961', marginBottom: 16,
  },
  publishText: { color: '#C9A961', fontSize: 13, fontWeight: '700', textAlign: 'center' },
  liveBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#EAF5EF', borderRadius: 12, padding: 12,
    borderWidth: 1.5, borderColor: '#2E7D5B', marginBottom: 16,
  },
  liveDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: '#2E7D5B', marginRight: 8,
  },
  liveText: { color: '#2E7D5B', fontSize: 11, fontWeight: '700', letterSpacing: 2 },
  statsGrid: {
    flexDirection: 'row', gap: 8, marginBottom: 16,
  },
  statBox: {
    flex: 1, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12,
    borderWidth: 1.5, borderColor: '#E8E6E1',
  },
  statLabel: { color: '#8A93A5', fontSize: 9, fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
  statValue: { color: '#1B2A4E', fontSize: 20, fontWeight: '700' },
  avgBox: {
    backgroundColor: '#EAF5EF', borderRadius: 12, padding: 14,
    borderWidth: 1.5, borderColor: '#2E7D5B', marginBottom: 20,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  avgLabel: { color: '#2E7D5B', fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },
  avgValue: { color: '#2E7D5B', fontSize: 22, fontWeight: '700' },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionLabel: { color: '#C9A961', fontSize: 11, fontWeight: '700', letterSpacing: 2 },
  sectionCount: { color: '#8A93A5', fontSize: 12, fontWeight: '600' },
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
  reasonText: { color: '#8A93A5', fontSize: 11 },
  timeText: { color: '#8A93A5', fontSize: 11, marginTop: 4 },
  scoreBubble: {
    backgroundColor: '#EAF5EF', borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 8, marginLeft: 12,
    flexDirection: 'row', alignItems: 'baseline',
  },
  scoreValue: { color: '#2E7D5B', fontSize: 18, fontWeight: '700' },
  scoreMax: { color: '#2E7D5B', fontSize: 12, fontWeight: '600', marginLeft: 2 },
  errorBox: {
    backgroundColor: '#F5E5E5', borderRadius: 12, padding: 12, marginBottom: 16,
  },
  errorText: { color: '#A93B3B', fontSize: 13 },
});