import { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';

const DURATIONS = [15, 30, 45, 60, 90, 120];

export default function SessionStartModal({
  visible,
  onClose,
  onStart,
  courseName,
  courseCode,
  walletBalanceCents,
  busy,
}) {
  const [duration, setDuration] = useState(60);

  const balanceKsh = (walletBalanceCents / 100).toFixed(2);
  const afterKsh = ((walletBalanceCents - 1000) / 100).toFixed(2);
  const canAfford = walletBalanceCents >= 1000;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>Start session</Text>
            <Text style={styles.subtitle}>
              {courseCode} · {courseName}
            </Text>

            <Text style={styles.label}>Duration</Text>
            <View style={styles.grid}>
              {DURATIONS.map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[styles.durationBtn, duration === d && styles.durationBtnActive]}
                  onPress={() => setDuration(d)}
                  activeOpacity={0.7}
                  disabled={busy}
                >
                  <Text
                    style={[
                      styles.durationNumber,
                      duration === d && styles.durationNumberActive,
                    ]}
                  >
                    {d}
                  </Text>
                  <Text
                    style={[
                      styles.durationUnit,
                      duration === d && styles.durationUnitActive,
                    ]}
                  >
                    min
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Cost</Text>
            <View style={styles.costBox}>
              <View style={styles.costRow}>
                <Text style={styles.costLabel}>Session fee</Text>
                <Text style={styles.costValue}>KSh 10.00</Text>
              </View>
              <View style={styles.costDivider} />
              <View style={styles.costRow}>
                <Text style={styles.costLabel}>Current balance</Text>
                <Text style={styles.costValue}>KSh {balanceKsh}</Text>
              </View>
              <View style={styles.costRow}>
                <Text style={styles.costLabel}>After this session</Text>
                <Text
                  style={[
                    styles.costValue,
                    !canAfford && styles.costValueRisk,
                  ]}
                >
                  KSh {canAfford ? afterKsh : '—'}
                </Text>
              </View>
            </View>

            {!canAfford && (
              <View style={styles.insufficientBox}>
                <Text style={styles.insufficientText}>
                  ⚠ Insufficient balance. Top up your wallet to start a session.
                </Text>
              </View>
            )}

            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={onClose}
                disabled={busy}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.startBtn, (!canAfford || busy) && styles.startBtnDisabled]}
                onPress={() => onStart(duration)}
                disabled={!canAfford || busy}
                activeOpacity={0.85}
              >
                {busy ? (
                  <ActivityIndicator color="#F8F7F5" />
                ) : (
                  <Text style={styles.startText}>Start session</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(27, 42, 78, 0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#F8F7F5',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingHorizontal: 24,
    paddingBottom: 40,
    maxHeight: '85%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E0DCD3',
    alignSelf: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1B2A4E',
    letterSpacing: -0.8,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7383',
    marginBottom: 28,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1B2A4E',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 28,
  },
  durationBtn: {
    width: '31.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E8E6E1',
  },
  durationBtnActive: {
    backgroundColor: '#1B2A4E',
    borderColor: '#1B2A4E',
  },
  durationNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1B2A4E',
    letterSpacing: -0.3,
  },
  durationNumberActive: {
    color: '#C9A961',
  },
  durationUnit: {
    fontSize: 10,
    fontWeight: '600',
    color: '#8A93A5',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  durationUnitActive: {
    color: '#F8F7F5',
  },
  costBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#E8E6E1',
    marginBottom: 20,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  costLabel: { color: '#6B7383', fontSize: 13 },
  costValue: { color: '#1B2A4E', fontSize: 14, fontWeight: '700' },
  costValueRisk: { color: '#B8860B' },
  costDivider: {
    height: 1,
    backgroundColor: '#F0EDE5',
    marginVertical: 8,
  },
  insufficientBox: {
    backgroundColor: '#FEF3E2',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#B8860B',
  },
  insufficientText: { color: '#B8860B', fontSize: 13, fontWeight: '500' },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E8E6E1',
  },
  cancelText: { color: '#1B2A4E', fontSize: 15, fontWeight: '600' },
  startBtn: {
    flex: 1.5,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1B2A4E',
    shadowColor: '#1B2A4E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 5,
  },
  startBtnDisabled: {
    opacity: 0.5,
  },
  startText: { color: '#F8F7F5', fontSize: 15, fontWeight: '700' },
});