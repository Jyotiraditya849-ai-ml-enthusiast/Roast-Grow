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
  const isConquered = currentStreak >= targetDays && targetDays > 0;

  return (
    <View
      style={[
        styles.card,
        isDead && styles.cardBroken,
        isFrozen && styles.cardFrozen,
        isConquered && styles.cardConquered
      ]}
    >
      {/* Top Bar: Title & Freeze Coin Shield */}
      <View style={styles.topRow}>
        <View style={styles.titleContainer}>
          <Text style={[styles.challengeLabel, isConquered && styles.challengeLabelConquered]}>
            {isConquered ? 'CHALLENGE CONQUERED 🏆' : 'ACTIVE CHALLENGE'}
          </Text>
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
        <View
          style={[
            styles.flameIconContainer,
            isDead && styles.flameIconContainerDead,
            isFrozen && styles.flameIconContainerFrozen,
            isConquered && styles.flameIconContainerConquered
          ]}
        >
          <Ionicons
            name={isDead ? 'skull' : isFrozen ? 'snow' : isConquered ? 'trophy' : 'flame'}
            size={42}
            color={isDead ? '#ef4444' : isFrozen ? '#38bdf8' : isConquered ? '#fbbf24' : '#f97316'}
          />
        </View>

        <View style={styles.numberContainer}>
          <View style={styles.numberRow}>
            <Text
              style={[
                styles.streakNumber,
                isDead && styles.textRed,
                isFrozen && styles.textBlue,
                isConquered && styles.textGold
              ]}
            >
              {currentStreak}
            </Text>
            <Text style={styles.streakUnit}>d</Text>
          </View>
          <View style={styles.statusPill}>
            <View
              style={[
                styles.statusDot,
                isDead && { backgroundColor: '#ef4444' },
                isFrozen && { backgroundColor: '#38bdf8' },
                isConquered && { backgroundColor: '#fbbf24' }
              ]}
            />
            <Text style={styles.streakSubtext}>
              {isDead
                ? 'STREAK RESET'
                : isFrozen
                ? 'PROTECTED (FROZEN)'
                : isConquered
                ? 'CONQUERED • EXTENDING RUN ⚡'
                : 'BURNING BRIGHT'}
            </Text>
          </View>
        </View>

        <View style={[styles.targetBadge, isConquered && styles.targetBadgeConquered]}>
          <Text style={[styles.targetBadgeLabel, isConquered && { color: '#fbbf24' }]}>
            {isConquered ? 'GOAL MET' : 'TARGET'}
          </Text>
          <Text style={[styles.targetBadgeValue, isConquered && { color: '#fbbf24' }]}>
            {isConquered ? `✓ ${targetDays}d` : `${targetDays}d`}
          </Text>
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
    backgroundColor: '#111620',
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 12,
    marginVertical: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(249, 115, 22, 0.35)',
    overflow: 'hidden',
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4
  },
  cardBroken: {
    borderColor: '#7f1d1d',
    backgroundColor: '#160b0d'
  },
  cardFrozen: {
    borderColor: 'rgba(56, 189, 248, 0.4)',
    backgroundColor: '#071824'
  },
  cardConquered: {
    borderColor: 'rgba(245, 158, 11, 0.6)',
    shadowColor: '#f59e0b',
    backgroundColor: '#141410'
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  titleContainer: {
    flex: 1,
    paddingRight: 8
  },
  challengeLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#f97316',
    letterSpacing: 1.2
  },
  challengeLabelConquered: {
    color: '#fbbf24'
  },
  challengeTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
    marginTop: 2,
    letterSpacing: -0.3
  },
  freezeCoinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderWidth: 1.5,
    borderColor: '#38bdf8',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6
  },
  freezeCoinText: {
    color: '#38bdf8',
    fontWeight: '900',
    fontSize: 14
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16
  },
  flameIconContainer: {
    width: 66,
    height: 66,
    borderRadius: 22,
    backgroundColor: 'rgba(249, 115, 22, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(249, 115, 22, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14
  },
  flameIconContainerDead: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.4)'
  },
  flameIconContainerFrozen: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderColor: 'rgba(56, 189, 248, 0.4)'
  },
  flameIconContainerConquered: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.5)'
  },
  numberContainer: {
    flex: 1
  },
  numberRow: {
    flexDirection: 'row',
    alignItems: 'baseline'
  },
  streakNumber: {
    fontSize: 54,
    fontWeight: '900',
    color: '#f97316',
    lineHeight: 58,
    letterSpacing: -1
  },
  streakUnit: {
    fontSize: 22,
    fontWeight: '900',
    color: '#f97316',
    marginLeft: 3
  },
  textRed: {
    color: '#ef4444'
  },
  textBlue: {
    color: '#38bdf8'
  },
  textGold: {
    color: '#fbbf24'
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#22c55e'
  },
  streakSubtext: {
    fontSize: 11,
    fontWeight: '800',
    color: '#8b949e',
    letterSpacing: 0.6
  },
  targetBadge: {
    backgroundColor: '#161b22',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#30363d'
  },
  targetBadgeConquered: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.5)'
  },
  targetBadgeLabel: {
    fontSize: 9.5,
    color: '#8b949e',
    fontWeight: '800',
    letterSpacing: 0.8
  },
  targetBadgeValue: {
    fontSize: 15,
    color: '#f0f6fc',
    fontWeight: '900',
    marginTop: 1
  },
  milestoneContainer: {
    backgroundColor: '#0a0e14',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1e2533'
  },
  milestoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  milestoneTitle: {
    fontSize: 12,
    color: '#8b949e',
    fontWeight: '600'
  },
  highlightText: {
    color: '#f0f6fc',
    fontWeight: '800'
  },
  milestoneCounter: {
    fontSize: 12,
    color: '#38bdf8',
    fontWeight: '900'
  },
  progressBarTrack: {
    height: 7,
    backgroundColor: '#161b22',
    borderRadius: 4,
    overflow: 'hidden'
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#38bdf8',
    borderRadius: 4
  }
});

