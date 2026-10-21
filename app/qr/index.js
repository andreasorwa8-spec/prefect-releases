// app/qr/index.js - QR dashboard
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator, RefreshControl, SafeAreaView, ScrollView,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { api } from '../../lib/api';
import { getMobileSession } from '../../lib/auth';
import { queueSize, flushQueue } from '../../lib/qr-offline-queue';
import { PURPOSE_LABEL } from '../../lib/qr-purpose-labels';

export default function QrDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [codes, setCodes] = useState([]);
  const [pending, setPending] = useState(0);
  const [error, setError] = useState(null);
  const [syncing, setSyncing] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const session = await getMobileSession();
      const role = session && session.user ? session.user.role : null;
      if (role === 'ADMIN') {
        setCodes([]);
        setPending(await queueSize());
        setLoading(false);
        return;
      }
      const res = await api.get('/api/qr');
      setCodes((res && res.codes) || []);
      setPending(await queueSize());
    } catch (err) {
      setError(err.message || 'Failed to load');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = () => { setRefreshing(true); load(); };

  const trySync = async () => {
    setSyncing(true);
    try {
      await flushQueue();
      await load();
    } catch (err) {
      setError('Sync failed: ' + (err.message || 'unknown'));
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color="#C9A961" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Prefect QR</Text>
        <Text style={styles.subtitle}>Create static QR codes, print them, and scan offline.</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.body}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#C9A961" />}
      >
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.action, styles.actionPrimary]}
            onPress={() => router.push('/qr/new')}
            activeOpacity={0.9}
          >
            <Text style={styles.actionIcon}>+</Text>
            <Text style={styles.actionLabel}>Create QR</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.action, styles.actionGold]}
            onPress={() => router.push('/qr/scan')}
            activeOpacity={0.9}
          >
            <Text style={styles.actionIcon}>#</Text>
            <Text style={styles.actionLabel}>Scan QR</Text>
          </TouchableOpacity>
        </View>

        {pending > 0 ? (
          <View style={styles.pendingBox}>
            <Text style={styles.pendingText}>
              {pending} scan{pending === 1 ? '' : 's'} queued offline
            </Text>
            <TouchableOpacity onPress={trySync} disabled={syncing} style={styles.pendingBtn}>
              <Text style={styles.pendingBtnText}>{syncing ? 'Syncing...' : 'Sync now'}</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Text style={styles.sectionTitle}>Your codes</Text>
        {codes.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No QR codes yet.</Text>
            <Text style={styles.emptyHint}>Tap Create QR to make your first one.</Text>
          </View>
        ) : (
          codes.map(function (c) {
            const badge = c.status === 'ACTIVE' ? 'ON' : c.status === 'PAUSED' ? 'II' : 'X';
            return (
              <TouchableOpacity
                key={c.id}
                style={styles.codeRow}
                onPress={() => router.push('/qr/' + c.id)}
                activeOpacity={0.85}
              >
                <View style={styles.codeBadge}>
                  <Text style={styles.codeBadgeText}>{badge}</Text>
                </View>
                <View style={styles.codeBody}>
                  <Text style={styles.codeLabel}>{c.label}</Text>
                  <Text style={styles.codeMeta}>
                    {(PURPOSE_LABEL[c.purpose] || c.purpose) + ' · ' + c.totalScans + ' scans · ' + c.shortCode}
                  </Text>
                </View>
                <Text style={styles.chev}>{'>'}</Text>
              </TouchableOpacity>
            );
          })
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8F7F5' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8F7F5' },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  title: { fontSize: 26, fontWeight: '700', color: '#1B2A4E' },
  subtitle: { fontSize: 13, color: '#6B7383', marginTop: 4 },
  body: { paddingHorizontal: 20, paddingTop: 12 },
  actionRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  action: { flex: 1, borderRadius: 16, paddingVertical: 18, alignItems: 'center', justifyContent: 'center' },
  actionPrimary: { backgroundColor: '#1B2A4E' },
  actionGold: { backgroundColor: '#C9A961' },
  actionIcon: { color: '#FFF', fontSize: 22, fontWeight: '700', marginBottom: 6 },
  actionLabel: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  pendingBox: {
    backgroundColor: '#FFF7E0', borderRadius: 12, padding: 12, marginBottom: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: '#EAD9A8',
  },
  pendingText: { color: '#8A6D1E', fontSize: 13, flex: 1 },
  pendingBtn: { backgroundColor: '#C9A961', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999 },
  pendingBtnText: { color: '#FFF', fontWeight: '600', fontSize: 12 },
  error: { color: '#B3414A', marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#1B2A4E', letterSpacing: 0.5, marginBottom: 10 },
  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { color: '#6B7383', fontSize: 15 },
  emptyHint: { color: '#A0A6B2', fontSize: 12, marginTop: 4 },
  codeRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFF', borderRadius: 14, padding: 14,
    marginBottom: 10, borderWidth: 1, borderColor: '#EFE9DA',
  },
  codeBadge: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F4EFE2', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  codeBadgeText: { color: '#1B2A4E', fontSize: 11, fontWeight: '700' },
  codeBody: { flex: 1 },
  codeLabel: { fontSize: 15, fontWeight: '600', color: '#1B2A4E' },
  codeMeta: { fontSize: 12, color: '#6B7383', marginTop: 2 },
  chev: { color: '#C9A961', fontSize: 18, marginLeft: 8 },
});
