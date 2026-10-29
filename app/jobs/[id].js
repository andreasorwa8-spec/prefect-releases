// app/jobs/[id].js
// Session 31 -- 31.6
//
// Mobile job detail: shows role, employer, skills, apply button.
// Apply hits POST /api/jobs/[id]/apply.

import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, SafeAreaView, Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { api, ApiError } from '@/lib/api';

function humanize(s) {
  return String(s || '').toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function JobDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [applying, setApplying] = useState(false);
  const [appliedStatus, setAppliedStatus] = useState(null);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setError('');
      const res = await api.get('/api/jobs/' + id);
      setJob(res.job || null);
      // check own applications
      try {
        const mine = await api.get('/api/applications/mine');
        const found = (mine.items || []).find((a) => a.jobId === id);
        if (found) setAppliedStatus(found.status);
      } catch (_) {}
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) setError('Job not found');
      else setError(err.message || 'Failed to load job');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function apply() {
    setApplying(true);
    try {
      await api.post('/api/jobs/' + id + '/apply', {});
      setAppliedStatus('PENDING');
      Alert.alert('Applied', 'Your application has been submitted.');
    } catch (err) {
      Alert.alert('Could not apply', err.message || 'Try again');
    } finally {
      setApplying(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#1B2A4E" />
      </SafeAreaView>
    );
  }

  if (error || !job) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.errorText}>{error || 'Job not found'}</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.push('/jobs')}>
          <Text style={styles.backBtnText}>Back to jobs</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity onPress={() => router.push('/jobs')} style={styles.backLink}>
          <Text style={styles.backLinkText}>\u2190 Back to jobs</Text>
        </TouchableOpacity>

        <View style={styles.card}>
          <Text style={styles.metaTop} numberOfLines={1}>
            {job.companyName}{job.location ? ' \u00b7 ' + job.location : ''}
          </Text>
          <Text style={styles.title}>{job.title}</Text>
          <Text style={styles.postedBy}>
            Posted by {job.employer?.displayName || 'Prefect'}{job.employer?.verified ? ' \u2713 Verified' : ''}
          </Text>

          <View style={styles.grid}>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>Salary</Text>
              <Text style={styles.gridValue}>
                {job.salaryMin || job.salaryMax
                  ? job.currency + ' ' + (job.salaryMin || 0) + ' - ' + (job.salaryMax || '\u221e')
                  : 'Negotiable'}
              </Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>Deadline</Text>
              <Text style={styles.gridValue}>
                {job.deadline ? new Date(job.deadline).toLocaleDateString() : 'Rolling'}
              </Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>Applied</Text>
              <Text style={styles.gridValue}>{job._count?.applications || 0}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>Type</Text>
              <Text style={styles.gridValue}>{humanize(job.jobType)}</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>About the role</Text>
          <Text style={styles.body}>{job.description}</Text>

          {(job.skillsRequired || []).length > 0 ? (
            <>
              <Text style={styles.sectionTitle}>Skills required</Text>
              <View style={styles.skillsRow}>
                {job.skillsRequired.map((sr) => (
                  <View key={sr.id} style={styles.skillChip}>
                    <Text style={styles.skillChipText}>{sr.skill.name}</Text>
                  </View>
                ))}
              </View>
            </>
          ) : null}
        </View>

        {appliedStatus ? (
          <View style={styles.appliedBox}>
            <Text style={styles.appliedText}>Applied \u00b7 {humanize(appliedStatus)}</Text>
          </View>
        ) : job.status === 'OPEN' ? (
          <TouchableOpacity style={[styles.applyBtn, applying && styles.applyBtnDisabled]} onPress={apply} disabled={applying}>
            <Text style={styles.applyBtnText}>{applying ? 'Applying\u2026' : 'Apply now'}</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.closedBox}>
            <Text style={styles.closedText}>Not accepting applications</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8F7F5' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8F7F5', padding: 20 },
  scroll: { padding: 20, paddingBottom: 40 },
  backLink: { marginBottom: 12 },
  backLinkText: { color: '#4F6B8E', fontSize: 13, fontWeight: '600' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#EFE9DA', padding: 20 },
  metaTop: { fontSize: 11, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  title: { fontSize: 22, fontWeight: '700', color: '#1B2A4E', lineHeight: 28 },
  postedBy: { fontSize: 13, color: '#4F6B8E', marginTop: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 16, padding: 12, backgroundColor: '#F8F7F5', borderRadius: 12, gap: 12 },
  gridItem: { width: '45%' },
  gridLabel: { fontSize: 10, color: '#9AA8BE', textTransform: 'uppercase', letterSpacing: 0.5 },
  gridValue: { fontSize: 14, fontWeight: '600', color: '#1B2A4E', marginTop: 2 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#6F7F9B', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 20, marginBottom: 8 },
  body: { fontSize: 14, color: '#1A2B44', lineHeight: 22 },
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  skillChip: { backgroundColor: '#F2F6FB', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  skillChipText: { fontSize: 12, fontWeight: '600', color: '#1B2A4E' },
  applyBtn: { marginTop: 20, backgroundColor: '#1B2A4E', borderRadius: 999, paddingVertical: 14, alignItems: 'center' },
  applyBtnDisabled: { opacity: 0.6 },
  applyBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  appliedBox: { marginTop: 20, backgroundColor: '#E5F1EB', borderRadius: 999, paddingVertical: 12, alignItems: 'center' },
  appliedText: { color: '#2E7D5B', fontSize: 14, fontWeight: '700' },
  closedBox: { marginTop: 20, backgroundColor: '#F5E5E5', borderRadius: 999, paddingVertical: 12, alignItems: 'center' },
  closedText: { color: '#A93B3B', fontSize: 14, fontWeight: '700' },
  errorText: { fontSize: 15, color: '#A93B3B', textAlign: 'center' },
  backBtn: { marginTop: 16, backgroundColor: '#1B2A4E', borderRadius: 999, paddingHorizontal: 20, paddingVertical: 10 },
  backBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
});
