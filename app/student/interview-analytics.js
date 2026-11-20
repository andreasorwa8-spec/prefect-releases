import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../../lib/theme';

export default function InterviewAnalytics() {
  const router = useRouter();
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Interview Report Card</Text>
      <Text style={styles.subtitle}>Here is how you performed in your live AI session.</Text>

      <View style={styles.scoreCircle}>
        <Text style={styles.scoreNumber}>84</Text>
        <Text style={styles.scoreLabel}>Overall Score</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Communication</Text>
        <View style={styles.metricRow}><Text style={styles.metricName}>Clarity</Text><Text style={styles.metricValue}>Excellent</Text></View>
        <View style={styles.metricRow}><Text style={styles.metricName}>Pace (WPM)</Text><Text style={styles.metricValue}>135 (Optimal)</Text></View>
        <View style={styles.metricRow}><Text style={styles.metricName}>Filler Words</Text><Text style={styles.metricValueGood}>2 (Very Low)</Text></View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Body Language</Text>
        <View style={styles.metricRow}><Text style={styles.metricName}>Eye Contact</Text><Text style={styles.metricValue}>88%</Text></View>
        <View style={styles.metricRow}><Text style={styles.metricName}>Posture</Text><Text style={styles.metricValueGood}>Professional</Text></View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Content (STAR Method)</Text>
        <View style={styles.metricRow}><Text style={styles.metricName}>Situation</Text><Text style={styles.metricValueGood}>Clear</Text></View>
        <View style={styles.metricRow}><Text style={styles.metricName}>Action</Text><Text style={styles.metricValueGood}>Detailed</Text></View>
        <View style={styles.metricRow}><Text style={styles.metricName}>Result</Text><Text style={styles.metricValueWarning}>Missing Metrics</Text></View>
      </View>

      <TouchableOpacity style={styles.premiumBtn}>
        <Text style={styles.premiumBtnText}>Unlock Pro Video Feedback</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.back()}>
        <Text style={styles.secondaryBtnText}>Back to Career Hub</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 24, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: '800', color: '#0F172A', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#64748B', marginBottom: 30 },
  scoreCircle: { alignSelf: 'center', width: 150, height: 150, borderRadius: 75, backgroundColor: '#EFF6FF', borderWidth: 8, borderColor: '#3B82F6', justifyContent: 'center', alignItems: 'center', marginBottom: 30 },
  scoreNumber: { fontSize: 48, fontWeight: '800', color: '#1E3A8A' },
  scoreLabel: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  card: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingBottom: 10 },
  metricRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  metricName: { fontSize: 14, color: '#475569' },
  metricValue: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  metricValueGood: { fontSize: 14, fontWeight: '700', color: '#10B981' },
  metricValueWarning: { fontSize: 14, fontWeight: '700', color: '#F59E0B' },
  premiumBtn: { backgroundColor: '#1E3A8A', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  premiumBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  secondaryBtn: { padding: 18, alignItems: 'center' },
  secondaryBtnText: { color: '#64748B', fontSize: 15, fontWeight: '600' },
});