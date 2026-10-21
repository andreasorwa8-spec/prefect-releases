import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '@/lib/api';

const STATUS_LABEL = {
  PENDING: 'Not submitted',
  SUBMITTED: 'Submitted',
  LATE: 'Late',
  MISSING: 'Missing',
  GRADED: 'Graded',
};

export default function GradeSubmission() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [score, setScore] = useState('');
  const [feedback, setFeedback] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      setError('');
      const res = await api.get(`/api/submissions/${id}`);
      setSubmission(res.submission);
      setScore(res.submission.score != null ? String(res.submission.score) : '');
      setFeedback(res.submission.feedback || '');
    } catch (err) {
      setError(err.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [id]);

  async function handleAiDraft() {
    setAiLoading(true);
    try {
      const res = await api.post(`/api/submissions/${id}/ai-draft`, {});
      if (res.aiFeedback) {
        setFeedback(res.aiFeedback);
        Alert.alert(
          'AI draft ready',
          'Feedback has been filled in. Review and edit before publishing.'
        );
      } else {
        Alert.alert('No draft', 'AI did not return feedback. Try again or write your own.');
      }
    } catch (err) {
      Alert.alert('AI unavailable', err.message || 'Please write feedback manually.');
    } finally {
      setAiLoading(false);
    }
  }

  async function handleSave(publish) {
    setError('');

    const parsed = parseInt(score, 10);
    const max = submission.assignment.maxScore;

    if (publish) {
      if (!Number.isFinite(parsed) || parsed < 0 || parsed > max) {
        return setError(`Score must be between 0 and ${max}`);
      }
    } else if (score.trim()) {
      if (!Number.isFinite(parsed) || parsed < 0 || parsed > max) {
        return setError(`Score must be between 0 and ${max}`);
      }
    }

    setSaving(true);
    try {
      const body = { feedback: feedback.trim() };
      if (score.trim()) body.score = parsed;
      if (publish) body.publish = true;

      await api.patch(`/api/submissions/${id}`, body);
      Alert.alert(
        publish ? 'Grade published' : 'Saved',
        publish ? 'The student can now see their score.' : 'Saved as draft.'
      );
      router.back();
    } catch (err) {
      setError(err.message || 'Failed to save');
      setSaving(false);
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

  if (error && !submission) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.scroll}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error || 'Not found'}</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const s = submission;
  const max = s.assignment.maxScore;
  const status = s.status || 'PENDING';
  const isGraded = status === 'GRADED';

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>

          <Text style={styles.courseCode}>{s.assignment.course?.code}</Text>
          <Text style={styles.title}>{s.assignment.title}</Text>

          <View style={styles.studentCard}>
            <Text style={styles.studentName}>
              {s.student?.name || s.student?.admissionNumber || 'Student'}
            </Text>
            <Text style={styles.studentMeta}>
              {s.student?.admissionNumber || s.student?.email}
            </Text>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Status:</Text>
              <Text style={styles.statusValue}>{STATUS_LABEL[status]}</Text>
              {s.submittedAt ? (
                <Text style={styles.submitted}>
                  · {new Date(s.submittedAt).toLocaleString()}
                </Text>
              ) : null}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>STUDENT SUBMISSION</Text>
            {s.content ? (
              <View style={styles.contentBox}>
                <Text style={styles.contentText}>{s.content}</Text>
              </View>
            ) : (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>No text submitted.</Text>
              </View>
            )}
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>FEEDBACK</Text>
              <TouchableOpacity
                style={styles.aiButton}
                onPress={handleAiDraft}
                disabled={aiLoading}
                activeOpacity={0.7}
              >
                <Text style={styles.aiButtonText}>
                  {aiLoading ? 'Drafting...' : '✨ AI Draft'}
                </Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.textArea}
              placeholder="Write feedback for the student..."
              placeholderTextColor="#8A93A5"
              value={feedback}
              onChangeText={setFeedback}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>SCORE (out of {max})</Text>
            <TextInput
              style={styles.scoreInput}
              placeholder="—"
              placeholderTextColor="#8A93A5"
              value={score}
              onChangeText={setScore}
              keyboardType="number-pad"
            />
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.secondaryButton, saving && styles.buttonDisabled]}
              onPress={() => handleSave(false)}
              disabled={saving}
              activeOpacity={0.85}
            >
              <Text style={styles.secondaryButtonText}>
                {isGraded ? 'Save changes' : 'Save draft'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.primaryButton, saving && styles.buttonDisabled]}
              onPress={() => handleSave(true)}
              disabled={saving}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryButtonText}>
                {isGraded ? 'Update grade' : 'Publish grade'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
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
  courseCode: { color: '#C9A961', fontSize: 11, fontWeight: '700', letterSpacing: 2, marginBottom: 6 },
  title: { color: '#1B2A4E', fontSize: 22, fontWeight: '700', lineHeight: 30, marginBottom: 16 },
  studentCard: {
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16,
    borderWidth: 1.5, borderColor: '#E8E6E1', marginBottom: 20,
  },
  studentName: { color: '#1B2A4E', fontSize: 16, fontWeight: '700' },
  studentMeta: { color: '#8A93A5', fontSize: 12, marginTop: 2 },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 6 },
  statusLabel: { color: '#8A93A5', fontSize: 12 },
  statusValue: { color: '#1B2A4E', fontSize: 12, fontWeight: '700' },
  submitted: { color: '#8A93A5', fontSize: 11 },
  section: { marginBottom: 20 },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionLabel: { color: '#C9A961', fontSize: 11, fontWeight: '700', letterSpacing: 2 },
  aiButton: {
    backgroundColor: '#EAF5EF', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 10, borderWidth: 1.5, borderColor: '#2E7D5B',
  },
  aiButtonText: { color: '#2E7D5B', fontSize: 12, fontWeight: '700' },
  contentBox: {
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14,
    borderWidth: 1.5, borderColor: '#E8E6E1',
  },
  contentText: { color: '#1B2A4E', fontSize: 14, lineHeight: 21 },
  emptyBox: {
    backgroundColor: '#F8F7F5', borderRadius: 12, padding: 20,
    borderWidth: 1.5, borderColor: '#E8E6E1', alignItems: 'center',
  },
  emptyText: { color: '#8A93A5', fontSize: 13, fontStyle: 'italic' },
  textArea: {
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14,
    borderWidth: 1.5, borderColor: '#E8E6E1',
    color: '#1B2A4E', fontSize: 14, minHeight: 120,
  },
  scoreInput: {
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14,
    borderWidth: 1.5, borderColor: '#E8E6E1',
    color: '#1B2A4E', fontSize: 20, fontWeight: '700',
    textAlign: 'center',
  },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  primaryButton: {
    flex: 1, backgroundColor: '#2E7D5B', paddingVertical: 16, borderRadius: 14,
    alignItems: 'center',
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  secondaryButton: {
    flex: 1, backgroundColor: '#FFFFFF', paddingVertical: 16, borderRadius: 14,
    alignItems: 'center', borderWidth: 1.5, borderColor: '#E8E6E1',
  },
  secondaryButtonText: { color: '#1B2A4E', fontSize: 15, fontWeight: '700' },
  buttonDisabled: { opacity: 0.5 },
  errorBox: {
    backgroundColor: '#F5E5E5', borderRadius: 12, padding: 12, marginBottom: 16,
  },
  errorText: { color: '#A93B3B', fontSize: 13 },
});