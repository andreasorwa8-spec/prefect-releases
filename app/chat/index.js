// app/chat/index.js
// Session 25 -- 25.9
//
// Mobile conversation list: role-scoped General + Groups + DMs.
// Dot priority matches web: hasPending > hasUnread > neutral.
//
// Pull-to-refresh. Tapping a conversation opens /chat/[id].
// Top-right "New chat" opens /chat/new.

import { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, SafeAreaView, Alert,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { api } from '@/lib/api';

const ICON_ARROW = '\u2192';
const ICON_PLUS = '\u002B';

const DOT_PENDING = '#EAB308';
const DOT_UNREAD = '#F97316';
const DOT_NEUTRAL = '#D1D5DB';

export default function ChatListScreen() {
  const router = useRouter();
  const [data, setData] = useState({ general: null, groups: [], dms: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    try {
      setError('');
      const res = await api.get('/api/chat/conversations');
      setData({
        general: res.general || null,
        groups: res.groups || [],
        dms: res.dms || [],
      });
    } catch (err) {
      setError(err?.message || 'Could not load conversations');
    }
  }

  useFocusEffect(
    useCallback(() => {
      (async () => {
        setLoading(true);
        await load();
        setLoading(false);
      })();
    }, [])
  );

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  function dotColor(item) {
    if ((item.pendingCount || 0) > 0) return DOT_PENDING;
    if ((item.unreadCount || 0) > 0) return DOT_UNREAD;
    return DOT_NEUTRAL;
  }

  function badgeText(item) {
    const p = item.pendingCount || 0;
    const u = item.unreadCount || 0;
    if (p > 0) return `${p} pending`;
    if (u > 0) return `${u} unread`;
    return '';
  }

  function open(conversationId) {
    router.push(`/chat/${conversationId}`);
  }

  const totalConversations =
    (data.general ? 1 : 0) + data.dms.length + data.groups.length;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Text style={styles.headerBtnText}>{'\u2190'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chat</Text>
        <TouchableOpacity onPress={() => router.push('/chat/new')} style={styles.headerBtn}>
          <Text style={styles.headerBtnText}>{ICON_PLUS}</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#1B2A4E" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {totalConversations === 0 && !error ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No conversations yet.</Text>
              <Text style={styles.emptyHint}>Tap + to start one.</Text>
            </View>
          ) : null}

          {data.general ? (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>GENERAL</Text>
              <TouchableOpacity style={styles.row} onPress={() => open(data.general.id)} activeOpacity={0.85}>
                <View style={[styles.dot, { backgroundColor: dotColor(data.general) }]} />
                <View style={styles.rowBody}>
                  <Text style={styles.rowTitle}>{data.general.title || 'General'}</Text>
                  {badgeText(data.general) ? (
                    <Text style={styles.rowSub}>{badgeText(data.general)}</Text>
                  ) : null}
                </View>
                <Text style={styles.chevron}>{ICON_ARROW}</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {data.dms.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>DIRECT MESSAGES</Text>
              {data.dms.map((d) => (
                <TouchableOpacity key={d.id} style={styles.row} onPress={() => open(d.id)} activeOpacity={0.85}>
                  <View style={[styles.dot, { backgroundColor: dotColor(d) }]} />
                  <View style={styles.rowBody}>
                    <Text style={styles.rowTitle}>{d.other?.name || 'Unknown'}</Text>
                    <Text style={styles.rowSub}>
                      {d.other?.role || ''}
                      {badgeText(d) ? `  ·  ${badgeText(d)}` : ''}
                    </Text>
                  </View>
                  <Text style={styles.chevron}>{ICON_ARROW}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}

          {data.groups.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>GROUPS</Text>
              {data.groups.map((g) => (
                <TouchableOpacity key={g.id} style={styles.row} onPress={() => open(g.id)} activeOpacity={0.85}>
                  <View style={[styles.dot, { backgroundColor: dotColor(g) }]} />
                  <View style={styles.rowBody}>
                    <Text style={styles.rowTitle}>
                      {g.title || 'Group'}
                      {g.isPendingInvite ? '  · invited' : ''}
                      {!g.isMember ? '  · not joined' : ''}
                    </Text>
                    {badgeText(g) ? <Text style={styles.rowSub}>{badgeText(g)}</Text> : null}
                  </View>
                  <Text style={styles.chevron}>{ICON_ARROW}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}

          <TouchableOpacity
            style={styles.pendingLink}
            onPress={() => router.push('/chat/pending')}
            activeOpacity={0.85}
          >
            <Text style={styles.pendingLinkText}>Review pending messages</Text>
            <Text style={styles.chevron}>{ICON_ARROW}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.pendingLink}
            onPress={() => router.push('/profile')}
            activeOpacity={0.85}
          >
            <Text style={styles.pendingLinkText}>Profile</Text>
            <Text style={styles.chevron}>{ICON_ARROW}</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F4EC' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#EFE9DA', backgroundColor: '#FFFFFF',
  },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerBtnText: { fontSize: 22, color: '#1B2A4E', fontWeight: '600' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#1B2A4E' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { padding: 16, paddingBottom: 32 },
  section: { marginBottom: 18 },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: '#6B7280',
    letterSpacing: 1, marginBottom: 8, marginLeft: 4,
  },
  row: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 14,
    paddingVertical: 14, paddingHorizontal: 14, marginBottom: 8,
    borderWidth: 1, borderColor: '#EFE9DA',
  },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 12 },
  rowBody: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: '600', color: '#1B2A4E' },
  rowSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  chevron: { fontSize: 16, color: '#9CA3AF', marginLeft: 8 },
  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 15, color: '#1B2A4E', fontWeight: '600' },
  emptyHint: { fontSize: 13, color: '#6B7280', marginTop: 6 },
  errorBox: {
    backgroundColor: '#FEE2E2', borderRadius: 10, padding: 12, marginBottom: 16,
  },
  errorText: { color: '#991B1B', fontSize: 13 },
  pendingLink: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 16, paddingHorizontal: 14, marginTop: 8,
    borderTopWidth: 1, borderTopColor: '#EFE9DA',
  },
  pendingLinkText: { fontSize: 14, color: '#1B2A4E', fontWeight: '600' },
});