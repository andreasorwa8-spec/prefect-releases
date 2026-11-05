import React, { useState, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { api, ApiError } from "../../../lib/api";

export default function StudentBeaconListScreen() {
  const router = useRouter();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setError("");
      const res = await api.get("/api/sessions/active");
      const list = (res && res.sessions) ? res.sessions : (Array.isArray(res) ? res : []);
      setSessions(list);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not load active sessions");
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  function onRefresh() { setRefreshing(true); load(); }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#111827" /></View>;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={sessions}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.empty}>No active attendance sessions for your courses.</Text>
            <Text style={styles.emptyHint}>Pull down to refresh.</Text>
          </View>
        }
        ListHeaderComponent={error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push("/student/beacon/" + item.id)}
          >
            <Text style={styles.courseName}>{item.course ? (item.course.name || item.course.code) : "Session"}</Text>
            <Text style={styles.courseMeta}>
              {item.course ? item.course.code : ""} {item.roomName ? " - " + item.roomName : ""}
            </Text>
            <Text style={styles.hint}>
              Started {new Date(item.startedAt).toLocaleTimeString()} - ends {new Date(item.endsAt).toLocaleTimeString()}
            </Text>
            <View style={styles.ctaRow}>
              <Text style={styles.cta}>Tap to check in</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  list: { padding: 16 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, backgroundColor: "#f9fafb" },
  empty: { fontSize: 14, color: "#6b7280", textAlign: "center", marginBottom: 6 },
  emptyHint: { fontSize: 12, color: "#9ca3af", textAlign: "center" },
  card: { backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 12, padding: 16, marginBottom: 12 },
  courseName: { fontSize: 16, fontWeight: "700", color: "#111827" },
  courseMeta: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  hint: { fontSize: 12, color: "#6b7280", marginTop: 8 },
  ctaRow: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#f3f4f6" },
  cta: { fontSize: 13, fontWeight: "600", color: "#059669" },
  errorBox: { backgroundColor: "#fef2f2", borderWidth: 1, borderColor: "#fecaca", borderRadius: 8, padding: 12, marginBottom: 12 },
  errorText: { fontSize: 13, color: "#991b1b" },
})