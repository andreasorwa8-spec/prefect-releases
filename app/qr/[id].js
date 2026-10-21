// app/qr/[id].js - code detail: QR view, print, AI summary, scans
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator, Alert, SafeAreaView, ScrollView, Share, StyleSheet,
  Text, TouchableOpacity, View,
} from 'react-native';
import { useLocalSearchParams, useFocusEffect } from 'expo-router';
import * as Print from 'expo-print';
import QRCode from 'react-native-qrcode-svg';
import { api } from '../../lib/api';
import { PURPOSE_LABEL } from '../../lib/qr-purpose-labels';

function buildPrintHtml(code, perPage) {
  const cell = perPage === 4
    ? '<div class="cell"><img src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=' + encodeURIComponent(code.payload) + '" /><div class="short">' + code.shortCode + '</div><div class="label">' + code.label + '</div><div class="purpose">' + (PURPOSE_LABEL[code.purpose] || code.purpose) + '</div></div>'
    : '<div class="cell full"><img src="https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=' + encodeURIComponent(code.payload) + '" /><div class="short">' + code.shortCode + '</div><div class="label">' + code.label + '</div><div class="purpose">' + (PURPOSE_LABEL[code.purpose] || code.purpose) + '</div></div>';
  const grid = perPage === 4
    ? '<div class="grid">' + cell + cell + cell + cell + '</div>'
    : cell;
  return '<html><head><style>' +
    'body{font-family:system-ui;margin:24px;color:#1B2A4E}' +
    '.grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}' +
    '.cell{text-align:center;border:1px dashed #1B2A4E;padding:12px;border-radius:12px}' +
    '.cell img{width:100%;max-width:240px;height:auto}' +
    '.full img{max-width:420px}' +
    '.short{font-family:monospace;font-size:22px;letter-spacing:2px;margin-top:8px;font-weight:700}' +
    '.label{font-size:14px;margin-top:4px}' +
    '.purpose{font-size:11px;color:#6B7383;margin-top:2px}' +
    '</style></head><body>' + grid + '</body></html>';
}

export default function QrDetail() {
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [summary, setSummary] = useState(null);
  const [genning, setGenning] = useState(false);

  const load = useCallback(async function () {
    try {
      const res = await api.get('/api/qr/' + id);
      setData(res);
      setSummary(res && res.summary ? res.summary : null);
    } catch (e) {
      Alert.alert('Load failed', e.message || '');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(useCallback(function () { load(); }, [load]));

  const generateSummary = async function () {
    setGenning(true);
    try {
      const res = await api.post('/api/qr/' + id + '/summary', { days: 7 });
      setSummary(res && res.summary ? res.summary : null);
    } catch (e) {
      Alert.alert('AI summary failed', e.message || '');
    } finally {
      setGenning(false);
    }
  };

  const printOne = async function () {
    if (!data || !data.code) return;
    try { await Print.printAsync({ html: buildPrintHtml(data.code, 1) }); }
    catch (e) { Alert.alert('Print failed', e.message || ''); }
  };

  const printFourUp = async function () {
    if (!data || !data.code) return;
    try { await Print.printAsync({ html: buildPrintHtml(data.code, 4) }); }
    catch (e) { Alert.alert('Print failed', e.message || ''); }
  };

  const sharePayload = async function () {
    if (!data || !data.code) return;
    try {
      await Share.share({
        message: data.code.payload + '\n\n' + data.code.label + ' (' + data.code.shortCode + ')',
      });
    } catch (e) { /* cancelled */ }
  };

  const togglePause = async function () {
    if (!data || !data.code) return;
    const next = data.code.status === 'PAUSED' ? 'ACTIVE' : 'PAUSED';
    try {
      const res = await api.patch('/api/qr/' + id, { status: next });
      setData(Object.assign({}, data, { code: res.code }));
    } catch (e) { Alert.alert('Update failed', e.message || ''); }
  };

  const revoke = function () {
    Alert.alert('Revoke this QR?', 'Printed copies stop working immediately.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Revoke', style: 'destructive',
        onPress: async function () {
          try {
            const res = await api.delete('/api/qr/' + id);
            setData(Object.assign({}, data, { code: res.code }));
          } catch (e) { Alert.alert('Revoke failed', e.message || ''); }
        },
      },
    ]);
  };

  if (loading || !data || !data.code) {
    return <SafeAreaView style={styles.center}><ActivityIndicator color="#C9A961" /></SafeAreaView>;
  }

  const c = data.code;
  const scans = data.scans || [];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.title}>{c.label}</Text>
        <Text style={styles.meta}>{PURPOSE_LABEL[c.purpose] || c.purpose} · {c.shortCode} · {c.status}</Text>
        {c.description ? <Text style={styles.desc}>{c.description}</Text> : null}

        <View style={styles.qrWrap}>
          <QRCode value={c.payload} size={240} backgroundColor="#FFFFFF" color="#1B2A4E" />
          <Text style={styles.qrCodeText}>{c.shortCode}</Text>
          <Text style={styles.qrHint}>Or enter the code above manually in the scanner.</Text>
        </View>

        <View style={styles.btnRow}>
          <TouchableOpacity style={styles.btn} onPress={printOne} activeOpacity={0.85}>
            <Text style={styles.btnText}>Print A4</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btn} onPress={printFourUp} activeOpacity={0.85}>
            <Text style={styles.btnText}>Print 4-up</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btn} onPress={sharePayload} activeOpacity={0.85}>
            <Text style={styles.btnText}>Share</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{c.totalScans}</Text>
            <Text style={styles.statLabel}>Scans</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{c.uniqueScanners}</Text>
            <Text style={styles.statLabel}>Unique</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{scans.length}</Text>
            <Text style={styles.statLabel}>Recent</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHead}>
            <Text style={styles.cardTitle}>AI summary</Text>
            <TouchableOpacity onPress={generateSummary} disabled={genning} activeOpacity={0.85}>
              <Text style={styles.cardBtn}>{genning ? 'Generating...' : 'Regenerate'}</Text>
            </TouchableOpacity>
          </View>
          {summary ? (
            <View>
              <Text style={styles.narrative}>{summary.narrative}</Text>
              {Array.isArray(summary.suggestions) && summary.suggestions.length ? (
                <View style={{ marginTop: 10 }}>
                  <Text style={styles.suggHead}>Suggestions</Text>
                  {summary.suggestions.map(function (s, i) {
                    return <Text key={i} style={styles.suggLine}>- {s}</Text>;
                  })}
                </View>
              ) : null}
              {Array.isArray(summary.perPerson) && summary.perPerson.length ? (
                <View style={{ marginTop: 10 }}>
                  <Text style={styles.suggHead}>Per person</Text>
                  {summary.perPerson.map(function (p, i) {
                    const tag = p.flag && p.flag !== 'NONE' ? ' [' + p.flag + ']' : '';
                    return <Text key={i} style={styles.suggLine}>- {p.name}{tag}: {p.line}</Text>;
                  })}
                </View>
              ) : null}
            </View>
          ) : (
            <Text style={styles.desc}>No summary yet. Tap Regenerate to produce one with AI.</Text>
          )}
        </View>

        <Text style={styles.sectionTitle}>Recent scans</Text>
        {scans.length === 0 ? (
          <Text style={styles.desc}>No scans yet.</Text>
        ) : scans.map(function (s) {
          const when = new Date(s.scannedAt);
          return (
            <View key={s.id} style={styles.scanRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.scanName}>{s.scannerName}</Text>
                <Text style={styles.scanMeta}>{when.toLocaleString()} · {s.method}</Text>
              </View>
              {s.dedupedIntoId ? <Text style={styles.dedupe}>deduped</Text> : null}
            </View>
          );
        })}

        <View style={styles.btnRow}>
          <TouchableOpacity style={[styles.btn, styles.btnAlt]} onPress={togglePause} activeOpacity={0.85}>
            <Text style={[styles.btnText, { color: '#1B2A4E' }]}>
              {c.status === 'PAUSED' ? 'Resume' : 'Pause'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.btnDanger]} onPress={revoke} activeOpacity={0.85}>
            <Text style={styles.btnText}>Revoke</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8F7F5' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  body: { padding: 20 },
  title: { fontSize: 22, fontWeight: '700', color: '#1B2A4E' },
  meta: { fontSize: 12, color: '#6B7383', marginTop: 4 },
  desc: { fontSize: 13, color: '#6B7383', marginTop: 8 },
  qrWrap: { alignItems: 'center', backgroundColor: '#FFF', padding: 20, borderRadius: 20, marginTop: 16, borderWidth: 1, borderColor: '#EFE9DA' },
  qrCodeText: { fontFamily: 'monospace', fontSize: 20, letterSpacing: 3, color: '#1B2A4E', fontWeight: '700', marginTop: 12 },
  qrHint: { fontSize: 11, color: '#A0A6B2', marginTop: 4, textAlign: 'center' },
  btnRow: { flexDirection: 'row', gap: 8, marginTop: 16 },
  btn: { flex: 1, backgroundColor: '#1B2A4E', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  btnAlt: { backgroundColor: '#F4EFE2' },
  btnDanger: { backgroundColor: '#B3414A' },
  btnText: { color: '#FFF', fontWeight: '600', fontSize: 13 },
  stats: { flexDirection: 'row', gap: 10, marginTop: 16 },
  stat: { flex: 1, backgroundColor: '#FFF', borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#EFE9DA' },
  statNum: { fontSize: 20, fontWeight: '700', color: '#1B2A4E' },
  statLabel: { fontSize: 11, color: '#6B7383', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  card: { backgroundColor: '#FFF', borderRadius: 14, padding: 14, marginTop: 16, borderWidth: 1, borderColor: '#EFE9DA' },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#1B2A4E' },
  cardBtn: { fontSize: 12, color: '#C9A961', fontWeight: '700' },
  narrative: { fontSize: 13, color: '#1B2A4E', lineHeight: 19 },
  suggHead: { fontSize: 12, fontWeight: '700', color: '#6B7383', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  suggLine: { fontSize: 12, color: '#1B2A4E', lineHeight: 18, marginBottom: 3 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#1B2A4E', letterSpacing: 0.5, marginTop: 20, marginBottom: 8 },
  scanRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#EFE9DA' },
  scanName: { fontSize: 14, fontWeight: '600', color: '#1B2A4E' },
  scanMeta: { fontSize: 11, color: '#6B7383', marginTop: 2 },
  dedupe: { fontSize: 10, color: '#A0A6B2', fontStyle: 'italic' },
});
