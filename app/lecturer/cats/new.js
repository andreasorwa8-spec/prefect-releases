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

const emptyQuestion = () => ({
  type: 'MCQ',
  prompt: '',
  options: ['', '', '', ''],
  correct: '',
  points: 1,
});

export default function NewCAT() {
  const router = useRouter();
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [courseId, setCourseId] = useState(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [durationMin, setDurationMin] = useState('60');
  const [windowStart, setWindowStart] = useState('');
  const [windowEnd, setWindowEnd] = useState('');
  const [maxScore, setMaxScore] = useState('100');
  const [shuffleQs, setShuffleQs] = useState(true);
  const [gracePeriodSec, setGracePeriodSec] = useState('0');
  const [publishNow, setPublishNow] = useState(true);

  const [questions, setQuestions] = useState([emptyQuestion()]);

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

  function parseDate(str) {
    if (!str) return null;
    const s = str.includes('T') ? str : str.replace(' ', 'T');
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }

  function updateQuestion(idx, patch) {
    setQuestions((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], ...patch };
      return next;
    });
  }

  function updateOption(qIdx, optIdx, value) {
    setQuestions((prev) => {
      const next = [...prev];
      const opts = [...next[qIdx].options];
      opts[optIdx] = value;
      next[qIdx] = { ...next[qIdx], options: opts };
      return next;
    });
  }

  function addQuestion() {
    setQuestions((prev) => [...prev, emptyQuestion()]);
  }

  function removeQuestion(idx) {
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleCreate() {
    setError('');

    if (!courseId) return setError('Pick a course');
    if (!title.trim()) return setError('Title is required');

    const dur = parseInt(durationMin, 10);
    if (!Number.isFinite(dur) || dur < 1 || dur > 600) {
      return setError('Duration must be between 1 and 600 minutes');
    }

    const winStart = parseDate(windowStart.trim());
    const winEnd = parseDate(windowEnd.trim());
    if (!winStart || !winEnd) {
      return setError('Window start and end must be valid dates (YYYY-MM-DD HH:MM)');
    }
    if (winEnd.getTime() <= winStart.getTime()) {
      return setError('Window end must be after start');
    }

    const max = parseInt(maxScore, 10);
    if (!Number.isFinite(max) || max < 1) {
      return setError('Max score must be at least 1');
    }

    const grace = parseInt(gracePeriodSec, 10) || 0;

    // Validate questions
    const cleanedQuestions = [];
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.prompt.trim()) {
        return setError(`Question ${i + 1}: prompt is required`);
      }
      if (q.type === 'MCQ') {
        const opts = q.options.filter((o) => o.trim());
        if (opts.length < 2) {
          return setError(`Question ${i + 1}: MCQ needs at least 2 options`);
        }
        if (!q.correct.trim()) {
          return setError(`Question ${i + 1}: correct answer is required`);
        }
        if (!opts.includes(q.correct.trim())) {
          return setError(`Question ${i + 1}: correct answer must match one option`);
        }
        cleanedQuestions.push({
          type: 'MCQ',
          prompt: q.prompt.trim(),
          options: opts.map((o) => o.trim()),
          correct: q.correct.trim(),
          points: q.points,
        });
      } else {
        cleanedQuestions.push({
          type: 'SHORT_ANSWER',
          prompt: q.prompt.trim(),
          correct: q.correct.trim() || null,
          points: q.points,
        });
      }
    }

    setSubmitting(true);
    try {
      const res = await api.post('/api/cats', {
        courseId,
        title: title.trim(),
        description: description.trim() || null,
        durationMin: dur,
        windowStart: winStart.toISOString(),
        windowEnd: winEnd.toISOString(),
        maxScore: max,
        shuffleQs,
        gracePeriodSec: grace,
        questions: cleanedQuestions,
      });

      if (publishNow && res.cat?.id) {
        await api.patch(`/api/cats/${res.cat.id}`, { publish: true });
      }

      Alert.alert(
        publishNow ? 'CAT published' : 'Draft saved',
        publishNow
          ? 'Students can take it during the window.'
          : 'Publish it later from the list.'
      );
      router.replace('/lecturer/cats');
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
            <Text style={styles.brandText}>NEW CAT</Text>
          </View>
          <Text style={styles.title}>Create a test</Text>
          <Text style={styles.subtitle}>
            Proctored — students cannot leave during the exam.
          </Text>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.section}>
            <Text style={styles.label}>COURSE</Text>
            {courses.length === 0 ? (
              <Text style={styles.emptyText}>You have no courses yet.</Text>
            ) : (
              <View style={styles.courseList}>
                {courses.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.chip, courseId === c.id && styles.chipActive]}
                    onPress={() => setCourseId(c.id)}
                  >
                    <Text style={[styles.chipText, courseId === c.id && styles.chipTextActive]}>
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
              placeholder="e.g. CAT 1 — Data Structures"
              placeholderTextColor="#8A93A5"
              value={title}
              onChangeText={setTitle}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>DESCRIPTION (optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Any instructions for students..."
              placeholderTextColor="#8A93A5"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>DURATION (min)</Text>
              <TextInput
                style={styles.input}
                placeholder="60"
                placeholderTextColor="#8A93A5"
                value={durationMin}
                onChangeText={setDurationMin}
                keyboardType="number-pad"
              />
            </View>
            <View style={{ flex: 1 }}>
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
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>WINDOW START</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD HH:MM"
              placeholderTextColor="#8A93A5"
              value={windowStart}
              onChangeText={setWindowStart}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>WINDOW END</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD HH:MM"
              placeholderTextColor="#8A93A5"
              value={windowEnd}
              onChangeText={setWindowEnd}
              autoCapitalize="none"
            />
            <Text style={styles.hint}>
              When the CAT opens and closes. Students can start any time in this window.
            </Text>
          </View>

          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.switchLabel}>Shuffle questions</Text>
              <Text style={styles.switchHint}>Each student gets a different order</Text>
            </View>
            <Switch
              value={shuffleQs}
              onValueChange={setShuffleQs}
              trackColor={{ true: '#C9A961', false: '#E8E6E1' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>QUESTIONS</Text>
            {questions.map((q, idx) => (
              <View key={idx} style={styles.questionCard}>
                <View style={styles.questionHeader}>
                  <Text style={styles.questionNum}>Q{idx + 1}</Text>
                  {questions.length > 1 ? (
                    <TouchableOpacity onPress={() => removeQuestion(idx)}>
                      <Text style={styles.removeText}>Remove</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>

                <View style={styles.typeRow}>
                  <TouchableOpacity
                    style={[styles.typeChip, q.type === 'MCQ' && styles.typeChipActive]}
                    onPress={() => updateQuestion(idx, { type: 'MCQ' })}
                  >
                    <Text style={[styles.typeText, q.type === 'MCQ' && styles.typeTextActive]}>
                      Multiple choice
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.typeChip, q.type === 'SHORT_ANSWER' && styles.typeChipActive]}
                    onPress={() => updateQuestion(idx, { type: 'SHORT_ANSWER' })}
                  >
                    <Text style={[styles.typeText, q.type === 'SHORT_ANSWER' && styles.typeTextActive]}>
                      Short answer
                    </Text>
                  </TouchableOpacity>
                </View>

                <TextInput
                  style={[styles.input, { marginTop: 10 }]}
                  placeholder="Question prompt"
                  placeholderTextColor="#8A93A5"
                  value={q.prompt}
                  onChangeText={(t) => updateQuestion(idx, { prompt: t })}
                  multiline
                />

                {q.type === 'MCQ' ? (
                  <View style={{ marginTop: 10 }}>
                    {q.options.map((opt, oi) => (
                      <TextInput
                        key={oi}
                        style={[styles.input, { marginTop: 6 }]}
                        placeholder={`Option ${oi + 1}`}
                        placeholderTextColor="#8A93A5"
                        value={opt}
                        onChangeText={(t) => updateOption(idx, oi, t)}
                      />
                    ))}
                    <TextInput
                      style={[styles.input, styles.correctInput, { marginTop: 10 }]}
                      placeholder="Correct answer (must match one option)"
                      placeholderTextColor="#2E7D5B"
                      value={q.correct}
                      onChangeText={(t) => updateQuestion(idx, { correct: t })}
                    />
                  </View>
                ) : (
                  <TextInput
                    style={[styles.input, { marginTop: 10 }]}
                    placeholder="Expected answer (or leave blank for AI grading)"
                    placeholderTextColor="#8A93A5"
                    value={q.correct}
                    onChangeText={(t) => updateQuestion(idx, { correct: t })}
                  />
                )}
              </View>
            ))}

            <TouchableOpacity
              style={styles.addQuestionButton}
              onPress={addQuestion}
              activeOpacity={0.85}
            >
              <Text style={styles.addQuestionText}>+ Add another question</Text>
            </TouchableOpacity>
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
  textArea: { minHeight: 80 },
  correctInput: { borderColor: '#2E7D5B' },
  hint: { color: '#8A93A5', fontSize: 12, marginTop: 6 },
  row: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  emptyText: { color: '#8A93A5', fontSize: 13 },
  courseList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#E8E6E1',
  },
  chipActive: { backgroundColor: '#1B2A4E', borderColor: '#1B2A4E' },
  chipText: { color: '#6B7383', fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: '#F8F7F5' },
  switchRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14,
    borderWidth: 1.5, borderColor: '#E8E6E1', marginBottom: 20,
  },
  switchLabel: { color: '#1B2A4E', fontSize: 15, fontWeight: '600' },
  switchHint: { color: '#8A93A5', fontSize: 12, marginTop: 2 },
  questionCard: {
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14,
    borderWidth: 1.5, borderColor: '#E8E6E1', marginBottom: 12,
  },
  questionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 10,
  },
  questionNum: { color: '#C9A961', fontSize: 12, fontWeight: '700', letterSpacing: 1.5 },
  removeText: { color: '#A93B3B', fontSize: 12, fontWeight: '600' },
  typeRow: { flexDirection: 'row', gap: 8 },
  typeChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
    backgroundColor: '#F8F7F5', borderWidth: 1.5, borderColor: '#E8E6E1',
  },
  typeChipActive: { backgroundColor: '#EAF5EF', borderColor: '#2E7D5B' },
  typeText: { color: '#6B7383', fontSize: 12, fontWeight: '600' },
  typeTextActive: { color: '#2E7D5B' },
  addQuestionButton: {
    backgroundColor: '#FFFFFF', paddingVertical: 14, borderRadius: 12,
    borderWidth: 1.5, borderColor: '#C9A961', borderStyle: 'dashed',
    alignItems: 'center', marginTop: 6,
  },
  addQuestionText: { color: '#C9A961', fontSize: 13, fontWeight: '700' },
  submitButton: {
    backgroundColor: '#1B2A4E', paddingVertical: 18, borderRadius: 14,
    alignItems: 'center',
  },
  submitButtonDisabled: { opacity: 0.5 },
  submitButtonText: { color: '#F8F7F5', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
});