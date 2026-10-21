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
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '@/lib/api';

export default function NewAssignment() {
  const router = useRouter();
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [courseId, setCourseId] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [maxScore, setMaxScore] = useState('100');
  const [publishNow, setPublishNow] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const dash = await api.get('/api/lecturer/dashboard');
        const list = dash.courses || [];
        setCourses(list);
        if (list.length > 0) setCourseId(list[0].id);
      } catch (err) {
        setError(err.message || 'Failed to load courses');
      } finally {
        setLoadingCourses(false);
      }
    }
    load();
  }, []);

  function parseDueAt(str) {
    if (!str) return null;
    // Accept YYYY-MM-DD or YYYY-MM-DD HH:MM
    const s = str.includes('T') ? str : str.replace(' ', 'T');
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }

  async function handleCreate() {
    setError('');

    if (!courseId) return setError('Pick a course');
    if (!title.trim()) return setError('Title is required');
    if (!description.trim()) return setError('Description is required');

    const dueDate = parseDueAt(dueAt.trim());
    if (!dueDate) {
      return setError('Due date must be YYYY-MM-DD or YYYY-MM-DD HH:MM');
    }
    if (dueDate.getTime() < Date.now()) {
      return setError('Due date must be in the future');
    }

    const max = parseInt(maxScore, 10);
    if (!Number.isFinite(max) || max < 1 || max > 1000) {
      return setError('Max score must be between 1 and 1000');
    }

    setSubmitting(true);
    try {
      const res = await api.post('/api/assignments', {
        courseId,
        title: title.trim(),
        description: description.trim(),
        dueAt: dueDate.toISOString(),
        maxScore: max,
      });

      // Immediately publish if requested
      if (publishNow && res.assignment?.id) {
        await api.patch(`/api/assignments/${res.assignment.id}`, { publish: true });
      }

      Alert.alert(
        publishNow ? 'Assignment published' : 'Draft saved',
        publishNow
          ? 'Students can now see this assignment.'
          : 'Save as draft — publish it later from the list.'
      );
      router.replace('/lecturer/assignments');
    } catch (err) {
      setError(err.message || 'Failed to create');
      setSubmitting(false);
    }
  }

  if (loadingCourses) {
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
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>

          <View style={styles.brandRow}>
            <View style={styles.brandDot} />
            <Text style={styles.brandText}>NEW ASSIGNMENT</Text>
          </View>
          <Text style={styles.title}>Create work</Text>
          <Text style={styles.subtitle}>Students see this once published.</Text>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.section}>
            <Text style={styles.label}>COURSE</Text>
            {courses.length === 0 ? (
              <Text style={styles.emptyText}>
                You have no courses yet. Create one from the web dashboard.
              </Text>
            ) : (
              <View style={styles.courseList}>
                {courses.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.courseChip, courseId === c.id && styles.courseChipActive]}
                    onPress={() => setCourseId(c.id)}
                  >
                    <Text
                      style={[
                        styles.courseChipText,
                        courseId === c.id && styles.courseChipTextActive,
                      ]}
                    >
                      {c.code}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>TITLE</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Essay 1: Postcolonial Literature"
              placeholderTextColor="#8A93A5"
              value={title}
              onChangeText={setTitle}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>INSTRUCTIONS</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="What should students do?"
              placeholderTextColor="#8A93A5"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>DUE DATE</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD HH:MM"
              placeholderTextColor="#8A93A5"
              value={dueAt}
              onChangeText={setDueAt}
              autoCapitalize="none"
            />
            <Text style={styles.hint}>
              Format: 2026-11-15 23:59 (local time)
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>MAX SCORE</Text>
            <TextInput
              style={styles.input}
              placeholder="100"
              placeholderTextColor="#8A93A5"
              value={maxScore}
              onChangeText={setMaxScore}
              keyboardType="number-pad"
            />
          </View>

          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.switchLabel}>Publish now</Text>
              <Text style={styles.switchHint}>
                Off = save as draft, publish later
              </Text>
            </View>
            <Switch
              value={publishNow}
              onValueChange={setPublishNow}
              trackColor={{ true: '#C9A961', false: '#E8E6E1' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            onPress={handleCreate}
            disabled={submitting || courses.length === 0}
            activeOpacity={0.85}
          >
            <Text style={styles.submitButtonText}>
              {submitting
                ? 'Creating...'
                : publishNow
                ? 'Create & publish'
                : 'Save draft'}
            </Text>
          </TouchableOpacity>

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
  brandRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  brandDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#C9A961', marginRight: 8 },
  brandText: { color: '#C9A961', fontSize: 11, fontWeight: '700', letterSpacing: 2 },
  title: { color: '#1B2A4E', fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  subtitle: { color: '#6B7383', fontSize: 14, marginTop: 4, marginBottom: 24 },
  errorBox: {
    backgroundColor: '#F5E5E5', borderRadius: 12, padding: 12, marginBottom: 16,
  },
  errorText: { color: '#A93B3B', fontSize: 13 },
  section: { marginBottom: 20 },
  label: { color: '#C9A961', fontSize: 11, fontWeight: '700', letterSpacing: 2, marginBottom: 8 },
  input: {
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14,
    borderWidth: 1.5, borderColor: '#E8E6E1',
    color: '#1B2A4E', fontSize: 15,
  },
  textArea: { minHeight: 120 },
  hint: { color: '#8A93A5', fontSize: 12, marginTop: 6 },
  emptyText: { color: '#8A93A5', fontSize: 13 },
  courseList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  courseChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#E8E6E1',
  },
  courseChipActive: { backgroundColor: '#1B2A4E', borderColor: '#1B2A4E' },
  courseChipText: { color: '#6B7383', fontSize: 13, fontWeight: '600' },
  courseChipTextActive: { color: '#F8F7F5' },
  switchRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14,
    borderWidth: 1.5, borderColor: '#E8E6E1', marginBottom: 24,
  },
  switchLabel: { color: '#1B2A4E', fontSize: 15, fontWeight: '600' },
  switchHint: { color: '#8A93A5', fontSize: 12, marginTop: 2 },
  submitButton: {
    backgroundColor: '#1B2A4E', paddingVertical: 18, borderRadius: 14,
    alignItems: 'center',
  },
  submitButtonDisabled: { opacity: 0.5 },
  submitButtonText: { color: '#F8F7F5', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
});