import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { api } from '@/lib/api';

const STATUS_TONE = {
  OPEN: { bg: '#F5EAD2', fg: '#8A6D2A' },
  IN_REVIEW: { bg: '#E4EEF9', fg: '#2A4B7C' },
  RESOLVED: { bg: '#E1F1EB', fg: '#1A7A5E' },
  DISMISSED: { bg: '#F0EDE5', fg: '#6B7383' },
};

export default function ComplaintDetail() {
  const { id } = useLocalSearchParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    try {
      setError('');
      const res = await api.get(`/api/complaints/${id}`);
      setItem(res.complaint);
    } catch (err) {
      setError(err.message || 'Failed to load');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { load(); }, [id]);
  const onRefresh = useCallback(() => { setRefreshing(true); load(); }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}><ActivityIndicator color="#C9A961" /></View>
      </SafeAreaView>
    );
  }

  if (error || !item) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.errorText}>{error || 'Not found'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const tone = STATUS_TONE[item.status] || STATUS_TONE.OPEN;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#C9A961" />}
      >
        <View style={[styles.badge, { backgroundColor: tone.bg, alignSelf: 'flex-start' }]}>
          <Text style={[styles.badgeText, { color: tone.fg }]}>{item.status.replace('_', ' ')}</Text>
        </View>

        <Text style={styles.title}>{item.subject}</Text>

        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Filed by</Text>
          <Text style={styles.metaValue}>{item.author?.name || 'Anonymous'}</Text>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>About</Text>
          <Text style={styles.metaValue}>
            {item.targetType === 'LECTURER'
              ? (item.targetUser?.name || item.targetUser?.email || 'A lecturer')
              : (item.targetDept?.name || 'Your department')}
          </Text>
        </View>

        {item.course ? (
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Course</Text>
            <Text style={styles.metaValue}>{item.course.code} - {item.course.name}</Text>
          </View>
        ) : null}

        {item.isAnonymous ? (
          <View style={styles.anonNote}>
            <Text style={styles.anonNoteText}>
              Filed anonymously. Your name is hidden from the lecturer.
              {item.requiresDeptTriage && !item.isForwarded
                ? ' Your department will review before it may be forwarded.'
                : ''}
            </Text>
          </View>
        ) : null}

        <Text style={styles.sectionLabel}>What was reported</Text>
        <View style={styles.bodyBox}>
          <Text style={styles.bodyText}>{item.body}</Text>
        </View>

        {item.resolution ? (
          <>
            <Text style={styles.sectionLabel}>Resolution</Text>
            <View style={[styles.bodyBox, styles.resolutionBox]}>
              <Text style={styles.bodyText}>{item.resolution}</Text>
            </View>
          </>
        ) : null}

        <Text style={styles.filedAt}>Filed {new Date(item.createdAt).toLocaleString()}</Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8F7F5' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginBottom: 12 },
  badgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  title: { color: '#1B2A4E', fontSize: 22, fontWeight: '700', marginBottom: 20 },
  metaRow: { flexDirection: 'row', marginBottom: 6 },
  metaLabel: { color: '#8A93A5', fontSize: 12, width: 70 },
  metaValue: { color: '#1B2A4E', fontSize: 13, flex: 1, fontWeight: '600' },
  anonNote: { backgroundColor: '#F5EAD2', borderRadius: 12, padding: 12, marginTop: 12, marginBottom: 4 },
  anonNoteText: { color: '#8A6D2A', fontSize: 12, lineHeight: 17 },
  sectionLabel: { color: '#1B2A4E', fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginTop: 24, marginBottom: 8 },
  bodyBox: { backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1.5, borderColor: '#E8E6E1', padding: 14 },
  resolutionBox: { borderColor: '#1A7A5E' },
  bodyText: { color: '#1B2A4E', fontSize: 14, lineHeight: 20 },
  filedAt: { color: '#B0B6C2', fontSize: 11, marginTop: 24, textAlign: 'center' },
  errorText: { color: '#A93B3B', fontSize: 14 },
});