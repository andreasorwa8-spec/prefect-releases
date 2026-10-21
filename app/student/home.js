import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, SafeAreaView, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';

const ICON_QR = '\u{1F4F1}';
const ICON_CAL = '\u{1F4C5}';
const ICON_BALLOT = '\u{1F5F3}\uFE0F';
const ICON_MEMO = '\u{1F4DD}';
const ICON_TUBE = '\u{1F9EA}';
const ICON_CHART = '\u{1F4CA}';
const ICON_MEGA = '\u{1F4E2}';
const ICON_BULB = '\u{1F4A1}';
const ICON_CHAT = '💬';
const ICON_ARROW = '\u2192';

export default function StudentHome() {
  const { session, signOut } = useAuth();
  const router = useRouter();
  const [enrolled, setEnrolled] = useState([]);
  const [available, setAvailable] = useState([]);
  const [liveSessions, setLiveSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('enrolled');

  async function load() {
    try {
      setError('');
      const [coursesRes, sessionsRes] = await Promise.all([
        api.get('/api/courses'),
        api.get('/api/sessions/active'),
      ]);
      setEnrolled(coursesRes.enrolled || []);
      setAvailable(coursesRes.available || []);
      setLiveSessions(sessionsRes.sessions || []);
    } catch (err) {
      setError(err.message || 'Failed to load');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { load(); }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, []);

  async function registerForCourse(course) {
    Alert.alert(
      'Register for course',
      'Enroll in ' + course.code + ' ' + course.name + '?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Register',
          onPress: async () => {
            try {
              await api.post('/api/courses/' + course.id + '/register', {});
              Alert.alert('Success', 'You are now enrolled in ' + course.code);
              load();
            } catch (err) {
              Alert.alert('Error', err.message || 'Registration failed');
            }
          },
        },
      ]
    );
  }

  const firstName = (session?.user?.name || 'there').split(' ')[0];
  const avgAttendance = enrolled.length > 0
    ? Math.round(enrolled.reduce((sum, c) => sum + (c.attendancePercent || 0), 0) / enrolled.length)
    : 0;

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator color="#C9A961" />
        </View>
      </SafeAreaView>
    );
  }

  const tiles = [
    { route: '/chat', label: 'Chat', hint: 'Message students, lecturers and your department', icon: ICON_CHAT },
    { icon: ICON_QR, label: 'Prefect QR', hint: 'Create, print and scan QR codes', route: '/qr' },
    { icon: ICON_CAL, label: 'My Timetable', hint: 'Weekly class schedule', route: '/student/timetable' },
    { icon: ICON_BALLOT, label: 'Timetable Proposals', hint: 'Vote on changes', route: '/timetable/proposals' },
    { icon: ICON_MEMO, label: 'Assignments', hint: 'Submit your work', route: '/student/assignments' },
    { icon: ICON_TUBE, label: 'CATs', hint: 'Take tests', route: '/student/cats' },
    { icon: ICON_CHART, label: 'Your Progress', hint: 'See how you are doing', route: '/student/progress' },
    { icon: ICON_MEGA, label: 'Complaints', hint: 'Raise an issue', route: '/student/complaints' },
    { icon: ICON_BULB, label: 'Suggestions', hint: 'Earn a bounty', route: '/student/suggestions' },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#C9A961" />
        }
      >
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <View style={styles.brandDot} />
            <Text style={styles.brandText}>PREFECT</Text>
          </View>
          <Text style={styles.greeting}>Hi, {firstName}</Text>
          <Text style={styles.tagline}>
            {session?.user?.department?.name || 'Your attendance at a glance'}
          </Text>
        </View>

        <View style={styles.quickNav}>
          {tiles.map((t) => (
            <TouchableOpacity
              key={t.route}
              style={styles.quickNavBtn}
              onPress={() => router.push(t.route)}
              activeOpacity={0.85}
            >
              <View style={styles.quickNavIcon}>
                <Text style={styles.quickNavIconText}>{t.icon}</Text>
              </View>
              <View style={styles.quickNavBody}>
                <Text style={styles.quickNavLabel}>{t.label}</Text>
                <Text style={styles.quickNavHint}>{t.hint}</Text>
              </View>
              <Text style={styles.quickNavChevron}>{ICON_ARROW}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {liveSessions.length > 0 && (
          <View style={styles.liveSection}>
            <View style={styles.liveHeader}>
              <View style={styles.livePulse} />
              <Text style={styles.liveLabel}>LIVE NOW</Text>
            </View>
            {liveSessions.map((s) => (
              <TouchableOpacity
                key={s.id}
                style={styles.liveCard}
                activeOpacity={0.85}
                onPress={() => router.push('/student/checkin/' + s.id)}
              >
                <View style={styles.liveCardContent}>
                  <Text style={styles.liveCourseCode}>{s.courseCode}</Text>
                  <Text style={styles.liveCourseName} numberOfLines={1}>{s.courseName}</Text>
                  <Text style={styles.liveMeta}>
                    {s.lecturerName} {s.minutesRemaining} min left
                  </Text>
                </View>
                <View style={styles.liveAction}>
                  <Text style={styles.liveActionText}>
                    {s.hasCheckedIn ? 'Done' : 'Check in'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>COURSES</Text>
            <Text style={styles.statValue}>{enrolled.length}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>ATTENDANCE</Text>
            <Text style={styles.statValue}>{avgAttendance}%</Text>
          </View>
        </View>

        <View style={styles.tabsRow}>
          <TouchableOpacity
            style={[styles.tab, tab === 'enrolled' && styles.tabActive]}
            onPress={() => setTab('enrolled')}
          >
            <Text style={[styles.tabText, tab === 'enrolled' && styles.tabTextActive]}>
              My Courses ({enrolled.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, tab === 'available' && styles.tabActive]}
            onPress={() => setTab('available')}
          >
            <Text style={[styles.tabText, tab === 'available' && styles.tabTextActive]}>
              Available ({available.length})
            </Text>
          </TouchableOpacity>
        </View>

        {tab === 'enrolled' && (
          <View>
            {enrolled.length === 0 ? (
              <Text style={styles.emptyText}>You are not enrolled in any courses yet.</Text>
            ) : (
              enrolled.map((c) => {
                const pct = c.attendancePercent || 0;
                const isRisk = pct < 75;
                return (
                  <View key={c.id} style={styles.courseCard}>
                    <View style={styles.courseHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.courseCode}>{c.code}</Text>
                        <Text style={styles.courseName} numberOfLines={1}>{c.name}</Text>
                        {c.lecturer && (
                          <Text style={styles.courseLecturer}>
                            {c.lecturer.name || c.lecturer.email}
                          </Text>
                        )}
                      </View>
                      <Text style={[styles.coursePercent, isRisk && styles.coursePercentRisk]}>
                        {pct}%
                      </Text>
                    </View>
                    <View style={styles.progressTrack}>
                      <View
                        style={[
                          styles.progressFill,
                          { width: Math.min(100, pct) + '%' },
                          isRisk && styles.progressFillRisk,
                        ]}
                      />
                    </View>
                    {isRisk && (
                      <Text style={styles.riskText}>Below 75% - exam risk</Text>
                    )}
                  </View>
                );
              })
            )}
          </View>
        )}

        {tab === 'available' && (
          <View>
            {available.length === 0 ? (
              <Text style={styles.emptyText}>No available courses in your department.</Text>
            ) : (
              available.map((c) => (
                <View key={c.id} style={styles.courseCard}>
                  <View style={styles.courseHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.courseCode}>{c.code}</Text>
                      <Text style={styles.courseName} numberOfLines={1}>{c.name}</Text>
                      {c.lecturer && (
                        <Text style={styles.courseLecturer}>
                          {c.lecturer.name || c.lecturer.email}
                        </Text>
                      )}
                      <Text style={styles.courseEnrolled}>
                        {c.enrolledCount || 0} students enrolled
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.registerButton}
                    onPress={() => registerForCourse(c)}
                  >
                    <Text style={styles.registerButtonText}>Register</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        )}

        <TouchableOpacity onPress={signOut} style={styles.signOutButton}>
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8F7F5' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },
  header: { marginBottom: 24 },
  brandRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  brandDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#C9A961', marginRight: 8 },
  brandText: { color: '#C9A961', fontSize: 11, fontWeight: '700', letterSpacing: 2 },
  greeting: { color: '#1B2A4E', fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  tagline: { color: '#6B7383', fontSize: 14, marginTop: 4 },

  quickNav: { gap: 10, marginBottom: 24 },
  quickNavBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14,
    borderWidth: 1.5, borderColor: '#E8E6E1',
  },
  quickNavIcon: {
    width: 40, height: 40, borderRadius: 10, backgroundColor: '#F8F7F5',
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  quickNavIconText: { fontSize: 20 },
  quickNavBody: { flex: 1 },
  quickNavLabel: { color: '#1B2A4E', fontSize: 15, fontWeight: '700' },
  quickNavHint: { color: '#8A93A5', fontSize: 12, marginTop: 2 },
  quickNavChevron: { color: '#C9A961', fontSize: 22, fontWeight: '400', lineHeight: 22 },

  liveSection: { marginBottom: 24 },
  liveHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  livePulse: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2E7D5B', marginRight: 8 },
  liveLabel: { color: '#2E7D5B', fontSize: 11, fontWeight: '700', letterSpacing: 2 },
  liveCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, marginBottom: 10,
    borderWidth: 2, borderColor: '#2E7D5B',
    shadowColor: '#2E7D5B', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12, shadowRadius: 12, elevation: 3,
  },
  liveCardContent: { flex: 1 },
  liveCourseCode: { color: '#1B2A4E', fontSize: 15, fontWeight: '700' },
  liveCourseName: { color: '#6B7383', fontSize: 13, marginTop: 2 },
  liveMeta: { color: '#8A93A5', fontSize: 11, marginTop: 6 },
  liveAction: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#C9A961', borderRadius: 20, marginLeft: 12 },
  liveActionText: { color: '#1B2A4E', fontSize: 13, fontWeight: '700' },

  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, borderWidth: 1.5, borderColor: '#E8E6E1' },
  statLabel: { color: '#8A93A5', fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 8 },
  statValue: { color: '#1B2A4E', fontSize: 28, fontWeight: '700' },

  tabsRow: { flexDirection: 'row', marginBottom: 20, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 4, borderWidth: 1.5, borderColor: '#E8E6E1' },
  tab: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  tabActive: { backgroundColor: '#1B2A4E' },
  tabText: { color: '#6B7383', fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: '#F8F7F5' },

  courseCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1.5, borderColor: '#E8E6E1' },
  courseHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  courseCode: { color: '#1B2A4E', fontSize: 15, fontWeight: '700' },
  courseName: { color: '#6B7383', fontSize: 13, marginTop: 2 },
  courseLecturer: { color: '#8A93A5', fontSize: 11, marginTop: 2 },
  courseEnrolled: { color: '#8A93A5', fontSize: 11, marginTop: 4 },
  coursePercent: { color: '#2E7D5B', fontSize: 22, fontWeight: '700', marginLeft: 12 },
  coursePercentRisk: { color: '#B8860B' },
  progressTrack: { height: 6, borderRadius: 3, backgroundColor: '#F0EDE5', overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#2E7D5B', borderRadius: 3 },
  progressFillRisk: { backgroundColor: '#B8860B' },
  riskText: { color: '#B8860B', fontSize: 11, marginTop: 8, fontWeight: '500' },
  registerButton: { backgroundColor: '#C9A961', paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginTop: 12 },
  registerButtonText: { color: '#1B2A4E', fontSize: 14, fontWeight: '700' },
  emptyText: { color: '#8A93A5', fontSize: 14, textAlign: 'center', paddingVertical: 40 },
  errorBox: { backgroundColor: '#F5E5E5', borderRadius: 12, padding: 12, marginBottom: 16 },
  errorText: { color: '#A93B3B', fontSize: 13 },
  signOutButton: { marginTop: 20, paddingVertical: 16, alignItems: 'center' },
  signOutText: { color: '#8A93A5', fontSize: 13, fontWeight: '500' },
});
