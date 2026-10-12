import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '@/lib/api';
import TimetableGrid from '@/components/TimetableGrid';

export default function StudentTimetable() {
  const router = useRouter();
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [view, setView] = useState('grid'); // grid | list

  async function load() {
    try {
      setError('');
      const res = await api.get('/api/timetables/me');
      setSlots(res.slots || []);
    } catch (err) {
      setError(err.message || 'Failed to load timetable');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, []);

  function handleSlotPress(slot) {
    router.push(`/student/course/${slot.courseId}`);
  }

  // Group for list view
  const byDay = {};
  slots.forEach(s => {
    if (!byDay[s.dayOfWeek]) byDay[s.dayOfWeek] = [];
    byDay[s.dayOfWeek].push(s);
  });
  const dayNames = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator color="#C9A961" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#C9A961" />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>

          <View style={styles.titleRow}>
            <View>
              <View style={styles.brandRow}>
                <View style={styles.brandDot} />
                <Text style={styles.brandText}>TIMETABLE</Text>
              </View>
              <Text style={styles.title}>My classes</Text>
              <Text style={styles.subtitle}>
                {slots.length} sessions scheduled this week
              </Text>
            </View>
          </View>
        </View>

        {/* View toggle */}
        <View style={styles.toggle}>
          <TouchableOpacity
            style={[styles.toggleButton, view === 'grid' && styles.toggleActive]}
            onPress={() => setView('grid')}
            activeOpacity={0.7}
          >
            <Text style={[styles.toggleText, view === 'grid' && styles.toggleTextActive]}>
              Grid
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, view === 'list' && styles.toggleActive]}
            onPress={() => setView('list')}
            activeOpacity={0.7}
          >
            <Text style={[styles.toggleText, view === 'list' && styles.toggleTextActive]}>
              List
            </Text>
          </TouchableOpacity>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Grid view */}
        {view === 'grid' && (
          <TimetableGrid slots={slots} onSlotPress={handleSlotPress} />
        )}

        {/* List view */}
        {view === 'list' && (
          <View style={styles.listContainer}>
            {slots.length === 0 ? (
              <TimetableGrid slots={[]} />
            ) : (
              Object.keys(byDay)
                .sort((a, b) => Number(a) - Number(b))
                .map(day => (
                  <View key={day} style={styles.daySection}>
                    <Text style={styles.dayTitle}>{dayNames[Number(day)]}</Text>
                    {byDay[day]
                      .sort((a, b) => a.startTime.localeCompare(b.startTime))
                      .map(slot => (
                        <TouchableOpacity
                          key={slot.id}
                          style={styles.listItem}
                          onPress={() => handleSlotPress(slot)}
                          activeOpacity={0.7}
                        >
                          <View style={styles.listTime}>
                            <Text style={styles.listTimeText}>{slot.startTime}</Text>
                            <Text style={styles.listTimeSub}>{slot.endTime}</Text>
                          </View>
                          <View style={styles.listBody}>
                            <Text style={styles.listCode}>{slot.courseCode}</Text>
                            <Text style={styles.listName} numberOfLines={1}>
                              {slot.courseName}
                            </Text>
                            <Text style={styles.listRoom}>
                              {slot.roomName || 'TBD'} · {slot.lecturerName}
                            </Text>
                          </View>
                          <Text style={styles.listChevron}>→</Text>
                        </TouchableOpacity>
                      ))}
                  </View>
                ))
            )}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8F7F5' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingTop: 8, paddingBottom: 40 },
  header: { paddingHorizontal: 20, marginBottom: 16 },
  backButton: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#E8E6E1', marginBottom: 20,
  },
  backText: { fontSize: 20, color: '#1B2A4E', fontWeight: '500' },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  brandRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  brandDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#C9A961', marginRight: 8 },
  brandText: { color: '#C9A961', fontSize: 11, fontWeight: '700', letterSpacing: 2 },
  title: { color: '#1B2A4E', fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  subtitle: { color: '#6B7383', fontSize: 14, marginTop: 4 },
  toggle: {
    flexDirection: 'row', marginHorizontal: 20, marginBottom: 16,
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: 4,
    borderWidth: 1.5, borderColor: '#E8E6E1',
  },
  toggleButton: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  toggleActive: { backgroundColor: '#1B2A4E' },
  toggleText: { color: '#6B7383', fontSize: 13, fontWeight: '600' },
  toggleTextActive: { color: '#F8F7F5' },
  errorBox: {
    backgroundColor: '#F5E5E5', borderRadius: 12, padding: 12,
    marginHorizontal: 20, marginBottom: 16,
  },
  errorText: { color: '#A93B3B', fontSize: 13 },
  listContainer: { paddingHorizontal: 20 },
  daySection: { marginBottom: 24 },
  dayTitle: {
    fontSize: 11, fontWeight: '700', color: '#C9A961',
    letterSpacing: 2, marginBottom: 12, textTransform: 'uppercase',
  },
  listItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 14,
    padding: 14, marginBottom: 8,
    borderWidth: 1.5, borderColor: '#E8E6E1',
  },
  listTime: {
    width: 60, alignItems: 'flex-start',
    borderRightWidth: 1, borderRightColor: '#F0EDE5',
    paddingRight: 12, marginRight: 12,
  },
  listTimeText: { color: '#1B2A4E', fontSize: 14, fontWeight: '700' },
  listTimeSub: { color: '#8A93A5', fontSize: 11, marginTop: 2 },
  listBody: { flex: 1 },
  listCode: { color: '#1B2A4E', fontSize: 15, fontWeight: '700' },
  listName: { color: '#6B7383', fontSize: 13, marginTop: 2 },
  listRoom: { color: '#8A93A5', fontSize: 11, marginTop: 4 },
  listChevron: { color: '#C9A961', fontSize: 18, fontWeight: '600' },
});