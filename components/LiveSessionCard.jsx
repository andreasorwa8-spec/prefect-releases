import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { api } from '@/lib/api';

export default function LiveSessionCard({ sessionId, onEnded }) {
  const [secret, setSecret] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [ending, setEnding] = useState(false);
  const [studentCount, setStudentCount] = useState(0);

  // Fetch current secret every 3s
  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;

    async function fetchSecret() {
      try {
        const data = await api.get(`/api/sessions/current-secret?sessionId=${sessionId}`);
        if (!cancelled && !data.error) {
          setSecret(data);
          setStudentCount(data.checkInsCount || 0);
        }
      } catch (e) {
        // ignore
      }
    }

    fetchSecret();
    const interval = setInterval(fetchSecret, 3000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [sessionId]);

  // Tick every second for countdown
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  async function endSession() {
    setEnding(true);
    try {
      await api.post('/api/sessions/end', { sessionId });
      if (onEnded) onEnded();
    } catch (e) {
      // ignore
    } finally {
      setEnding(false);
    }
  }

  const endsAt = secret?.endsAt ? new Date(secret.endsAt).getTime() : null;
  const msLeft = endsAt ? Math.max(0, endsAt - now) : 0;
  const minLeft = Math.floor(msLeft / 60000);
  const secLeft = Math.floor((msLeft % 60000) / 1000);

  const secondsToRotate = secret
    ? Math.max(0, Math.ceil((secret.nextRotationAt - now) / 1000))
    : 0;

  const rotationProgress = secret
    ? Math.min(100, Math.max(0, (1 - (secret.nextRotationAt - now) / 15000) * 100))
    : 0;

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.liveIndicator}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE SESSION</Text>
        </View>
      </View>

      {/* Countdown */}
      <View style={styles.timerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.timerLabel}>Time remaining</Text>
          <Text style={styles.timerValue}>
            {String(minLeft).padStart(2, '0')}:{String(secLeft).padStart(2, '0')}
          </Text>
        </View>
        <View style={styles.studentsBox}>
          <Text style={styles.studentsLabel}>Students</Text>
          <Text style={styles.studentsValue}>{studentCount}</Text>
        </View>
      </View>

      {/* Secret */}
      <View style={styles.secretBox}>
        <View style={styles.secretHeader}>
          <Text style={styles.secretLabel}>📡 Broadcasting BLE secret</Text>
          <Text style={styles.secretTimer}>rotates in {secondsToRotate}s</Text>
        </View>
        <Text style={styles.secretValue}>
          {secret?.secret || '—'}
        </Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${rotationProgress}%` }]} />
        </View>
      </View>

      {/* End button */}
      <TouchableOpacity
        style={styles.endBtn}
        onPress={endSession}
        disabled={ending}
        activeOpacity={0.85}
      >
        {ending ? (
          <ActivityIndicator color="#A93B3B" />
        ) : (
          <Text style={styles.endText}>End session</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#2E7D5B',
    shadowColor: '#2E7D5B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAF5EF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2E7D5B',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2E7D5B',
    marginRight: 8,
  },
  liveText: {
    color: '#2E7D5B',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 24,
  },
  timerLabel: {
    color: '#8A93A5',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  timerValue: {
    color: '#1B2A4E',
    fontSize: 48,
    fontWeight: '700',
    letterSpacing: -2,
    fontVariant: ['tabular-nums'],
  },
  studentsBox: { alignItems: 'flex-end' },
  studentsLabel: {
    color: '#8A93A5',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  studentsValue: {
    color: '#2E7D5B',
    fontSize: 40,
    fontWeight: '700',
    letterSpacing: -1.5,
  },
  secretBox: {
    backgroundColor: '#1B2A4E',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },
  secretHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  secretLabel: {
    color: '#C9A961',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  secretTimer: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    fontVariant: ['tabular-nums'],
  },
  secretValue: {
    color: '#F8F7F5',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 2,
    fontFamily: 'Courier',
    marginBottom: 12,
  },
  progressTrack: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#C9A961',
    borderRadius: 2,
  },
  endBtn: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#A93B3B',
  },
  endText: {
    color: '#A93B3B',
    fontSize: 15,
    fontWeight: '700',
  },
});