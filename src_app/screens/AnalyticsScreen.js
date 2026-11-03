import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useStreak } from '../context/StreakContext';
import { ActivityHeatmap } from '../components/Analytics/ActivityHeatmap';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';

export const AnalyticsScreen = () => {
  const { challenge, history, freezeCoins } = useStreak();

  const totalActiveDays = Object.values(history).filter((h) => h.completed).length;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Metric Cards Row */}
        <View style={styles.metricsRow}>
          <View style={[styles.metricCard, styles.streakMetricCard]}>
            <View style={styles.metricIconWrapOrange}>
              <Ionicons name="flame" size={20} color="#f97316" />
            </View>
            <Text style={[styles.metricValue, { color: '#f97316' }]}>{challenge.currentStreak}</Text>
            <Text style={styles.metricLabel}>CURRENT STREAK</Text>
          </View>

          <View style={[styles.metricCard, styles.trophyMetricCard]}>
            <View style={styles.metricIconWrapGold}>
              <Ionicons name="trophy" size={18} color="#eab308" />
            </View>
            <Text style={[styles.metricValue, { color: '#eab308' }]}>{challenge.bestStreak || challenge.currentStreak}</Text>
            <Text style={styles.metricLabel}>ALL-TIME BEST</Text>
          </View>

          <View style={[styles.metricCard, styles.freezeMetricCard]}>
            <View style={styles.metricIconWrapCyan}>
              <FontAwesome5 name="snowflake" size={16} color="#38bdf8" />
            </View>
            <Text style={[styles.metricValue, { color: '#38bdf8' }]}>{freezeCoins}</Text>
            <Text style={styles.metricLabel}>FREEZE VAULT</Text>
          </View>
        </View>

        {/* 365-Day Activity Heatmap */}
        <ActivityHeatmap
          history={history}
          challenge={challenge}
          startDate={challenge?.startDate}
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
            <Text style={styles.insightVal}>
              {Math.min(100, Math.round((totalActiveDays / challenge.targetDays) * 100))}%
            </Text>
          </View>

          <View style={styles.insightItem}>
            <Text style={styles.insightLabel}>Strict Mode Integrity</Text>
            <Text style={[styles.insightVal, { color: challenge.isBroken ? '#ef4444' : '#39d353' }]}>
              {challenge.isBroken ? 'Reset (Broken)' : '100% Unbroken'}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090d14'
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
    backgroundColor: '#111620',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#1e2636',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3
  },
  streakMetricCard: {
    borderColor: 'rgba(249, 115, 22, 0.4)',
    shadowColor: '#ea580c'
  },
  trophyMetricCard: {
    borderColor: 'rgba(234, 179, 8, 0.4)',
    shadowColor: '#eab308'
  },
  freezeMetricCard: {
    borderColor: 'rgba(56, 189, 248, 0.4)',
    shadowColor: '#38bdf8'
  },
  metricIconWrapOrange: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(249, 115, 22, 0.14)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  metricIconWrapGold: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(234, 179, 8, 0.14)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  metricIconWrapCyan: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(56, 189, 248, 0.14)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#f8fafc',
    marginTop: 6,
    marginBottom: 2
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.8
  },
  insightsCard: {
    backgroundColor: '#111620',
    borderRadius: 20,
    padding: 18,
    marginHorizontal: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#1e2636',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3
  },
  insightsTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#f8fafc',
    letterSpacing: -0.2,
    marginBottom: 14
  },
  insightItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderColor: '#1a2230'
  },
  insightLabel: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600'
  },
  insightVal: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '800'
  }
});

