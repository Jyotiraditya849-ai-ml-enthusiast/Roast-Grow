import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';

export const ChallengeCard = ({
  challenge,
  freezeCoins,
  onOpenStore
}) => {
  const { currentStreak, targetDays, title, status, isBroken } = challenge;

  // Calculate progress toward the next 10-day Freeze Coin milestone
  const daysIntoMilestone = currentStreak % 10;
  const progressRatio = daysIntoMilestone / 10;
  const daysLeftForCoin = 10 - daysIntoMilestone;

  const isFrozen = status === 'FROZEN';
  const isDead = isBroken || currentStreak === 0;

  return (
    <View style={[styles.card, isDead && styles.cardBroken, isFrozen && styles.cardFrozen]}>
      {/* Top Bar: Title & Freeze Coin Shield */}
      <View style={styles.topRow}>
        <View style={styles.titleContainer}>
          <Text style={styles.challengeLabel}>ACTIVE CHALLENGE</Text>
          <Text style={styles.challengeTitle}>{title}</Text>
        </View>

        <TouchableOpacity
          style={styles.freezeCoinBadge}
          onPress={onOpenStore}
          activeOpacity={0.8}
        >
          <FontAwesome5 name="snowflake" size={14} color="#38bdf8" />
          <Text style={styles.freezeCoinText}>{freezeCoins}</Text>
        </TouchableOpacity>
      </View>

      {/* Main Counter Display */}
      <View style={styles.counterRow}>
        <View style={styles.flameIconContainer}>
          <Ionicons
            name={isDead ? 'skull' : isFrozen ? 'snow' : 'flame'}
            size={48}
            color={isDead ? '#ef4444' : isFrozen ? '#38bdf8' : '#f97316'}
          />
        </View>

        <View style={styles.numberContainer}>
          <Text style={[styles.streakNumber, isDead && styles.textRed, isFrozen && styles.textBlue]}>
            {currentStreak}
          </Text>
          <Text style={styles.streakSubtext}>
            {isDead ? 'DAYS (RESET)' : isFrozen ? 'DAYS (PROTECTED)' : 'DAY STREAK'}
          </Text>
        </View>

        <View style={styles.targetBadge}>
          <Text style={styles.targetBadgeLabel}>GOAL</Text>
          <Text style={styles.targetBadgeValue}>{targetDays}d</Text>
        </View>
      </View>

      {/* 10-Day Milestone Progress to Next Freeze Coin */}
      <View style={styles.milestoneContainer}>
        <View style={styles.milestoneHeader}>
          <Text style={styles.milestoneTitle}>
            Next Freeze Coin 🪙: <Text style={styles.highlightText}>{daysLeftForCoin} days left</Text>
          </Text>
          <Text style={styles.milestoneCounter}>{daysIntoMilestone}/10</Text>
        </View>
        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: `${progressRatio * 100}%` }]} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#161b22',
    borderRadius: 18,
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#30363d',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5
  },
  cardBroken: {
    borderColor: '#7f1d1d',
    backgroundColor: '#1a1012'
  },
  cardFrozen: {
    borderColor: '#0369a1',
    backgroundColor: '#0c1a24'
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16
  },
  titleContainer: {
    flex: 1
  },
  challengeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8b949e',
    letterSpacing: 1.2
  },
  challengeTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#f0f6fc',
    marginTop: 2
  },
  freezeCoinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0d2838',
    borderWidth: 1,
    borderColor: '#0284c7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6
  },
  freezeCoinText: {
    color: '#38bdf8',
    fontWeight: '800',
    fontSize: 14
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18
  },
  flameIconContainer: {
    marginRight: 14
  },
  numberContainer: {
    flex: 1
  },
  streakNumber: {
    fontSize: 52,
    fontWeight: '900',
    color: '#f97316',
    lineHeight: 56
  },
  textRed: {
    color: '#ef4444'
  },
  textBlue: {
    color: '#38bdf8'
  },
  streakSubtext: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8b949e',
    letterSpacing: 0.8
  },
  targetBadge: {
    backgroundColor: '#21262d',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#30363d'
  },
  targetBadgeLabel: {
    fontSize: 10,
    color: '#8b949e',
    fontWeight: '700'
  },
  targetBadgeValue: {
    fontSize: 14,
    color: '#f0f6fc',
    fontWeight: '800'
  },
  milestoneContainer: {
    backgroundColor: '#0d1117',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#21262d'
  },
  milestoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  milestoneTitle: {
    fontSize: 12,
    color: '#8b949e',
    fontWeight: '600'
  },
  highlightText: {
    color: '#e6edf3',
    fontWeight: '700'
  },
  milestoneCounter: {
    fontSize: 12,
    color: '#38bdf8',
    fontWeight: '700'
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: '#21262d',
    borderRadius: 4,
    overflow: 'hidden'
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#38bdf8',
    borderRadius: 4
  }
});

