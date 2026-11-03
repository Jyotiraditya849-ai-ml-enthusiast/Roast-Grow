import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity
} from 'react-native';
import { getLocalDateString } from '../../storage/asyncStorage';

const CELL_SIZE = 12;
const CELL_GAP = 3;
const WEEKS_COUNT = 52;
const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Dark Mode Color Palette
const COLOR_EMPTY = '#21262d';
const COLOR_FUTURE = '#0d1117';
const COLOR_FROZEN = '#38bdf8';
const COLOR_SCALE = [
  '#0e4429', // 1 - 25% completed
  '#006d32', // 26 - 50% completed
  '#26a641', // 51 - 75% completed
  '#39d353'  // 76 - 100% completed
];

export const ActivityHeatmap = ({ history = {}, challenge = {}, startDate }) => {
  // Mode: 'forward' (starts on user login/start date) vs 'retrospective' (past 365 days)
  const [viewMode, setViewMode] = useState('forward');
  const [selectedDay, setSelectedDay] = useState(null);

  const todayStr = useMemo(() => getLocalDateString(), []);
  const todayDayOfWeekIndex = useMemo(() => {
    // JavaScript getDay(): 0 = Sun, 1 = Mon, ..., 6 = Sat
    // Grid rows: 0 = Mon, 1 = Tue, 2 = Wed, 3 = Thu, 4 = Fri, 5 = Sat, 6 = Sun
    const d = new Date().getDay();
    return (d + 6) % 7;
  }, []);

  // Compute 52-week grid based on mode
  const { weeks, monthLabels, totalActiveDays, challengeDayCount } = useMemo(() => {
    const today = new Date();
    const currentDayOfWeek = today.getDay(); // 0 = Sunday

    let baseStart = new Date(today);

    if (viewMode === 'forward') {
      // START FROM USER'S LOGIN / START DATE
      if (startDate) {
        const [sy, sm, sd] = startDate.split('-').map(Number);
        baseStart = new Date(sy, sm - 1, sd);
      }
      // Align start to the Sunday of that start week so days line up Mon-Sun cleanly
      const startDayOfWeek = baseStart.getDay();
      baseStart.setDate(baseStart.getDate() - startDayOfWeek);
    } else {
      // Retrospective: 52 weeks in the past up to today
      baseStart.setDate(today.getDate() - (52 * 7) - currentDayOfWeek);
    }

    const generatedWeeks = [];
    const months = [];
    let currentMonth = -1;
    let activeCounter = 0;
    let totalChallengeDays = 0;

    let cursor = new Date(baseStart);

    for (let w = 0; w < WEEKS_COUNT; w++) {
      const weekDays = [];
      for (let d = 0; d < 7; d++) {
        cursor.setDate(cursor.getDate() + 1);
        const dateStr = getLocalDateString(cursor);
        const entry = history[dateStr];
        const isToday = dateStr === todayStr;
        const isFuture = cursor > today && !isToday;

        totalChallengeDays++;

        if (entry?.completed) {
          activeCounter++;
        }

        weekDays.push({
          dateStr,
          date: new Date(cursor),
          entry,
          isToday,
          isFuture,
          dayIndex: totalChallengeDays
        });

        // Month labels along top
        if (d === 0) {
          const m = cursor.getMonth();
          if (m !== currentMonth) {
            months.push({
              weekIndex: w,
              name: cursor.toLocaleString('default', { month: 'short' })
            });
            currentMonth = m;
          }
        }
      }
      generatedWeeks.push(weekDays);
    }

    return {
      weeks: generatedWeeks,
      monthLabels: months,
      totalActiveDays: activeCounter,
      challengeDayCount: totalChallengeDays
    };
  }, [history, startDate, viewMode, todayStr]);

  // Determine cell color
  const getCellColor = (day) => {
    if (day.entry?.completed) {
      if (day.entry.freezeUsed) return COLOR_FROZEN;
      const ratio = day.entry.ratio || 0.5;
      if (ratio <= 0.25) return COLOR_SCALE[0];
      if (ratio <= 0.5) return COLOR_SCALE[1];
      if (ratio <= 0.75) return COLOR_SCALE[2];
      return COLOR_SCALE[3];
    }

    if (day.isToday) {
      return '#261b11'; // Warm accent for today pending check-in
    }

    if (day.isFuture) {
      return COLOR_FUTURE;
    }

    return COLOR_EMPTY;
  };

  return (
    <View style={styles.container}>
      {/* Header Stat & Toggle */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>
            {viewMode === 'forward' ? '365-Day Challenge Grid' : 'Past Year Activity'}
          </Text>
          <Text style={styles.subtitle}>
            {viewMode === 'forward'
              ? `Started on ${startDate || todayStr} • Road to Day 365`
              : 'Last 365 days retrospective view'}
          </Text>
        </View>

        <View style={styles.statPill}>
          <Text style={styles.statPillNumber}>{totalActiveDays}</Text>
          <Text style={styles.statPillLabel}>active days</Text>
        </View>
      </View>

      {/* Mode Switcher */}
      <View style={styles.modeToggle}>
        <TouchableOpacity
          style={[styles.modeToggleBtn, viewMode === 'forward' && styles.modeToggleBtnActive]}
          onPress={() => setViewMode('forward')}
        >
          <Text style={[styles.modeToggleText, viewMode === 'forward' && styles.modeToggleTextActive]}>
            🚀 Challenge Roadmap (From Start)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.modeToggleBtn, viewMode === 'retrospective' && styles.modeToggleBtnActive]}
          onPress={() => setViewMode('retrospective')}
        >
          <Text style={[styles.modeToggleText, viewMode === 'retrospective' && styles.modeToggleTextActive]}>
            ⏪ Past 365 Days
          </Text>
        </TouchableOpacity>
      </View>

      {/* Grid Container */}
      <View style={styles.gridWrapper}>
        {/* Day of Week Labels (All 7 Days) */}
        <View style={styles.dayLabelsCol}>
          <View style={styles.monthHeaderSpacer} />
          <View style={styles.dayLabelsList}>
            {DAYS_OF_WEEK.map((dayName, idx) => {
              const isTodayDay = idx === todayDayOfWeekIndex;
              return (
                <View key={dayName} style={styles.dayLabelItem}>
                  <Text
                    style={[
                      styles.dayLabelText,
                      isTodayDay && styles.dayLabelTextToday
                    ]}
                  >
                    {dayName}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Scrollable Heatmap Weeks */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollArea}>
          <View>
            {/* Month Header Row */}
            <View style={styles.monthsRow}>
              {monthLabels.map((m, idx) => (
                <Text
                  key={idx}
                  style={[
                    styles.monthText,
                    { left: m.weekIndex * (CELL_SIZE + CELL_GAP) }
                  ]}
                >
                  {m.name}
                </Text>
              ))}
            </View>

            {/* Weeks Columns */}
            <View style={styles.weeksContainer}>
              {weeks.map((week, wIdx) => (
                <View key={wIdx} style={styles.weekCol}>
                  {week.map((day, dIdx) => {
                    const isSelected = selectedDay?.dateStr === day.dateStr;
                    return (
                      <TouchableOpacity
                        key={dIdx}
                        style={[
                          styles.cell,
                          { backgroundColor: getCellColor(day) },
                          day.isFuture && styles.cellFuture,
                          day.isToday && styles.cellToday,
                          isSelected && styles.cellSelected
                        ]}
                        onPress={() => setSelectedDay(day)}
                        activeOpacity={0.7}
                      />
                    );
                  })}
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Heatmap Legend */}
      <View style={styles.legendRow}>
        <View style={styles.todayLegend}>
          <View style={[styles.legendCell, styles.cellToday]} />
          <Text style={styles.legendLabel}>Today 📍</Text>
        </View>

        <Text style={styles.legendLabel}>Less</Text>
        <View style={[styles.legendCell, { backgroundColor: COLOR_EMPTY }]} />
        <View style={[styles.legendCell, { backgroundColor: COLOR_SCALE[0] }]} />
        <View style={[styles.legendCell, { backgroundColor: COLOR_SCALE[1] }]} />
        <View style={[styles.legendCell, { backgroundColor: COLOR_SCALE[2] }]} />
        <View style={[styles.legendCell, { backgroundColor: COLOR_SCALE[3] }]} />
        <Text style={styles.legendLabel}>More</Text>

        <View style={styles.freezeLegend}>
          <View style={[styles.legendCell, { backgroundColor: COLOR_FROZEN }]} />
          <Text style={styles.legendLabel}>Frozen ❄️</Text>
        </View>
      </View>

      {/* Selected Day Inspector */}
      {selectedDay && (
        <View style={styles.inspectorCard}>
          <View style={styles.inspectorHeader}>
            <View style={styles.inspectorTitleRow}>
              <Text style={styles.inspectorDate}>{selectedDay.dateStr}</Text>
              {selectedDay.isToday && (
                <View style={styles.todayTag}>
                  <Text style={styles.todayTagText}>TODAY 📍</Text>
                </View>
              )}
            </View>
            <TouchableOpacity onPress={() => setSelectedDay(null)}>
              <Text style={styles.inspectorClose}>✕</Text>
            </TouchableOpacity>
          </View>

          {selectedDay.entry?.completed ? (
            <View>
              <Text style={styles.inspectorStatus}>
                {selectedDay.entry.freezeUsed
                  ? '❄️ Streak Protected via Freeze Coin'
                  : `✅ Completed (${Math.round((selectedDay.entry.ratio || 1) * 100)}% habits)`}
              </Text>
              {selectedDay.entry.completedHabits && (
                <Text style={styles.inspectorHabits}>
                  {selectedDay.entry.completedHabits.join(' • ')}
                </Text>
              )}
            </View>
          ) : selectedDay.isToday ? (
            <Text style={styles.inspectorTodayInfo}>
              🔥 Today is active! Check off your micro-habits on the Streak tab and lock in your check-in.
            </Text>
          ) : selectedDay.isFuture ? (
            <Text style={styles.inspectorFuture}>
              🎯 Day {selectedDay.dayIndex} of 365 • Upcoming milestone. Keep showing up every day to unlock this square!
            </Text>
          ) : (
            <Text style={styles.inspectorEmpty}>No check-in recorded on this date.</Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#111620',
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 12,
    marginVertical: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(34, 197, 94, 0.3)',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  headerLeft: {
    flex: 1,
    marginRight: 8
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#f0f6fc'
  },
  subtitle: {
    fontSize: 12,
    color: '#8b949e',
    marginTop: 2
  },
  statPill: {
    backgroundColor: '#0d1117',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#238636'
  },
  statPillNumber: {
    color: '#39d353',
    fontWeight: '800',
    fontSize: 14
  },
  statPillLabel: {
    color: '#8b949e',
    fontSize: 9,
    fontWeight: '600'
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: '#0d1117',
    borderRadius: 10,
    padding: 3,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#21262d'
  },
  modeToggleBtn: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 8
  },
  modeToggleBtnActive: {
    backgroundColor: '#21262d'
  },
  modeToggleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6e7681'
  },
  modeToggleTextActive: {
    color: '#f97316'
  },
  gridWrapper: {
    flexDirection: 'row'
  },
  dayLabelsCol: {
    width: 28,
    marginRight: 6
  },
  monthHeaderSpacer: {
    height: 18
  },
  dayLabelsList: {
    flexDirection: 'column',
    gap: CELL_GAP
  },
  dayLabelItem: {
    height: CELL_SIZE,
    justifyContent: 'center'
  },
  dayLabelText: {
    fontSize: 8.5,
    fontWeight: '700',
    color: '#8b949e',
    textAlign: 'right',
    includeFontPadding: false
  },
  dayLabelTextToday: {
    color: '#f97316',
    fontWeight: '900'
  },
  scrollArea: {
    flex: 1
  },
  monthsRow: {
    height: 18,
    position: 'relative'
  },
  monthText: {
    position: 'absolute',
    fontSize: 10,
    color: '#8b949e',
    fontWeight: '600'
  },
  weeksContainer: {
    flexDirection: 'row',
    gap: CELL_GAP
  },
  weekCol: {
    flexDirection: 'column',
    gap: CELL_GAP
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: 2
  },
  cellFuture: {
    borderWidth: 1,
    borderColor: '#21262d'
  },
  cellToday: {
    borderWidth: 1.5,
    borderColor: '#f97316'
  },
  cellSelected: {
    borderWidth: 2,
    borderColor: '#ffffff'
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 14
  },
  todayLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 'auto',
    gap: 4
  },
  legendLabel: {
    fontSize: 10,
    color: '#8b949e',
    marginHorizontal: 2
  },
  legendCell: {
    width: 10,
    height: 10,
    borderRadius: 2
  },
  freezeLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
    gap: 4
  },
  inspectorCard: {
    backgroundColor: '#0d1117',
    borderRadius: 12,
    padding: 12,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#30363d'
  },
  inspectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  inspectorTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  inspectorDate: {
    color: '#f0f6fc',
    fontSize: 13,
    fontWeight: '700'
  },
  todayTag: {
    backgroundColor: '#27150c',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#f97316'
  },
  todayTagText: {
    color: '#f97316',
    fontSize: 9,
    fontWeight: '800'
  },
  inspectorClose: {
    color: '#8b949e',
    fontSize: 14,
    padding: 4
  },
  inspectorStatus: {
    color: '#39d353',
    fontSize: 12,
    fontWeight: '700'
  },
  inspectorHabits: {
    color: '#8b949e',
    fontSize: 11,
    marginTop: 4
  },
  inspectorTodayInfo: {
    color: '#fbbf24',
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600'
  },
  inspectorFuture: {
    color: '#8b949e',
    fontSize: 12,
    lineHeight: 18
  },
  inspectorEmpty: {
    color: '#6e7681',
    fontSize: 12,
    fontStyle: 'italic'
  }
});
