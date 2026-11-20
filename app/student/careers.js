import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../../lib/theme';

export default function CareerPremium() {
  const router = useRouter();
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.headerTitle}>Career Premium</Text>
      <Text style={styles.headerSubtitle}>Land your dream role with enterprise-grade AI tools.</Text>

      <View style={styles.card}>
        <View style={styles.iconBox}><Text style={styles.icon}>📄</Text></View>
        <Text style={styles.cardTitle}>AI Resume Builder</Text>
        <Text style={styles.cardDesc}>Craft an ATS-ready resume in minutes. Get instant keyword optimization and a recruiter-approved template.</Text>
        <TouchableOpacity style={styles.actionBtn}>
          <Text style={styles.actionBtnText}>Build Resume</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.cardDark}>
        <View style={styles.iconBoxDark}><Text style={styles.icon}>🎙️</Text></View>
        <Text style={styles.cardTitleDark}>Live AI Interview Coach</Text>
        <Text style={styles.cardDescDark}>Practice with a real-time talking AI avatar. Get live feedback on your eye contact, tone, and STAR method responses.</Text>
        <TouchableOpacity style={styles.actionBtnPrimary} onPress={() => router.push('/student/ai-interview')}>
          <Text style={styles.actionBtnText}>Start Mock Interview</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <View style={styles.iconBox}><Text style={styles.icon}>📊</Text></View>
        <Text style={styles.cardTitle}>ATS Resume Scorer</Text>
        <Text style={styles.cardDesc}>Upload your current resume and get a 0-100 match score against any job description.</Text>
        <TouchableOpacity style={styles.actionBtn}>
          <Text style={styles.actionBtnText}>Upload & Score</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 24, paddingTop: 60 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#0F172A', marginBottom: 8 },
  headerSubtitle: { fontSize: 15, color: '#64748B', marginBottom: 30 },
  card: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: '#E2E8F0' },
  cardDark: { backgroundColor: '#0F172A', borderRadius: 20, padding: 20, marginBottom: 20 },
  iconBox: { width: 50, height: 50, borderRadius: 12, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  iconBoxDark: { width: 50, height: 50, borderRadius: 12, backgroundColor: '#1E293B', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  icon: { fontSize: 24 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A', marginBottom: 8 },
  cardTitleDark: { fontSize: 18, fontWeight: '700', color: '#FFF', marginBottom: 8 },
  cardDesc: { fontSize: 14, color: '#475569', lineHeight: 22, marginBottom: 20 },
  cardDescDark: { fontSize: 14, color: '#CBD5E1', lineHeight: 22, marginBottom: 20 },
  actionBtn: { backgroundColor: '#F1F5F9', padding: 15, borderRadius: 12, alignItems: 'center' },
  actionBtnPrimary: { backgroundColor: '#3B82F6', padding: 15, borderRadius: 12, alignItems: 'center' },
  actionBtnText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
  actionBtnTextDark: { color: '#0F172A', fontWeight: '700', fontSize: 15 },
});