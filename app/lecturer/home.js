import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';

const ICON_QR = '\u{1F4F1}';
const ICON_CHAT = '💬';
const ICON_JOB = '💼';
const ICON_PARTNER = '\u{1F91D}';
const ICON_CAL = '\u{1F4C5}';
const ICON_BALLOT = '\u{1F5F3}\uFE0F';
const ICON_MEMO = '\u{1F4DD}';
const ICON_TUBE = '\u{1F9EA}';
const ICON_ARROW = '\u2192';
const ICON_SCAN = '\u{1F4F7}';
const ICON_CONSTRUCT = '\u{1F6E0}\uFE0F';

export default function LecturerHome() {
  const { session, signOut } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    try {
      setError('');
      const res = await api.get('/api/lecturer/dashboard');
      setData(res);
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

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator color="#C9A961" />
        </View>
      </SafeAreaView>
    );
  }

  const lecturer = (data && data.lecturer) || {};
  const stats = (data && data.stats) || {};
  const courses = (data && data.courses) || [];
  const firstName = (lecturer.name || lecturer.email || 'there').split(' ')[0];

  const tiles = [
    { route: '/chat', label: 'Chat', hint: 'Message students and colleagues', icon: ICON_CHAT },
    { icon: ICON_QR, label: 'Prefect QR', hint: 'Create, print and scan QR codes', route: '/qr' },
    { icon: ICON_CAL, label: 'My Schedule', hint: 'Weekly teaching timetable', route: '/lecturer/timetable' },
    { icon: ICON_BALLOT, label: 'Timetable Proposals', hint: 'Vote on changes', route: '/timetable/proposals' },
    { icon: ICON_MEMO, label: 'Assignments', hint: 'Create and grade student work', route: '/lecturer/assignments' },
    { icon: ICON_TUBE, label: 'CATs', hint: 'Create and monitor tests', route: '/lecturer/cats' },
    { icon: ICON_SCAN, label: 'School scan', hint: 'Mark class attendance', route: '/school/scan' },
    { icon: ICON_CONSTRUCT, label: 'Make-up class', hint: 'Request a rescheduled lesson', route: '/lecturer/makeup' },
    { icon: ICON_JOB, label: 'Jobs', hint: 'Browse open roles and apply in one tap', route: '/jobs' },
    { icon: ICON_PARTNER, label: 'Partner Program', hint: 'Earn 10% referring to Prefect', route: '/partner' },
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
          <Text style={styles.greeting}>Welcome, {firstName}</Text>
          <Text style={styles.tagline}>
            {lecturer.departmentName || 'Your teaching dashboard'}
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

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>COURSES</Text>
            <Text style={styles.statValue}>{stats.totalCourses || 0}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>STUDENTS</Text>
            <Text style={styles.statValue}>{stats.totalStudents || 0}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>SESSIONS</Text>
            <Text style={styles.statValue}>{stats.totalSessions || 0}</Text>
          </View>
          <View style={[styles.statCard, stats.activeSessions > 0 && styles.statCardActive]}>
            <Text style={styles.statLabel}>LIVE NOW</Text>
            <Text style={[styles.statValue, stats.activeSessions > 0 && styles.statValueActive]}>
              {stats.activeSessions || 0}
            </Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>MY COURSES</Text>
          <Text style={styles.sectionCount}>{courses.length}</Text>
        </View>

        {courses.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>You have no courses yet.</Text>
            <Text style={styles.emptyHint}>Create one from the web dashboard.</Text>
          </View>
        ) : (
          courses.map((course) => (
            <TouchableOpacity
              key={course.id}
              style={styles.courseCard}
              activeOpacity={0.7}
              onPress={() => router.push('/lecturer/course/' + course.id)}
            >
              <View style={styles.courseHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.courseCode}>{course.code}</Text>
                  <Text style={styles.courseName} numberOfLines={1}>
                    {course.name}
                  </Text>
                </View>
                {course.activeSession && (
                  <View style={styles.liveBadge}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveText}>LIVE</Text>
                  </View>
                )}
              </View>

              <View style={styles.courseStats}>
                <View style={styles.courseStatItem}>
                  <Text style={styles.courseStatLabel}>Students</Text>
                  <Text style={styles.courseStatValue}>{course.studentCount}</Text>
                </View>
                <View style={styles.courseStatDivider} />
                <View style={styles.courseStatItem}>
                  <Text style={styles.courseStatLabel}>Sessions</Text>
                  <Text style={styles.courseStatValue}>{course.sessionsCount}</Text>
                </View>
                <View style={styles.courseStatDivider} />
                <View style={styles.courseStatItem}>
                  <Text style={styles.courseStatLabel}>Attendance</Text>
                  <Text
                    style={[
                      styles.courseStatValue,
                      course.avgAttendancePercent < 75 && styles.courseStatValueRisk,
                    ]}
                  >
                    {course.avgAttendancePercent}%
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}

        <TouchableOpacity onPress={signOut} style={styles.signOutButton} activeOpacity={0.7}>
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

  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  statCard: {
    flex: 1, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16,
    borderWidth: 1.5, borderColor: '#E8E6E1',
  },
  statCardActive: { borderColor: '#2E7D5B', backgroundColor: '#EAF5EF' },
  statLabel: { color: '#8A93A5', fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 8 },
  statValue: { color: '#1B2A4E', fontSize: 28, fontWeight: '700' },
  statValueActive: { color: '#2E7D5B' },

  sectionHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 24, marginBottom: 16 },
  sectionLabel: { color: '#C9A961', fontSize: 11, fontWeight: '700', letterSpacing: 2 },
  sectionCount: { color: '#8A93A5', fontSize: 12, fontWeight: '600' },

  emptyBox: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 32,
    borderWidth: 1.5, borderColor: '#E8E6E1', alignItems: 'center',
  },
  emptyText: { color: '#1B2A4E', fontSize: 15, fontWeight: '600', marginBottom: 6 },
  emptyHint: { color: '#8A93A5', fontSize: 13 },

  courseCard: {
    backgroundColor: '#FFFFFF', borderRadius: 18, padding: 18, marginBottom: 12,
    borderWidth: 1.5, borderColor: '#E8E6E1',
  },
  courseHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  courseCode: { color: '#1B2A4E', fontSize: 17, fontWeight: '700', letterSpacing: -0.3 },
  courseName: { color: '#6B7383', fontSize: 13, marginTop: 3 },
  liveBadge: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#EAF5EF',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
    borderWidth: 1, borderColor: '#2E7D5B',
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#2E7D5B', marginRight: 6 },
  liveText: { color: '#2E7D5B', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  courseStats: {
    flexDirection: 'row', alignItems: 'center',
    borderTopWidth: 1, borderTopColor: '#F0EDE5', paddingTop: 14,
  },
  courseStatItem: { flex: 1 },
  courseStatDivider: { width: 1, height: 24, backgroundColor: '#F0EDE5', marginHorizontal: 8 },
  courseStatLabel: { color: '#8A93A5', fontSize: 10, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 },
  courseStatValue: { color: '#1B2A4E', fontSize: 18, fontWeight: '700' },
  courseStatValueRisk: { color: '#B8860B' },
  signOutButton: { marginTop: 24, paddingVertical: 16, alignItems: 'center' },
  signOutText: { color: '#8A93A5', fontSize: 13, fontWeight: '500' },
  errorBox: { backgroundColor: '#F5E5E5', borderRadius: 12, padding: 12, marginBottom: 16 },
  errorText: { color: '#A93B3B', fontSize: 13 },
});
