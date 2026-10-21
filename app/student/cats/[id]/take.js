import { useEffect, useState, useRef, useCallback } from 'react';
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
  AppState,
  BackHandler,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useKeepAwake } from 'expo-keep-awake';
import * as ScreenCapture from 'expo-screen-capture';
import { api } from '@/lib/api';

const HEARTBEAT_MS = 15000;
const AUTOSAVE_DEBOUNCE_MS = 1500;

export default function TakeCAT() {
  useKeepAwake();

  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const submittedRef = useRef(false);
  const autosaveTimers = useRef({});

  const load = useCallback(async () => {
    try {
      setError('');
      const res = await api.post(`/api/cats/${id}/start`, {});
      setAttempt(res.attempt);
      setQuestions(res.questions || []);
      setAnswers(res.attempt.answers || {});

      const deadline = new Date(res.attempt.deadlineAt).getTime();
      setSecondsLeft(Math.max(0, Math.floor((deadline - Date.now()) / 1000)));
    } catch (err) {
      setError(err.message || 'Failed to load CAT');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const submit = useCallback(
    async (reason) => {
      const r = reason || 'MANUAL';
      if (submittedRef.current || !attempt) return;
      submittedRef.current = true;
      setSubmitting(true);
      try {
        await api.post('/api/cats/attempts/' + attempt.id + '/submit', {
          reason: r,
          answers,
        });
        router.replace('/student/cats/' + id + '/result');
      } catch (err) {
        submittedRef.current = false;
        setSubmitting(false);
        if (r === 'MANUAL') {
          Alert.alert('Submit failed', err.message || 'Please try again');
        }
      }
    },
    [attempt, answers, id, router]
  );

  useEffect(() => {
    ScreenCapture.preventScreenCaptureAsync().catch(function () {});
    return () => {
      ScreenCapture.allowScreenCaptureAsync().catch(function () {});
    };
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active' && !submittedRef.current) {
        submit('LEFT_APP');
      }
    });
    return () => sub.remove();
  }, [submit]);

  useEffect(() => {
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!submittedRef.current) {
        Alert.alert(
          'Leaving submits your CAT',
          'Are you sure you want to leave? Your answers will submit instantly.',
          [
            { text: 'Stay', style: 'cancel' },
            { text: 'Leave & submit', style: 'destructive', onPress: () => submit('LEFT_APP') },
          ]
        );
      }
      return true;
    });
    return () => handler.remove();
  }, [submit]);

  useEffect(() => {
    if (!attempt) return;
    const iv = setInterval(() => {
      api.post('/api/cats/attempts/' + attempt.id + '/heartbeat', {}).catch(function () {});
    }, HEARTBEAT_MS);
    return () => clearInterval(iv);
  }, [attempt]);

  useEffect(() => {
    if (!attempt) return;
    const iv = setInterval(() => {
      const deadline = new Date(attempt.deadlineAt).getTime();
      const left = Math.max(0, Math.floor((deadline - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left <= 0 && !submittedRef.current) {
        submit('TIMEOUT');
      }
    }, 1000);
    return () => clearInterval(iv);
  }, [attempt, submit]);

  const queueAutosave = useCallback(
    (questionId, value) => {
      if (!attempt) return;
      if (autosaveTimers.current[questionId]) {
        clearTimeout(autosaveTimers.current[questionId]);
      }
      autosaveTimers.current[questionId] = setTimeout(() => {
        api
          .patch('/api/cats/attempts/' + attempt.id + '/answer', {
            questionId,
            answer: value,
          })
          .catch(function (err) { console.warn('Autosave failed', err.message); });
      }, AUTOSAVE_DEBOUNCE_MS);
    },
    [attempt]
  );

  function setAnswer(questionId, value) {
    setAnswers((prev) => {
      const next = { ...prev, [questionId]: value };
      queueAutosave(questionId, value);
      return next;
    });
  }

  function formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return m + ':' + String(s).padStart(2, '0');
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

  if (error || !attempt) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.scroll}>
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error || 'CAT unavailable'}</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const isLowTime = secondsLeft > 0 && secondsLeft <= 60;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={[styles.timerBar, isLowTime && styles.timerBarLow]}>
        <View>
          <Text style={styles.timerLabel}>TIME LEFT</Text>
          <Text style={[styles.timerValue, isLowTime && styles.timerValueLow]}>
            {formatTime(secondsLeft)}
          </Text>
        </View>
        <View style={styles.timerRight}>
          <Text style={styles.timerLock}>Proctored</Text>
          <Text style={styles.timerHint}>Do not leave the app</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {questions.map((q, idx) => (
          <View key={q.id} style={styles.questionCard}>
            <View style={styles.questionHeader}>
              <Text style={styles.questionNum}>Q{idx + 1}</Text>
              <Text style={styles.questionPoints}>
                {q.points} pt{q.points > 1 ? 's' : ''}
              </Text>
            </View>
            <Text style={styles.questionPrompt}>{q.prompt}</Text>

            {q.type === 'MCQ' && Array.isArray(q.options) ? (
              <View style={styles.optionsContainer}>
                {q.options.map((opt, i) => {
                  const selected = answers[q.id] === opt;
                  return (
                    <TouchableOpacity
                      key={i}
                      style={[styles.option, selected && styles.optionSelected]}
                      onPress={() => setAnswer(q.id, opt)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.radio, selected && styles.radioOn]}>
                        {selected ? <View style={styles.radioDot} /> : null}
                      </View>
                      <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                        {opt}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <TextInput
                style={styles.textInput}
                multiline
                placeholder="Type your answer..."
                placeholderTextColor="#8A93A5"
                value={answers[q.id] || ''}
                onChangeText={(t) => setAnswer(q.id, t)}
                textAlignVertical="top"
              />
            )}
          </View>
        ))}

        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={() => {
            Alert.alert(
              'Submit CAT?',
              'You cannot change your answers after submitting.',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Submit', style: 'default', onPress: () => submit('MANUAL') },
              ]
            );
          }}
          disabled={submitting}
          activeOpacity={0.85}
        >
          <Text style={styles.submitButtonText}>
            {submitting ? 'Submitting...' : 'Submit CAT'}
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
  scroll: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },
  timerBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#1B2A4E', paddingHorizontal: 20, paddingVertical: 14,
  },
  timerBarLow: { backgroundColor: '#A93B3B' },
  timerLabel: { color: '#C9A961', fontSize: 10, fontWeight: '700', letterSpacing: 2, marginBottom: 2 },
  timerValue: { color: '#F8F7F5', fontSize: 24, fontWeight: '700' },
  timerValueLow: { color: '#FFFFFF' },
  timerRight: { alignItems: 'flex-end' },
  timerLock: { color: '#F8F7F5', fontSize: 13, fontWeight: '700' },
  timerHint: { color: '#C9A961', fontSize: 11, marginTop: 2 },
  questionCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 18,
    marginBottom: 14, borderWidth: 1.5, borderColor: '#E8E6E1',
  },
  questionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 12,
  },
  questionNum: { color: '#C9A961', fontSize: 12, fontWeight: '700', letterSpacing: 1.5 },
  questionPoints: { color: '#8A93A5', fontSize: 11, fontWeight: '600' },
  questionPrompt: { color: '#1B2A4E', fontSize: 15, lineHeight: 23, marginBottom: 16, fontWeight: '500' },
  optionsContainer: { gap: 10 },
  option: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F8F7F5', borderRadius: 12, padding: 14,
    borderWidth: 1.5, borderColor: '#E8E6E1',
  },
  optionSelected: { backgroundColor: '#EAF5EF', borderColor: '#2E7D5B' },
  radio: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#C9A961',
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  radioOn: { borderColor: '#2E7D5B' },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#2E7D5B' },
  optionText: { color: '#1B2A4E', fontSize: 14, flex: 1, lineHeight: 20 },
  optionTextSelected: { fontWeight: '600' },
  textInput: {
    backgroundColor: '#F8F7F5', borderRadius: 12, padding: 14,
    borderWidth: 1.5, borderColor: '#E8E6E1',
    color: '#1B2A4E', fontSize: 15, minHeight: 100,
  },
  submitButton: {
    backgroundColor: '#2E7D5B', paddingVertical: 18, borderRadius: 14,
    alignItems: 'center', marginTop: 12,
  },
  submitButtonDisabled: { opacity: 0.5 },
  submitButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
  errorBox: { backgroundColor: '#F5E5E5', borderRadius: 12, padding: 12, marginBottom: 16 },
  errorText: { color: '#A93B3B', fontSize: 13 },
});