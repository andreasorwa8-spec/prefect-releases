import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

const DAYS = [
  { value: 1, short: 'Mon', full: 'Monday' },
  { value: 2, short: 'Tue', full: 'Tuesday' },
  { value: 3, short: 'Wed', full: 'Wednesday' },
  { value: 4, short: 'Thu', full: 'Thursday' },
  { value: 5, short: 'Fri', full: 'Friday' },
  { value: 6, short: 'Sat', full: 'Saturday' },
  { value: 7, short: 'Sun', full: 'Sunday' },
];

const COLORS = [
  '#1B2A4E', '#2E7D5B', '#8B4A8F', '#B8860B', '#A93B3B',
  '#4A6FA5', '#5B8C5A', '#7A6BAE',
];

function colorForCourse(code) {
  let hash = 0;
  for (let i = 0; i < code.length; i++) {
    hash = code.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

export default function TimetableGrid({ slots = [], onSlotPress = null }) {
  const activeDays = DAYS.filter(d => slots.some(s => s.dayOfWeek === d.value));
  const displayDays = activeDays.length > 0 ? activeDays : DAYS.slice(0, 5);

  if (slots.length === 0) {
    return (
      <View style={styles.emptyBox}>
        <Text style={styles.emptyTitle}>No timetable yet</Text>
        <Text style={styles.emptySubtitle}>
          Your schedule will appear here once it's published.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.horizontalContainer}
    >
      <View style={styles.gridContainer}>
        {/* Header row */}
        <View style={styles.headerRow}>
          <View style={styles.timeColumnHeader} />
          {displayDays.map(d => (
            <View key={d.value} style={styles.dayHeader}>
              <Text style={styles.dayHeaderText}>{d.short}</Text>
            </View>
          ))}
        </View>

        {/* Slot rows grouped by day */}
        <View style={styles.rowsContainer}>
          {displayDays.map(d => {
            const daySlots = slots
              .filter(s => s.dayOfWeek === d.value)
              .sort((a, b) => a.startTime.localeCompare(b.startTime));

            return (
              <View key={d.value} style={styles.dayColumn}>
                <View style={styles.dayColumnHeader}>
                  <Text style={styles.dayColumnHeaderText}>{d.full}</Text>
                </View>
                {daySlots.length === 0 ? (
                  <View style={styles.emptyDay}>
                    <Text style={styles.emptyDayText}>—</Text>
                  </View>
                ) : (
                  daySlots.map(slot => {
                    const color = colorForCourse(slot.courseCode || 'X');
                    return (
                      <TouchableOpacity
                        key={slot.id}
                        style={[styles.slotCard, { backgroundColor: color }]}
                        onPress={() => onSlotPress?.(slot)}
                        activeOpacity={0.85}
                      >
                        <Text style={styles.slotTime}>
                          {slot.startTime}–{slot.endTime}
                        </Text>
                        <Text style={styles.slotCode} numberOfLines={1}>
                          {slot.courseCode}
                        </Text>
                        {slot.roomName && (
                          <Text style={styles.slotRoom} numberOfLines={1}>
                            {slot.roomName}
                          </Text>
                        )}
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  horizontalContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  gridContainer: {
    flexDirection: 'column',
  },
  headerRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  timeColumnHeader: {
    width: 0,
  },
  dayHeader: {
    width: 120,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  dayHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8A93A5',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  rowsContainer: {
    flexDirection: 'row',
  },
  dayColumn: {
    width: 120,
    marginHorizontal: 4,
  },
  dayColumnHeader: {
    marginBottom: 8,
    alignItems: 'center',
  },
  dayColumnHeaderText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1B2A4E',
  },
  slotCard: {
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    minHeight: 80,
    justifyContent: 'center',
  },
  slotTime: {
    color: '#F8F7F5',
    fontSize: 10,
    fontWeight: '600',
    opacity: 0.85,
    marginBottom: 4,
  },
  slotCode: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  slotRoom: {
    color: '#F8F7F5',
    fontSize: 10,
    marginTop: 4,
    opacity: 0.75,
  },
  emptyDay: {
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F7F5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E6E1',
    borderStyle: 'dashed',
  },
  emptyDayText: {
    color: '#C7CAD1',
    fontSize: 20,
  },
  emptyBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 40,
    marginHorizontal: 20,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E8E6E1',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1B2A4E',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#8A93A5',
    textAlign: 'center',
    lineHeight: 18,
  },
});