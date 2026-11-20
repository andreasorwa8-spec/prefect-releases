import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../../lib/theme';
import { api } from '../../lib/api';

const AVATARS = [
  { id: 'sarah', name: 'Sarah (Corporate)', img: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop' },
  { id: 'david', name: 'David (Tech)', img: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=200&auto=format&fit=crop' },
];

export default function PremiumInterview() {
  const router = useRouter();
  const [selectedAvatar, setSelectedAvatar] = useState('sarah');
  const [loading, setLoading] = useState(false);
  const [unlocked, setUnlocked] = useState(false); // Check DB for this in production

  const handleUnlock = async () => {
    setLoading(true);
    // In a real app, this triggers the Paystack Checkout for KSh 5,000
    try {
      // Simulate Paystack payment success
      setTimeout(() => {
        setUnlocked(true);
        setLoading(false);
        Alert.alert("Premium Unlocked!", "You now have lifetime access to Real-Time 3D Interviews.");
      }, 2000);
    } catch (err) {
      setLoading(false);
      Alert.alert("Payment failed");
    }
  };

  const startLive3D = async () => {
    setLoading(true);
    try {
      // 1. Call backend to start a WebRTC session with HeyGen
      const res = await api.post('/api/ai/start-3d-interview', { avatarId: selectedAvatar });
      
      // 2. Navigate to the Live 3D Room with the session token
      router.push({
        pathname: '/student/live-3d-room',
        params: { sessionToken: res.sessionToken, avatarId: selectedAvatar }
      });
    } catch (err) {
      Alert.alert("Connection Error", "Failed to start 3D session.");
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.badgeContainer}>
        <Text style={styles.badgeText}>ULTRA PREMIUM</Text>
      </View>
      
      <Text style={styles.headerTitle}>Real-Time 3D Interview</Text>
      <Text style={styles.headerSubtitle}>
        Experience a hyper-realistic interview. Our AI avatars make natural hand gestures, maintain eye contact, and react to your answers in real-time.
      </Text>

      <Text style={styles.sectionTitle}>1. Select Your Recruiter</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.row}>
        {AVATARS.map((a) => (
          <TouchableOpacity 
            key={a.id} 
            style={[styles.card, selectedAvatar === a.id && styles.cardActive]}
            onPress={() => setSelectedAvatar(a.id)}
          >
            <Image source={{ uri: a.img }} style={styles.avatarImg} />
            <Text style={styles.cardText}>{a.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {!unlocked ? (
        <View style={styles.paywallCard}>
          <Text style={styles.paywallTitle}>Unlock 3D Real-Time Interviews</Text>
          <Text style={styles.paywallDesc}>Get unlimited access to realistic 3D interviews with body language and hand gestures.</Text>
          <Text style={styles.price}>KSh 5,000 <Text style={styles.priceSub}>/ lifetime</Text></Text>
          
          <TouchableOpacity style={styles.payBtn} onPress={handleUnlock} disabled={loading}>
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.payBtnText}>Unlock with Paystack</Text>}
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.startBtn} onPress={startLive3D} disabled={loading}>
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.startBtnText}>Enter 3D Interview Room</Text>}
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A', padding: 24, paddingTop: 60 },
  badgeContainer: { backgroundColor: '#F59E0B', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, alignSelf: 'flex-start', marginBottom: 20 },
  badgeText: { color: '#FFF', fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  headerTitle: { fontSize: 32, fontWeight: '800', color: '#FFF', marginBottom: 12 },
  headerSubtitle: { fontSize: 15, color: '#94A3B8', lineHeight: 24, marginBottom: 30 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#FFF', marginBottom: 15 },
  row: { flexDirection: 'row', marginBottom: 30 },
  card: { backgroundColor: '#1E293B', borderRadius: 16, padding: 10, marginRight: 15, alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  cardActive: { borderColor: '#3B82F6' },
  avatarImg: { width: 80, height: 80, borderRadius: 40, marginBottom: 8 },
  cardText: { color: '#FFF', fontSize: 13, fontWeight: '600' },
  paywallCard: { backgroundColor: '#1E293B', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: '#334155' },
  paywallTitle: { fontSize: 20, fontWeight: '800', color: '#FFF', marginBottom: 10 },
  paywallDesc: { fontSize: 14, color: '#94A3B8', lineHeight: 22, marginBottom: 20 },
  price: { fontSize: 28, fontWeight: '800', color: '#10B981', marginBottom: 20 },
  priceSub: { fontSize: 14, color: '#64748B', fontWeight: '500' },
  payBtn: { backgroundColor: '#3B82F6', padding: 18, borderRadius: 12, alignItems: 'center' },
  payBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  startBtn: { backgroundColor: '#10B981', padding: 20, borderRadius: 16, alignItems: 'center', marginTop: 20 },
  startBtnText: { color: '#FFF', fontSize: 18, fontWeight: '800' },
});