import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, SafeAreaView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';

const ICON_BACK = '\u2190';

export default function ClaimScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();
  const linkCode = params.linkCode;
  const [busy, setBusy] = useState(false);
  const [claimed, setClaimed] = useState(null);
  const [error, setError] = useState('');

  async function claim() {
    setBusy(true);
    setError('');
    try {
      const res = await api.post('/api/affiliate/links/' + linkCode + '/claim', {});
      if (res && res.link) {
        setClaimed(res.link);
      }
    } catch (err) {
      setError(err.message || 'Claim failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>{ICON_BACK}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Claim affiliate link</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {!claimed ? (
          <View style={styles.card}>
            <Text style={styles.title}>Claim your link</Text>
            <Text style={styles.body}>
              You will get your own unique link code for this product. Share it with your audience.
              When someone purchases through your link, you earn the merchant's commission.
            </Text>
            <Text style={styles.body}>
              The commission is set by the merchant and is the same for you as for any other affiliate.
              Once claimed, your code is permanent.
            </Text>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={claim}
              disabled={busy}
            >
              <Text style={styles.primaryBtnText}>
                {busy ? 'Claiming...' : 'Claim your link'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.title}>Your link is ready</Text>
            <Text style={styles.body}>
              Share this code with your audience. Anyone who purchases through it earns you commission.
            </Text>
            <Text selectable style={styles.linkCode}>{claimed.linkCode}</Text>
            <Text style={styles.muted}>
              {claimed.product ? claimed.product.name : ''}
              {claimed.commissionType === 'PERCENT' ? ' -- ' + claimed.commissionValue + '%' : ''}
              {claimed.commissionType === 'FIXED' ? ' -- KSh ' + (claimed.commissionValue / 100) : ''}
            </Text>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => router.push('/affiliate/links')}
            >
              <Text style={styles.primaryBtnText}>Back to products</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8F7F5' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#EEE' },
  back: { fontSize: 22, color: '#1B2A4E' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1B2A4E' },
  scroll: { padding: 16, paddingBottom: 40 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#EEE' },
  title: { fontSize: 18, fontWeight: '700', color: '#1B2A4E', marginBottom: 10 },
  body: { fontSize: 14, color: '#4A5260', lineHeight: 20, marginBottom: 12 },
  error: { color: '#B00020', marginBottom: 12 },
  primaryBtn: { backgroundColor: '#1B2A4E', paddingVertical: 14, borderRadius: 999, alignItems: 'center', marginTop: 12 },
  primaryBtnText: { color: '#FFFFFF', fontWeight: '600', fontSize: 15 },
  linkCode: { fontSize: 28, fontWeight: '700', color: '#1B2A4E', letterSpacing: 2, marginVertical: 16 },
  muted: { fontSize: 12, color: '#8A909C', marginBottom: 16 },
});
