import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { api } from '@/lib/api';
import SessionStartModal from '@/components/SessionStartModal';
import LiveSessionCard from '@/components/LiveSessionCard';

export default function CourseDetail() {
  const { id } = useLocalSearchParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('students');
  const [startModalOpen, setStartModalOpen] = useState(false);
  const [starting, setStarting] = useState(false);
  const [wallet, setWallet] = useState({ balanceCents: 0 });

  useEffect(() => {
    load();
  }, [id]);

  async function load() {
    try {
      setError('');
      const [courseRes, walletRes] = await Promise.all([
        api.get(`/api/lecturer/courses/${id}`),
        api.get('/api/wallet'),
      ]);
      setData(courseRes);
      setWallet(walletRes);
    } catch (err) {
      setError(err.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  async function startSession(duration) {
    setStarting(true);
    try {
      await api.post('/api/sessions/start', {
        courseId: id,
        durationMinutes: duration,
      });
      setStartModalOpen(false);
      await load();
    } catch (err) {
      setError(err.message || 'Failed to start session');
      setStartModalOpen(false);
    } finally {
      setStarting(false);
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
          <Text style={styles.errorText}>{error || 'Course not found'}</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const course = data.course;
  const students = data.students || [];
  const sessions = data.sessions || [];
  const activeSession = data.activeSession;

  const atRisk = students.filter((s) => s.attendancePercent < 75);
  const avgAttendance =
    students.length > 0
      ? Math.round(students.reduce((sum, s) => sum + s.attendancePercent, 0) / students.length)
      : 0;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>

        <View style={styles.brandRow}>
          <View style={styles.brandDot} />
          <Text style={styles.brandText}>{course.code}</Text>
        </View>

        <Text style={styles.title}>{course.name}</Text>
        <Text style={styles.subtitle}>
          {course.departmentName || 'Department'} · {course.semester || 'Semester'}
        </Text>

        {activeSession ? (
          <LiveSessionCard
            sessionId={activeSession.id}
            onEnded={load}
          />
        ) : (
          <TouchableOpacity
            style={styles.startSessionBtn}
            onPress={() => setStartModalOpen(true)}
            activeOpacity={0.85}
          >
            <Text style={styles.startSessionText}>Start session · KSh 10</Text>
          </TouchableOpacity>
        )}

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>STUDENTS</Text>
            <Text style={styles.statValue}>{course.studentCount}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>SESSIONS</Text>
            <Text style={styles.statValue}>{course.sessionsCount}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>AVG ATT.</Text>
            <Text style={[styles.statValue, avgAttendance < 75 && styles.statValueRisk]}>
              {avgAttendance}%
            </Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsRow}>
          <TouchableOpacity
            style={[styles.tab, tab === 'students' && styles.tabActive]}
            onPress={() => setTab('students')}
          >
            <Text style={[styles.tabText, tab === 'students' && styles.tabTextActive]}>
              Students ({students.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, tab === 'sessions' && styles.tabActive]}
            onPress={() => setTab('sessions')}
          >
            <Text style={[styles.tabText, tab === 'sessions' && styles.tabTextActive]}>
              Sessions ({sessions.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Students tab */}
        {tab === 'students' && (
          <>
            {atRisk.length > 0 && (
              <View style={styles.riskBanner}>
                <Text style={styles.riskText}>
                  ⚠ {atRisk.length} student{atRisk.length > 1 ? 's' : ''} below 75%
                </Text>
              </View>
            )}

            {students.length === 0 ? (
              <Text style={styles.emptyText}>No students enrolled yet.</Text>
            ) : (
              students.map((s) => {
                const isRisk = s.attendancePercent < 75;
                return (
                  <View key={s.id} style={styles.studentRow}>
                    <View style={styles.studentInfo}>
                      <Text style={styles.studentName}>{s.name}</Text>
                      <Text style={styles.studentMeta}>
                        {s.admissionNumber || s.email}
                      </Text>
                    </View>
                    <View style={styles.studentRight}>
                      <Text style={[styles.studentPercent, isRisk && styles.studentPercentRisk]}>
                        {s.attendancePercent}%
                      </Text>
                      <Text style={styles.studentAttendance}>
                        {s.attended}/{s.totalSessions}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </>
        )}

        {/* Sessions tab */}
        {tab === 'sessions' && (
          <>
            {sessions.length === 0 ? (
              <Text style={styles.emptyText}>No sessions yet.</Text>
            ) : (
              sessions.map((s) => (
                <View key={s.id} style={styles.sessionRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sessionDate}>
                      {new Date(s.startedAt).toLocaleDateString()} at{' '}
                      {new Date(s.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                    <Text style={styles.sessionMeta}>
                      {s.status} · {Math.round((new Date(s.endsAt) - new Date(s.startedAt)) / 60000)} min
                    </Text>
                  </View>
                  <View style={styles.sessionRight}>
                    <Text style={styles.sessionCheckIns}>{s.checkInsCount}</Text>
                    <Text style={styles.sessionCheckInsLabel}>checked in</Text>
                  </View>
                </View>
              ))
            )}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      <SessionStartModal
        visible={startModalOpen}
        onClose={() => setStartModalOpen(false)}
        onStart={startSession}
        courseName={course.name}
        courseCode={course.code}
        walletBalanceCents={wallet.balanceCents || 0}
        busy={starting}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8F7F5' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  scroll: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },
  back: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#E8E6E1',
    marginBottom: 20,
  },
  backText: { fontSize: 20, color: '#1B2A4E', fontWeight: '500' },
  brandRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  brandDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#C9A961',
    marginRight: 8,
  },
  brandText: {
    color: '#C9A961',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
  },
  title: {
    color: '#1B2A4E',
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  subtitle: { color: '#8A93A5', fontSize: 13, marginTop: 4, marginBottom: 20 },
  liveBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAF5EF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2E7D5B',
    marginBottom: 16,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2E7D5B',
    marginRight: 10,
  },
  liveText: {
    color: '#2E7D5B',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#E8E6E1',
  },
  statLabel: {
    color: '#8A93A5',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 6,
  },
  statValue: { color: '#1B2A4E', fontSize: 22, fontWeight: '700' },
  statValueRisk: { color: '#B8860B' },
  tabsRow: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1.5,
    borderColor: '#E8E6E1',
  },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  tabActive: { backgroundColor: '#1B2A4E' },
  tabText: { color: '#6B7383', fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: '#F8F7F5' },
  riskBanner: {
    backgroundColor: '#FEF3E2',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#B8860B',
  },
  riskText: { color: '#B8860B', fontSize: 12, fontWeight: '600' },
  emptyText: {
    color: '#8A93A5',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 40,
  },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E8E6E1',
  },
  studentInfo: { flex: 1 },
  studentName: { color: '#1B2A4E', fontSize: 14, fontWeight: '600' },
  studentMeta: { color: '#8A93A5', fontSize: 11, marginTop: 2 },
  studentRight: { alignItems: 'flex-end' },
  studentPercent: {
    color: '#2E7D5B',
    fontSize: 18,
    fontWeight: '700',
  },
  studentPercentRisk: { color: '#B8860B' },
  studentAttendance: {
    color: '#8A93A5',
    fontSize: 10,
    marginTop: 2,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E8E6E1',
  },
  sessionDate: { color: '#1B2A4E', fontSize: 13, fontWeight: '600' },
  sessionMeta: { color: '#8A93A5', fontSize: 11, marginTop: 2 },
  sessionRight: { alignItems: 'flex-end' },
  sessionCheckIns: { color: '#1B2A4E', fontSize: 18, fontWeight: '700' },
  sessionCheckInsLabel: { color: '#8A93A5', fontSize: 10 },
  errorText: { color: '#A93B3B', fontSize: 14, marginBottom: 16 },
  backBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#1B2A4E',
    borderRadius: 12,
  },
  backBtnText: { color: '#F8F7F5', fontSize: 14, fontWeight: '600' },
    startSessionBtn: {
    backgroundColor: '#1B2A4E',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 20,
    shadowColor: '#1B2A4E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 5,
  },
  startSessionText: {
    color: '#F8F7F5',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});