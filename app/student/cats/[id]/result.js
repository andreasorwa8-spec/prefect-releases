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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '@/lib/api';

export default function CATResult() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    try {
      setError('');
      const res = await api.get('/api/cats/me');
      const cat = (res.cats || []).find((c) => c.id === id);
      if (!cat || !cat.myAttempt) {
        setError('No attempt found');
      } else {
        const full = await api.get('/api/cats/attempts/' + cat.myAttempt.id);
        setAttempt(full.attempt);
      }
    } catch (err) {
      setError(err.message || 'Failed to load result');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator color="#C9A961" />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !attempt) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.scroll}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error || 'Result unavailable'}</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const autoSubmitted = attempt.status === 'AUTO_SUBMITTED';
  const reasonMap = {
    LEFT_APP: 'you left the app',
    HEARTBEAT_LOST: 'the connection was lost',
    TIMEOUT: 'time ran out',
  };
  const reasonText = reasonMap[attempt.submitReason] || 'the CAT was auto-submitted';

  const score = attempt.score == null ? 0 : attempt.score;
  const maxScore = attempt.cat && attempt.cat.maxScore ? attempt.cat.maxScore : 100;
  const isGraded = attempt.status === 'GRADED' || attempt.score != null;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity
          onPress={() => router.replace('/student/cats')}
          style={styles.backButton}
        >
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>

        {autoSubmitted ? (
          <View style={styles.autoBanner}>
            <Text style={styles.autoTitle}>SUBMITTED AUTOMATICALLY</Text>
            <Text style={styles.autoBody}>
              Your answers were submitted because {reasonText}. They cannot be changed now.
            </Text>
          </View>
        ) : null}

        <Text style={styles.brand}>CAT RESULT</Text>
        <Text style={styles.title}>
          {isGraded ? 'Submitted & graded' : 'Submitted'}
        </Text>

        <View style={styles.scoreCard}>
          <Text style={styles.scoreLabel}>YOUR SCORE</Text>
          <View style={styles.scoreRow}>
            <Text style={styles.scoreValue}>{score}</Text>
            <Text style={styles.scoreMax}>/ {maxScore}</Text>
          </View>
          {isGraded ? (
            <View style={styles.scoreBar}>
              <View
                style={[
                  styles.scoreBarFill,
                  {
                    width: Math.min(100, Math.round((score / maxScore) * 100)) + '%',
                  },
                ]}
              />
            </View>
          ) : (
            <Text style={styles.pendingText}>
              Some answers need lecturer review. Final score may change.
            </Text>
          )}
        </View>

        <View style={styles.metaCard}>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Submitted</Text>
            <Text style={styles.metaValue}>
              {attempt.submittedAt
                ? new Date(attempt.submittedAt).toLocaleString()
                : '—'}
            </Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Reason</Text>
            <Text style={styles.metaValue}>
              {attempt.submitReason === 'MANUAL'
                ? 'Submitted manually'
                : 'Auto (' + (attempt.submitReason || 'unknown') + ')'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.doneButton}
          onPress={() => router.replace('/student/cats')}
          activeOpacity={0.85}
        >
          <Text style={styles.doneButtonText}>Back to CATs</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8F7F5' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40 },
  backButton: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#E8E6E1', marginBottom: 20,
  },
  backText: { fontSize: 20, color: '#1B2A4E', fontWeight: '500' },
  autoBanner: {
    backgroundColor: '#FFF5E5', borderRadius: 14, padding: 16,
    borderWidth: 2, borderColor: '#B8860B', marginBottom: 20,
  },
  autoTitle: { color: '#B8860B', fontSize: 12, fontWeight: '700', letterSpacing: 1.5, marginBottom: 6 },
  autoBody: { color: '#1B2A4E', fontSize: 13, lineHeight: 20 },
  brand: { color: '#C9A961', fontSize: 11, fontWeight: '700', letterSpacing: 2, marginBottom: 8 },
  title: { color: '#1B2A4E', fontSize: 26, fontWeight: '700', letterSpacing: -0.4, marginBottom: 24 },
  scoreCard: {
    backgroundColor: '#FFFFFF', borderRadius: 18, padding: 22,
    borderWidth: 1.5, borderColor: '#E8E6E1', marginBottom: 16,
  },
  scoreLabel: { color: '#8A93A5', fontSize: 10, fontWeight: '700', letterSpacing: 2, marginBottom: 12 },
  scoreRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 16 },
  scoreValue: { color: '#2E7D5B', fontSize: 48, fontWeight: '700', letterSpacing: -1 },
  scoreMax: { color: '#8A93A5', fontSize: 20, fontWeight: '600', marginLeft: 8 },
  scoreBar: { height: 8, borderRadius: 4, backgroundColor: '#F0EDE5', overflow: 'hidden' },
  scoreBarFill: { height: '100%', backgroundColor: '#2E7D5B' },
  pendingText: { color: '#B8860B', fontSize: 13, fontStyle: 'italic' },
  metaCard: {
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16,
    borderWidth: 1.5, borderColor: '#E8E6E1', marginBottom: 24,
  },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  metaLabel: { color: '#8A93A5', fontSize: 13 },
  metaValue: { color: '#1B2A4E', fontSize: 13, fontWeight: '600' },
  doneButton: {
    backgroundColor: '#1B2A4E', paddingVertical: 16, borderRadius: 14,
    alignItems: 'center',
  },
  doneButtonText: { color: '#F8F7F5', fontSize: 15, fontWeight: '700', letterSpacing: 0.3 },
  errorBox: { backgroundColor: '#F5E5E5', borderRadius: 12, padding: 12, marginBottom: 16 },
  errorText: { color: '#A93B3B', fontSize: 13 },
});