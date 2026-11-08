import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getLocalDateString } from '../../storage/asyncStorage';
import { THEME } from '../../theme';

const CELL_SIZE = 12;
const CELL_GAP = 2.8;
const WEEKS_COUNT = 52;
const DAYS_OF_WEEK = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export const HabitHeatmapGrid = React.memo(({
  habitId,
  title,
  icon = 'checkmark-circle-outline',
  accentColor = THEME.marigold,
  history = {},
  isTodayDone = false,
  startDate,
  viewMode = 'forward' // 'forward' (Roadmap from challenge start) or 'retrospective' (Past 365 days)
}) => {
  const [selectedDay, setSelectedDay] = useState(null);
  const scrollRef = useRef(null);

  const todayStr = useMemo(() => getLocalDateString(), []);
  const todayDayOfWeekIndex = useMemo(() => {
    const d = new Date().getDay();
    return (d + 6) % 7;
  }, []);

  // Compute 52-week grid for this specific habit based on viewMode
  const { weeks, monthLabels, totalHabitDays, habitStreak } = useMemo(() => {
    const today = new Date();
    const todayYear = today.getFullYear();
    const todayMonth = today.getMonth();
    const todayDate = today.getDate();

    const todayStartOfDay = new Date(todayYear, todayMonth, todayDate, 0, 0, 0, 0);
    const todayEndOfDay = new Date(todayYear, todayMonth, todayDate, 23, 59, 59, 999);

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
      gridStartDate = new Date(
        currentWeekMonday.getFullYear(),
        currentWeekMonday.getMonth(),
        currentWeekMonday.getDate() - 51 * 7,
        0, 0, 0, 0
      );
    }

    const generatedWeeks = [];
    const months = [];
    let lastLabeledMonth = -1;
    let lastLabeledWeekIndex = -999;
    let activeCounter = 0;

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

        // Check if this specific habit was completed on dateStr
        let isHabitCompleted = false;
        if (isToday && isTodayDone) {
          isHabitCompleted = true;
        } else if (entry) {
          const hasId = entry.completedHabitIds && entry.completedHabitIds.includes(habitId);
          const hasTitle = entry.completedHabits && entry.completedHabits.some((hTitle) => {
            const hLower = (hTitle || '').toLowerCase();
            if (habitId === 'core_exercise') return hLower.includes('exercise') || hLower.includes('workout');
            if (habitId === 'core_water') return hLower.includes('water');
            if (habitId === 'core_reading') return hLower.includes('read') || hLower.includes('book');
            if (habitId === 'core_sleep') return hLower.includes('sleep') || hLower.includes('wake');
            return false;
          });
          if (hasId || hasTitle) {
            isHabitCompleted = true;
          }
        }

        if (isHabitCompleted) {
          activeCounter++;
        }

        weekDays.push({
          dateStr,
          date: cellDate,
          isToday,
          isFuture,
          isCompleted: isHabitCompleted,
          dayIndex: dayOffset + 1
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
              // Replace cramped month with the new month label
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

    // Calculate current habit streak leading up to today
    let streakCount = 0;
    const testDate = new Date(todayYear, todayMonth, todayDate, 0, 0, 0, 0);

    // If today is completed, count starting from today, else starting yesterday
    if (!isTodayDone) {
      testDate.setDate(testDate.getDate() - 1);
    }

    for (let i = 0; i < 365; i++) {
      const dStr = getLocalDateString(testDate);
      const entry = history[dStr];
      const done = Boolean(
        (dStr === todayStr && isTodayDone) ||
        (entry?.completedHabitIds && entry.completedHabitIds.includes(habitId)) ||
        (entry?.completedHabits && entry.completedHabits.some((hTitle) => {
          const hLower = (hTitle || '').toLowerCase();
          if (habitId === 'core_exercise') return hLower.includes('exercise');
          if (habitId === 'core_water') return hLower.includes('water');
          if (habitId === 'core_reading') return hLower.includes('read');
          if (habitId === 'core_sleep') return hLower.includes('sleep');
          return false;
        }))
      );

      if (done) {
        streakCount++;
        testDate.setDate(testDate.getDate() - 1);
      } else {
        break;
      }
    }

    return {
      weeks: generatedWeeks,
      monthLabels: months,
      totalHabitDays: activeCounter,
      habitStreak: streakCount
    };
  }, [history, habitId, isTodayDone, todayStr, startDate, viewMode]);

  // Auto-scroll to today so today's column is guaranteed visible in viewport
  const scrollToToday = useCallback(() => {
    if (!scrollRef.current) return;
    const todayCol = weeks.findIndex((w) => w.some((d) => d.isToday));
    if (todayCol >= 0) {
      const xOffset = Math.max(0, (todayCol - 1) * (CELL_SIZE + CELL_GAP));
      scrollRef.current.scrollTo({ x: xOffset, animated: true });
    }
  }, [weeks]);

  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToToday();
    }, 150);
    return () => clearTimeout(timer);
  }, [viewMode, scrollToToday]);

  const getCellColor = (day) => {
    if (day.isCompleted) {
      return accentColor;
    }
    if (day.isToday) {
      return 'rgba(255, 255, 255, 0.08)';
    }
    if (day.isFuture) {
      return '#03060d';
    }
    return '#090f1d';
  };

  return (
    <View style={[styles.container, { borderColor: `${accentColor}33` }]}>
      {/* Habit Grid Header - 2-Row Clean Structured Layout (Zero Overlap Guaranteed) */}
      <View style={styles.header}>
        {/* Row 1: Habit Icon, Title & CORE Pill (Left) and Streak Badge (Right) */}
        <View style={styles.headerTopRow}>
          <View style={styles.titleGroup}>
            <View style={[styles.iconWrap, { backgroundColor: `${accentColor}20`, borderColor: `${accentColor}55` }]}>
              <Ionicons name={icon} size={15} color={accentColor} />
            </View>
            <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
              {title}
            </Text>
            <View style={[styles.coreTag, { borderColor: `${accentColor}44`, backgroundColor: `${accentColor}15` }]}>
              <Text style={[styles.coreTagText, { color: accentColor }]}>CORE</Text>
            </View>
          </View>

          {/* Streak Badge */}
          <View style={[styles.streakBadge, { borderColor: `${accentColor}66`, backgroundColor: `${accentColor}18` }]}>
            <Text style={[styles.streakNumber, { color: accentColor }]}>{habitStreak}d</Text>
            <Text style={styles.streakLabel}>STREAK</Text>
          </View>
        </View>

        {/* Row 2: Consistency Subtitle, Today Done Status (Left) & Today Jump Button (Right) */}
        <View style={styles.headerBottomRow}>
          <View style={styles.metaRow}>
            <Text style={styles.subtitle} numberOfLines={1}>
              {totalHabitDays}d logged in 365d • {Math.round((totalHabitDays / 365) * 100)}%
            </Text>
            {isTodayDone && (
              <View style={[styles.doneTag, { backgroundColor: `${accentColor}25`, borderColor: accentColor }]}>
                <Ionicons name="checkmark-sharp" size={10} color={accentColor} />
                <Text style={[styles.doneTagText, { color: accentColor }]}>TODAY DONE</Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[styles.todayJumpBtn, { borderColor: `${accentColor}44` }]}
            onPress={scrollToToday}
            activeOpacity={0.7}
          >
            <Ionicons name="navigate-circle-outline" size={12} color={accentColor} />
            <Text style={[styles.todayJumpText, { color: accentColor }]}>Today</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Grid Container */}
      <View style={styles.gridWrapper}>
        {/* Day of Week Labels */}
        <View style={styles.dayLabelsCol}>
          <View style={styles.monthHeaderSpacer} />
          <View style={styles.dayLabelsList}>
            {DAYS_OF_WEEK.map((dayName, idx) => {
              const isTodayDay = idx === todayDayOfWeekIndex;
              return (
                <View key={idx} style={styles.dayLabelItem}>
                  <Text
                    style={[
                      styles.dayLabelText,
                      isTodayDay && { color: accentColor, fontWeight: '900' }
                    ]}
                  >
                    {dayName}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Scrollable Weeks */}
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.scrollArea}
        >
          <View>
            {/* Month Labels */}
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
                          day.isCompleted && {
                            shadowColor: accentColor,
                            shadowOffset: { width: 0, height: 0 },
                            shadowOpacity: 0.9,
                            shadowRadius: 4,
                            elevation: 4,
                            borderWidth: 1,
                            borderColor: '#ffffff66'
                          },
                          day.isToday && [
                            styles.cellToday,
                            {
                              borderColor: day.isCompleted ? '#ffffff' : accentColor,
                              borderWidth: day.isCompleted ? 1.5 : 2
                            }
                          ],
                          isSelected && styles.cellSelected
                        ]}
                        onPress={() => setSelectedDay(day)}
                        activeOpacity={0.7}
                      >
                        {day.isCompleted && (
                          <Ionicons
                            name="checkmark"
                            size={CELL_SIZE >= 12 ? 8.5 : 7.5}
                            color="#ffffff"
                            style={{ alignSelf: 'center', marginTop: 1 }}
                          />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Selected Day Inspector */}
      {selectedDay && (
        <View style={styles.inspectorCard}>
          <View style={styles.inspectorHeader}>
            <View style={styles.inspectorTitleRow}>
              <Text style={styles.inspectorDate}>{selectedDay.dateStr}</Text>
              {selectedDay.isToday && (
                <View style={[styles.todayTag, { backgroundColor: `${accentColor}25` }]}>
                  <Text style={[styles.todayTagText, { color: accentColor }]}>TODAY 📍</Text>
                </View>
              )}
            </View>
            <TouchableOpacity onPress={() => setSelectedDay(null)}>
              <Text style={styles.inspectorClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.inspectorStatus, { color: selectedDay.isCompleted ? accentColor : THEME.textMuted }]}>
            {selectedDay.isCompleted
              ? `✓ Completed! Logged towards 365-day ${title} discipline.`
              : selectedDay.isFuture
              ? 'Future challenge target date.'
              : 'Not logged on this date.'}
          </Text>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: THEME.bgCard,
    borderRadius: 18,
    padding: 14,
    marginHorizontal: 12,
    marginVertical: 7,
    borderWidth: 1.2,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3
  },
  header: {
    marginBottom: 10,
    gap: 7
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flex: 1,
    minWidth: 0
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  title: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.textWhite,
    flexShrink: 1
  },
  coreTag: {
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 5,
    borderWidth: 1,
    flexShrink: 0
  },
  coreTagText: {
    fontSize: 8.5,
    fontWeight: '900',
    letterSpacing: 0.5
  },
  streakBadge: {
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9,
    borderWidth: 1,
    flexShrink: 0
  },
  streakNumber: {
    fontSize: 12.5,
    fontWeight: '900',
    fontFamily: 'monospace'
  },
  streakLabel: {
    fontSize: 7,
    fontWeight: '800',
    color: THEME.textMuted,
    marginTop: 0.5
  },
  headerBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0,
    flexWrap: 'wrap'
  },
  subtitle: {
    fontSize: 10,
    color: THEME.textMuted
  },
  doneTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2.5,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 5,
    borderWidth: 1,
    flexShrink: 0
  },
  doneTagText: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.4
  },
  todayJumpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 7,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    flexShrink: 0
  },
  todayJumpText: {
    fontSize: 9.5,
    fontWeight: '800'
  },
  gridWrapper: {
    flexDirection: 'row'
  },
  dayLabelsCol: {
    width: 14,
    marginRight: 4
  },
  monthHeaderSpacer: {
    height: 16
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
    fontSize: 7.5,
    fontWeight: '700',
    color: '#64748b',
    textAlign: 'center'
  },
  scrollArea: {
    flex: 1
  },
  monthsRow: {
    height: 16,
    position: 'relative'
  },
  monthText: {
    position: 'absolute',
    fontSize: 9,
    color: '#64748b',
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
    borderRadius: 2.5,
    justifyContent: 'center',
    alignItems: 'center'
  },
  cellToday: {
    borderWidth: 1.5
  },
  cellSelected: {
    borderWidth: 1.8,
    borderColor: '#ffffff'
  },
  inspectorCard: {
    backgroundColor: '#050912',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: THEME.borderMedium
  },
  inspectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  inspectorTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  inspectorDate: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700'
  },
  todayTag: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4
  },
  todayTagText: {
    fontSize: 9,
    fontWeight: '800'
  },
  inspectorClose: {
    color: THEME.textMuted,
    fontSize: 12,
    paddingHorizontal: 4
  },
  inspectorStatus: {
    fontSize: 11.5,
    marginTop: 2
  }
});
