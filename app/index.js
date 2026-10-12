import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

export default function Splash() {
  const { session, loading } = useAuth();
  const [minDelayDone, setMinDelayDone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMinDelayDone(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!loading && minDelayDone) {
      if (session?.sessionToken) {
        const role = session.user?.role;
        if (role === 'LECTURER') router.replace('/lecturer/home');
        else if (role === 'DEPARTMENT') router.replace('/department/home');
        else if (role === 'MERCHANT') router.replace('/merchant/home');
        else if (role === 'ADMIN') router.replace('/admin');
        else if (role === 'OTHER') router.replace('/other/home');
        else router.replace('/student/home');
      } else {
        router.replace('/auth/welcome');
      }
    }
  }, [loading, minDelayDone, session]);

  return (
    <View style={styles.container}>
      <View style={styles.gradientTop} />
      <View style={styles.gradientBottom} />

      <View style={styles.center}>
        <Image
          source={require('../assets/brand/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <View style={styles.bottom}>
        <ActivityIndicator color="#C9A961" size="small" />
        <Text style={styles.loadingText}>Loading</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1B2A4E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: '#243356',
  },
  gradientBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: '#1B2A4E',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 140,
    height: 140,
  },
  bottom: {
    position: 'absolute',
    bottom: 80,
    alignItems: 'center',
  },
  loadingText: {
    color: '#8A93A5',
    fontSize: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginTop: 16,
    fontWeight: '500',
  },
});