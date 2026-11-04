import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Linking } from "react-native";
import { useRouter } from "expo-router";
import { api, ApiError } from "../../lib/api";

const TIER_COPY = {
  FREE: { name: "Free", tagline: "Try Prefect Career", features: ["1 resume score", "1 mock interview", "Local salary insight only"] },
  CAREER: { name: "Career", tagline: "Land your first job", features: ["5 resume scores/mo", "3 interviews/mo", "Local + remote insight", "Payment setup guide"] },
  CAREER_PRO: { name: "Career Pro", tagline: "Go global", features: ["30 resume scores/mo", "15 interviews/mo", "Auto-apply", "Priority matching"] },
  CAREER_ELITE: { name: "Career Elite", tagline: "Unlimited + human coach", features: ["Unlimited everything", "1:1 coaching", "Guaranteed intro"] },
};

export default function CareerPremiumScreen() {
  const router = useRouter();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState("");

  async function load() {
    try {
      const res = await api.get("/api/careers/status");
      setStatus(res);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not load status");
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function subscribe(tier) {
    setBusy(tier);
    setError("");
    try {
      const res = await api.post("/api/careers/subscribe", { tier });
      const url = res.authorizationUrl;
      if (url) {
        const supported = await Linking.canOpenURL(url).catch(() => false);
        if (supported) {
          await Linking.openURL(url);
          Alert.alert("Payment", "Complete your payment in the browser, then return here and tap Refresh to see your new tier.", [{ text: "OK", onPress: () => load() }]);
        } else {
          setError("Could not open payment URL");
        }
      } else {
        setError("No payment URL returned");
      }
    } catch (e) {
      setError(e instanceof ApiError ? (e.message || "Subscribe failed") : "Network error");
    }
    setBusy(null);
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#111827" /></View>;
  }

  if (!status) {
    return <View style={styles.center}><Text style={styles.error}>{error || "Could not load premium"}</Text></View>;
  }

  const tierOrder = ["FREE", "CAREER", "CAREER_PRO", "CAREER_ELITE"];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.currentCard}>
        <Text style={styles.currentLabel}>Current tier</Text>
        <Text style={styles.currentValue}>{status.tier}</Text>
        <Text style={styles.currentMeta}>
          Resume: {status.usage.resumeScore || 0} / {status.limits.resumeScore === -1 ? "∞" : status.limits.resumeScore} · 
          Interviews: {status.usage.interview || 0} / {status.limits.interview === -1 ? "∞" : status.limits.interview}
        </Text>
      </View>

      {tierOrder.map((tierKey) => {
        const t = TIER_COPY[tierKey];
        const isCurrent = tierKey === status.tier;
        const price = tierKey === "FREE" ? "Free" : "KSh " + (status.allTiers[tierKey].monthlyCents / 100).toLocaleString("en-KE") + "/mo";
        return (
          <View key={tierKey} style={[styles.card, isCurrent && styles.cardCurrent]}>
            <Text style={styles.tierName}>{t.name}</Text>
            <Text style={styles.tierTagline}>{t.tagline}</Text>
            <Text style={styles.price}>{price}</Text>
            {t.features.map((f, i) => (
              <Text key={i} style={styles.feature}>• {f}</Text>
            ))}
            {isCurrent ? (
              <Text style={styles.currentPlanText}>Current plan</Text>
            ) : tierKey === "FREE" ? (
              <Text style={styles.freeNote}>-</Text>
            ) : (
              <TouchableOpacity
                style={[styles.button, busy === tierKey && styles.buttonDisabled]}
                onPress={() => subscribe(tierKey)}
                disabled={busy === tierKey}
              >
                <Text style={styles.buttonText}>{busy === tierKey ? "Opening..." : "Subscribe"}</Text>
              </TouchableOpacity>
            )}
          </View>
        );
      })}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity onPress={load} style={styles.refresh}>
        <Text style={styles.refreshText}>Refresh</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  content: { padding: 16 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  currentCard: { backgroundColor: "#111827", borderRadius: 12, padding: 16, marginBottom: 16 },
  currentLabel: { color: "#9ca3af", fontSize: 11, fontWeight: "600" },
  currentValue: { color: "#ffffff", fontSize: 20, fontWeight: "700", marginTop: 2 },
  currentMeta: { color: "#d1d5db", fontSize: 12, marginTop: 4 },
  card: { backgroundColor: "#ffffff", borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "#e5e7eb" },
  cardCurrent: { borderColor: "#3b82f6", borderWidth: 2 },
  tierName: { fontSize: 18, fontWeight: "700", color: "#111827" },
  tierTagline: { fontSize: 13, color: "#6b7280", marginTop: 2 },
  price: { fontSize: 22, fontWeight: "700", color: "#111827", marginTop: 8, marginBottom: 8 },
  feature: { fontSize: 13, color: "#374151", marginBottom: 3 },
  button: { backgroundColor: "#111827", borderRadius: 8, paddingVertical: 12, alignItems: "center", marginTop: 12 },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: "#ffffff", fontSize: 14, fontWeight: "600" },
  currentPlanText: { fontSize: 13, color: "#3b82f6", marginTop: 12, textAlign: "center", fontWeight: "600" },
  freeNote: { fontSize: 13, color: "#9ca3af", marginTop: 12, textAlign: "center" },
  error: { color: "#991b1b", fontSize: 13, marginTop: 12, textAlign: "center" },
  refresh: { paddingVertical: 12, alignItems: "center", marginTop: 8 },
  refreshText: { color: "#3b82f6", fontSize: 14, fontWeight: "600" },
});