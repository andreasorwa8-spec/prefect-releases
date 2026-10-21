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

export default function LecturerCATs() {
  const router = useRouter();
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    try {
      setError('');
      const dash = await api.get('/api/lecturer/dashboard');
      const myCourses = dash.courses || [];

      const lists = await Promise.all(
        myCourses.map((c) =>
          api
            .get(`/api/cats?courseId=${c.id}`)
            .then((r) => (r.cats || []).map((cat) => ({ ...cat, course: c })))
            .catch(() => [])
        )
      );
      const flat = lists.flat().sort((a, b) => new Date(b.windowStart) - new Date(a.windowStart));
      setCats(flat);
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

  function status(cat) {
    const now = new Date();
    const start = new Date(cat.windowStart);
    const end = new Date(cat.windowEnd);
    if (!cat.publishedAt) return { label: 'DRAFT', color: '#8A93A5' };
    if (now < start) return { label: 'Scheduled', color: '#C9A961' };
    if (now > end) return { label: 'Closed', color: '#8A93A5' };
    return { label: 'OPEN NOW', color: '#2E7D5B' };
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
          <Text style={styles.title}>Manage tests</Text>
          <Text style={styles.subtitle}>
            {cats.length} CAT{cats.length === 1 ? '' : 's'} across your courses
          </Text>
        </View>

        <TouchableOpacity
          style={styles.createButton}
          onPress={() => router.push('/lecturer/cats/new')}
          activeOpacity={0.85}
        >
          <Text style={styles.createButtonText}>+ New CAT</Text>
        </TouchableOpacity>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {cats.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No CATs yet</Text>
            <Text style={styles.emptyHint}>
              Tap "New CAT" above to schedule one for your class.
            </Text>
          </View>
        ) : (
          cats.map((cat) => {
            const s = status(cat);
            const qCount = cat._count?.questions ?? cat.questions?.length ?? 0;
            const aCount = cat._count?.attempts ?? cat.attempts?.length ?? 0;
            return (
              <TouchableOpacity
                key={cat.id}
                style={styles.card}
                activeOpacity={0.85}
                onPress={() => router.push(`/lecturer/cats/${cat.id}`)}
              >
                <View style={styles.cardTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.courseCode}>{cat.course?.code}</Text>
                    <Text style={styles.cardTitle} numberOfLines={2}>{cat.title}</Text>
                    <Text style={styles.metaText}>
                      {cat.durationMin} min · {qCount} question{qCount === 1 ? '' : 's'} · {aCount} attempt{aCount === 1 ? '' : 's'}
                    </Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: s.color + '22' }]}>
                    <Text style={[styles.badgeText, { color: s.color }]}>{s.label}</Text>
                  </View>
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.windowText}>
                    {new Date(cat.windowStart).toLocaleString(undefined, {
                      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                    })}
                    {' → '}
                    {new Date(cat.windowEnd).toLocaleString(undefined, {
                      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                    })}
                  </Text>
                  <Text style={styles.chevron}>→</Text>
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
  createButton: {
    backgroundColor: '#1B2A4E', paddingVertical: 16, borderRadius: 14,
    alignItems: 'center', marginBottom: 16,
  },
  createButtonText: { color: '#F8F7F5', fontSize: 15, fontWeight: '700', letterSpacing: 0.3 },
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
  metaText: { color: '#8A93A5', fontSize: 12, marginTop: 6 },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, marginLeft: 8 },
  badgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  cardFooter: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderTopWidth: 1, borderTopColor: '#F0EDE5', paddingTop: 12,
  },
  windowText: { color: '#8A93A5', fontSize: 11, flex: 1 },
  chevron: { color: '#C9A961', fontSize: 18, fontWeight: '600', marginLeft: 8 },
});