import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../../lib/theme';

export default function BusTracking() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.back}>←</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>Campus Shuttle</Text>
        <View style={{width: 24}} />
      </View>
      <View style={styles.mapPlaceholder}>
        <Text style={styles.mapText}>📍 Live GPS Map View</Text>
      </View>
      <View style={styles.infoCard}>
        <Text style={styles.routeName}>Route A: Main Gate to Hostels</Text>
        <Text style={styles.eta}>Arriving in: 5 mins</Text>
        <TouchableOpacity style={styles.boardBtn}>
          <Text style={styles.boardBtnText}>Scan QR to Board</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgMain },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60, backgroundColor: colors.bgCard },
  back: { fontSize: 24, color: colors.textPrimary },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  mapPlaceholder: { flex: 1, backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center' },
  mapText: { fontSize: 18, color: '#6B7280', fontWeight: '600' },
  infoCard: { backgroundColor: colors.bgCard, padding: 24, borderTopLeftRadius: 24, borderTopRightRadius: 24, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  routeName: { fontSize: 18, fontWeight: '800', color: colors.textPrimary, marginBottom: 8 },
  eta: { fontSize: 16, fontWeight: '600', color: 'green', marginBottom: 20 },
  boardBtn: { backgroundColor: colors.navyBase, padding: 16, borderRadius: 12, alignItems: 'center' },
  boardBtnText: { color: colors.bgMain, fontWeight: '700', fontSize: 16 }
});