import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity
} from 'react-native';
import { getLocalDateString } from '../../storage/asyncStorage';

import { THEME } from '../../theme';

const CELL_SIZE = 12;
const CELL_GAP = 3;
const WEEKS_COUNT = 52;
const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Cyberpunk Heatmap Color Palette: Deep Blue -> Marigold
const COLOR_EMPTY = '#0c1424';
const COLOR_FUTURE = '#050811';
const COLOR_FROZEN = THEME.blueLight;
const COLOR_SCALE = [
  '#0c4a6e', // 1 - 25% completed (Deep Cyber Navy)
  '#0284c7', // 26 - 50% completed (Electric Cyber Blue)
  '#d97706', // 51 - 75% completed (Deep Warm Marigold)
  '#f59e0b'  // 76 - 100% completed (Radiant Gold Marigold)
];

export const ActivityHeatmap = React.memo(({
  history = {},
  challenge = {},
  startDate,
  viewMode: controlledViewMode,
  onToggleViewMode
}) => {
  // Mode: 'forward' (starts on user login/start date) vs 'retrospective' (past 365 days)
  const [internalViewMode, setInternalViewMode] = useState('forward');
  const viewMode = controlledViewMode !== undefined ? controlledViewMode : internalViewMode;
  const setViewMode = onToggleViewMode || setInternalViewMode;
  const [selectedDay, setSelectedDay] = useState(null);

  const todayStr = useMemo(() => getLocalDateString(), []);
  const todayDayOfWeekIndex = useMemo(() => {
    // JavaScript getDay(): 0 = Sun, 1 = Mon, ..., 6 = Sat
    // Grid rows: 0 = Mon, 1 = Tue, 2 = Wed, 3 = Thu, 4 = Fri, 5 = Sat, 6 = Sun
    const d = new Date().getDay();
    return (d + 6) % 7;
  }, []);

  // Compute 52-week grid based on mode with exact day alignment
  const { weeks, monthLabels, totalActiveDays, challengeDayCount } = useMemo(() => {
    const today = new Date();
    const todayYear = today.getFullYear();
    const todayMonth = today.getMonth();
    const todayDate = today.getDate();

    const todayStartOfDay = new Date(todayYear, todayMonth, todayDate, 0, 0, 0, 0);
    const todayEndOfDay = new Date(todayYear, todayMonth, todayDate, 23, 59, 59, 999);

    // Row index: 0 = Mon, 1 = Tue, 2 = Wed, 3 = Thu, 4 = Fri, 5 = Sat, 6 = Sun
    const getRow = (d) => (d.getDay() + 6) % 7;

    let gridStartDate;

    if (viewMode === 'forward') {
      let start = todayStartOfDay;
      if (startDate) {
        const [sy, sm, sd] = startDate.split('-').map(Number);
        if (!isNaN(sy) && !isNaN(sm) && !isNaN(sd)) {
          start = new Date(sy, sm - 1, sd, 0, 0, 0, 0);
        }
      }
      const startRow = getRow(start);
      // Align grid start to the Monday of that start week
      gridStartDate = new Date(start.getFullYear(), start.getMonth(), start.getDate() - startRow, 0, 0, 0, 0);
    } else {
      // Retrospective: 52 weeks ending on current week
      const todayRow = getRow(todayStartOfDay);
      const currentWeekMonday = new Date(todayYear, todayMonth, todayDate - todayRow, 0, 0, 0, 0);
      gridStartDate = new Date(currentWeekMonday.getFullYear(), currentWeekMonday.getMonth(), currentWeekMonday.getDate() - (51 * 7), 0, 0, 0, 0);
    }

    const generatedWeeks = [];
    const months = [];
    let lastLabeledMonth = -1;
    let lastLabeledWeekIndex = -999;
    let activeCounter = 0;
    let totalChallengeDays = 0;

    for (let w = 0; w < WEEKS_COUNT; w++) {
      const weekDays = [];
      for (let d = 0; d < 7; d++) {
        const dayOffset = w * 7 + d;
        const cellDate = new Date(
          gridStartDate.getFullYear(),
          gridStartDate.getMonth(),
          gridStartDate.getDate() + dayOffset,
          0, 0, 0, 0
        );
        const dateStr = getLocalDateString(cellDate);
        const entry = history[dateStr];
        const isToday = dateStr === todayStr;
        const isFuture = cellDate.getTime() > todayEndOfDay.getTime();

        totalChallengeDays++;

        // Guaranteed check-in detection: either recorded in history or challenge verified for today
        const isCompleted = Boolean(
          entry?.completed || (isToday && challenge?.lastActiveDate === todayStr)
        );

        if (isCompleted) {
          activeCounter++;
        }

        weekDays.push({
          dateStr,
          date: cellDate,
          entry,
          isToday,
          isFuture,
          isCompleted,
          dayIndex: totalChallengeDays
        });

        // Month labels along top with guaranteed 3-week spacing (prevents "OctNov" overlap)
        if (d === 0) {
          const m = cellDate.getMonth();
          if (m !== lastLabeledMonth) {
            if (lastLabeledWeekIndex === -999 || (w - lastLabeledWeekIndex) >= 3) {
              months.push({
                weekIndex: w,
                name: cellDate.toLocaleString('default', { month: 'short' })
              });
              lastLabeledMonth = m;
              lastLabeledWeekIndex = w;
            } else if (months.length === 1 && (w - lastLabeledWeekIndex) < 3) {
              months[0] = {
                weekIndex: w,
                name: cellDate.toLocaleString('default', { month: 'short' })
              };
              lastLabeledMonth = m;
              lastLabeledWeekIndex = w;
            }
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
  }, [history, challenge, startDate, viewMode, todayStr]);

  // Determine cell color: Radiant Gold Marigold when checked in, Pure Blood Red / Wine when pending
  const getCellColor = (day) => {
    const isCompleted = Boolean(
      day.isCompleted || day.entry?.completed || (day.isToday && challenge?.lastActiveDate === todayStr)
    );

    if (isCompleted) {
      if (day.entry?.freezeUsed) return COLOR_FROZEN;
      const ratio = day.entry?.ratio || 1.0;
      if (ratio <= 0.25) return COLOR_SCALE[0];
      if (ratio <= 0.5) return COLOR_SCALE[1];
      if (ratio <= 0.75) return COLOR_SCALE[2];
      return COLOR_SCALE[3]; // Radiant Gold Marigold #f59e0b
    }

    if (day.isToday) {
      return '#2a0911'; // Deep crimson wine accent for today pending check-in
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
                    const isTodaySecured = day.isCompleted || (day.isToday && challenge?.lastActiveDate === todayStr);

                    return (
                      <TouchableOpacity
                        key={dIdx}
                        style={[
                          styles.cell,
                          { backgroundColor: getCellColor(day) },
                          day.isFuture && styles.cellFuture,
                          day.isToday && (isTodaySecured ? styles.cellTodayDone : styles.cellTodayPending),
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
          <View style={[styles.legendCell, styles.cellTodayDone]} />
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

          {(selectedDay.isCompleted || selectedDay.entry?.completed || (selectedDay.isToday && challenge?.lastActiveDate === todayStr)) ? (
            <View>
              <Text style={styles.inspectorStatus}>
                {selectedDay.entry?.freezeUsed
                  ? '❄️ Streak Protected via Freeze Coin'
                  : `✅ Completed (Day ${selectedDay.dayIndex} of 365) • Streak Secured 🔥`}
              </Text>
              {selectedDay.entry?.completedHabits && (
                <Text style={styles.inspectorHabits}>
                  {selectedDay.entry.completedHabits.join(' • ')}
                </Text>
              )}
            </View>
          ) : selectedDay.isToday ? (
            <Text style={styles.inspectorTodayInfo}>
              🔥 Today is active! Check off your micro-habits and complete check-in on the Home tab to lock in Radiant Gold!
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
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: THEME.bgCard,
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 12,
    marginVertical: 10,
    borderWidth: 1.5,
    borderColor: THEME.borderMedium,
    shadowColor: THEME.marigold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
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
    color: THEME.textWhite
  },
  subtitle: {
    fontSize: 12,
    color: THEME.textMuted,
    marginTop: 2
  },
  statPill: {
    backgroundColor: THEME.bgInput,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: THEME.marigold
  },
  statPillNumber: {
    color: THEME.marigoldLight,
    fontWeight: '800',
    fontSize: 14
  },
  statPillLabel: {
    color: THEME.textMuted,
    fontSize: 9,
    fontWeight: '600'
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: THEME.bgInput,
    borderRadius: 10,
    padding: 3,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: THEME.borderMedium
  },
  modeToggleBtn: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 8
  },
  modeToggleBtnActive: {
    backgroundColor: THEME.bgCardElevated,
    borderColor: THEME.borderHighlight,
    borderWidth: 1
  },
  modeToggleText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.textMuted
  },
  modeToggleTextActive: {
    color: THEME.marigoldLight
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
    color: THEME.marigoldLight,
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
    borderColor: '#182338'
  },
  cellToday: {
    borderWidth: 1.8,
    borderColor: '#fbbf24'
  },
  cellTodayDone: {
    borderWidth: 2,
    borderColor: '#fbbf24',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 5,
    elevation: 4
  },
  cellTodayPending: {
    borderWidth: 2,
    borderColor: '#ff003f',
    shadowColor: '#ff003f',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 3
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
