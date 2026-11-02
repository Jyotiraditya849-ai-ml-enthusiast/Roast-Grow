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
          <View style={styles.metricCard}>
            <Ionicons name="flame" size={24} color="#f97316" />
            <Text style={styles.metricValue}>{challenge.currentStreak}</Text>
            <Text style={styles.metricLabel}>CURRENT STREAK</Text>
          </View>

          <View style={styles.metricCard}>
            <Ionicons name="trophy" size={24} color="#eab308" />
            <Text style={styles.metricValue}>{challenge.bestStreak || challenge.currentStreak}</Text>
            <Text style={styles.metricLabel}>ALL-TIME BEST</Text>
          </View>

          <View style={styles.metricCard}>
            <FontAwesome5 name="snowflake" size={20} color="#38bdf8" />
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
    backgroundColor: '#0d1117'
  },
  scrollContent: {
    paddingVertical: 14,
    paddingBottom: 40
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 6
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#161b22',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#30363d'
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#f0f6fc',
    marginTop: 6,
    marginBottom: 2
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#8b949e',
    letterSpacing: 0.6
  },
  insightsCard: {
    backgroundColor: '#161b22',
    borderRadius: 18,
    padding: 18,
    marginHorizontal: 16,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#30363d'
  },
  insightsTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#f0f6fc',
    marginBottom: 14
  },
  insightItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#21262d'
  },
  insightLabel: {
    color: '#8b949e',
    fontSize: 13,
    fontWeight: '600'
  },
  insightVal: {
    color: '#f0f6fc',
    fontSize: 13,
    fontWeight: '700'
  }
});

