import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '@/lib/api';

export default function CATGate() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [cat, setCat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dndChecked, setDndChecked] = useState(false);
  const [batteryChecked, setBatteryChecked] = useState(false);
  const [starting, setStarting] = useState(false);

  async function load() {
    try {
      setError('');
      const res = await api.get(`/api/cats/${id}`);
      setCat(res.cat);
    } catch (err) {
      setError(err.message || 'Failed to load CAT');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [id]);

  async function handleStart() {
    if (!dndChecked || !batteryChecked) return;
    setStarting(true);
    try {
      await api.post(`/api/cats/${id}/start`, {});
      router.replace(`/student/cats/${id}/take`);
    } catch (err) {
      Alert.alert('Cannot start', err.message || 'Please try again');
      setStarting(false);
    }
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

  if (error || !cat) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.scroll}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error || 'CAT not found'}</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const canStart = dndChecked && batteryChecked && !starting;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>

        <Text style={styles.courseCode}>{cat.course?.code}</Text>
        <Text style={styles.title}>{cat.title}</Text>
        <Text style={styles.courseName}>{cat.course?.name}</Text>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>DURATION</Text>
            <Text style={styles.metaValue}>{cat.durationMin} min</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>QUESTIONS</Text>
            <Text style={styles.metaValue}>{cat.questionCount}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>MAX SCORE</Text>
            <Text style={styles.metaValue}>{cat.maxScore}</Text>
          </View>
        </View>

        {cat.description ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>INSTRUCTIONS</Text>
            <Text style={styles.body}>{cat.description}</Text>
          </View>
        ) : null}

        <View style={styles.warningBox}>
          <Text style={styles.warningTitle}>⚠️ This is a proctored CAT</Text>
          <Text style={styles.warningBody}>
            • If you leave Prefect, your answers submit instantly — no warning.{'\n'}
            • A phone call, notification, or accidental swipe can trigger this.{'\n'}
            • Keep your screen on and don't switch apps.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>BEFORE YOU BEGIN</Text>

          <Text style={styles.dndInstruction}>
            Turn on Do Not Disturb to prevent calls and notifications:
          </Text>
          <View style={styles.dndSteps}>
            <Text style={styles.dndStep}>• Android: Swipe down twice → tap "Do Not Disturb"</Text>
            <Text style={styles.dndStep}>• iPhone: Swipe down from top-right → tap moon icon</Text>
          </View>

          <TouchableOpacity
            style={styles.checkRow}
            onPress={() => setDndChecked(!dndChecked)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, dndChecked && styles.checkboxOn]}>
              {dndChecked ? <Text style={styles.checkmark}>✓</Text> : null}
            </View>
            <Text style={styles.checkLabel}>I've turned on Do Not Disturb</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.checkRow}
            onPress={() => setBatteryChecked(!batteryChecked)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, batteryChecked && styles.checkboxOn]}>
              {batteryChecked ? <Text style={styles.checkmark}>✓</Text> : null}
            </View>
            <Text style={styles.checkLabel}>My phone is charged and I have a stable connection</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.startButton, !canStart && styles.startButtonDisabled]}
          onPress={handleStart}
          disabled={!canStart}
          activeOpacity={0.85}
        >
          <Text style={styles.startButtonText}>
            {starting ? 'Starting...' : 'Start CAT'}
          </Text>
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
  courseCode: { color: '#C9A961', fontSize: 11, fontWeight: '700', letterSpacing: 2, marginBottom: 8 },
  title: { color: '#1B2A4E', fontSize: 24, fontWeight: '700', letterSpacing: -0.4, lineHeight: 32 },
  courseName: { color: '#6B7383', fontSize: 14, marginTop: 4 },
  metaRow: { flexDirection: 'row', gap: 12, marginTop: 20, marginBottom: 24 },
  metaItem: {
    flex: 1, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12,
    borderWidth: 1.5, borderColor: '#E8E6E1',
  },
  metaLabel: { color: '#8A93A5', fontSize: 9, fontWeight: '700', letterSpacing: 1.5, marginBottom: 6 },
  metaValue: { color: '#1B2A4E', fontSize: 14, fontWeight: '700' },
  section: { marginBottom: 24 },
  sectionLabel: { color: '#C9A961', fontSize: 11, fontWeight: '700', letterSpacing: 2, marginBottom: 10 },
  body: { color: '#1B2A4E', fontSize: 15, lineHeight: 23 },
  warningBox: {
    backgroundColor: '#FFF5E5', borderRadius: 16, padding: 18,
    borderWidth: 2, borderColor: '#B8860B', marginBottom: 24,
  },
  warningTitle: { color: '#B8860B', fontSize: 15, fontWeight: '700', marginBottom: 10 },
  warningBody: { color: '#1B2A4E', fontSize: 13, lineHeight: 20 },
  dndInstruction: { color: '#1B2A4E', fontSize: 13, marginBottom: 8, fontWeight: '500' },
  dndSteps: { marginBottom: 16 },
  dndStep: { color: '#6B7383', fontSize: 12, lineHeight: 19 },
  checkRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14,
    borderWidth: 1.5, borderColor: '#E8E6E1', marginBottom: 10,
  },
  checkbox: {
    width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: '#C9A961',
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  checkboxOn: { backgroundColor: '#C9A961' },
  checkmark: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  checkLabel: { color: '#1B2A4E', fontSize: 14, flex: 1, lineHeight: 20 },
  startButton: {
    backgroundColor: '#1B2A4E', paddingVertical: 18, borderRadius: 14,
    alignItems: 'center', marginTop: 8,
  },
  startButtonDisabled: { opacity: 0.4 },
  startButtonText: { color: '#F8F7F5', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
  errorBox: { backgroundColor: '#F5E5E5', borderRadius: 12, padding: 12, marginBottom: 16 },
  errorText: { color: '#A93B3B', fontSize: 13 },
});