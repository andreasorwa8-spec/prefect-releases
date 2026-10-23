import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, SafeAreaView, TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';

const ICON_BACK = '\u2190';

function formatCents(cents) {
  return 'KSh ' + (cents / 100).toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function commissionLabel(item) {
  if (item.commissionType === 'PERCENT') {
    const amount = Math.floor(item.product.priceCents * item.commissionValue / 100);
    return item.commissionValue + '% (' + formatCents(amount) + ')';
  }
  return formatCents(item.commissionValue);
}

export default function AffiliateLinksScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');

  async function load() {
    try {
      setError('');
      const res = await api.get('/api/affiliate/links');
      setItems(res.items || []);
    } catch (err) {
      setError(err.message || 'Failed to load');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { load(); }, []);
  const onRefresh = useCallback(() => { setRefreshing(true); load(); }, []);

  const filtered = q
    ? items.filter(function (it) {
        const hay = (it.product.name + ' ' + (it.merchant.displayName || it.merchant.businessName)).toLowerCase();
        return hay.indexOf(q.toLowerCase()) >= 0;
      })
    : items;

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator color="#C9A961" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>{ICON_BACK}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Affiliate products</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#C9A961" />}
      >
        <View style={styles.searchWrap}>
          <TextInput
            style={styles.search}
            value={q}
            onChangeText={setQ}
            placeholder="Search products or merchants"
            placeholderTextColor="#8A909C"
          />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No affiliate products available right now.</Text>
          </View>
        ) : (
          filtered.map(function (item) {
            return (
              <TouchableOpacity
                key={item.id}
                style={styles.card}
                onPress={() => router.push('/affiliate/links/' + item.linkCode)}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.productName} numberOfLines={1}>{item.product.name}</Text>
                  <Text style={styles.merchantName} numberOfLines={1}>
                    {item.merchant.displayName || item.merchant.businessName}
                    {item.merchant.verified ? '  \u2713' : ''}
                  </Text>
                </View>
                <View style={styles.cardRow}>
                  <View>
                    <Text style={styles.smallLabel}>PRICE</Text>
                    <Text style={styles.price}>{formatCents(item.product.priceCents)}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.smallLabel}>YOUR COMMISSION</Text>
                    <Text style={styles.commission}>{commissionLabel(item)}</Text>
                  </View>
                </View>
                {item.myLinkCode ? (
                  <View style={styles.ownedBadge}>
                    <Text style={styles.ownedText}>You own a link: {item.myLinkCode}</Text>
                  </View>
                ) : (
                  <Text style={styles.claimHint}>Tap to claim your link</Text>
                )}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8F7F5' },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#EEE' },
  back: { fontSize: 22, color: '#1B2A4E' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1B2A4E' },
  scroll: { padding: 16, paddingBottom: 40 },
  searchWrap: { marginBottom: 16 },
  search: { backgroundColor: '#FFFFFF', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, borderWidth: 1, borderColor: '#E5E2DC' },
  error: { color: '#B00020', marginBottom: 12 },
  empty: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 40, borderWidth: 1, borderColor: '#EEE' },
  emptyText: { textAlign: 'center', color: '#8A909C', fontSize: 14 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#EEE' },
  cardHeader: { marginBottom: 12 },
  productName: { fontSize: 16, fontWeight: '600', color: '#1B2A4E', marginBottom: 2 },
  merchantName: { fontSize: 12, color: '#8A909C' },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  smallLabel: { fontSize: 10, letterSpacing: 1, fontWeight: '600', color: '#8A909C', marginBottom: 2 },
  price: { fontSize: 15, fontWeight: '600', color: '#1B2A4E' },
  commission: { fontSize: 15, fontWeight: '600', color: '#059669' },
  ownedBadge: { backgroundColor: '#ECFDF5', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 10 },
  ownedText: { fontSize: 12, color: '#047857', fontWeight: '500' },
  claimHint: { fontSize: 12, color: '#1B2A4E', fontWeight: '500' },
});
