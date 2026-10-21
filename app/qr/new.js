// app/qr/new.js
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
