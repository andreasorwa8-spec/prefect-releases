import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../../lib/theme';
import { api } from '../../lib/api';

export default function AxiomAI() {
  const router = useRouter();
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('solve');

  const handleSolve = async () => {
    if (!question.trim()) return;
    setLoading(true);
    setResponse('');
    
    try {
      // Call the backend API we just built
      const res = await api.post('/api/ai/solve', { prompt: question, subject: 'math' });
      setResponse(res.answer);
    } catch (err) {
      setResponse("Sorry, Axiom couldn't solve this. Make sure you are connected to the internet.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Text style={styles.backText}>←</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>Axiom AI</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity style={[styles.tab, activeTab === 'solve' && styles.activeTab]} onPress={() => setActiveTab('solve')}>
          <Text style={[styles.tabText, activeTab === 'solve' && styles.activeTabText]}>AI Solver</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'pricing' && styles.activeTab]} onPress={() => setActiveTab('pricing')}>
          <Text style={[styles.tabText, activeTab === 'pricing' && styles.activeTabText]}>Go Pro</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'solve' ? (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.heroTitle}>Your Personal AI Tutor</Text>
          <Text style={styles.heroSubtitle}>Axiom is smarter and faster than any other solver.</Text>
          
          <View style={styles.inputCard}>
            <TextInput 
              style={styles.mainInput} 
              placeholder="e.g. Solve x^2 + 5x + 6 = 0" 
              placeholderTextColor={colors.textSecondary} 
              multiline 
              value={question} 
              onChangeText={setQuestion} 
            />
            <View style={styles.inputFooter}>
              <TouchableOpacity style={styles.solveButton} onPress={handleSolve} disabled={loading}>
                {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.solveButtonText}>Solve</Text>}
              </TouchableOpacity>
            </View>
          </View>

          {response ? (
            <View style={styles.resultCard}>
              <Text style={styles.resultHeader}>Axiom's Solution</Text>
              {/* In a real app, use a Markdown renderer here for math formatting */}
              <Text style={styles.resultText}>{response}</Text>
            </View>
          ) : null}

        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.heroTitle}>Upgrade to Axiom Pro</Text>
          <Text style={styles.heroSubtitle}>Unlimited solving, video explanations, and no wait times.</Text>
          
          <View style={[styles.priceCard, styles.priceCardPro]}>
            <View style={styles.proBadge}><Text style={styles.proBadgeText}>BEST VALUE</Text></View>
            <Text style={styles.priceTierPro}>Pro Plan</Text>
            <Text style={styles.priceAmountPro}>KSh 500<Text style={styles.pricePeriodPro}>/mo</Text></Text>
            <View style={styles.featureList}>
              <Text style={styles.featureItemPro}>✓ Unlimited AI Questions</Text>
              <Text style={styles.featureItemPro}>✓ Advanced Math & Physics</Text>
              <Text style={styles.featureItemPro}>✓ Priority Groq Speed</Text>
              <Text style={styles.featureItemPro}>✓ Support the Prefect OS</Text>
            </View>
            <TouchableOpacity style={styles.btnPrimary}>
              <Text style={styles.btnPrimaryText}>Upgrade via Paystack</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 60, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  backText: { fontSize: 24, color: '#111827' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  tabContainer: { flexDirection: 'row', backgroundColor: '#FFFFFF', padding: 10 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8 },
  activeTab: { backgroundColor: '#F3F4F6' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  activeTabText: { color: '#1E3A8A' },
  scrollContent: { padding: 24 },
  heroTitle: { fontSize: 28, fontWeight: '800', color: '#111827', textAlign: 'center', marginBottom: 8 },
  heroSubtitle: { fontSize: 15, color: '#6B7280', textAlign: 'center', marginBottom: 24 },
  inputCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  mainInput: { fontSize: 16, color: '#111827', minHeight: 80, textAlignVertical: 'top' },
  inputFooter: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
  solveButton: { backgroundColor: '#1E3A8A', paddingVertical: 10, paddingHorizontal: 24, borderRadius: 8 },
  solveButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  resultCard: { marginTop: 24, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, borderLeftWidth: 4, borderLeftColor: '#1E3A8A' },
  resultHeader: { fontSize: 16, fontWeight: '800', color: '#1E3A8A', marginBottom: 10 },
  resultText: { fontSize: 15, color: '#374151', lineHeight: 24 },
  priceCardPro: { backgroundColor: '#EFF6FF', borderRadius: 16, padding: 24, borderWidth: 2, borderColor: '#1E3A8A' },
  proBadge: { position: 'absolute', top: -12, alignSelf: 'center', backgroundColor: '#1E3A8A', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  proBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  priceTierPro: { fontSize: 18, fontWeight: '700', color: '#1E3A8A', marginBottom: 10 },
  priceAmountPro: { fontSize: 32, fontWeight: '800', color: '#1E3A8A', marginBottom: 20 },
  pricePeriodPro: { fontSize: 16, fontWeight: '500', color: '#3B82F6' },
  featureList: { marginBottom: 20 },
  featureItemPro: { fontSize: 14, color: '#1E3A8A', marginBottom: 10, fontWeight: '500' },
  btnPrimary: { backgroundColor: '#1E3A8A', padding: 16, borderRadius: 12, alignItems: 'center' },
  btnPrimaryText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
});