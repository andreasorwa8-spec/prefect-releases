import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import ModernNavBar from '../../components/ModernNavBar';
import { colors, shadows } from '../../lib/theme';

export default function StudentHome() {
  const router = useRouter();
  const { user } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, {user?.name?.split(' ')[0] || 'Student'}</Text>
            <Text style={styles.subtitle}>Ready for class?</Text>
          </View>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'S'}</Text>
          </View>
        </View>

        {/* Axiom AI Banner */}
        <TouchableOpacity style={styles.aiBanner} onPress={() => router.push('/student/axiom')} activeOpacity={0.9}>
          <View style={styles.aiBadge}><Text style={styles.aiBadgeText}>PREMIUM</Text></View>
          <Text style={styles.aiTitle}>Axiom AI Tutor</Text>
          <Text style={styles.aiSub}>Step-by-step math solutions, video explanations, and interactive quizzes.</Text>
          <View style={styles.aiActionRow}>
            <Text style={styles.aiAction}>Solve a problem</Text>
            <Text style={styles.aiArrow}>→</Text>
          </View>
        </TouchableOpacity>

        {/* NEW: Campus Hub */}
        <Text style={styles.sectionTitle}>Campus Hub</Text>
        <View style={styles.gridRow}>
          <TouchableOpacity style={styles.gridCard} onPress={() => router.push('/student/live-sessions')}>
            <View style={[styles.gridIcon, { backgroundColor: '#FEE2E2' }]}><Text>📹</Text></View>
            <Text style={styles.gridTitle}>AI Zoom</Text>
            <Text style={styles.gridDesc}>Live Classes</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.gridCard} onPress={() => router.push('/student/tournaments')}>
            <View style={[styles.gridIcon, { backgroundColor: '#E0E7FF' }]}><Text>🏆</Text></View>
            <Text style={styles.gridTitle}>Tournaments</Text>
            <Text style={styles.gridDesc}>E-Football</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.gridCard} onPress={() => router.push('/student/careers')}>
            <View style={[styles.gridIcon, { backgroundColor: '#E0F2FE' }]}><Text>💼</Text></View>
            <Text style={styles.gridTitle}>Career AI</Text>
            <Text style={styles.gridDesc}>Resume & Interviews</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.gridCard} onPress={() => router.push('/student/book-sponsor')}>
            <View style={[styles.gridIcon, { backgroundColor: '#E0F2FE' }]}><Text>📢</Text></View>
            <Text style={styles.gridTitle}>Billboard</Text>
            <Text style={styles.gridDesc}>Book Ad Space</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.gridRow}>
          <TouchableOpacity style={styles.gridCard} onPress={() => router.push('/student/bus')}>
            <View style={[styles.gridIcon, { backgroundColor: '#FEF3C7' }]}><Text>🚌</Text></View>
            <Text style={styles.gridTitle}>Bus Tracker</Text>
            <Text style={styles.gridDesc}>Track Shuttle</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.gridCard} onPress={() => router.push('/student/progress')}>
            <View style={[styles.gridIcon, { backgroundColor: '#D1FAE5' }]}><Text>📊</Text></View>
            <Text style={styles.gridTitle}>Risk AI</Text>
            <Text style={styles.gridDesc}>Progress</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        <TouchableOpacity style={styles.actionCard} activeOpacity={0.8}>
          <View style={styles.actionIconBox}><Text style={styles.actionIcon}>B</Text></View>
          <View style={styles.actionInfo}>
            <Text style={styles.actionTitle}>BLE Check-in</Text>
            <Text style={styles.actionDesc}>Mark your attendance</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard} activeOpacity={0.8}>
          <View style={styles.actionIconBox}><Text style={styles.actionIcon}>Q</Text></View>
          <View style={styles.actionInfo}>
            <Text style={styles.actionTitle}>QR Codes</Text>
            <Text style={styles.actionDesc}>Scan or generate</Text>
          </View>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>
      <ModernNavBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgMain },
  scrollContent: { padding: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, marginTop: 10 },
  greeting: { fontSize: 24, fontWeight: '800', color: colors.textPrimary },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  avatarPlaceholder: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.navyBase, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.bgMain, fontSize: 20, fontWeight: 'bold' },
  aiBanner: { backgroundColor: colors.navyDark, borderRadius: 20, padding: 24, marginBottom: 30, ...shadows.card },
  aiBadge: { backgroundColor: colors.bgMain, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start', marginBottom: 12 },
  aiBadgeText: { color: colors.navyDark, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  aiTitle: { fontSize: 24, fontWeight: '800', color: colors.bgMain, marginBottom: 8 },
  aiSub: { fontSize: 14, color: colors.textLight, lineHeight: 20, marginBottom: 20 },
  aiActionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  aiAction: { color: colors.bgMain, fontSize: 15, fontWeight: '700' },
  aiArrow: { color: colors.bgMain, fontSize: 20 },
  
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginBottom: 16 },
  
  gridRow: { flexDirection: 'row', gap: 15, marginBottom: 15 },
  gridCard: { flex: 1, backgroundColor: colors.bgCard, borderRadius: 16, padding: 16, ...shadows.card },
  gridIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  gridTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 },
  gridDesc: { fontSize: 12, color: colors.textSecondary },

  actionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgCard, borderRadius: 16, padding: 16, marginBottom: 12, ...shadows.card },
  actionIconBox: { width: 48, height: 48, borderRadius: 12, backgroundColor: colors.bgMain, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  actionIcon: { fontSize: 20, fontWeight: 'bold', color: colors.navyBase },
  actionInfo: { flex: 1 },
  actionTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 },
  actionDesc: { fontSize: 13, color: colors.textSecondary }
});