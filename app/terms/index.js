// app/terms/index.js
// Session 25 -- 25.9
//
// Mobile terms: fetch current version + acceptance state, render body,
// let the user accept, then go back (or push to /chat if next=chat).

import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, SafeAreaView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { api, ApiError } from '@/lib/api';

export default function TermsScreen() {
  const router = useRouter();
  const { next } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [terms, setTerms] = useState(null);
  const [accepted, setAccepted] = useState(false);
  const [acceptedAt, setAcceptedAt] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/api/terms');
      setTerms(res.terms || null);
      setAccepted(!!res.accepted);
      setAcceptedAt(res.acceptedAt || null);
    } catch (err) {
      setError(err?.message || 'Could not load terms');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function accept() {
    setBusy(true);
    setError('');
    try {
      const res = await api.post('/api/terms/accept', {});
      setAccepted(true);
      setAcceptedAt(res.acceptedAt || new Date().toISOString());
      setTimeout(() => {
        if (next === 'chat') router.replace('/chat');
        else router.back();
      }, 400);
    } catch (err) {
      setError(err?.message || 'Could not record acceptance');
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
        <Text style={styles.headerTitle}>Terms</Text>
        <View style={styles.headerBtn} />
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color="#1B2A4E" /></View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {terms ? (
            <>
              <Text style={styles.version}>Version {terms.version}</Text>
              <Text style={styles.body}>{terms.body}</Text>

              {accepted ? (
                <View style={styles.acceptedBox}>
                  <Text style={styles.acceptedText}>
                    You accepted this version
                    {acceptedAt ? ` on ${new Date(acceptedAt).toLocaleString()}` : ''}.
                  </Text>
                </View>
              ) : (
                <>
                  {error ? <Text style={styles.errorText}>{error}</Text> : null}
                  <TouchableOpacity
                    style={[styles.acceptBtn, busy && styles.acceptBtnDisabled]}
                    onPress={accept}
                    disabled={busy}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.acceptBtnText}>
                      {busy ? 'Saving...' : 'Accept and continue'}
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </>
          ) : (
            <Text style={styles.errorText}>No current terms available.</Text>
          )}
        </ScrollView>
      )}
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16, paddingBottom: 40 },
  version: { fontSize: 12, color: '#6B7280', marginBottom: 12, fontWeight: '600' },
  body: { fontSize: 13, color: '#1B2A4E', lineHeight: 20 },
  acceptedBox: { marginTop: 24, padding: 14, borderRadius: 12, backgroundColor: '#DCFCE7' },
  acceptedText: { color: '#166534', fontSize: 13 },
  acceptBtn: {
    backgroundColor: '#1B2A4E', borderRadius: 12,
    paddingVertical: 14, alignItems: 'center', marginTop: 24,
  },
  acceptBtnDisabled: { opacity: 0.55 },
  acceptBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  errorText: { color: '#991B1B', fontSize: 13, marginTop: 12 },
});