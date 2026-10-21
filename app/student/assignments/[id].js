import { useEffect, useState, useCallback } from 'react';
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
  PENDING: 'Not started',
  SUBMITTED: 'Submitted',
  LATE: 'Submitted late',
  MISSING: 'Missing',
  GRADED: 'Graded',
};

export default function AssignmentDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    try {
      setError('');
      const res = await api.get(`/api/assignments/${id}`);
      setAssignment(res.assignment);
      if (res.assignment?.mySubmission?.content) {
        setContent(res.assignment.mySubmission.content);
      }
    } catch (err) {
      setError(err.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [id]);

  async function handleSubmit() {
    if (!content.trim()) {
      Alert.alert('Empty submission', 'Write something before submitting.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/api/assignments/${id}/submit`, { content: content.trim() });
      Alert.alert('Submitted', 'Your work has been submitted.');
      load();
    } catch (err) {
      Alert.alert('Error', err.message || 'Submission failed');
    } finally {
      setSubmitting(false);
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

  if (error || !assignment) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.scroll}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>â†</Text>
          </TouchableOpacity>
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error || 'Assignment not found'}</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const sub = assignment.mySubmission;
  const graded = sub?.status === 'GRADED';
  const isOverdue = new Date(assignment.dueAt) < new Date();
  const canSubmit = !graded && (!sub || sub.status === 'PENDING' || sub.status === 'SUBMITTED' || sub.status === 'LATE');

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>â†</Text>
          </TouchableOpacity>

          <Text style={styles.courseCode}>{assignment.course?.code}</Text>
          <Text style={styles.title}>{assignment.title}</Text>
          <Text style={styles.courseName}>{assignment.course?.name}</Text>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>DUE</Text>
              <Text style={[styles.metaValue, isOverdue && !sub && styles.metaValueOverdue]}>
                {new Date(assignment.dueAt).toLocaleString(undefined, {
                  month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                })}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>MAX SCORE</Text>
              <Text style={styles.metaValue}>{assignment.maxScore}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>STATUS</Text>
              <Text style={styles.metaValue}>{STATUS_LABEL[sub?.status || 'PENDING']}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>INSTRUCTIONS</Text>
            <Text style={styles.body}>{assignment.description}</Text>
          </View>

          {graded ? (
            <View style={styles.gradeBox}>
              <View style={styles.gradeHeader}>
                <Text style={styles.gradeLabel}>YOUR GRADE</Text>
                <Text style={styles.gradeScore}>
                  {sub.score} / {assignment.maxScore}
                </Text>
              </View>
              {sub.feedback ? (
                <>
                  <Text style={styles.feedbackLabel}>Feedback</Text>
                  <Text style={styles.feedbackText}>{sub.feedback}</Text>
                </>
              ) : (
                <Text style={styles.feedbackEmpty}>No written feedback.</Text>
              )}
            </View>
          ) : (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>
                {sub ? 'YOUR SUBMISSION' : 'SUBMIT YOUR WORK'}
              </Text>
              <TextInput
                style={styles.textInput}
                multiline
                numberOfLines={10}
                placeholder="Type your answer here..."
                placeholderTextColor="#8A93A5"
                value={content}
                onChangeText={setContent}
                editable={canSubmit}
                textAlignVertical="top"
              />
              {sub?.submittedAt ? (
                <Text style={styles.submittedAt}>
                  Last submitted {new Date(sub.submittedAt).toLocaleString()}
                </Text>
              ) : null}
              {canSubmit ? (
                <TouchableOpacity
                  style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                  onPress={handleSubmit}
                  disabled={submitting}
                  activeOpacity={0.85}
                >
                  <Text style={styles.submitButtonText}>
                    {submitting ? 'Submitting...' : sub ? 'Resubmit' : 'Submit'}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          )}

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
  courseCode: { color: '#C9A961', fontSize: 11, fontWeight: '700', letterSpacing: 2, marginBottom: 8 },
  title: { color: '#1B2A4E', fontSize: 24, fontWeight: '700', letterSpacing: -0.4, lineHeight: 32 },
  courseName: { color: '#6B7383', fontSize: 14, marginTop: 4 },
  metaRow: {
    flexDirection: 'row', gap: 12, marginTop: 20, marginBottom: 24,
  },
  metaItem: {
    flex: 1, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12,
    borderWidth: 1.5, borderColor: '#E8E6E1',
  },
  metaLabel: {
    color: '#8A93A5', fontSize: 9, fontWeight: '700', letterSpacing: 1.5, marginBottom: 6,
  },
  metaValue: { color: '#1B2A4E', fontSize: 13, fontWeight: '700' },
  metaValueOverdue: { color: '#B8860B' },
  section: { marginBottom: 24 },
  sectionLabel: {
    color: '#C9A961', fontSize: 11, fontWeight: '700', letterSpacing: 2, marginBottom: 10,
  },
  body: { color: '#1B2A4E', fontSize: 15, lineHeight: 23 },
  gradeBox: {
    backgroundColor: '#EAF5EF', borderRadius: 16, padding: 20,
    borderWidth: 1.5, borderColor: '#2E7D5B', marginBottom: 24,
  },
  gradeHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline',
    marginBottom: 16,
  },
  gradeLabel: {
    color: '#2E7D5B', fontSize: 11, fontWeight: '700', letterSpacing: 1.5,
  },
  gradeScore: { color: '#2E7D5B', fontSize: 24, fontWeight: '700' },
  feedbackLabel: {
    color: '#2E7D5B', fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 6,
  },
  feedbackText: { color: '#1B2A4E', fontSize: 14, lineHeight: 21 },
  feedbackEmpty: { color: '#6B7383', fontSize: 13, fontStyle: 'italic' },
  textInput: {
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14,
    borderWidth: 1.5, borderColor: '#E8E6E1',
    color: '#1B2A4E', fontSize: 15, minHeight: 160,
  },
  submittedAt: { color: '#8A93A5', fontSize: 12, marginTop: 8, fontStyle: 'italic' },
  submitButton: {
    backgroundColor: '#1B2A4E', paddingVertical: 16, borderRadius: 14,
    alignItems: 'center', marginTop: 16,
  },
  submitButtonDisabled: { opacity: 0.5 },
  submitButtonText: { color: '#F8F7F5', fontSize: 15, fontWeight: '700', letterSpacing: 0.3 },
  errorBox: {
    backgroundColor: '#F5E5E5', borderRadius: 12, padding: 12, marginBottom: 16,
  },
  errorText: { color: '#A93B3B', fontSize: 13 },
});
