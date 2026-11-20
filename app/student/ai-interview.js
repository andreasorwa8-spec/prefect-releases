import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground } from 'react-native';
import { useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import { LinearGradient } from 'expo-linear-gradient';

const RECRUITER_IMAGE = require('../../assets/recruiter.jpg'); 

export default function AIInterview() {
  const router = useRouter();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);

  const questions = [
    "Hello! I am Sarah, your AI recruiter. Welcome to your interview. Could you start by telling me about yourself?",
    "That's interesting. Now, can you describe a time you faced a difficult challenge and how you overcame it?",
    "Finally, why do you want to work for this company?"
  ];

  const speakQuestion = () => {
    setIsSpeaking(true);
    Speech.speak(questions[questionIndex], {
      onDone: () => setIsSpeaking(false),
      onStopped: () => setIsSpeaking(false),
      pitch: 1.0, 
      rate: 0.85, 
    });
  };

  useEffect(() => {
    const timer = setTimeout(() => speakQuestion(), 1000);
    return () => { clearTimeout(timer); Speech.stop(); };
  }, [questionIndex]);

  const handleNext = () => {
    if (questionIndex < questions.length - 1) {
      setQuestionIndex(prev => prev + 1);
    } else {
      Speech.stop();
      router.push('/student/interview-analytics');
    }
  };

  return (
    <View style={styles.container}>
      <ImageBackground source={RECRUITER_IMAGE} style={styles.backgroundImage}>
        <LinearGradient colors={['rgba(0,0,0,0.8)', 'transparent', 'rgba(0,0,0,0.9)']} style={styles.gradientOverlay}>
          
          <View style={styles.header}>
            <TouchableOpacity onPress={() => { Speech.stop(); router.back(); }} style={styles.endBtn}>
              <Text style={styles.endBtnText}>✕ End</Text>
            </TouchableOpacity>
            <View style={styles.liveBadge}>
              <View style={styles.redDot} />
              <Text style={styles.liveText}>LIVE AI INTERVIEW</Text>
            </View>
          </View>

          <View style={styles.bottomPanel}>
            <View style={styles.speakerInfo}>
              <Text style={styles.speakerName}>Sarah (AI Recruiter)</Text>
              <Text style={styles.speakerRole}>Senior Talent Acquisition</Text>
            </View>

            <View style={styles.waveformContainer}>
              {isSpeaking ? (
                <View style={styles.waveform}>
                  <View style={[styles.bar, { height: 20 }]} /><View style={[styles.bar, { height: 45 }]} />
                  <View style={[styles.bar, { height: 60 }]} /><View style={[styles.bar, { height: 30 }]} />
                  <View style={[styles.bar, { height: 50 }]} /><View style={[styles.bar, { height: 25 }]} />
                  <View style={[styles.bar, { height: 40 }]} />
                </View>
              ) : (
                <Text style={styles.listeningText}>Listening to your response...</Text>
              )}
            </View>

            <View style={styles.metricsCard}>
              <Text style={styles.metricsTitle}>Real-time Analysis</Text>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>Eye Contact</Text>
                <View style={styles.metricBarBg}><View style={[styles.metricBarFill, { width: '88%', backgroundColor: '#10B981' }]} /></View>
              </View>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>Confidence</Text>
                <View style={styles.metricBarBg}><View style={[styles.metricBarFill, { width: '75%', backgroundColor: '#3B82F6' }]} /></View>
              </View>
            </View>

            <View style={styles.controls}>
              <TouchableOpacity style={styles.micBtn}>
                <Text style={styles.micIcon}>🎤</Text>
                <Text style={styles.micText}>Hold to Speak</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
                <Text style={styles.nextText}>{questionIndex === questions.length - 1 ? 'Finish' : 'Next →'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  backgroundImage: { flex: 1, resizeMode: 'cover' },
  gradientOverlay: { flex: 1, justifyContent: 'space-between', padding: 20, paddingTop: 60, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  endBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  endBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  liveBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(239, 68, 68, 0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.5)' },
  redDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444', marginRight: 6 },
  liveText: { color: '#FFF', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  bottomPanel: { width: '100%' },
  speakerInfo: { marginBottom: 20 },
  speakerName: { color: '#FFF', fontSize: 24, fontWeight: '800' },
  speakerRole: { color: '#CBD5E1', fontSize: 15, fontWeight: '500' },
  waveformContainer: { height: 70, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  waveform: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  bar: { width: 6, backgroundColor: '#FFF', borderRadius: 3 },
  listeningText: { color: '#94A3B8', fontSize: 15, fontStyle: 'italic', fontWeight: '500' },
  metricsCard: { backgroundColor: 'rgba(30, 41, 59, 0.8)', borderRadius: 20, padding: 20, marginBottom: 20 },
  metricsTitle: { color: '#FFF', fontSize: 14, fontWeight: '700', marginBottom: 15 },
  metricRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  metricLabel: { color: '#CBD5E1', width: 90, fontSize: 13 },
  metricBarBg: { flex: 1, height: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3, marginLeft: 10 },
  metricBarFill: { height: 6, borderRadius: 3 },
  controls: { flexDirection: 'row', gap: 15 },
  micBtn: { flex: 2, flexDirection: 'row', backgroundColor: '#FFF', padding: 18, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  micIcon: { fontSize: 20, marginRight: 8 },
  micText: { color: '#0F172A', fontWeight: '800', fontSize: 16 },
  nextBtn: { flex: 1, backgroundColor: '#3B82F6', padding: 18, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  nextText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
});