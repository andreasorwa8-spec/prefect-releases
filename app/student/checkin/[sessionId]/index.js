import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { api } from '@/lib/api';

export default function CheckIn() {
  const { sessionId } = useLocalSearchParams();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | checking | success | error
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadSession();
  }, [sessionId]);

  async function loadSession() {
    try {
      setError('');
      const res = await api.get('/api/sessions/active');
      const found = (res.sessions || []).find((s) => s.id === sessionId);
      if (!found) {
        setError('This session is no longer active');
      } else {
        setSession(found);
        if (found.hasCheckedIn) {
          setStatus('success');
          setMessage('You are already checked in for this session');
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load session');
    } finally {
      setLoading(false);
    }
  }

  async function submitCheckIn(secret, bleRssi) {
    try {
      const res = await api.post('/api/attendance/checkin', {
        sessionId,
        secret,
        bleRssi,
        deviceHash: 'expo-dev-simulated-device',
      });

      if (res.alreadyMarked) {
        setStatus('success');
        setMessage('You are already checked in');
        return;
      }

      setStatus('success');
      setMessage(`Checked in at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);

      // Start monitoring for away/returned
      // TODO: S11.4 — real BLE scan will handle this
    } catch (err) {
      setStatus('error');
      setError(err.message || 'Check-in failed');
    }
  }

  async function forceCheckIn() {
    setChecking(true);
    setStatus('checking');
    setMessage('Fetching current secret...');

    try {
      // Simulate what BLE would do — fetch the current secret from the server
      const secretRes = await api.get(`/api/attendance/debug-secret?sessionId=${sessionId}`);
      if (secretRes.error) throw new Error(secretRes.error);

      setMessage('Submitting check-in...');
      await submitCheckIn(secretRes.secret, -65); // simulate good RSSI
    } finally {
      setChecking(false);
    }
  }

  function simulateAway() {
    Alert.alert(
      'Simulate away',
      'This will mark you as LEFT for testing.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Simulate',
          onPress: async () => {
            try {
              await api.post('/api/attendance/away', { sessionId });
              Alert.alert('Success', 'Marked as LEFT');
            } catch (err) {
              Alert.alert('Error', err.message);
            }
          },
        },
      ]
    );
  }

  function simulateReturned() {
    Alert.alert(
      'Simulate return',
      'This will mark you as RETURNED for testing.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Simulate',
          onPress: async () => {
            try {
              await api.post('/api/attendance/returned', { sessionId, bleRssi: -65 });
              Alert.alert('Success', 'Marked as RETURNED');
            } catch (err) {
              Alert.alert('Error', err.message);
            }
          },
        },
      ]
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator color="#C9A961" />
        </View>
      </SafeAreaView>
    );
  }

  if (error && !session) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>

        <View style={styles.brandRow}>
          <View style={styles.brandDot} />
          <Text style={styles.brandText}>CHECK IN</Text>
        </View>

        <Text style={styles.title}>{session.courseCode}</Text>
        <Text style={styles.subtitle}>{session.courseName}</Text>

        <View style={styles.sessionMeta}>
          <Text style={styles.metaText}>
            {session.lecturerName} · {session.minutesRemaining} min remaining
          </Text>
        </View>

        {/* Radar / status area */}
        <View style={styles.radarArea}>
          {status === 'idle' && (
            <>
              <View style={styles.radarCircle}>
                <Text style={styles.radarIcon}>📡</Text>
              </View>
              <Text style={styles.radarTitle}>Ready to check in</Text>
              <Text style={styles.radarSubtitle}>
                Real BLE scanning activates with the dev build. Tap below to
                submit via secure channel for testing.
              </Text>
            </>
          )}

          {status === 'checking' && (
            <>
              <View style={styles.radarCircle}>
                <ActivityIndicator color="#C9A961" size="large" />
              </View>
              <Text style={styles.radarTitle}>Verifying...</Text>
              <Text style={styles.radarSubtitle}>{message}</Text>
            </>
          )}

          {status === 'success' && (
            <>
              <View style={[styles.radarCircle, styles.radarSuccess]}>
                <Text style={styles.radarIcon}>✓</Text>
              </View>
              <Text style={[styles.radarTitle, styles.radarTitleSuccess]}>
                You're checked in
              </Text>
              <Text style={styles.radarSubtitle}>{message}</Text>
            </>
          )}

          {status === 'error' && (
            <>
              <View style={[styles.radarCircle, styles.radarError]}>
                <Text style={styles.radarIcon}>!</Text>
              </View>
              <Text style={[styles.radarTitle, styles.radarTitleError]}>
                Check-in failed
              </Text>
              <Text style={styles.radarSubtitle}>{error}</Text>
            </>
          )}
        </View>

        {/* Actions */}
        {status === 'idle' && (
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={forceCheckIn}
            disabled={checking}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>Check in now</Text>
          </TouchableOpacity>
        )}

        {status === 'error' && (
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={forceCheckIn}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>Try again</Text>
          </TouchableOpacity>
        )}

        {status === 'success' && (
          <View style={styles.successActions}>
            <Text style={styles.successHint}>
              Once you're marked present, you can simulate leaving and returning
              to test the tier system.
            </Text>

            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={simulateAway}
              activeOpacity={0.7}
            >
              <Text style={styles.secondaryBtnText}>Simulate leaving class</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={simulateReturned}
              activeOpacity={0.7}
            >
              <Text style={styles.secondaryBtnText}>Simulate returning</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8F7F5' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  scroll: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 40 },
  back: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#E8E6E1', marginBottom: 20,
  },
  backText: { fontSize: 20, color: '#1B2A4E', fontWeight: '500' },
  brandRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  brandDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: '#C9A961', marginRight: 8,
  },
  brandText: {
    color: '#C9A961', fontSize: 11, fontWeight: '700', letterSpacing: 2,
  },
  title: {
    color: '#1B2A4E', fontSize: 30, fontWeight: '700', letterSpacing: -0.8,
  },
  subtitle: { color: '#6B7383', fontSize: 15, marginTop: 4 },
  sessionMeta: {
    marginTop: 12, paddingVertical: 10, paddingHorizontal: 14,
    backgroundColor: '#FFFFFF', borderRadius: 12, alignSelf: 'flex-start',
    borderWidth: 1, borderColor: '#E8E6E1',
  },
  metaText: { color: '#8A93A5', fontSize: 12 },

  radarArea: {
    alignItems: 'center', marginVertical: 40,
  },
  radarCircle: {
    width: 140, height: 140, borderRadius: 70,
    backgroundColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#E8E6E1',
    marginBottom: 24,
    shadowColor: '#1B2A4E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 3,
  },
  radarSuccess: {
    backgroundColor: '#EAF5EF',
    borderColor: '#2E7D5B',
  },
  radarError: {
    backgroundColor: '#F5E5E5',
    borderColor: '#A93B3B',
  },
  radarIcon: {
    fontSize: 48,
    color: '#1B2A4E',
  },
  radarTitle: {
    color: '#1B2A4E', fontSize: 20, fontWeight: '700',
    letterSpacing: -0.3, marginBottom: 8,
  },
  radarTitleSuccess: { color: '#2E7D5B' },
  radarTitleError: { color: '#A93B3B' },
  radarSubtitle: {
    color: '#8A93A5', fontSize: 14, textAlign: 'center',
    maxWidth: 320, lineHeight: 20,
  },

  primaryBtn: {
    backgroundColor: '#1B2A4E', paddingVertical: 18, borderRadius: 16,
    alignItems: 'center', marginBottom: 16,
    shadowColor: '#1B2A4E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15, shadowRadius: 14, elevation: 5,
  },
  primaryBtnText: {
    color: '#F8F7F5', fontSize: 16, fontWeight: '700', letterSpacing: 0.3,
  },

  successActions: { marginTop: 8 },
  successHint: {
    color: '#8A93A5', fontSize: 12, textAlign: 'center',
    lineHeight: 18, marginBottom: 20,
  },
  secondaryBtn: {
    backgroundColor: '#FFFFFF', paddingVertical: 14, borderRadius: 14,
    alignItems: 'center', marginBottom: 10,
    borderWidth: 1.5, borderColor: '#E8E6E1',
  },
  secondaryBtnText: { color: '#1B2A4E', fontSize: 14, fontWeight: '600' },

  errorText: {
    color: '#A93B3B', fontSize: 14, marginBottom: 20, textAlign: 'center',
  },
  backBtn: {
    paddingVertical: 12, paddingHorizontal: 24,
    backgroundColor: '#1B2A4E', borderRadius: 12,
  },
  backBtnText: { color: '#F8F7F5', fontSize: 14, fontWeight: '600' },
});