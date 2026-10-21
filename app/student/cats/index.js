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

function getStatus(cat) {
  if (cat.myAttempt) {
    if (cat.myAttempt.status === 'GRADED') return { label: 'Graded', color: '#1B2A4E' };
    if (cat.myAttempt.status === 'SUBMITTED') return { label: 'Submitted', color: '#2E7D5B' };
    if (cat.myAttempt.status === 'AUTO_SUBMITTED') return { label: 'Auto-submitted', color: '#B8860B' };
    if (cat.myAttempt.status === 'IN_PROGRESS') return { label: 'In progress', color: '#C9A961' };
  }
  if (cat.isOpen) return { label: 'Open now', color: '#2E7D5B' };
  const now = new Date();
  if (now < new Date(cat.windowStart)) return { label: 'Not yet open', color: '#8A93A5' };
  return { label: 'Closed', color: '#8A93A5' };
}

export default function StudentCATs() {
  const router = useRouter();
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    try {
      setError('');
      const res = await api.get('/api/cats/me');
      setCats(res.cats || []);
    } catch (err) {
      setError(err.message || 'Failed to load CATs');
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

  function openCAT(cat) {
    if (
      cat.myAttempt &&
      (cat.myAttempt.status === 'SUBMITTED' ||
        cat.myAttempt.status === 'AUTO_SUBMITTED' ||
        cat.myAttempt.status === 'GRADED')
    ) {
      router.push(`/student/cats/${cat.id}/result`);
      return;
    }
    router.push(`/student/cats/${cat.id}`);
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
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>

          <View style={styles.brandRow}>
            <View style={styles.brandDot} />
            <Text style={styles.brandText}>CATS</Text>
          </View>
          <Text style={styles.title}>Tests & assessments</Text>
          <Text style={styles.subtitle}>
            {cats.length} CAT{cats.length === 1 ? '' : 's'} across your courses
          </Text>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {cats.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No CATs yet</Text>
            <Text style={styles.emptyHint}>
              When your lecturers schedule a CAT, it will appear here.
            </Text>
          </View>
        ) : (
          cats.map((cat) => {
            const status = getStatus(cat);
            return (
              <TouchableOpacity
                key={cat.id}
                style={styles.card}
                activeOpacity={0.85}
                onPress={() => openCAT(cat)}
              >
                <View style={styles.cardTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.courseCode}>{cat.course?.code}</Text>
                    <Text style={styles.cardTitle} numberOfLines={2}>{cat.title}</Text>
                    <Text style={styles.courseName} numberOfLines={1}>
                      {cat.course?.name}
                    </Text>
                  </View>
                  {cat.myAttempt?.score != null ? (
                    <View style={styles.scoreBubble}>
                      <Text style={styles.scoreValue}>{cat.myAttempt.score}</Text>
                      <Text style={styles.scoreMax}>/{cat.maxScore}</Text>
                    </View>
                  ) : null}
                </View>

                <View style={styles.metaRow}>
                  <Text style={styles.metaText}>
                    {cat.durationMin} min · {cat.questionCount || 0} question{cat.questionCount === 1 ? '' : 's'}
                  </Text>
                </View>

                <View style={styles.cardFooter}>
                  <View style={[styles.statusPill, { backgroundColor: status.color + '22' }]}>
                    <Text style={[styles.statusText, { color: status.color }]}>
                      {status.label}
                    </Text>
                  </View>
                  <Text style={styles.windowText}>
                    {new Date(cat.windowStart).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    {' – '}
                    {new Date(cat.windowEnd).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
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
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
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
  metaRow: { marginBottom: 10 },
  metaText: { color: '#8A93A5', fontSize: 12 },
  cardFooter: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderTopWidth: 1, borderTopColor: '#F0EDE5', paddingTop: 12,
  },
  statusPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
  windowText: { color: '#8A93A5', fontSize: 11, fontWeight: '500' },
});