import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../../lib/theme';
import { api } from '../../lib/api';

export default function LiveSessions() {
  const router = useRouter();
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    // In a real app, fetch from /api/live-sessions
    setSessions([
      { id: '1', title: 'Advanced Calculus Review', host: 'Dr. Smith', status: 'ACTIVE' },
      { id: '2', title: 'Physics 101 Q&A', host: 'Prof. Jane', status: 'UPCOMING' }
    ]);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.back}>←</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>AI Live Sessions</Text>
        <View style={{width: 24}} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Your Classes</Text>
        {sessions.map(s => (
          <View key={s.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{s.title}</Text>
              <View style={[styles.badge, s.status === 'ACTIVE' ? styles.badgeActive : styles.badgeUpcoming]}>
                <Text style={styles.badgeText}>{s.status}</Text>
              </View>
            </View>
            <Text style={styles.cardHost}>Host: {s.host}</Text>
            <TouchableOpacity style={styles.joinBtn}>
              <Text style={styles.joinBtnText}>{s.status === 'ACTIVE' ? 'Join Room' : 'Remind Me'}</Text>
            </TouchableOpacity>
          </View>
        ))}
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
  title: { fontSize: 22, fontWeight: '800', color: colors.textPrimary, marginBottom: 20 },
  card: { backgroundColor: colors.bgCard, borderRadius: 16, padding: 20, marginBottom: 15, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, flex: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeActive: { backgroundColor: '#FEE2E2' },
  badgeUpcoming: { backgroundColor: '#E0E7FF' },
  badgeText: { fontSize: 10, fontWeight: '800', color: colors.textPrimary },
  cardHost: { fontSize: 14, color: colors.textSecondary, marginBottom: 15 },
  joinBtn: { backgroundColor: colors.navyBase, padding: 12, borderRadius: 8, alignItems: 'center' },
  joinBtnText: { color: colors.bgMain, fontWeight: '700' }
});