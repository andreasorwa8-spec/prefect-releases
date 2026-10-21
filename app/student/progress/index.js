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
  Modal,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { api } from '@/lib/api';

const TONE_STYLE = {
  green:  { bg: '#E6F4EC', border: '#2E7D5B', text: '#2E7D5B', dot: '#2E7D5B' },
  yellow: { bg: '#FBF4DD', border: '#B8860B', text: '#8A6508', dot: '#B8860B' },
  orange: { bg: '#FBEAD8', border: '#C9701E', text: '#A55B14', dot: '#C9701E' },
  amber:  { bg: '#F8E6D8', border: '#A55B14', text: '#7E4410', dot: '#A55B14' },
  gray:   { bg: '#F0F2F6', border: '#8A93A5', text: '#5C6475', dot: '#8A93A5' },
};

const TREND_STYLE = {
  improving: { arrow: '↓', color: '#2E7D5B', label: 'Improving' },
  slipping:  { arrow: '↑', color: '#C9701E', label: 'Slipping' },
  steady:    { arrow: '→', color: '#8A93A5', label: 'Steady' },
};

export default function StudentProgress() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [modalLecturer, setModalLecturer] = useState(null);

  async function load() {
    try {
      setError('');
      const res = await api.get('/api/risk/me');
      setCourses(res.courses || []);
    } catch (err) {
      setError(err.message || 'Failed to load progress');
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

  function formatWhen(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const diff = Date.now() - d.getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(hours / 24);
    if (hours < 1) return 'just now';
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString();
  }

  async function copyEmail(email) {
    if (!email) return;
    try {
      await Clipboard.setStringAsync(email);
    } catch {}
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#1B2A4E" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={styles.title}>Your Progress</Text>
        <Text style={styles.subtitle}>
          A quick look at how things are going across your courses.
        </Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {!error && courses.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No updates yet</Text>
            <Text style={styles.emptyBody}>
              Check back after your next session. We'll show you a snapshot of each course.
            </Text>
          </View>
        ) : null}

        {courses.map((c) => {
          const t = TONE_STYLE[c.status?.tone] || TONE_STYLE.gray;
          const trend = c.trend ? TREND_STYLE[c.trend] : null;

          return (
            <View key={c.courseId} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.courseCode}>{c.courseCode}</Text>
                <Text style={styles.courseName} numberOfLines={1}>
                  {c.courseName}
                </Text>
              </View>

              <View style={styles.pillRow}>
                <View style={[styles.pill, { backgroundColor: t.bg, borderColor: t.border }]}>
                  <View style={[styles.dot, { backgroundColor: t.dot }]} />
                  <Text style={[styles.pillText, { color: t.text }]}>
                    {c.status?.label || 'No data yet'}
                  </Text>
                </View>

                {trend ? (
                  <View style={styles.trendWrap}>
                    <Text style={[styles.trendArrow, { color: trend.color }]}>
                      {trend.arrow}
                    </Text>
                    <Text style={[styles.trendLabel, { color: trend.color }]}>
                      {trend.label}
                    </Text>
                  </View>
                ) : null}
              </View>

              <Text style={styles.narrative}>{c.narrative}</Text>

              {c.canTalkToLecturer ? (
                <TouchableOpacity
                  style={styles.talkBtn}
                  onPress={() => setModalLecturer(c.lecturer)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.talkBtnText}>Talk to your lecturer</Text>
                </TouchableOpacity>
              ) : null}

              <Text style={styles.when}>Updated {formatWhen(c.computedAt)}</Text>
            </View>
          );
        })}
      </ScrollView>

      <Modal
        visible={!!modalLecturer}
        transparent
        animationType="fade"
        onRequestClose={() => setModalLecturer(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Chat coming soon</Text>
            <Text style={styles.modalBody}>
              In-app chat is on the way. For now, you can reach{' '}
              <Text style={styles.modalName}>
                {modalLecturer?.name || 'your lecturer'}
              </Text>{' '}
              directly.
            </Text>

            {modalLecturer?.email ? (
              <TouchableOpacity
                style={styles.emailRow}
                onPress={() => copyEmail(modalLecturer.email)}
                activeOpacity={0.7}
              >
                <Text style={styles.emailText}>{modalLecturer.email}</Text>
                <Text style={styles.emailHint}>Tap to copy</Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setModalLecturer(null)}
              activeOpacity={0.85}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F7F8FB' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7F8FB' },
  content: { padding: 20, paddingBottom: 60 },
  title: { fontSize: 26, fontWeight: '700', color: '#1B2A4E', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#5C6475', marginBottom: 20, lineHeight: 20 },
  error: { color: '#A93B3B', marginBottom: 12 },

  empty: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E4E7EE',
  },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#1B2A4E', marginBottom: 6 },
  emptyBody: { fontSize: 13, color: '#5C6475', textAlign: 'center', lineHeight: 19 },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E4E7EE',
  },
  cardHeader: { marginBottom: 12 },
  courseCode: { fontSize: 12, fontWeight: '700', color: '#8A93A5', letterSpacing: 0.5 },
  courseName: { fontSize: 17, fontWeight: '600', color: '#1B2A4E', marginTop: 2 },

  pillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  dot: { width: 7, height: 7, borderRadius: 4, marginRight: 6 },
  pillText: { fontSize: 12, fontWeight: '600' },

  trendWrap: { flexDirection: 'row', alignItems: 'center' },
  trendArrow: { fontSize: 16, fontWeight: '700', marginRight: 4 },
  trendLabel: { fontSize: 12, fontWeight: '600' },

  narrative: { fontSize: 14, color: '#3A4256', lineHeight: 21, marginBottom: 12 },

  talkBtn: {
    backgroundColor: '#1B2A4E',
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
    marginBottom: 10,
  },
  talkBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },

  when: { fontSize: 11, color: '#8A93A5' },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 22,
    width: '100%',
    maxWidth: 420,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1B2A4E', marginBottom: 8 },
  modalBody: { fontSize: 14, color: '#3A4256', lineHeight: 21, marginBottom: 16 },
  modalName: { fontWeight: '700', color: '#1B2A4E' },
  emailRow: {
    backgroundColor: '#F0F2F6',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  emailText: { fontSize: 14, fontWeight: '600', color: '#1B2A4E' },
  emailHint: { fontSize: 11, color: '#8A93A5', marginTop: 3 },
  modalClose: {
    backgroundColor: '#1B2A4E',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCloseText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
});