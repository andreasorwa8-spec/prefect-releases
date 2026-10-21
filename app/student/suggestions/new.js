import { useState } from 'react';
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '@/lib/api';

const CATEGORIES = ['Feature', 'Bug', 'UX', 'Content', 'Other'];

export default function NewSuggestion() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState('Feature');
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!title.trim() || !body.trim()) {
      Alert.alert('Missing info', 'Please add a title and describe your idea.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post('/api/suggestions', {
        title: title.trim(),
        bodyText: body.trim(),
        category,
      });
      router.replace(`/student/suggestions/${res.suggestion.id}`);
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not submit suggestion');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>New suggestion</Text>
        <Text style={styles.subtitle}>
          The Prefect team reviews every idea. Accepted suggestions may earn a bounty.
        </Text>

        <Text style={styles.label}>Title</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Short title"
          placeholderTextColor="#B0B6C2"
          maxLength={120}
        />

        <Text style={styles.label}>Category</Text>
        <View style={styles.chips}>
          {CATEGORIES.map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.chip, category === c && styles.chipActive]}
              onPress={() => setCategory(c)}
            >
              <Text style={[styles.chipText, category === c && styles.chipTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Describe your idea</Text>
        <TextInput
          style={[styles.input, styles.inputMulti]}
          value={body}
          onChangeText={setBody}
          placeholder="What problem does it solve? How would it work?"
          placeholderTextColor="#B0B6C2"
          multiline
          numberOfLines={6}
        />

        <TouchableOpacity
          style={[styles.submit, submitting && { opacity: 0.6 }]}
          onPress={submit}
          disabled={submitting}
          activeOpacity={0.85}
        >
          {submitting ? <ActivityIndicator color="#F8F7F5" /> : <Text style={styles.submitText}>Submit suggestion</Text>}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8F7F5' },
  scroll: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },
  title: { color: '#1B2A4E', fontSize: 26, fontWeight: '700' },
  subtitle: { color: '#6B7383', fontSize: 13, marginTop: 4, marginBottom: 20 },
  label: { color: '#1B2A4E', fontSize: 12, fontWeight: '700', letterSpacing: 0.5, marginTop: 18, marginBottom: 8, textTransform: 'uppercase' },
  input: { backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1.5, borderColor: '#E8E6E1', padding: 14, color: '#1B2A4E', fontSize: 14 },
  inputMulti: { minHeight: 140, textAlignVertical: 'top' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: '#E8E6E1', backgroundColor: '#FFFFFF' },
  chipActive: { backgroundColor: '#1B2A4E', borderColor: '#1B2A4E' },
  chipText: { color: '#6B7383', fontSize: 12, fontWeight: '600' },
  chipTextActive: { color: '#F8F7F5' },
  submit: { backgroundColor: '#1B2A4E', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 28 },
  submitText: { color: '#F8F7F5', fontSize: 15, fontWeight: '700' },
});