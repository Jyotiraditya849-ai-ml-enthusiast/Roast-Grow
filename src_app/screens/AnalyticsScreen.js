import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useStreak } from '../context/StreakContext';
import { ActivityHeatmap } from '../components/Analytics/ActivityHeatmap';
import { WeeklyFocusTimerGraph } from '../components/Analytics/WeeklyFocusTimerGraph';
import { HabitHeatmapGrid } from '../components/Analytics/HabitHeatmapGrid';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { getLocalDateString } from '../storage/asyncStorage';
import { THEME } from '../theme';

export const AnalyticsScreen = React.memo(() => {
  const { challenge, history, habits = [], freezeCoins } = useStreak();
  const [heatmapMode, setHeatmapMode] = useState('forward');

  const todayStr = getLocalDateString();
  const totalActiveDays =
    Object.values(history).filter((h) => h.completed).length +
    (!history[todayStr]?.completed && challenge?.lastActiveDate === todayStr ? 1 : 0);
  const isPureRed = challenge?.currentStreak === 0 || challenge?.isBroken;

  const isExerciseDone = Boolean(
    habits.find((h) => h.id === 'core_exercise')?.completedToday ||
    history[todayStr]?.completedHabitIds?.includes('core_exercise')
  );
  const isWaterDone = Boolean(
    habits.find((h) => h.id === 'core_water')?.completedToday ||
    history[todayStr]?.completedHabitIds?.includes('core_water')
  );
  const isReadingDone = Boolean(
    habits.find((h) => h.id === 'core_reading')?.completedToday ||
    history[todayStr]?.completedHabitIds?.includes('core_reading')
  );
  const isSleepDone = Boolean(
    habits.find((h) => h.id === 'core_sleep')?.completedToday ||
    history[todayStr]?.completedHabitIds?.includes('core_sleep')
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Metric Cards Row */}
        <View style={styles.metricsRow}>
          <View style={[styles.metricCard, styles.streakMetricCard, isPureRed && styles.streakMetricCardRed]}>
            <View style={[styles.metricIconWrap, isPureRed ? styles.iconWrapRed : styles.iconWrapCrimson]}>
              <Ionicons
                name={isPureRed ? 'skull' : 'flame'}
                size={18}
                color={isPureRed ? THEME.crimsonPureRed : THEME.crimson}
              />
            </View>
            <Text style={[styles.metricValue, { color: isPureRed ? THEME.crimsonPureRed : THEME.crimson }]}>
              {challenge.currentStreak}d
            </Text>
            <Text style={styles.metricLabel}>CURRENT STREAK</Text>
          </View>

          <View style={[styles.metricCard, styles.trophyMetricCard]}>
            <View style={[styles.metricIconWrap, styles.iconWrapMarigold]}>
              <Ionicons name="trophy" size={17} color={THEME.marigold} />
            </View>
            <Text style={[styles.metricValue, { color: THEME.marigoldLight }]}>
              {challenge.bestStreak || challenge.currentStreak}d
            </Text>
            <Text style={styles.metricLabel}>ALL-TIME BEST</Text>
          </View>

          <View style={[styles.metricCard, styles.freezeMetricCard]}>
            <View style={[styles.metricIconWrap, styles.iconWrapBlue]}>
              <FontAwesome5 name="snowflake" size={15} color={THEME.blueLight} />
            </View>
            <Text style={[styles.metricValue, { color: THEME.blueLight }]}>
              {freezeCoins}
            </Text>
            <Text style={styles.metricLabel}>FREEZE VAULT</Text>
          </View>
        </View>

        {/* 1. Main Overall 365-Day Activity Heatmap */}
        <ActivityHeatmap
          history={history}
          challenge={challenge}
          startDate={challenge?.startDate}
          viewMode={heatmapMode}
          onToggleViewMode={setHeatmapMode}
        />

        {/* 2. Weekly Focus Timer Graph Analysis (Between Main Grid & 4 Habits) */}
        <WeeklyFocusTimerGraph />

        {/* 3. Four Dedicated 365-Day Core Habit Grids */}
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionHeaderLeft}>
            <View style={styles.hudBadge}>
              <View style={styles.hudDot} />
              <Text style={styles.hudBadgeText}>CORE PILLARS // 365-DAY BREAKDOWN</Text>
            </View>
            <Text style={styles.sectionHeading}>4 Non-Negotiable Habit Grids</Text>
            <Text style={styles.sectionSub}>
              Dedicated 365-day matrices for each mandatory foundational habit.
            </Text>
          </View>

          {/* Mode Switcher Buttons */}
          <View style={styles.modeToggleRow}>
            <TouchableOpacity
              style={[styles.modeToggleBtn, heatmapMode === 'forward' && styles.modeToggleBtnActive]}
              onPress={() => setHeatmapMode('forward')}
              activeOpacity={0.7}
            >
              <Text style={[styles.modeToggleText, heatmapMode === 'forward' && styles.modeToggleTextActive]}>
                🚀 Roadmap
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modeToggleBtn, heatmapMode === 'retrospective' && styles.modeToggleBtnActive]}
              onPress={() => setHeatmapMode('retrospective')}
              activeOpacity={0.7}
            >
              <Text style={[styles.modeToggleText, heatmapMode === 'retrospective' && styles.modeToggleTextActive]}>
                ⏪ Past 365d
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <HabitHeatmapGrid
          habitId="core_exercise"
          title="Daily 1hr Exercise 🏋️"
          icon="barbell-outline"
          accentColor={THEME.crimson}
          history={history}
          isTodayDone={isExerciseDone}
          startDate={challenge?.startDate}
          viewMode={heatmapMode}
        />

        <HabitHeatmapGrid
          habitId="core_water"
          title="Daily Drink 4L Water 💧"
          icon="water-outline"
          accentColor={THEME.blueLight}
          history={history}
          isTodayDone={isWaterDone}
          startDate={challenge?.startDate}
          viewMode={heatmapMode}
        />

        <HabitHeatmapGrid
          habitId="core_reading"
          title="Read at least 10 Pages of Book 📖"
          icon="book-outline"
          accentColor={THEME.marigold}
          history={history}
          isTodayDone={isReadingDone}
          startDate={challenge?.startDate}
          viewMode={heatmapMode}
        />

        <HabitHeatmapGrid
          habitId="core_sleep"
          title="Wake Up & Sleep at Fixed Time ⏰"
          icon="alarm-outline"
          accentColor="#c084fc"
          history={history}
          isTodayDone={isSleepDone}
          startDate={challenge?.startDate}
          viewMode={heatmapMode}
        />

        {/* Performance Insights */}
        <View style={styles.insightsCard}>
          <Text style={styles.insightsTitle}>Discipline Analytics</Text>

          <View style={styles.insightItem}>
            <Text style={styles.insightLabel}>Total Challenge Check-ins</Text>
            <Text style={styles.insightVal}>{totalActiveDays} days</Text>
          </View>

          <View style={styles.insightItem}>
            <Text style={styles.insightLabel}>Challenge Target</Text>
            <Text style={styles.insightVal}>{challenge.targetDays} days</Text>
          </View>

          <View style={styles.insightItem}>
            <Text style={styles.insightLabel}>Overall Completion</Text>
            <Text style={[styles.insightVal, { color: THEME.marigoldLight }]}>
              {Math.min(100, Math.round((totalActiveDays / challenge.targetDays) * 100))}%
            </Text>
          </View>

          <View style={styles.insightItem}>
            <Text style={styles.insightLabel}>Strict Mode Integrity</Text>
            <Text style={[styles.insightVal, { color: challenge.isBroken ? THEME.crimsonPureRed : THEME.success }]}>
              {challenge.isBroken ? 'Reset (Broken)' : '100% Unbroken'}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.bgApp
  },
  scrollContent: {
    paddingVertical: 14,
    paddingBottom: 40
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    gap: 8,
    marginBottom: 8
  },
  metricCard: {
    flex: 1,
    backgroundColor: THEME.bgCard,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: THEME.borderMedium,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3
  },
  streakMetricCard: {
    borderColor: THEME.crimsonBorder,
    shadowColor: THEME.crimson
  },
  streakMetricCardRed: {
    borderColor: 'rgba(255, 0, 63, 0.5)',
    shadowColor: THEME.crimsonPureRed
  },
  trophyMetricCard: {
    borderColor: THEME.marigoldBorder,
    shadowColor: THEME.marigold
  },
  freezeMetricCard: {
    borderColor: THEME.blueBorder,
    shadowColor: THEME.blueLight
  },
  metricIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center'
  },
  iconWrapCrimson: {
    backgroundColor: THEME.crimsonBg
  },
  iconWrapRed: {
    backgroundColor: 'rgba(255, 0, 63, 0.15)'
  },
  iconWrapMarigold: {
    backgroundColor: THEME.marigoldBg
  },
  iconWrapBlue: {
    backgroundColor: THEME.blueBg
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '900',
    marginTop: 6,
    marginBottom: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace'
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: THEME.textMuted,
    letterSpacing: 0.8
  },
  insightsCard: {
    backgroundColor: THEME.bgCard,
    borderRadius: 20,
    padding: 18,
    marginHorizontal: 12,
    marginTop: 8,
    borderWidth: 1.5,
    borderColor: THEME.borderMedium,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3
  },
  insightsTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: THEME.textWhite,
    letterSpacing: -0.2,
    marginBottom: 14
  },
  insightItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderColor: THEME.borderSubtle
  },
  insightLabel: {
    color: THEME.textMuted,
    fontSize: 13,
    fontWeight: '600'
  },
  insightVal: {
    color: THEME.textWhite,
    fontSize: 13,
    fontWeight: '800'
  },
  sectionHeaderRow: {
    marginHorizontal: 16,
    marginTop: 18,
    marginBottom: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
    gap: 8
  },
  sectionHeaderLeft: {
    flex: 1,
    minWidth: 200
  },
  modeToggleRow: {
    flexDirection: 'row',
    backgroundColor: '#050912',
    padding: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: THEME.borderMedium,
    gap: 4
  },
  modeToggleBtn: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 7
  },
  modeToggleBtnActive: {
    backgroundColor: THEME.bgCard,
    borderWidth: 1,
    borderColor: THEME.borderLight
  },
  modeToggleText: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.textMuted
  },
  modeToggleTextActive: {
    color: THEME.marigoldLight,
    fontWeight: '800'
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
    backgroundColor: THEME.marigold
  },
  hudBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: THEME.textMuted
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '900',
    color: THEME.textWhite,
    letterSpacing: 0.3
  },
  sectionSub: {
    fontSize: 11,
    color: THEME.textSecondary,
    marginTop: 2
  }
});

