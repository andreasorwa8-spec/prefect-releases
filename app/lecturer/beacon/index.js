import React, { useState, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { api, ApiError } from "../../../lib/api";

export default function LecturerBeaconListScreen() {
  const router = useRouter();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setError("");
      const res = await api.get("/api/courses?mine=1");
      const courses = (res && res.courses) ? res.courses : (Array.isArray(res) ? res : []);
      const activeRes = await api.get("/api/sessions/active").catch(() => ({ sessions: [] }));
      const activeMap = {};
      const activeList = (activeRes && activeRes.sessions) ? activeRes.sessions : [];
      for (const s of activeList) activeMap[s.courseId] = s;
      const merged = courses.map((c) => ({ course: c, activeSession: activeMap[c.id] || null }));
      setSessions(merged);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not load courses");
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  function onRefresh() { setRefreshing(true); load(); }

  async function startForCourse(course) {
    try {
      const res = await api.post("/api/sessions/start", { courseId: course.id, durationMinutes: 60 });
      if (res && res.sessionId) {
        router.push("/lecturer/beacon/" + res.sessionId);
      } else {
        setError("Session start did not return a sessionId");
      }
    } catch (e) {
      setError(e instanceof ApiError ? (e.message || "Could not start session") : "Network error");
    }
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#111827" /></View>;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={sessions}
        keyExtractor={(item) => item.course.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.empty}>No courses assigned to you.</Text>
          </View>
        }
        ListHeaderComponent={error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.courseName}>{item.course.name || item.course.code}</Text>
                <Text style={styles.courseMeta}>
                  {item.course.code} {item.course.department ? " - " + item.course.department.name : ""}
                </Text>
              </View>
              {item.activeSession ? (
                <View style={styles.badgeLive}><Text style={styles.badgeLiveText}>ACTIVE</Text></View>
              ) : null}
            </View>
            {item.activeSession ? (
              <TouchableOpacity
                style={[styles.button, styles.buttonPrimary]}
                onPress={() => router.push("/lecturer/beacon/" + item.activeSession.id)}
              >
                <Text style={styles.buttonText}>Open active session</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.button, styles.buttonGreen]}
                onPress={() => startForCourse(item.course)}
              >
                <Text style={styles.buttonText}>Start attendance session</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  list: { padding: 16 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, backgroundColor: "#f9fafb" },
  empty: { fontSize: 14, color: "#6b7280", textAlign: "center" },
  card: { backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 12, padding: 16, marginBottom: 12 },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  courseName: { fontSize: 16, fontWeight: "700", color: "#111827" },
  courseMeta: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  badgeLive: { backgroundColor: "#059669", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  badgeLiveText: { color: "#ffffff", fontSize: 11, fontWeight: "700" },
  button: { borderRadius: 10, paddingVertical: 12, alignItems: "center" },
  buttonGreen: { backgroundColor: "#059669" },
  buttonPrimary: { backgroundColor: "#111827" },
  buttonText: { color: "#ffffff", fontSize: 14, fontWeight: "600" },
  errorBox: { backgroundColor: "#fef2f2", borderWidth: 1, borderColor: "#fecaca", borderRadius: 8, padding: 12, marginBottom: 12 },
  errorText: { fontSize: 13, color: "#991b1b" },
})