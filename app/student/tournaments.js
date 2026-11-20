import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../../lib/theme';

export default function Tournaments() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.back}>←</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>Tournaments</Text>
        <View style={{width: 24}} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>E-Football Cup</Text>
          <Text style={styles.heroSub}>Entry: KSh 100 • Prize: KSh 800</Text>
          <TouchableOpacity style={styles.heroBtn}><Text style={styles.heroBtnText}>Join Tournament</Text></TouchableOpacity>
        </View>
        <Text style={styles.sectionTitle}>Live Brackets</Text>
        <View style={styles.bracketCard}>
          <Text style={styles.matchup}>Player A vs Player B</Text>
          <Text style={styles.score}>2 - 1</Text>
        </View>
        <View style={styles.bracketCard}>
          <Text style={styles.matchup}>Player C vs Player D</Text>
          <Text style={styles.score}>Pending</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgMain },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60, backgroundColor: colors.bgCard },
  back: { fontSize: 24, color: colors.textPrimary },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  content: { padding: 20 },
  hero: { backgroundColor: colors.navyDark, borderRadius: 16, padding: 24, marginBottom: 20, alignItems: 'center' },
  heroTitle: { fontSize: 24, fontWeight: '800', color: colors.bgMain, marginBottom: 8 },
  heroSub: { fontSize: 14, color: colors.textLight, marginBottom: 20 },
  heroBtn: { backgroundColor: colors.bgMain, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 30 },
  heroBtnText: { color: colors.navyDark, fontWeight: '800' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginBottom: 15 },
  bracketCard: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: colors.bgCard, padding: 16, borderRadius: 12, marginBottom: 10 },
  matchup: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  score: { fontSize: 15, fontWeight: '800', color: colors.navyBase }
});