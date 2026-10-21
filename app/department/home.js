import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import QrTile from '../../components/QrTile';
import ChatTile from '../../components/ChatTile';

export default function DepartmentHome() {
  const { session, signOut } = useAuth();
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.label}>DEPARTMENT</Text>
      <Text style={styles.title}>Admin dashboard</Text>
      <Text style={styles.sub}>{session?.user?.email}</Text>
      <View style={{ height: 16 }} />
      <QrTile hint="Create, print and scan QR codes" />
      <ChatTile hint="Message students and lecturers" />

      <TouchableOpacity onPress={signOut} style={styles.button}>
        <Text style={styles.buttonText}>Sign out</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F7F5', padding: 24 },
  label: { color: '#C9A961', fontSize: 11, fontWeight: '700', letterSpacing: 2, marginTop: 40, marginBottom: 16 },
  title: { fontSize: 26, fontWeight: '700', color: '#1B2A4E', marginBottom: 8 },
  sub: { fontSize: 14, color: '#6B7383', marginBottom: 32 },
  button: { backgroundColor: '#1B2A4E', paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  buttonText: { color: '#F8F7F5', fontSize: 15, fontWeight: '700' },
});