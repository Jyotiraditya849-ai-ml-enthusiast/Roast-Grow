import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Dimensions
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { getWeeklyFocusStats } from '../../storage/asyncStorage';
import { useFocusTimer } from '../../context/FocusTimerContext';
import { THEME } from '../../theme';

const TARGET_MINUTES = 60; // 60 min daily focus target
const MAX_BAR_HEIGHT = 110;

export const WeeklyFocusTimerGraph = React.memo(() => {
  const { todayMinutes, todaySessions } = useFocusTimer();
  const [stats, setStats] = useState({
    daysData: [],
    totalMinutes: 0,
    totalSessions: 0,
    avgMinutes: 0,
    maxMinutes: 0,
    peakDay: 'None yet'
  });
  const [selectedDay, setSelectedDay] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const data = await getWeeklyFocusStats();
      
      // Ensure today's live minutes from context are seamlessly blended if higher
      if (todayMinutes !== undefined && data.daysData) {
        const todayIdx = data.daysData.findIndex((d) => d.isToday);
        if (todayIdx !== -1 && todayMinutes > data.daysData[todayIdx].minutes) {
          data.daysData[todayIdx].minutes = todayMinutes;
          data.daysData[todayIdx].sessions = Math.max(data.daysData[todayIdx].sessions, todaySessions || 0);
          data.totalMinutes = data.daysData.reduce((sum, d) => sum + d.minutes, 0);
          data.totalSessions = data.daysData.reduce((sum, d) => sum + d.sessions, 0);
          data.avgMinutes = Math.round(data.totalMinutes / 7);
          data.maxMinutes = Math.max(...data.daysData.map((d) => d.minutes), 0);
        }
      }

      setStats(data);
      // Auto-select today
      const todayItem = data.daysData.find((d) => d.isToday);
      if (todayItem) {
        setSelectedDay(todayItem);
      }
    } catch (e) {
      console.warn('Failed to load focus graph stats:', e);
    } finally {
      setIsLoading(false);
    }
  }, [todayMinutes, todaySessions]);

  useEffect(() => {
    loadData();
  }, [loadData, todayMinutes, todaySessions]);

  const maxVal = Math.max(TARGET_MINUTES, stats.maxMinutes, 60);

  const formatHours = (mins) => {
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.hudBadge}>
            <View style={styles.hudDot} />
            <Text style={styles.hudBadgeText}>FOCUS_CORE // TELEMETRY</Text>
          </View>
          <Text style={styles.title}>Weekly Focus & Timer Analysis</Text>
          <Text style={styles.subtitle}>
            7-day breakdown of deep work sessions and pomodoro sprints
          </Text>
        </View>

        <TouchableOpacity
          style={styles.refreshIconBtn}
          onPress={loadData}
          activeOpacity={0.7}
        >
          <Ionicons name="reload-outline" size={15} color={THEME.blueLight} />
        </TouchableOpacity>
      </View>

      {/* KPI Stats Row */}
      <View style={styles.kpiRow}>
        <View style={[styles.kpiBox, styles.kpiBoxGold]}>
          <Text style={styles.kpiLabel}>TOTAL FOCUS</Text>
          <Text style={[styles.kpiValue, { color: THEME.marigoldLight }]}>
            {formatHours(stats.totalMinutes)}
          </Text>
          <Text style={styles.kpiSub}>Past 7 days</Text>
        </View>

        <View style={[styles.kpiBox, styles.kpiBoxBlue]}>
          <Text style={styles.kpiLabel}>DAILY AVG</Text>
          <Text style={[styles.kpiValue, { color: THEME.blueLight }]}>
            {stats.avgMinutes}m
          </Text>
          <Text style={styles.kpiSub}>Per active day</Text>
        </View>

        <View style={[styles.kpiBox, styles.kpiBoxCrimson]}>
          <Text style={styles.kpiLabel}>SPRINTS</Text>
          <Text style={[styles.kpiValue, { color: THEME.crimson }]}>
            {stats.totalSessions}
          </Text>
          <Text style={styles.kpiSub}>Cycles done</Text>
        </View>

        <View style={[styles.kpiBox, styles.kpiBoxEmerald]}>
          <Text style={styles.kpiLabel}>PEAK DAY</Text>
          <Text style={[styles.kpiValue, { color: THEME.success, fontSize: 13 }]} numberOfLines={1}>
            {stats.peakDay}
          </Text>
          <Text style={styles.kpiSub}>Best session</Text>
        </View>
      </View>

      {/* Bar Chart Area */}
      <View style={styles.chartWrapper}>
        {/* Target 60m Dashed Guide Line */}
        <View
          style={[
            styles.targetLineContainer,
            {
              bottom: (TARGET_MINUTES / maxVal) * MAX_BAR_HEIGHT + 28
            }
          ]}
        >
          <View style={styles.targetDashedLine} />
          <View style={styles.targetTag}>
            <Text style={styles.targetTagText}>60m Target</Text>
          </View>
        </View>

        {/* 7 Vertical Day Bars */}
        <View style={styles.barsContainer}>
          {stats.daysData.map((day, idx) => {
            const isSelected = selectedDay?.dateStr === day.dateStr;
            const barHeight = Math.max(
              8,
              Math.round((day.minutes / maxVal) * MAX_BAR_HEIGHT)
            );
            const isTargetMet = day.minutes >= TARGET_MINUTES;
            const isPeak = day.minutes === stats.maxMinutes && stats.maxMinutes > 0;

            return (
              <TouchableOpacity
                key={day.dateStr}
                style={[styles.barCol, isSelected && styles.barColSelected]}
                onPress={() => setSelectedDay(day)}
                activeOpacity={0.8}
              >
                {/* Crown on Peak Day */}
                {isPeak && (
                  <View style={styles.peakCrown}>
                    <Text style={{ fontSize: 10 }}>👑</Text>
                  </View>
                )}

                {/* Minute Label on top of bar */}
                <Text
                  style={[
                    styles.barTopText,
                    day.isToday && { color: THEME.marigoldLight, fontWeight: '900' },
                    isTargetMet && { color: THEME.success }
                  ]}
                >
                  {day.minutes > 0 ? `${day.minutes}m` : '0m'}
                </Text>

                {/* Vertical Bar Cylinder */}
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        height: barHeight,
                        backgroundColor: isTargetMet
                          ? THEME.marigold
                          : day.minutes > 0
                          ? THEME.blue
                          : '#121b2d'
                      },
                      day.isToday && styles.barFillToday,
                      isTargetMet && styles.barFillTargetMet
                    ]}
                  />
                </View>

                {/* Day of Week Label */}
                <Text
                  style={[
                    styles.barDayLabel,
                    day.isToday && styles.barDayLabelToday,
                    isSelected && { color: '#ffffff', fontWeight: '900' }
                  ]}
                >
                  {day.dayLabel}
                </Text>

                {/* Today Pill or Session Count */}
                {day.isToday ? (
                  <View style={styles.todaySmallPill}>
                    <Text style={styles.todaySmallText}>NOW</Text>
                  </View>
                ) : (
                  <Text style={styles.sessionsText}>
                    {day.sessions > 0 ? `${day.sessions}x` : '—'}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Selected Day Inspector Tooltip Card */}
      {selectedDay && (
        <View style={styles.inspectorCard}>
          <View style={styles.inspectorHeader}>
            <View style={styles.inspectorDateRow}>
              <Ionicons name="calendar-outline" size={14} color={THEME.marigold} />
              <Text style={styles.inspectorDate}>
                {selectedDay.dateStr} {selectedDay.isToday ? '(Today)' : `(${selectedDay.dayLabel})`}
              </Text>
              {selectedDay.isToday && (
                <View style={styles.todayBadge}>
                  <Text style={styles.todayBadgeText}>TODAY 📍</Text>
                </View>
              )}
            </View>
            <TouchableOpacity onPress={() => setSelectedDay(null)}>
              <Ionicons name="close" size={14} color={THEME.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={styles.inspectorBody}>
            <Text style={styles.inspectorMainStat}>
              ⏱️ <Text style={{ color: THEME.marigoldLight, fontWeight: '900' }}>{selectedDay.minutes} minutes</Text> deep focus logged across{' '}
              <Text style={{ color: THEME.blueLight, fontWeight: '800' }}>{selectedDay.sessions} sessions</Text>.
            </Text>
            <Text style={styles.inspectorEvaluation}>
              {selectedDay.minutes >= TARGET_MINUTES
                ? '✅ Daily 60-minute deep focus target fully conquered!'
                : selectedDay.minutes > 0
                ? `⚡ ${TARGET_MINUTES - selectedDay.minutes}m remaining to hit daily 60m focus target.`
                : selectedDay.isToday
                ? '🎯 Ready to start today’s first pomodoro sprint on the Home tab!'
                : 'No pomodoro sprints recorded on this day.'}
            </Text>
          </View>
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
    borderColor: 'rgba(56, 189, 248, 0.35)',
    shadowColor: THEME.blue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12
  },
  headerLeft: {
    flex: 1,
    marginRight: 8
  },
  hudBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4
  },
  hudDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: THEME.blueLight
  },
  hudBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: THEME.blueLight
  },
  title: {
    fontSize: 16,
    fontWeight: '900',
    color: THEME.textWhite,
    letterSpacing: 0.2
  },
  subtitle: {
    fontSize: 11,
    color: THEME.textSecondary,
    marginTop: 2
  },
  refreshIconBtn: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 16
  },
  kpiBox: {
    flex: 1,
    backgroundColor: '#050912',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    borderWidth: 1
  },
  kpiBoxGold: {
    borderColor: 'rgba(245, 158, 11, 0.35)'
  },
  kpiBoxBlue: {
    borderColor: 'rgba(56, 189, 248, 0.35)'
  },
  kpiBoxCrimson: {
    borderColor: 'rgba(225, 29, 72, 0.35)'
  },
  kpiBoxEmerald: {
    borderColor: 'rgba(16, 185, 129, 0.35)'
  },
  kpiLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    color: THEME.textMuted,
    letterSpacing: 0.5
  },
  kpiValue: {
    fontSize: 15,
    fontWeight: '900',
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace'
  },
  kpiSub: {
    fontSize: 8.5,
    color: '#64748b',
    marginTop: 2
  },
  chartWrapper: {
    height: 160,
    position: 'relative',
    justifyContent: 'flex-end',
    paddingBottom: 4
  },
  targetLineContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1
  },
  targetDashedLine: {
    flex: 1,
    height: 1,
    borderWidth: 0.8,
    borderColor: 'rgba(245, 158, 11, 0.5)',
    borderStyle: 'dashed'
  },
  targetTag: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 0.8,
    borderColor: THEME.marigold
  },
  targetTagText: {
    fontSize: 8,
    fontWeight: '800',
    color: THEME.marigoldLight
  },
  barsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: '100%',
    paddingHorizontal: 4
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingVertical: 4,
    borderRadius: 8
  },
  barColSelected: {
    backgroundColor: 'rgba(56, 189, 248, 0.08)'
  },
  peakCrown: {
    marginBottom: -2
  },
  barTopText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 4,
    fontFamily: 'monospace'
  },
  barTrack: {
    width: 14,
    height: MAX_BAR_HEIGHT,
    backgroundColor: '#090f1d',
    borderRadius: 7,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#182438'
  },
  barFill: {
    width: '100%',
    borderRadius: 7
  },
  barFillToday: {
    shadowColor: THEME.marigold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
    elevation: 3
  },
  barFillTargetMet: {
    shadowColor: THEME.marigold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 2
  },
  barDayLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    marginTop: 6
  },
  barDayLabelToday: {
    color: THEME.marigoldLight,
    fontWeight: '900'
  },
  todaySmallPill: {
    backgroundColor: THEME.marigold,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    marginTop: 2
  },
  todaySmallText: {
    fontSize: 7.5,
    fontWeight: '900',
    color: '#000000'
  },
  sessionsText: {
    fontSize: 8.5,
    color: '#475569',
    marginTop: 2
  },
  inspectorCard: {
    backgroundColor: '#060a14',
    borderRadius: 12,
    padding: 10,
    marginTop: 12,
    borderWidth: 1,
    borderColor: THEME.borderMedium
  },
  inspectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  inspectorDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  inspectorDate: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff'
  },
  todayBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: THEME.marigold
  },
  todayBadgeText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: THEME.marigoldLight
  },
  inspectorBody: {
    marginTop: 2
  },
  inspectorMainStat: {
    fontSize: 11.5,
    color: '#cbd5e1',
    lineHeight: 16
  },
  inspectorEvaluation: {
    fontSize: 10.5,
    color: '#94a3b8',
    marginTop: 2
  }
});

