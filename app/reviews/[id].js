import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { api, ApiError } from "../../lib/api";

export default function ReviewDetailScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const id = params.id;
  const [loading, setLoading] = useState(true);
  const [review, setReview] = useState(null);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get("/api/reviews/" + id);
        if (cancelled) return;
        setReview(res);
        setRating(res.rating);
        setTitle(res.title || "");
        setBody(res.body || "");
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof ApiError ? e.message : "Could not load review");
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [id]);

  async function save() {
    setBusy(true);
    setError("");
    try {
      await api.patch("/api/reviews/" + id, { rating, title: title || null, body });
      Alert.alert("Saved", "Your review has been updated.", [{ text: "OK", onPress: () => router.back() }]);
    } catch (e) {
      setError(e instanceof ApiError ? (e.message || "Save failed") : "Network error");
    }
    setBusy(false);
  }

  function confirmDelete() {
    Alert.alert('Delete review?', 'This cannot be undone.', [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: doDelete }
    ]);
  }

  async function doDelete() {
    setBusy(true);
    try {
      await api.delete("/api/reviews/" + id);
      router.replace("/reviews");
    } catch (e) {
      setError(e instanceof ApiError ? (e.message || "Delete failed") : "Network error");
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#111827" />
      </View>
    );
  }

  if (!review) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error || "Review not found"}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Rating</Text>
      <View style={styles.starRow}>
        {[1,2,3,4,5].map((n) => (
          <TouchableOpacity key={n} onPress={() => setRating(n)}>
            <Text style={[styles.star, n <= rating ? styles.starOn : styles.starOff]}>
              {String.fromCharCode(n <= rating ? 0x2605 : 0x2606)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.label}>Title</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="Short headline"
        maxLength={120}
      />
      <Text style={styles.label}>Review</Text>
      <TextInput
        style={[styles.input, styles.textarea]}
        value={body}
        onChangeText={setBody}
        placeholder="What did you like or dislike?"
        multiline
        numberOfLines={6}
        maxLength={4000}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TouchableOpacity
        style={[styles.btn, styles.btnPrimary, busy && styles.btnDisabled]}
        onPress={save}
        disabled={busy}
      >
        <Text style={styles.btnPrimaryText}>{busy ? "Saving..." : "Save changes"}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.btn, styles.btnDanger, busy && styles.btnDisabled]}
        onPress={confirmDelete}
        disabled={busy}
      >
        <Text style={styles.btnDangerText}>Delete review</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  content: { padding: 20 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  label: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 6, marginTop: 12 },
  starRow: { flexDirection: "row", marginBottom: 8 },
  star: { fontSize: 32, marginRight: 6 },
  starOn: { color: "#eab308" },
  starOff: { color: "#d1d5db" },
  input: { borderWidth: 1, borderColor: "#d1d5db", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: "#111827" },
  textarea: { minHeight: 120, textAlignVertical: "top" },
  btn: { borderRadius: 8, paddingVertical: 12, alignItems: "center", marginTop: 16 },
  btnPrimary: { backgroundColor: "#111827" },
  btnPrimaryText: { color: "#ffffff", fontSize: 15, fontWeight: "600" },
  btnDanger: { backgroundColor: "#fee2e2" },
  btnDangerText: { color: "#991b1b", fontSize: 15, fontWeight: "600" },
  btnDisabled: { opacity: 0.5 },
  error: { color: "#991b1b", fontSize: 13, marginTop: 8 },
});