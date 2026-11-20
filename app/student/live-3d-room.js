import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function Live3DRoom() {
  const router = useRouter();
  const { sessionToken } = useLocalSearchParams();

  // In production, this points to a React web page that embeds the HeyGen WebRTC stream
  const streamUrl = https://prefect-jade.vercel.app/3d-room?token=;

  return (
    <View style={styles.container}>
      <WebView 
        source={{ uri: streamUrl }} 
        style={styles.webview}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
      />
      
      <TouchableOpacity style={styles.endBtn} onPress={() => router.back()}>
        <Text style={styles.endBtnText}>End 3D Interview</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  webview: { flex: 1 },
  endBtn: { position: 'absolute', bottom: 40, left: 20, right: 20, backgroundColor: '#EF4444', padding: 18, borderRadius: 16, alignItems: 'center' },
  endBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});