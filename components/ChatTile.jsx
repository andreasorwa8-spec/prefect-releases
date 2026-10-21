import React from 'react';
import { Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

const ICON_CHAT = '\u{1F4AC}';
const ICON_ARROW = '\u2192';

export default function ChatTile({ hint = 'Message students, lecturers and your department' }) {
  const router = useRouter();
  return (
    <View style={styles.quickNav}>
      <TouchableOpacity
        style={styles.quickNavBtn}
        onPress={() => router.push('/chat')}
        activeOpacity={0.85}
      >
        <View style={styles.quickNavIcon}>
          <Text style={styles.quickNavIconText}>{ICON_CHAT}</Text>
        </View>
        <View style={styles.quickNavBody}>
          <Text style={styles.quickNavLabel}>Chat</Text>
          <Text style={styles.quickNavHint}>{hint}</Text>
        </View>
        <Text style={styles.quickNavChevron}>{ICON_ARROW}</Text>
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
  quickNavLabel: { fontSize: 15, fontWeight: '700', color: '#1B2A4E', marginBottom: 2 },
  quickNavHint: { fontSize: 12, color: '#6B7280', lineHeight: 16 },
  quickNavChevron: { fontSize: 18, color: '#9CA3AF', marginLeft: 8 },
});