// app/jobs/index.js
// Session 31 -- 31.6
//
// Mobile job board. Mirrors the web /jobs page but native:
// search, filter by type, tap to open detail + apply.

import { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, SafeAreaView, TextInput,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { api } from '@/lib/api';

const ICON_SEARCH = '\u{1F50D}';
const ICON_ARROW = '\u2192';

const JOB_TYPES = [
  { key: '', label: 'All' },
  { key: 'FULL_TIME', label: 'Full-time' },
  { key: 'PART_TIME', label: 'Part-time' },
  { key: 'INTERNSHIP', label: 'Internship' },
  { key: 'CONTRACT', label: 'Contract' },
  { key: 'VOLUNTEER', label: 'Volunteer' },
];

function humanize(s) {
  return String(s || '').toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function JobsListScreen() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [jobType, setJobType] = useState('');

  async function load() {
    try {
      setError('');
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (jobType) params.set('jobType', jobType);
      const qs = params.toString();
      const res = await api.get('/api/jobs' + (qs ? '?' + qs : ''));
      setItems(res.items || []);
    } catch (err) {
      setError(err.message || 'Failed to load jobs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      load();
    }, [search, jobType])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [search, jobType]);

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
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Jobs</Text>
          <Text style={styles.subtitle}>
            {items.length} open {items.length === 1 ? 'role' : 'roles'}
          </Text>
        </View>

        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>{ICON_SEARCH}</Text>
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search title, company, keyword"
            placeholderTextColor="#9AA8BE"
            returnKeyType="search"
            onSubmitEditing={load}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow} contentContainerStyle={styles.chipRowInner}>
          {JOB_TYPES.map((t) => (
            <TouchableOpacity
              key={t.key || 'all'}
              style={[styles.chip, jobType === t.key && styles.chipActive]}
              onPress={() => setJobType(t.key)}
            >
              <Text style={[styles.chipText, jobType === t.key && styles.chipTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {items.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>\u25A4</Text>
            <Text style={styles.emptyTitle}>No jobs match these filters.</Text>
            <Text style={styles.emptyHint}>Try clearing filters or widening your search.</Text>
            {search || jobType ? (
              <TouchableOpacity
                style={styles.emptyCta}
                onPress={() => { setSearch(''); setJobType(''); }}
              >
                <Text style={styles.emptyCtaText}>Clear filters</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : (
          <View style={styles.list}>
            {items.map((j) => (
              <TouchableOpacity
                key={j.id}
                style={styles.card}
                onPress={() => router.push('/jobs/' + j.id)}
                activeOpacity={0.85}
              >
                <View style={styles.cardTop}>
                  <Text style={styles.employer} numberOfLines={1}>
                    {(j.employer?.displayName || 'Prefect') + (j.employer?.verified ? ' \u2713' : '')}
                  </Text>
                  <View style={styles.badge}><Text style={styles.badgeText}>{humanize(j.jobType)}</Text></View>
                </View>
                <Text style={styles.cardTitle} numberOfLines={2}>{j.title}</Text>
                <Text style={styles.cardMeta} numberOfLines={1}>
                  {j.companyName}{j.location ? ' \u00b7 ' + j.location : ''}
                </Text>
                <Text style={styles.cardDesc} numberOfLines={3}>{j.description}</Text>
                <View style={styles.cardFooter}>
                  {(j.skillsRequired || []).slice(0, 3).map((sr) => (
                    <View key={sr.id} style={styles.skillChip}><Text style={styles.skillChipText}>{sr.skill.name}</Text></View>
                  ))}
                  <Text style={styles.appliedText}>{j._count?.applications || 0} applied</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8F7F5' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8F7F5' },
  scroll: { paddingBottom: 32 },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 28, fontWeight: '700', color: '#1B2A4E' },
  subtitle: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 20, marginTop: 12,
    backgroundColor: '#FFFFFF', borderRadius: 12,
    borderWidth: 1, borderColor: '#EFE9DA', paddingHorizontal: 12,
  },
  searchIcon: { fontSize: 15, marginRight: 8, color: '#9AA8BE' },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 14, color: '#1B2A4E' },
  chipRow: { marginTop: 12, marginBottom: 4 },
  chipRowInner: { paddingHorizontal: 20, gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EFE9DA', marginRight: 8,
  },
  chipActive: { backgroundColor: '#1B2A4E', borderColor: '#1B2A4E' },
  chipText: { fontSize: 12, fontWeight: '600', color: '#1B2A4E' },
  chipTextActive: { color: '#FFFFFF' },
  error: { marginHorizontal: 20, marginTop: 12, color: '#A93B3B', fontSize: 13 },
  list: { paddingHorizontal: 20, marginTop: 12, gap: 12 },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 16,
    borderWidth: 1, borderColor: '#EFE9DA', padding: 16,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  employer: { flex: 1, fontSize: 11, fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5 },
  badge: { backgroundColor: '#EEF4FB', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 10, fontWeight: '700', color: '#1B2A4E', textTransform: 'uppercase' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1B2A4E', lineHeight: 22 },
  cardMeta: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  cardDesc: { fontSize: 13, color: '#4F6B8E', marginTop: 8, lineHeight: 19 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginTop: 10, gap: 6 },
  skillChip: { backgroundColor: '#F2F6FB', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  skillChipText: { fontSize: 10, fontWeight: '600', color: '#1B2A4E' },
  appliedText: { fontSize: 10, color: '#9AA8BE', marginLeft: 'auto' },
  empty: { paddingHorizontal: 20, paddingVertical: 48, alignItems: 'center' },
  emptyIcon: { fontSize: 36, color: '#C2CBDB' },
  emptyTitle: { fontSize: 15, fontWeight: '600', color: '#1A2B44', marginTop: 12 },
  emptyHint: { fontSize: 12, color: '#6F7F9B', marginTop: 4, textAlign: 'center' },
  emptyCta: { marginTop: 20, backgroundColor: '#1B2A4E', borderRadius: 999, paddingHorizontal: 20, paddingVertical: 10 },
  emptyCtaText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
});
