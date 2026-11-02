import React from "react";
import { TouchableOpacity, Text, View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

const ICON_STAR = String.fromCharCode(0x2B50);

export default function ReviewTile() {
  const router = useRouter();
  return (
    <TouchableOpacity style={styles.tile} onPress={() => router.push("/reviews")} activeOpacity={0.8}>
      <Text style={styles.icon}>{ICON_STAR}</Text>
      <View style={styles.text}>
        <Text style={styles.label}>My Reviews</Text>
        <Text style={styles.hint}>Reviews you have written</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tile: { flexDirection: "row", alignItems: "center", backgroundColor: "#ffffff", borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "#e5e7eb" },
  icon: { fontSize: 28, marginRight: 12 },
  text: { flex: 1 },
  label: { fontSize: 16, fontWeight: "600", color: "#111827", marginBottom: 2 },
  hint: { fontSize: 13, color: "#6b7280" },
});