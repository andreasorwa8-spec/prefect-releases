import React, { useState, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { api, ApiError } from "../../lib/api";

function StarRow({ rating }) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(String.fromCharCode(i <= rating ? 0x2605 : 0x2606));
  }
  return <Text style={styles.stars}>{stars.join("")}</Text>;
}

export default function MyReviewsScreen() {
  const router = useRouter();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setError("");
      const res = await api.get("/api/reviews?mine=1&limit=50");
      setReviews(res.items || []);
    } catch (e) {
      if (e instanceof ApiError) setError(e.message || "Could not load reviews");
      else setError("Network error");
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  function onRefresh() {
    setRefreshing(true);
    load();
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#111827" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={reviews}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.empty}>You have not written any reviews yet.</Text>
            <Text style={styles.emptyHint}>Buy a product on Prefect, then share your experience.</Text>
          </View>
        }
        ListHeaderComponent={error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push("/reviews/" + item.id)}
            activeOpacity={0.8}
          >
            <View style={styles.cardHeader}>
              <StarRow rating={item.rating} />
              <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
            </View>
            {item.status !== "PUBLISHED" ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.status}</Text>
              </View>
            ) : null}
            {item.title ? <Text style={styles.title}>{item.title}</Text> : null}
            <Text style={styles.body} numberOfLines={3}>{item.body}</Text>
            {item.reply ? (
              <View style={styles.replyBox}>
                <Text style={styles.replyLabel}>Seller response</Text>
                <Text style={styles.replyBody} numberOfLines={2}>{item.reply.body}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  list: { padding: 16 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  empty: { fontSize: 16, color: "#111827", textAlign: "center", marginBottom: 8 },
  emptyHint: { fontSize: 13, color: "#6b7280", textAlign: "center" },
  card: { backgroundColor: "#ffffff", borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "#e5e7eb" },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  stars: { fontSize: 16, color: "#eab308" },
  date: { fontSize: 12, color: "#9ca3af" },
  title: { fontSize: 15, fontWeight: "600", color: "#111827", marginBottom: 4 },
  body: { fontSize: 14, color: "#374151", lineHeight: 20 },
  replyBox: { marginTop: 10, padding: 10, backgroundColor: "#eff6ff", borderRadius: 8, borderLeftWidth: 3, borderLeftColor: "#3b82f6" },
  replyLabel: { fontSize: 11, fontWeight: "600", color: "#1e40af", marginBottom: 2 },
  replyBody: { fontSize: 13, color: "#1e3a8a" },
  badge: { alignSelf: "flex-start", backgroundColor: "#fef3c7", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginBottom: 6 },
  badgeText: { fontSize: 11, color: "#92400e", fontWeight: "600" },
  errorBox: { backgroundColor: "#fef2f2", padding: 12, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: "#fecaca" },
  errorText: { fontSize: 13, color: "#991b1b" },
});