import React from 'react';
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

export default function Welcome() {
  const router = useRouter();
  // Static image for the launch screen
  const defaultImage = "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1000&auto=format&fit=crop";

  return (
    <ImageBackground source={{ uri: defaultImage }} style={styles.backgroundImage}>
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.95)']}
        style={styles.overlay}
      >
        <View style={styles.contentContainer}>
          <View style={styles.headerSection}>
            <Text style={styles.title}>Your Academic{'\n'}Partner for Seamless{'\n'}Learning</Text>
          </View>

          <View style={styles.bottomSection}>
            <Text style={styles.subtitle}>
              Prefect provides end-to-end solutions for all your university needs, from attendance to AI tutoring.
            </Text>

            <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/auth/signin')}>
              <Text style={styles.primaryButtonText}>→</Text>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/auth/signin')}>
                <Text style={styles.loginText}>Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </LinearGradient>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: { flex: 1, resizeMode: 'cover' },
  overlay: { flex: 1, justifyContent: 'space-between', padding: 30, paddingTop: 80, paddingBottom: 50 },
  contentContainer: { flex: 1, justifyContent: 'space-between' },
  headerSection: { marginTop: 20 },
  title: { fontSize: 34, fontWeight: '800', color: '#FFFFFF', lineHeight: 42, letterSpacing: -0.5 },
  bottomSection: { alignItems: 'center' },
  subtitle: { fontSize: 14, color: '#D1D5DB', textAlign: 'center', marginBottom: 30, lineHeight: 22, paddingHorizontal: 10 },
  primaryButton: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#F97316', alignItems: 'center', justifyContent: 'center', marginBottom: 40, shadowColor: '#F97316', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 8 },
  primaryButtonText: { color: '#FFF', fontSize: 32, fontWeight: '300', marginTop: -4 },
  footer: { flexDirection: 'row', alignItems: 'center' },
  footerText: { color: '#9CA3AF', fontSize: 13 },
  loginText: { color: '#F97316', fontSize: 13, fontWeight: '700' }
});