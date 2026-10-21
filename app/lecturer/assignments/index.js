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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { api } from '@/lib/api';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'ungraded', label: 'Ungraded' },
  { key: 'late', label: 'Late' },
  { key: 'missing', label: 'Missing' },
];

export default function LecturerAssignments() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [assignments, setAssignments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [courseFilter, setCourseFilter] = useState(params.courseId || 'all');

  async function load() {
    try {
      setError('');
      const dash = await api.get('/api/lecturer/dashboard');
      const myCourses = dash.courses || [];
      setCourses(myCourses);

      const lists = await Promise.all(
        myCourses.map((c) =>
          api
            .get(`/api/assignments?courseId=${c.id}&all=1`)
            .then((r) => (r.assignments || []).map((a) => ({ ...a, course: c })))
            .catch(() => [])
        )
      );
      const flat = lists.flat().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setAssignments(flat);
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

  function countsFor(a) {
    const total = a._count?.submissions || 0;
    return { total, ungraded: 0, late: 0, missing: 0 };
  }

  const visible = assignments.filter((a) => {
    if (courseFilter !== 'all' && a.course?.id !== courseFilter) return false;
    if (filter === 'all') return true;
    if (filter === 'ungraded') return (a._count?.submissions || 0) > 0;
    return true;
  });

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
            <Text style={styles.brandText}>ASSIGNMENTS</Text>
          </View>
          <Text style={styles.title}>Manage your work</Text>
          <Text style={styles.subtitle}>
            {assignments.length} assignment{assignments.length === 1 ? '' : 's'} across your courses
          </Text>
        </View>

        <TouchableOpacity
          style={styles.createButton}
          onPress={() => router.push('/lecturer/assignments/new')}
          activeOpacity={0.85}
        >
          <Text style={styles.createButtonText}>+ New assignment</Text>
        </TouchableOpacity>

        <View style={styles.filterRow}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterPill, filter === f.key && styles.filterPillActive]}
              onPress={() => setFilter(f.key)}
            >
              <Text
                style={[styles.filterText, filter === f.key && styles.filterTextActive]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {visible.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No assignments yet</Text>
            <Text style={styles.emptyHint}>
              Tap "New assignment" above to create one for your class.
            </Text>
          </View>
        ) : (
          visible.map((a) => (
            <TouchableOpacity
              key={a.id}
              style={styles.card}
              activeOpacity={0.85}
              onPress={() => router.push(`/lecturer/assignments/${a.id}`)}
            >
              <View style={styles.cardTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.courseCode}>{a.course?.code}</Text>
                  <Text style={styles.cardTitle} numberOfLines={2}>{a.title}</Text>
                  <Text style={styles.dueText}>
                    Due {new Date(a.dueAt).toLocaleString(undefined, {
                      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                    })}
                  </Text>
                </View>
                {!a.publishedAt ? (
                  <View style={styles.draftBadge}>
                    <Text style={styles.draftText}>DRAFT</Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.cardFooter}>
                <Text style={styles.statText}>
                  {a._count?.submissions || 0} submission{a._count?.submissions === 1 ? '' : 's'}
                </Text>
                <Text style={styles.chevron}>→</Text>
              </View>
            </TouchableOpacity>
          ))
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
  createButton: {
    backgroundColor: '#1B2A4E', paddingVertical: 16, borderRadius: 14,
    alignItems: 'center', marginBottom: 16,
  },
  createButtonText: { color: '#F8F7F5', fontSize: 15, fontWeight: '700', letterSpacing: 0.3 },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  filterPill: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#E8E6E1',
  },
  filterPillActive: { backgroundColor: '#1B2A4E', borderColor: '#1B2A4E' },
  filterText: { color: '#6B7383', fontSize: 12, fontWeight: '600' },
  filterTextActive: { color: '#F8F7F5' },
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
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  courseCode: { color: '#C9A961', fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 4 },
  cardTitle: { color: '#1B2A4E', fontSize: 16, fontWeight: '700', lineHeight: 22 },
  dueText: { color: '#8A93A5', fontSize: 12, marginTop: 6 },
  draftBadge: {
    backgroundColor: '#F0EDE5', paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 10, marginLeft: 8,
  },
  draftText: { color: '#8A93A5', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  cardFooter: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderTopWidth: 1, borderTopColor: '#F0EDE5', paddingTop: 12,
  },
  statText: { color: '#6B7383', fontSize: 12, fontWeight: '500' },
  chevron: { color: '#C9A961', fontSize: 18, fontWeight: '600' },
});