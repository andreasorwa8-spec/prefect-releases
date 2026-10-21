// app/chat/new.js
// Session 25 -- 25.9
//
// Create DM (pick one user) or Group (title + multi-select invitees).
// Uses GET /api/users/search and POST /api/chat/conversations.

import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  ActivityIndicator, SafeAreaView, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { api, ApiError } from '@/lib/api';

const ICON_ARROW = '\u2192';

export default function NewChatScreen() {
  const router = useRouter();
  const [mode, setMode] = useState('dm'); // 'dm' | 'group'
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [otherUserId, setOtherUserId] = useState(null);
  const [title, setTitle] = useState('');
  const [inviteeIds, setInviteeIds] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function loadUsers(q) {
    try {
      setLoading(true);
      setError('');
      const qs = q && q.trim().length >= 2 ? `?q=${encodeURIComponent(q.trim())}` : '';
      const res = await api.get(`/api/users/search${qs}`);
      setUsers(res.users || []);
    } catch (err) {
      setError(err?.message || 'Could not load users');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers('');
  }, []);

  useEffect(() => {
    const t = setTimeout(() => { loadUsers(search); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  function toggleInvitee(id) {
    setInviteeIds((cur) => cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]);
  }

  async function submitDm() {
    if (!otherUserId) { setError('Pick a person'); return; }
    setBusy(true); setError('');
    try {
      const res = await api.post('/api/chat/conversations', { type: 'DM', otherUserId });
      if (res?.id) router.replace(`/chat/${res.id}`);
    } catch (err) {
      setError(err?.message || 'Could not start chat');
    } finally {
      setBusy(false);
    }
  }

  async function submitGroup() {
    if (title.trim().length < 2) { setError('Title too short'); return; }
    setBusy(true); setError('');
    try {
      const res = await api.post('/api/chat/conversations', {
        type: 'GROUP',
        title: title.trim(),
        inviteeIds,
      });
      if (res?.id) router.replace(`/chat/${res.id}`);
    } catch (err) {
      setError(err?.message || 'Could not create group');
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Text style={styles.headerBtnText}>{'\u2190'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New chat</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.modeRow}>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'dm' && styles.modeBtnActive]}
            onPress={() => { setMode('dm'); setError(''); }}
          >
            <Text style={[styles.modeBtnText, mode === 'dm' && styles.modeBtnTextActive]}>
              Direct message
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'group' && styles.modeBtnActive]}
            onPress={() => { setMode('group'); setError(''); }}
          >
            <Text style={[styles.modeBtnText, mode === 'group' && styles.modeBtnTextActive]}>
              New group
            </Text>
          </TouchableOpacity>
        </View>

        {mode === 'group' ? (
          <View style={styles.field}>
            <Text style={styles.label}>Group title</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              maxLength={120}
              placeholder="e.g. ENG 2024 study group"
              placeholderTextColor="#9CA3AF"
              style={styles.input}
            />
          </View>
        ) : null}

        <View style={styles.field}>
          <Text style={styles.label}>{mode === 'dm' ? 'Pick a person' : `Invite people (${inviteeIds.length} selected)`}</Text>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search name or email"
            placeholderTextColor="#9CA3AF"
            style={styles.input}
            autoCapitalize="none"
          />
        </View>

        {error ? (
          <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View>
        ) : null}

        {loading ? (
          <View style={styles.center}><ActivityIndicator color="#1B2A4E" /></View>
        ) : users.length === 0 ? (
          <Text style={styles.empty}>No matches.</Text>
        ) : (
          users.map((u) => {
            const selected = mode === 'dm' ? otherUserId === u.id : inviteeIds.includes(u.id);
            return (
              <TouchableOpacity
                key={u.id}
                style={[styles.userRow, selected && styles.userRowSelected]}
                onPress={() => {
                  if (mode === 'dm') setOtherUserId(u.id);
                  else toggleInvitee(u.id);
                }}
                activeOpacity={0.85}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{(u.name || u.email || '?').charAt(0).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.userName}>{u.name || u.email}</Text>
                  <Text style={styles.userSub}>{u.role}  ·  {u.email}</Text>
                </View>
                {selected ? <Text style={styles.selectedBadge}>selected</Text> : null}
              </TouchableOpacity>
            );
          })
        )}

        <TouchableOpacity
          style={[styles.submitBtn, busy && styles.submitBtnDisabled]}
          onPress={mode === 'dm' ? submitDm : submitGroup}
          disabled={busy}
          activeOpacity={0.85}
        >
          <Text style={styles.submitText}>
            {busy ? 'Creating...' : (mode === 'dm' ? 'Start chat' : 'Create group')}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F4EC' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#EFE9DA', backgroundColor: '#FFFFFF',
  },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerBtnText: { fontSize: 22, color: '#1B2A4E', fontWeight: '600' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#1B2A4E' },
  content: { padding: 16, paddingBottom: 40 },
  modeRow: { flexDirection: 'row', gap: 8, marginBottom: 18 },
  modeBtn: {
    flex: 1, paddingVertical: 10, alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 10, borderWidth: 1, borderColor: '#EFE9DA',
  },
  modeBtnActive: { backgroundColor: '#1B2A4E', borderColor: '#1B2A4E' },
  modeBtnText: { fontSize: 13, color: '#1B2A4E', fontWeight: '600' },
  modeBtnTextActive: { color: '#FFFFFF' },
  field: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '700', color: '#1B2A4E', marginBottom: 6, letterSpacing: 0.5 },
  input: {
    backgroundColor: '#FFFFFF', borderRadius: 10, borderWidth: 1, borderColor: '#EFE9DA',
    paddingVertical: 12, paddingHorizontal: 14, fontSize: 14, color: '#1B2A4E',
  },
  userRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 12, marginBottom: 8,
    borderWidth: 1, borderColor: '#EFE9DA',
  },
  userRowSelected: { borderColor: '#1B2A4E', backgroundColor: '#EEF2FF' },
  avatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#F4EFE2',
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  avatarText: { fontSize: 16, color: '#1B2A4E', fontWeight: '700' },
  userName: { fontSize: 14, fontWeight: '600', color: '#1B2A4E' },
  userSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  selectedBadge: { fontSize: 11, color: '#1B2A4E', fontWeight: '700' },
  submitBtn: {
    backgroundColor: '#1B2A4E', borderRadius: 12,
    paddingVertical: 14, alignItems: 'center', marginTop: 20,
  },
  submitBtnDisabled: { opacity: 0.55 },
  submitText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  empty: { fontSize: 13, color: '#6B7280', textAlign: 'center', paddingVertical: 20 },
  center: { paddingVertical: 24, alignItems: 'center' },
  errorBox: { backgroundColor: '#FEE2E2', borderRadius: 10, padding: 12, marginBottom: 12 },
  errorText: { color: '#991B1B', fontSize: 13 },
});