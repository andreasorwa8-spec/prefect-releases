import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '@/lib/api';

export default function NewComplaint() {
  const router = useRouter();
  const [targetType, setTargetType] = useState('DEPARTMENT');
  const [courses, setCourses] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [selectedLecturerId, setSelectedLecturerId] = useState(null);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get('/api/courses');
        const enrolled = res.enrolled || [];
        setCourses(enrolled);
        // Unique lecturers from enrolled courses
        const seen = {};
        const list = [];
        for (const c of enrolled) {
          if (c.lecturer && c.lecturer.id && !seen[c.lecturer.id]) {
            seen[c.lecturer.id] = true;
            list.push(c.lecturer);
          }
        }
        setLecturers(list);
      } catch (err) {
        // silent -- user can still complain to dept
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function submit() {
    if (!subject.trim() || !body.trim()) {
      Alert.alert('Missing info', 'Please add a subject and describe the issue.');
      return;
    }
    if (targetType === 'LECTURER' && !selectedLecturerId) {
      Alert.alert('Pick a lecturer', 'Please choose which lecturer this is about.');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        targetType,
        subject: subject.trim(),
        bodyText: body.trim(),
        isAnonymous,
        courseId: selectedCourseId || undefined,
        targetUserId: targetType === 'LECTURER' ? selectedLecturerId : undefined,
      };
      const res = await api.post('/api/complaints', payload);
      router.replace(`/student/complaints/${res.complaint.id}`);
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not submit complaint');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}><ActivityIndicator color="#C9A961" /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>New complaint</Text>
        <Text style={styles.subtitle}>
          Keep it factual. Your department or lecturer can see this.
        </Text>

        <Text style={styles.label}>Who is this about?</Text>
        <View style={styles.segRow}>
          <TouchableOpacity
            style={[styles.seg, targetType === 'DEPARTMENT' && styles.segActive]}
            onPress={() => setTargetType('DEPARTMENT')}
          >
            <Text style={[styles.segText, targetType === 'DEPARTMENT' && styles.segTextActive]}>
              Department
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.seg, targetType === 'LECTURER' && styles.segActive]}
            onPress={() => setTargetType('LECTURER')}
          >
            <Text style={[styles.segText, targetType === 'LECTURER' && styles.segTextActive]}>
              Lecturer
            </Text>
          </TouchableOpacity>
        </View>

        {targetType === 'LECTURER' && (
          <>
            <Text style={styles.label}>Which lecturer?</Text>
            {lecturers.length === 0 ? (
              <Text style={styles.hint}>No lecturers found on your courses.</Text>
            ) : (
              lecturers.map((l) => (
                <TouchableOpacity
                  key={l.id}
                  style={[styles.pickRow, selectedLecturerId === l.id && styles.pickRowActive]}
                  onPress={() => setSelectedLecturerId(l.id)}
                >
                  <Text style={[styles.pickText, selectedLecturerId === l.id && styles.pickTextActive]}>
                    {l.name || l.email}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </>
        )}

        <Text style={styles.label}>Related course (optional)</Text>
        {courses.length === 0 ? (
          <Text style={styles.hint}>No courses to link.</Text>
        ) : (
          courses.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={[styles.pickRow, selectedCourseId === c.id && styles.pickRowActive]}
              onPress={() => setSelectedCourseId(selectedCourseId === c.id ? null : c.id)}
            >
              <Text style={[styles.pickText, selectedCourseId === c.id && styles.pickTextActive]}>
                {c.code} - {c.name}
              </Text>
            </TouchableOpacity>
          ))
        )}

        <Text style={styles.label}>Subject</Text>
        <TextInput
          style={styles.input}
          value={subject}
          onChangeText={setSubject}
          placeholder="Short summary"
          placeholderTextColor="#B0B6C2"
          maxLength={120}
        />

        <Text style={styles.label}>What happened?</Text>
        <TextInput
          style={[styles.input, styles.inputMulti]}
          value={body}
          onChangeText={setBody}
          placeholder="Describe the issue clearly..."
          placeholderTextColor="#B0B6C2"
          multiline
          numberOfLines={6}
        />

        <View style={styles.switchRow}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={styles.switchLabel}>File anonymously</Text>
            <Text style={styles.switchHint}>
              Your name is hidden from the lecturer. Your department can still see it while they review.
            </Text>
          </View>
          <Switch
            value={isAnonymous}
            onValueChange={setIsAnonymous}
            trackColor={{ false: '#E8E6E1', true: '#C9A961' }}
            thumbColor={isAnonymous ? '#1B2A4E' : '#F8F7F5'}
          />
        </View>

        <TouchableOpacity
          style={[styles.submit, submitting && { opacity: 0.6 }]}
          onPress={submit}
          disabled={submitting}
          activeOpacity={0.85}
        >
          {submitting ? (
            <ActivityIndicator color="#F8F7F5" />
          ) : (
            <Text style={styles.submitText}>Submit complaint</Text>
          )}
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
  title: { color: '#1B2A4E', fontSize: 26, fontWeight: '700' },
  subtitle: { color: '#6B7383', fontSize: 13, marginTop: 4, marginBottom: 20 },
  label: { color: '#1B2A4E', fontSize: 12, fontWeight: '700', letterSpacing: 0.5, marginTop: 18, marginBottom: 8, textTransform: 'uppercase' },
  segRow: { flexDirection: 'row', gap: 10 },
  seg: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, borderColor: '#E8E6E1', backgroundColor: '#FFFFFF', alignItems: 'center' },
  segActive: { backgroundColor: '#1B2A4E', borderColor: '#1B2A4E' },
  segText: { color: '#6B7383', fontSize: 13, fontWeight: '600' },
  segTextActive: { color: '#F8F7F5' },
  pickRow: { paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1.5, borderColor: '#E8E6E1', backgroundColor: '#FFFFFF', marginBottom: 8 },
  pickRowActive: { borderColor: '#1B2A4E', backgroundColor: '#EEF2F8' },
  pickText: { color: '#6B7383', fontSize: 13 },
  pickTextActive: { color: '#1B2A4E', fontWeight: '700' },
  hint: { color: '#8A93A5', fontSize: 12, paddingVertical: 8 },
  input: { backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1.5, borderColor: '#E8E6E1', padding: 14, color: '#1B2A4E', fontSize: 14 },
  inputMulti: { minHeight: 120, textAlignVertical: 'top' },
  switchRow: { flexDirection: 'row', alignItems: 'center', marginTop: 20, backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1.5, borderColor: '#E8E6E1', padding: 14 },
  switchLabel: { color: '#1B2A4E', fontSize: 14, fontWeight: '700' },
  switchHint: { color: '#8A93A5', fontSize: 11, marginTop: 4, lineHeight: 15 },
  submit: { backgroundColor: '#1B2A4E', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 28 },
  submitText: { color: '#F8F7F5', fontSize: 15, fontWeight: '700' },
});