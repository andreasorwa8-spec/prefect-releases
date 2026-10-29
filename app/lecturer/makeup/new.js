import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  ActivityIndicator, SafeAreaView, Modal, FlatList,
} from 'react-native';
import { router } from 'expo-router';
import { api } from '@/lib/api';

function tomorrowISO() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function isHHMM(s) {
  return /^\d{2}:\d{2}$/.test(s);
}

export default function MakeupNewScreen() {
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState('');

  const [classId, setClassId] = useState(null);
  const [subjectId, setSubjectId] = useState(null);
  const [proposedDate, setProposedDate] = useState(tomorrowISO());
  const [proposedStart, setProposedStart] = useState('08:00');
  const [proposedEnd, setProposedEnd] = useState('09:00');
  const [reason, setReason] = useState('');

  const [classModal, setClassModal] = useState(false);
  const [subjectModal, setSubjectModal] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [c, s] = await Promise.all([
          api.get('/api/school/classes'),
          api.get('/api/school/subjects'),
        ]);
        const cls = c.classes || [];
        const subs = s.subjects || [];
        setClasses(cls);
        setSubjects(subs);
        if (cls.length) setClassId(cls[0].id);
        if (subs.length) setSubjectId(subs[0].id);
      } catch (e) {
        setErr(e.message || 'Failed to load classes/subjects');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const selectedClass = classes.find((c) => c.id === classId);
  const selectedSubject = subjects.find((s) => s.id === subjectId);

  async function submit() {
    setErr('');
    if (!classId || !subjectId) return setErr('Please pick a class and subject');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(proposedDate)) return setErr('Date must be YYYY-MM-DD');
    if (!isHHMM(proposedStart) || !isHHMM(proposedEnd)) return setErr('Times must be HH:MM');
    if (proposedEnd <= proposedStart) return setErr('End time must be after start time');
    if (reason.trim().length < 10) return setErr('Reason must be at least 10 characters');

    setSubmitting(true);
    try {
      await api.post('/api/school/makeup', {
        classId,
        subjectId,
        originalSlotId: null,
        proposedDate,
        proposedStart,
        proposedEnd,
        reason: reason.trim(),
      });
      router.replace('/lecturer/makeup');
    } catch (e) {
      setErr(e.data?.error || e.message || 'Submit failed');
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
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backArrow}>{'\u2190'}</Text>
          </TouchableOpacity>
          <Text style={styles.title}>New make-up request</Text>
        </View>

        <Text style={styles.label}>Class *</Text>
        <TouchableOpacity style={styles.select} onPress={() => setClassModal(true)}>
          <Text style={styles.selectText}>{selectedClass?.name || 'Select class'}</Text>
          <Text style={styles.selectChevron}>{'\u25BC'}</Text>
        </TouchableOpacity>

        <Text style={styles.label}>Subject *</Text>
        <TouchableOpacity style={styles.select} onPress={() => setSubjectModal(true)}>
          <Text style={styles.selectText}>{selectedSubject?.name || 'Select subject'}</Text>
          <Text style={styles.selectChevron}>{'\u25BC'}</Text>
        </TouchableOpacity>

        <Text style={styles.label}>Make-up date * (YYYY-MM-DD)</Text>
        <TextInput
          style={styles.input}
          value={proposedDate}
          onChangeText={setProposedDate}
          placeholder="2026-11-12"
          autoCapitalize="none"
        />

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Start * (HH:MM)</Text>
            <TextInput style={styles.input} value={proposedStart} onChangeText={setProposedStart} placeholder="08:00" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>End * (HH:MM)</Text>
            <TextInput style={styles.input} value={proposedEnd} onChangeText={setProposedEnd} placeholder="09:00" />
          </View>
        </View>

        <Text style={styles.label}>Reason * (min 10 chars)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={reason}
          onChangeText={setReason}
          placeholder="Covering Tuesday's missed lesson..."
          multiline
          numberOfLines={4}
        />

        {err ? <View style={styles.errorBox}><Text style={styles.errorText}>{err}</Text></View> : null}

        <TouchableOpacity
          style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
          onPress={submit}
          disabled={submitting}
        >
          <Text style={styles.submitText}>{submitting ? 'Submitting...' : 'Submit request'}</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={classModal} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Select class</Text>
            <FlatList
              data={classes}
              keyExtractor={(c) => c.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => { setClassId(item.id); setClassModal(false); }}
                >
                  <Text style={styles.modalItemText}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.modalCancel} onPress={() => setClassModal(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={subjectModal} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Select subject</Text>
            <FlatList
              data={subjects}
              keyExtractor={(s) => s.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => { setSubjectId(item.id); setSubjectModal(false); }}
                >
                  <Text style={styles.modalItemText}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.modalCancel} onPress={() => setSubjectModal(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAF8F3' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 16, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  backBtn: { padding: 4, marginRight: 8 },
  backArrow: { fontSize: 22, color: '#1E293B' },
  title: { fontSize: 20, fontWeight: '600', color: '#0F172A' },
  label: { fontSize: 12, fontWeight: '600', color: '#475569', marginTop: 14, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.4 },
  input: { backgroundColor: '#FFF', borderColor: '#E2E8F0', borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, fontSize: 15, color: '#0F172A' },
  textArea: { minHeight: 90, textAlignVertical: 'top' },
  select: { backgroundColor: '#FFF', borderColor: '#E2E8F0', borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  selectText: { fontSize: 15, color: '#0F172A' },
  selectChevron: { fontSize: 10, color: '#94A3B8' },
  submitBtn: { backgroundColor: '#C9A961', borderRadius: 10, paddingVertical: 16, alignItems: 'center', marginTop: 24 },
  submitText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
  errorBox: { backgroundColor: '#FEE2E2', borderColor: '#EF4444', borderWidth: 1, padding: 12, borderRadius: 8, marginTop: 16 },
  errorText: { color: '#991B1B', fontSize: 13 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '70%' },
  modalTitle: { fontSize: 17, fontWeight: '600', color: '#0F172A', marginBottom: 12 },
  modalItem: { paddingVertical: 14, borderBottomColor: '#F1F5F9', borderBottomWidth: 1 },
  modalItemText: { fontSize: 15, color: '#0F172A' },
  modalCancel: { paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  modalCancelText: { color: '#DC2626', fontSize: 15, fontWeight: '600' },
});
