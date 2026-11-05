import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Ble from "expo-ble-kit";
import { api, ApiError } from "../../../lib/api";

const SERVICE_UUID = "0000FEED-0000-1000-8000-00805F9B34FB";
const COMPANY_ID = 0xFFFF;

function shortCodeFromSecret(secret) {
  if (!secret || secret.length < 6) return "";
  return secret.slice(0, 6);
}

export default function LecturerBeaconScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [broadcasting, setBroadcasting] = useState(false);
  const [slot, setSlot] = useState(0);
  const [secretShort, setSecretShort] = useState("");
  const [endsAt, setEndsAt] = useState(null);
  const [checkIns, setCheckIns] = useState(0);
  const [error, setError] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(30);
  const broadcastRef = useRef(null);
  const rotationTimer = useRef(null);
  const countdownTimer = useRef(null);

  async function fetchAndBroadcast() {
    try {
      const res = await api.get("/api/sessions/current-secret?sessionId=" + id);
      if (!res || !res.secret) { setError("No secret returned"); return; }
      const short = shortCodeFromSecret(res.secret);
      setSecretShort(short);
      setSlot(res.slot);
      setEndsAt(res.endsAt);
      setCheckIns(res.checkInsCount || 0);
      setSecondsLeft(Math.ceil((res.ttlMs || 30000) / 1000));
      const dataBytes = [];
      for (let i = 0; i < short.length; i++) dataBytes.push(short.charCodeAt(i) & 0xff);
      const slotByte0 = (res.slot >> 24) & 0xff;
      const slotByte1 = (res.slot >> 16) & 0xff;
      const slotByte2 = (res.slot >> 8) & 0xff;
      const slotByte3 = res.slot & 0xff;
      dataBytes.push(slotByte0, slotByte1, slotByte2, slotByte3);
      if (broadcastRef.current && broadcastRef.current.stop) {
        try { await broadcastRef.current.stop(); } catch (e) {}
      }
      const adv = await Ble.startAdvertising({
        localName: "PrefectSession",
        serviceUUIDs: [SERVICE_UUID],
        manufacturerData: { companyId: COMPANY_ID, data: dataBytes },
      });
      broadcastRef.current = adv;
      setBroadcasting(true);
      setError("");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : (e && e.message) || "Broadcast failed");
      setBroadcasting(false);
    }
  }

  async function stopBroadcast() {
    if (broadcastRef.current && broadcastRef.current.stop) {
      try { await broadcastRef.current.stop(); } catch (e) {}
    }
    broadcastRef.current = null;
    setBroadcasting(false);
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const perm = await Ble.requestPermissionsAsync({ advertise: true, scan: false, connect: false });
        if (cancelled) return;
        if (perm && perm.advertise === false) {
          setError("Bluetooth advertise permission denied");
          setLoading(false);
          return;
        }
      } catch (e) {
        console.log("perm err", e);
      }
      if (cancelled) return;
      await fetchAndBroadcast();
      setLoading(false);
      if (cancelled) return;
      rotationTimer.current = setInterval(() => { fetchAndBroadcast(); }, 25000);
      countdownTimer.current = setInterval(() => {
        setSecondsLeft((s) => (s <= 1 ? 30 : s - 1));
      }, 1000);
    })();
    return () => {
      cancelled = true;
      if (rotationTimer.current) clearInterval(rotationTimer.current);
      if (countdownTimer.current) clearInterval(countdownTimer.current);
      stopBroadcast();
    };
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#111827" />
        <Text style={styles.loadingText}>Starting BLE broadcast...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Attendance Broadcast</Text>
        <Text style={styles.subtitle}>Session {String(id).slice(0, 12)}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>Status</Text>
        <Text style={broadcasting ? styles.statusOn : styles.statusOff}>
          {broadcasting ? "Broadcasting on BLE" : "Stopped"}
        </Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>Current code</Text>
        <Text style={styles.code}>{secretShort || "----"}</Text>
        <Text style={styles.hint}>Slot {slot} - rotates in {secondsLeft}s</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>Check-ins</Text>
        <Text style={styles.bigNumber}>{checkIns}</Text>
      </View>
      {endsAt ? (
        <View style={styles.card}>
          <Text style={styles.label}>Session ends</Text>
          <Text style={styles.text}>{new Date(endsAt).toLocaleTimeString()}</Text>
        </View>
      ) : null}
      <TouchableOpacity
        style={[styles.button, broadcasting ? styles.buttonDanger : styles.buttonGreen]}
        onPress={async () => {
          if (broadcasting) {
            await stopBroadcast();
          } else {
            await fetchAndBroadcast();
          }
        }}
      >
        <Text style={styles.buttonText}>{broadcasting ? "Stop broadcast" : "Restart broadcast"}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.buttonSecondary}
        onPress={async () => {
          await stopBroadcast();
          router.back();
        }}
      >
        <Text style={styles.buttonSecondaryText}>Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb", padding: 16 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#f9fafb" },
  loadingText: { marginTop: 12, fontSize: 14, color: "#6b7280" },
  header: { marginBottom: 16 },
  title: { fontSize: 22, fontWeight: "700", color: "#111827" },
  subtitle: { fontSize: 13, color: "#6b7280", marginTop: 4 },
  card: { backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 12, padding: 16, marginBottom: 12 },
  label: { fontSize: 12, fontWeight: "600", color: "#6b7280", marginBottom: 4 },
  statusOn: { fontSize: 16, fontWeight: "600", color: "#059669" },
  statusOff: { fontSize: 16, fontWeight: "600", color: "#dc2626" },
  code: { fontSize: 32, fontWeight: "700", color: "#111827", letterSpacing: 4 },
  hint: { fontSize: 12, color: "#6b7280", marginTop: 4 },
  bigNumber: { fontSize: 36, fontWeight: "700", color: "#111827" },
  text: { fontSize: 16, color: "#111827" },
  error: { fontSize: 13, color: "#991b1b", marginTop: 8 },
  button: { borderRadius: 10, paddingVertical: 14, alignItems: "center", marginBottom: 8 },
  buttonGreen: { backgroundColor: "#059669" },
  buttonDanger: { backgroundColor: "#dc2626" },
  buttonText: { color: "#ffffff", fontSize: 15, fontWeight: "600" },
  buttonSecondary: { paddingVertical: 12, alignItems: "center" },
  buttonSecondaryText: { color: "#6b7280", fontSize: 14 },
})