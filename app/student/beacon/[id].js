import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Ble from "expo-ble-kit";
import { api, ApiError } from "../../../lib/api";

const SERVICE_UUID = "0000FEED-0000-1000-8000-00805F9B34FB";
const MIN_RSSI = -80;

export default function StudentBeaconScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [scanning, setScanning] = useState(false);
  const [found, setFound] = useState(null);
  const [rssi, setRssi] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");
  const scanRef = useRef(null);

  function extractShortCode(manufData) {
    if (!manufData) return null;
    const bytes = Array.isArray(manufData) ? manufData : (manufData.data || []);
    if (!bytes || bytes.length < 10) return null;
    const chars = [];
    for (let i = 0; i < 6; i++) {
      const c = bytes[i];
      if (c >= 32 && c <= 126) chars.push(String.fromCharCode(c));
    }
    return chars.join("");
  }

  async function startScan() {
    setError("");
    setConfirmed(false);
    setFound(null);
    setRssi(null);
    try {
      const perm = await Ble.requestPermissionsAsync({ scan: true, advertise: false, connect: false });
      if (perm && perm.scan === false) { setError("Bluetooth scan permission denied"); return; }
    } catch (e) {
      console.log("perm err", e);
    }
    try {
      setScanning(true);
      const scan = await Ble.startScan({ serviceUUIDs: [SERVICE_UUID] }, (device) => {
        if (!device) return;
        const shortCode = extractShortCode(device.manufacturerData);
        if (!shortCode) return;
        setFound(shortCode);
        setRssi(device.rssi || null);
      });
      scanRef.current = scan;
    } catch (e) {
      setError("Scan failed: " + (e && e.message));
      setScanning(false);
    }
  }

  async function stopScan() {
    if (scanRef.current && scanRef.current.stop) {
      try { await scanRef.current.stop(); } catch (e) {}
    }
    scanRef.current = null;
    setScanning(false);
  }

  async function submitCheckin() {
    if (!found) { setError("No beacon found yet"); return; }
    if (rssi !== null && rssi < MIN_RSSI) { setError("You are too far from the lecturer (RSSI " + rssi + ")"); return; }
    setSubmitting(true);
    setError("");
    try {
      const res = await api.post("/api/attendance/checkin", {
        sessionId: id,
        secret: found,
        bleRssi: rssi,
      });
      setConfirmed(true);
      await stopScan();
    } catch (e) {
      setError(e instanceof ApiError ? (e.message || "Check-in failed") : "Network error");
    }
    setSubmitting(false);
  }

  useEffect(() => {
    return () => { stopScan(); };
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Check in</Text>
        <Text style={styles.subtitle}>Scanning for lecturer beacon</Text>
      </View>
      {confirmed ? (
        <View style={styles.successCard}>
          <Text style={styles.successTitle}>Attendance confirmed</Text>
          <Text style={styles.successHint}>You are marked present for this session.</Text>
          <TouchableOpacity style={styles.buttonPrimary} onPress={() => router.back()}>
            <Text style={styles.buttonText}>Done</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.card}>
            <Text style={styles.label}>Beacon</Text>
            <Text style={styles.code}>{found || (scanning ? "Searching..." : "Not found")}</Text>
            {rssi !== null ? <Text style={styles.hint}>Signal {rssi} dBm</Text> : null}
          </View>
          {error ? <View style={styles.errorCard}><Text style={styles.errorText}>{error}</Text></View> : null}
          {!scanning ? (
            <TouchableOpacity style={styles.buttonPrimary} onPress={startScan}>
              <Text style={styles.buttonText}>Start scan</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.buttonDanger} onPress={stopScan}>
              <Text style={styles.buttonText}>Stop scan</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.buttonPrimary, (!found || submitting) && styles.buttonDisabled]}
            onPress={submitCheckin}
            disabled={!found || submitting}
          >
            <Text style={styles.buttonText}>{submitting ? "Submitting..." : "Confirm attendance"}</Text>
          </TouchableOpacity>
        </>
      )}
      <TouchableOpacity style={styles.buttonSecondary} onPress={() => { stopScan(); router.back(); }}>
        <Text style={styles.buttonSecondaryText}>Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb", padding: 16 },
  header: { marginBottom: 16 },
  title: { fontSize: 22, fontWeight: "700", color: "#111827" },
  subtitle: { fontSize: 13, color: "#6b7280", marginTop: 4 },
  card: { backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 12, padding: 16, marginBottom: 12 },
  label: { fontSize: 12, fontWeight: "600", color: "#6b7280", marginBottom: 4 },
  code: { fontSize: 28, fontWeight: "700", color: "#111827", letterSpacing: 3 },
  hint: { fontSize: 12, color: "#6b7280", marginTop: 4 },
  errorCard: { backgroundColor: "#fef2f2", borderWidth: 1, borderColor: "#fecaca", borderRadius: 8, padding: 12, marginBottom: 12 },
  errorText: { fontSize: 13, color: "#991b1b" },
  successCard: { backgroundColor: "#ecfdf5", borderWidth: 1, borderColor: "#a7f3d0", borderRadius: 12, padding: 20, marginBottom: 12, alignItems: "center" },
  successTitle: { fontSize: 18, fontWeight: "700", color: "#065f46", marginBottom: 6 },
  successHint: { fontSize: 13, color: "#047857", textAlign: "center", marginBottom: 12 },
  buttonPrimary: { backgroundColor: "#111827", borderRadius: 10, paddingVertical: 14, alignItems: "center", marginTop: 8 },
  buttonDanger: { backgroundColor: "#dc2626", borderRadius: 10, paddingVertical: 14, alignItems: "center", marginTop: 8 },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: "#ffffff", fontSize: 15, fontWeight: "600" },
  buttonSecondary: { paddingVertical: 12, alignItems: "center" },
  buttonSecondaryText: { color: "#6b7280", fontSize: 14 },
})