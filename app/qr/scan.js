// app/qr/scan.js - camera scanner + manual entry + offline queue
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
