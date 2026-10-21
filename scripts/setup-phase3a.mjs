// scripts/setup-phase3a.mjs
import fs from 'fs';
import path from 'path';

const ROOT = 'C:/dev/prefect-mobile';
const files = {};

files['lib/qr-offline-queue.js'] = `// lib/qr-offline-queue.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';

const KEY = 'prefect.qr.queue.v1';
const MAX_QUEUE = 500;

export async function readQueue() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

export async function enqueue(scan) {
  const cur = await readQueue();
  const next = cur.concat([Object.assign({}, scan, { queuedAt: new Date().toISOString() })]);
  const trimmed = next.length > MAX_QUEUE ? next.slice(next.length - MAX_QUEUE) : next;
  await AsyncStorage.setItem(KEY, JSON.stringify(trimmed));
  return trimmed.length;
}

export async function clearQueue() {
  await AsyncStorage.removeItem(KEY);
}

export async function queueSize() {
  const q = await readQueue();
  return q.length;
}

export async function flushQueue() {
  const q = await readQueue();
  if (q.length === 0) return { flushed: 0, remaining: 0, results: [] };

  const chunks = [];
  for (let i = 0; i < q.length; i += 500) chunks.push(q.slice(i, i + 500));

  let flushed = 0;
  const allResults = [];
  const keep = [];

  for (const chunk of chunks) {
    try {
      const res = await api.post('/api/qr/scan/batch', { scans: chunk });
      const accepted = Number(res && res.accepted) || 0;
      flushed += accepted;
      allResults.push.apply(allResults, (res && res.results) || []);
      const results = (res && res.results) || [];
      for (let i = 0; i < results.length; i++) {
        if (!results[i].ok) {
          const reason = results[i].reason;
          const permanent = ['bad_payload','code_not_found','payload_invalid','code_not_active','forbidden_role'];
          if (!permanent.includes(reason)) keep.push(chunk[i]);
        }
      }
    } catch (err) {
      keep.push.apply(keep, chunk);
    }
  }

  if (keep.length === 0) await clearQueue();
  else await AsyncStorage.setItem(KEY, JSON.stringify(keep));

  return { flushed, remaining: keep.length, results: allResults };
}
`;

files['components/QrTile.jsx'] = `// components/QrTile.jsx
import React from 'react';
import { Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export default function QrTile({ hint = 'Create, print and scan QR codes' }) {
  const router = useRouter();
  return (
    <View style={styles.quickNav}>
      <TouchableOpacity
        style={styles.quickNavBtn}
        onPress={() => router.push('/qr')}
        activeOpacity={0.85}
      >
        <View style={styles.quickNavIcon}>
          <Text style={styles.quickNavIconText}>#</Text>
        </View>
        <View style={styles.quickNavBody}>
          <Text style={styles.quickNavLabel}>Prefect QR</Text>
          <Text style={styles.quickNavHint}>{hint}</Text>
        </View>
        <Text style={styles.quickNavChevron}>{'>'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  quickNav: { paddingHorizontal: 20, marginBottom: 8 },
  quickNavBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 16,
    paddingVertical: 14, paddingHorizontal: 16, marginBottom: 10,
    borderWidth: 1, borderColor: '#EFE9DA',
  },
  quickNavIcon: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#F4EFE2',
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  quickNavIconText: { fontSize: 20, color: '#1B2A4E', fontWeight: '700' },
  quickNavBody: { flex: 1 },
  quickNavLabel: { fontSize: 15, fontWeight: '600', color: '#1B2A4E' },
  quickNavHint: { fontSize: 12, color: '#6B7383', marginTop: 2 },
  quickNavChevron: { fontSize: 18, color: '#C9A961', marginLeft: 8 },
});
`;

files['lib/qr-purpose-labels.js'] = `// lib/qr-purpose-labels.js
export const PURPOSE_LABEL = {
  STUDENT_ID: 'Student ID', STAFF_ID: 'Staff ID', LECTURER_ID: 'Lecturer ID',
  VISITOR_PASS: 'Visitor Pass', MEMBER_CARD: 'Member Card', PERSONAL_SHARE: 'Personal Share',
  CLASS_ATTENDANCE: 'Class Attendance', LESSON_ATTENDANCE: 'Lesson Attendance',
  EXAM_HALL_CHECKIN: 'Exam Hall Check-in', STAFF_CLOCKIN: 'Staff Clock-in', STAFF_CLOCKOUT: 'Staff Clock-out',
  EMPLOYEE_CLOCKIN: 'Employee Clock-in', EMPLOYEE_CLOCKOUT: 'Employee Clock-out',
  SITE_GATE_ENTRY: 'Site / Gate Entry', CONTRACTOR_CHECKIN: 'Contractor Check-in',
  SHIFT_START: 'Shift Start', SHIFT_END: 'Shift End',
  GATE_ENTRY: 'Gate Entry', ROOM_ACCESS: 'Room / Lab Access', LIBRARY_ENTRY: 'Library Entry',
  PARKING_ACCESS: 'Parking Access', EVENT_ENTRY: 'Event Entry',
  SHOP_STAFF_CHECKIN: 'Shop Staff Check-in', DELIVERY_CONFIRM: 'Delivery Confirmation',
  TABLE_QR: 'Table QR', LOYALTY_STAMP: 'Loyalty Stamp', RECEIPT_VERIFY: 'Receipt Verification',
  ASSET_OUT: 'Asset Out', ASSET_IN: 'Asset In', VEHICLE_LOG: 'Vehicle Log',
  INVENTORY_MOVE: 'Inventory Move', PACKAGE_HANDOFF: 'Package Handoff',
  EVENT_ATTENDANCE: 'Event Attendance', WORKSHOP_ATTENDANCE: 'Workshop Attendance',
  APPOINTMENT_CHECKIN: 'Appointment Check-in', QUEUE_NUMBER: 'Queue Number',
  FEEDBACK_TRIGGER: 'Feedback Trigger',
  WALLET_TOPUP: 'Wallet Top-up', PAYMENT_REQUEST: 'Payment Request', TIP_DONATION: 'Tip / Donation',
  CUSTOM: 'Custom',
};
`;

files['app/qr/index.js'] = `// app/qr/index.js - QR dashboard
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
`;

files['app/qr/new.js'] = `// app/qr/new.js
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, Alert, SafeAreaView, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '../../lib/api';

export default function QrNew() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [groups, setGroups] = useState({});
  const [purpose, setPurpose] = useState(null);
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [orgLabel, setOrgLabel] = useState('');
  const [search, setSearch] = useState('');

  useEffect(function () {
    let alive = true;
    (async function () {
      try {
        const res = await api.get('/api/qr/purposes');
        if (alive) setGroups((res && res.groups) || {});
      } catch (e) {
        Alert.alert('Failed to load purposes', e.message || '');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return function () { alive = false; };
  }, []);

  const filteredGroups = useMemo(function () {
    const q = search.trim().toLowerCase();
    if (!q) return groups;
    const out = {};
    Object.keys(groups).forEach(function (g) {
      const items = groups[g].filter(function (it) {
        return it.label.toLowerCase().includes(q) || it.key.toLowerCase().includes(q);
      });
      if (items.length) out[g] = items;
    });
    return out;
  }, [groups, search]);

  const submit = async function () {
    if (!purpose) return Alert.alert('Pick a purpose first');
    if (!label || label.trim().length < 2) return Alert.alert('Give it a short label');
    setCreating(true);
    try {
      const body = {
        purpose,
        label: label.trim(),
        description: description.trim() || undefined,
        orgLabel: orgLabel.trim() || undefined,
      };
      const res = await api.post('/api/qr', body);
      const code = res && res.code;
      if (!code) throw new Error('No code returned');
      router.replace('/qr/' + code.id);
    } catch (e) {
      Alert.alert('Create failed', e.message || '');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return <SafeAreaView style={styles.center}><ActivityIndicator color="#C9A961" /></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.h1}>Create a QR code</Text>
        <Text style={styles.hint}>Pick a purpose. The QR is static — print once, reuse until you revoke.</Text>

        <Text style={styles.label}>Search purposes</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. attendance, gate, loyalty"
          value={search}
          onChangeText={setSearch}
          placeholderTextColor="#A0A6B2"
        />

        {Object.keys(filteredGroups).map(function (g) {
          return (
            <View key={g} style={{ marginBottom: 14 }}>
              <Text style={styles.groupTitle}>{g}</Text>
              {filteredGroups[g].map(function (it) {
                const selected = purpose === it.key;
                return (
                  <TouchableOpacity
                    key={it.key}
                    style={[styles.purposeRow, selected && styles.purposeRowSelected]}
                    onPress={() => setPurpose(it.key)}
                    activeOpacity={0.85}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.purposeLabel, selected && { color: '#FFF' }]}>{it.label}</Text>
                      <Text style={[styles.purposeHint, selected && { color: '#F4EFE2' }]}>{it.key}</Text>
                    </View>
                    {selected ? <Text style={{ color: '#FFF', fontWeight: '700' }}>OK</Text> : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          );
        })}

        <Text style={styles.label}>Label</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. ENG 101 Lecture Hall"
          value={label}
          onChangeText={setLabel}
          placeholderTextColor="#A0A6B2"
        />

        <Text style={styles.label}>Description (optional)</Text>
        <TextInput
          style={[styles.input, { height: 80 }]}
          placeholder="What is this for?"
          value={description}
          onChangeText={setDescription}
          multiline
          placeholderTextColor="#A0A6B2"
        />

        <Text style={styles.label}>Organization / room (optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Engineering Block A"
          value={orgLabel}
          onChangeText={setOrgLabel}
          placeholderTextColor="#A0A6B2"
        />

        <TouchableOpacity
          style={[styles.cta, creating && { opacity: 0.6 }]}
          onPress={submit}
          disabled={creating}
          activeOpacity={0.9}
        >
          <Text style={styles.ctaText}>{creating ? 'Creating...' : 'Create QR code'}</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8F7F5' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  body: { padding: 20 },
  h1: { fontSize: 24, fontWeight: '700', color: '#1B2A4E', marginBottom: 6 },
  hint: { fontSize: 13, color: '#6B7383', marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '700', color: '#1B2A4E', letterSpacing: 0.5, marginTop: 14, marginBottom: 6 },
  input: {
    backgroundColor: '#FFF', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    borderWidth: 1, borderColor: '#EFE9DA', color: '#1B2A4E',
  },
  groupTitle: { fontSize: 13, fontWeight: '700', color: '#6B7383', letterSpacing: 0.5, marginTop: 12, marginBottom: 8 },
  purposeRow: {
    backgroundColor: '#FFF', borderRadius: 12, padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: '#EFE9DA',
  },
  purposeRowSelected: { backgroundColor: '#1B2A4E', borderColor: '#1B2A4E' },
  purposeLabel: { fontSize: 14, fontWeight: '600', color: '#1B2A4E' },
  purposeHint: { fontSize: 11, color: '#6B7383', marginTop: 2 },
  cta: { backgroundColor: '#C9A961', borderRadius: 999, paddingVertical: 16, alignItems: 'center', marginTop: 24 },
  ctaText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
});
`;

let n = 0;
for (const rel of Object.keys(files)) {
  const full = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, files[rel], 'utf8');
  n++;
  console.log('wrote', rel, '(' + Buffer.byteLength(files[rel], 'utf8') + ' bytes)');
}
console.log('3a done:', n, 'files');