// components/QrTile.jsx
import React from 'react';
import { Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export default function QrTile({ hint = 'Create, print and scan QR codes' }) {
  const router = useRouter();
  return (
    <View style={styles.quickNav}>
      <TouchableOpacity
        style={styles.quickNavBtn}
        onPress={() => router.push('/qr')}
        activeOpacity={0.85}
      >
        <View style={styles.quickNavIcon}>
          <Text style={styles.quickNavIconText}>{'\u{1F4F1}'}</Text>
        </View>
        <View style={styles.quickNavBody}>
          <Text style={styles.quickNavLabel}>Prefect QR</Text>
          <Text style={styles.quickNavHint}>{hint}</Text>
        </View>
        <Text style={styles.quickNavChevron}>{'\u2192'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  quickNav: { paddingHorizontal: 20, marginBottom: 8 },
  quickNavBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 16,
    paddingVertical: 14, paddingHorizontal: 16, marginBottom: 10,
    borderWidth: 1, borderColor: '#EFE9DA',
  },
  quickNavIcon: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#F4EFE2',
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  quickNavIconText: { fontSize: 20, color: '#1B2A4E', fontWeight: '700' },
  quickNavBody: { flex: 1 },
  quickNavLabel: { fontSize: 15, fontWeight: '600', color: '#1B2A4E' },
  quickNavHint: { fontSize: 12, color: '#6B7383', marginTop: 2 },
  quickNavChevron: { fontSize: 18, color: '#C9A961', marginLeft: 8 },
});
