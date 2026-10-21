// scripts/setup-phase3b.mjs
import fs from 'fs';
import path from 'path';

const ROOT = 'C:/dev/prefect-mobile';
const files = {};

files['app/qr/[id].js'] = `// app/qr/[id].js - code detail: QR view, print, AI summary, scans
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
        message: data.code.payload + '\\n\\n' + data.code.label + ' (' + data.code.shortCode + ')',
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
`;

files['app/qr/scan.js'] = `// app/qr/scan.js - camera scanner + manual entry + offline queue
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Alert, SafeAreaView, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { api } from '../../lib/api';
import { enqueue, flushQueue, queueSize } from '../../lib/qr-offline-queue';
import { getDeviceId } from '../../lib/auth';

function parsePayload(payload) {
  if (typeof payload !== 'string') return null;
  const parts = payload.trim().split(':');
  if (parts.length !== 6) return null;
  const [prefix, kind, version, codeId, shortCode, hmac8] = parts;
  if (prefix !== 'PREFECT' || kind !== 'QR' || version !== '1') return null;
  if (!codeId || !shortCode || !/^[0-9a-f]{8}$/.test(hmac8)) return null;
  return { codeId, shortCode, hmac8 };
}

export default function QrScan() {
  const router = useRouter();
  const [perm, requestPerm] = useCameraPermissions();
  const [scanning, setScanning] = useState(true);
  const [pending, setPending] = useState(0);
  const [busy, setBusy] = useState(false);
  const [manual, setManual] = useState('');
  const lockRef = useRef(false);

  useEffect(function () {
    (async function () {
      setPending(await queueSize());
      try { await flushQueue(); setPending(await queueSize()); } catch (e) {}
    })();
  }, []);

  const sendScan = async function (body) {
    setBusy(true);
    try {
      const deviceId = (await getDeviceId()) || undefined;
      const full = Object.assign({ deviceId }, body);
      try {
        const res = await api.post('/api/qr/scan', full);
        const dedupe = res && res.deduped ? ' (deduped)' : '';
        Alert.alert('Marked', 'Scan recorded' + dedupe + '.');
        router.back();
      } catch (err) {
        const status = err && err.status;
        if (status === 0) {
          await enqueue(full);
          setPending(await queueSize());
          Alert.alert('Saved offline', 'We will sync this scan automatically when you are back online.');
          router.back();
        } else {
          Alert.alert('Scan failed', err.message || 'Unknown error');
          lockRef.current = false;
          setScanning(true);
        }
      }
    } finally {
      setBusy(false);
    }
  };

  const handleBar = function (result) {
    if (lockRef.current || busy) return;
    const payload = result && result.data;
    if (!payload) return;
    const parsed = parsePayload(payload);
    if (!parsed) return;
    lockRef.current = true;
    setScanning(false);
    sendScan({ payload });
  };

  const handleManual = function () {
    const trimmed = manual.trim();
    if (!trimmed) return;
    lockRef.current = true;
    setScanning(false);
    if (/^PREFECT:QR:1:/.test(trimmed)) {
      sendScan({ payload: trimmed });
    } else {
      sendScan({ shortCode: trimmed.toUpperCase() });
    }
  };

  if (!perm) {
    return <SafeAreaView style={styles.center}><ActivityIndicator color="#C9A961" /></SafeAreaView>;
  }

  if (!perm.granted) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.permText}>Prefect needs camera access to scan QR codes.</Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestPerm}>
          <Text style={styles.permBtnText}>Grant camera access</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.camWrap}>
        {scanning ? (
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={handleBar}
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.processing]}>
            <ActivityIndicator color="#FFF" size="large" />
            <Text style={styles.processingText}>Recording scan...</Text>
          </View>
        )}
        <View style={styles.camOverlay}>
          <View style={styles.camFrame} />
          <Text style={styles.camHint}>Point at a Prefect QR code</Text>
        </View>
      </View>

      {pending > 0 ? (
        <Text style={styles.queueText}>{pending} scan{pending === 1 ? '' : 's'} waiting to sync</Text>
      ) : null}

      <View style={styles.manualBox}>
        <Text style={styles.manualLabel}>Manual entry (short code)</Text>
        <TextInput
          style={styles.manualInput}
          placeholder="e.g. D7AXRE7F"
          value={manual}
          onChangeText={setManual}
          autoCapitalize="characters"
          placeholderTextColor="#A0A6B2"
        />
        <TouchableOpacity style={styles.manualBtn} onPress={handleManual} disabled={busy} activeOpacity={0.9}>
          <Text style={styles.manualBtnText}>{busy ? 'Working...' : 'Mark present'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0E1729' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8F7F5', padding: 24 },
  permText: { color: '#1B2A4E', textAlign: 'center', marginBottom: 16, fontSize: 14 },
  permBtn: { backgroundColor: '#1B2A4E', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 999 },
  permBtnText: { color: '#FFF', fontWeight: '700' },

  camWrap: { flex: 1, position: 'relative', backgroundColor: '#000' },
  processing: { alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.6)' },
  processingText: { color: '#FFF', marginTop: 8 },
  camOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  camFrame: { width: 240, height: 240, borderWidth: 3, borderColor: '#C9A961', borderRadius: 16 },
  camHint: { color: '#FFF', marginTop: 16, fontSize: 13 },

  queueText: { color: '#F4EFE2', textAlign: 'center', paddingVertical: 6, fontSize: 12 },

  manualBox: { backgroundColor: '#F8F7F5', padding: 16, paddingBottom: 24 },
  manualLabel: { fontSize: 12, fontWeight: '700', color: '#1B2A4E', letterSpacing: 0.5, marginBottom: 6, textTransform: 'uppercase' },
  manualInput: {
    backgroundColor: '#FFF', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    borderWidth: 1, borderColor: '#EFE9DA', color: '#1B2A4E', fontSize: 16,
    fontFamily: 'monospace', letterSpacing: 2,
  },
  manualBtn: { backgroundColor: '#C9A961', borderRadius: 999, paddingVertical: 14, alignItems: 'center', marginTop: 10 },
  manualBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
});
`;

// ============================================================
// Home tile patches
// ============================================================
function patchHome(relPath, importAnchor) {
  const full = path.join(ROOT, relPath);
  if (!fs.existsSync(full)) {
    console.log('skip (missing):', relPath);
    return;
  }
  let src = fs.readFileSync(full, 'utf8');

  // 1. import QrTile once
  if (!src.includes("from '../../components/QrTile'") && !src.includes("from '../components/QrTile'")) {
    // choose relative depth
    const depth = relPath.split('/').length - 1;
    const up = depth === 2 ? '../../' : '../';
    const importLine = "import QrTile from '" + up + "components/QrTile';\n";
    // insert after last import
    const lastImportIdx = src.lastIndexOf('\nimport ');
    if (lastImportIdx >= 0) {
      const endOfLine = src.indexOf('\n', lastImportIdx + 1);
      src = src.slice(0, endOfLine + 1) + importLine + src.slice(endOfLine + 1);
    } else {
      src = importLine + src;
    }
  }

  // 2. insert QrTile before the closing of the first <View style={styles.quickNav}>...</View> or or after the last quickNavBtn block
  if (!src.includes('<QrTile')) {
    // prefer replacing the opening of the first quickNav with <QrTile ... /> + same opening
    const marker = '<View style={styles.quickNav}>';
    const idx = src.indexOf(marker);
    if (idx >= 0) {
      const inject = '<QrTile hint="Create, print and scan QR codes" />\n\n        ';
      src = src.slice(0, idx) + inject + src.slice(idx);
    } else {
      console.log('no quickNav anchor in', relPath);
    }
  }

  fs.writeFileSync(full, src, 'utf8');
  console.log('patched', relPath);
}

// write new files
let n = 0;
for (const rel of Object.keys(files)) {
  const full = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, files[rel], 'utf8');
  n++;
  console.log('wrote', rel, '(' + Buffer.byteLength(files[rel], 'utf8') + ' bytes)');
}

// patch homes
const homes = [
  'app/student/home.js',
  'app/lecturer/home.js',
  'app/department/home.js',
  'app/merchant/home.js',
  'app/other/home.js',
];
for (const h of homes) patchHome(h);

console.log('3b done:', n, 'new files');