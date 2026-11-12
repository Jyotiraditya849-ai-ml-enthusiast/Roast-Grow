import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Dimensions
} from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { THEME } from '../../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Helper to calculate SVG arc path in degrees
const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians)
  };
};

const describeArc = (x, y, radius, startAngle, endAngle) => {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return [
    'M', start.x, start.y,
    'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y
  ].join(' ');
};

export const StreakHorseshoeCard = React.memo(({
  challenge,
  freezeCoins = 0,
  aiMessage = '',
  aiType = 'roast',
  eligibility,
  isAlreadyCheckedIn,
  isCheckingIn,
  onCheckIn,
  onNavigateToCreate,
  onOpenVault
}) => {
  const currentStreak = challenge?.currentStreak || 0;
  const targetDays = challenge?.targetDays || 100;
  const isBroken = challenge?.isBroken || currentStreak === 0;

  // COLOR THEME: Deep Pure Blood Red when streak is zero!
  // When active: Obsidian Black, Rich Marigold Amber & Deep Cyber Blue with Deep Neon Crimson!
  const isPureRed = currentStreak === 0 || isBroken;

  // Arc Gauge Geometry (Horseshoe: 260 degree sweep open at bottom)
  const size = 230;
  const strokeWidth = 14;
  const radius = (size - strokeWidth * 2) / 2;
  const centerX = size / 2;
  const centerY = size / 2;
  const startAngle = 140; // bottom-left
  const endAngle = 400;   // bottom-right (260 deg sweep)

  // Background track path
  const bgPath = useMemo(() => {
    return describeArc(centerX, centerY, radius, startAngle, endAngle);
  }, [centerX, centerY, radius, startAngle, endAngle]);

  // Active progress path
  const progressRatio = Math.min(1.0, currentStreak / Math.max(1, targetDays));
  const activeSweep = isPureRed ? 260 : Math.max(8, progressRatio * 260);
  const activeEndAngle = startAngle + activeSweep;

  const activePath = useMemo(() => {
    return describeArc(centerX, centerY, radius, startAngle, activeEndAngle);
  }, [centerX, centerY, radius, startAngle, activeEndAngle]);

  // Freeze Coin Cycle Progress (1 coin per 10 days)
  const cycleProgress = currentStreak % 10;
  const daysToCoin = 10 - cycleProgress;
  const coinRatio = cycleProgress / 10;

  const completedHabits = eligibility?.completedHabitsCount || 0;
  const isEligible = Boolean(eligibility?.isEligible);

  return (
    <View
      style={[
        styles.cardContainer,
        {
          borderColor: isPureRed ? 'rgba(255, 0, 63, 0.45)' : THEME.borderMedium,
          shadowColor: isPureRed ? THEME.crimsonPureRed : THEME.marigold
        }
      ]}
    >
      {/* 1. AI Roast / Motivation Top Banner */}
      <View
        style={[
          styles.aiBanner,
          {
            backgroundColor: isPureRed ? '#160407' : '#081120',
            borderColor: isPureRed ? 'rgba(255, 0, 63, 0.6)' : THEME.blueBorder
          }
        ]}
      >
        <View style={styles.aiHeaderRow}>
          <Text style={styles.aiIcon}>{isPureRed ? '🔥💀' : '⚡👑'}</Text>
          <Text style={[styles.aiHeaderTitle, { color: isPureRed ? THEME.crimsonPureRed : THEME.marigoldLight }]}>
            {isPureRed ? 'AI Roast:' : 'AI Discipline Directive:'}
          </Text>
        </View>

        <Text style={styles.aiBodyText}>
          {aiMessage ||
            (isPureRed
              ? 'Back again, 0d? Pitiful. You could not even manage a single day. Another goal, another complete and utter failure for the pile. The world is watching you give up... again.'
              : 'Discipline locked. Stay sharp, push your micro-habits, and conquer today.')}
        </Text>
      </View>

      {/* 2. Center Horseshoe Arc Gauge */}
      <View style={styles.gaugeContainer}>
        <Svg width={size} height={size - 20} style={styles.svgHorseshoe}>
          <Defs>
            <LinearGradient id="deepBloodRedGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#ff003f" />
              <Stop offset="50%" stopColor="#be123c" />
              <Stop offset="100%" stopColor="#881337" />
            </LinearGradient>
            <LinearGradient id="activeMarigoldRubyBlueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#0284c7" />
              <Stop offset="45%" stopColor="#f59e0b" />
              <Stop offset="100%" stopColor="#e11d48" />
            </LinearGradient>
          </Defs>

          {/* Background Track Arc */}
          <Path
            d={bgPath}
            stroke={isPureRed ? '#1a060a' : '#0d1626'}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            fill="none"
          />

          {/* Active Progress Arc */}
          <Path
            d={activePath}
            stroke={isPureRed ? 'url(#deepBloodRedGrad)' : 'url(#activeMarigoldRubyBlueGrad)'}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            fill="none"
          />
        </Svg>

        {/* Center Contents inside Horseshoe */}
        <View style={styles.centerTextOverlay}>
          {/* Top Skull or Flame Icon */}
          <View style={styles.centerIconWrap}>
            {isPureRed ? (
              <FontAwesome5 name="skull" size={26} color={THEME.crimsonPureRed} />
            ) : (
              <Ionicons name="flame" size={32} color={THEME.marigold} />
            )}
          </View>

          {/* Big Number: e.g. 0d (Gold Marigold when active, Pure Blood Red when 0d) */}
          <Text
            style={[
              styles.streakNumberText,
              { color: isPureRed ? THEME.crimsonPureRed : THEME.marigoldLight }
            ]}
          >
            {currentStreak}d
          </Text>

          {/* Label: Streak Reset / Active Streak */}
          <Text
            style={[
              styles.streakStatusLabel,
              { color: isPureRed ? THEME.crimsonPureRed : THEME.marigold }
            ]}
          >
            {isPureRed ? 'Streak Reset' : 'Active Streak'}
          </Text>
        </View>

        {/* Left & Right Bottom Wings */}
        <View style={styles.wingsRow}>
          {/* Left Wing: Skull or Flame */}
          <View style={[styles.wingPillLeft, isPureRed && styles.wingPillRed]}>
            {isPureRed ? (
              <FontAwesome5 name="skull" size={16} color={THEME.crimsonPureRed} />
            ) : (
              <Ionicons name="flame" size={18} color={THEME.marigold} />
            )}
          </View>

          {/* Right Wing: Target 100d */}
          <View style={[styles.wingPillRight, isPureRed && styles.wingPillRed]}>
            <Text style={styles.targetLabel}>Target:</Text>
            <Text style={[styles.targetValue, { color: isPureRed ? THEME.crimsonPureRed : THEME.textWhite }]}>
              {targetDays}d
            </Text>
          </View>
        </View>
      </View>

      {/* 3. Freeze Coin Progress Pill (Image 1 replica) */}
      <View style={styles.freezePillCard}>
        <View style={styles.freezeInfoRow}>
          <View style={styles.freezeLeft}>
            <Text style={styles.freezeTitle}>
              Next Freeze Coin: <Text style={styles.coinEmoji}>🪙</Text>{' '}
              <Text style={{ color: THEME.marigoldLight, fontWeight: '800' }}>
                {daysToCoin} days left
              </Text>{' '}
              <Text style={{ color: THEME.textMuted }}>({cycleProgress}/10)</Text>
            </Text>
          </View>

          <TouchableOpacity
            style={styles.shieldCountBadge}
            onPress={onOpenVault}
            activeOpacity={0.7}
          >
            <FontAwesome5 name="shield-alt" size={12} color={THEME.blueLight} />
            <Text style={styles.shieldCountText}>{freezeCoins}</Text>
          </TouchableOpacity>
        </View>

        {/* Laser Progress Bar */}
        <View style={styles.freezeTrack}>
          <View
            style={[
              styles.freezeFill,
              {
                width: `${Math.max(4, coinRatio * 100)}%`,
                backgroundColor: isPureRed ? THEME.crimsonPureRed : THEME.marigold
              }
            ]}
          />
        </View>
      </View>

      {/* 4. Streak Lock Status & Eligibility Indicator */}
      <View style={styles.lockStatusSection}>
        <View style={styles.lockHeaderRow}>
          <Ionicons
            name={
              isAlreadyCheckedIn
                ? 'checkmark-circle'
                : isEligible
                ? 'lock-open'
                : 'lock-closed'
            }
            size={16}
            color={isAlreadyCheckedIn ? THEME.success : isEligible ? THEME.blueLight : THEME.crimsonPureRed}
          />
          <Text
            style={[
              styles.lockStatusTitle,
              {
                color: isAlreadyCheckedIn
                  ? THEME.success
                  : isEligible
                  ? THEME.blueLight
                  : THEME.crimsonPureRed
              }
            ]}
          >
            {isAlreadyCheckedIn
              ? "TODAY'S STREAK SECURED 🔥"
              : isEligible
              ? 'READY TO LOCK IN STREAK ✨'
              : 'STREAK LOCKED 🔒'}
          </Text>
        </View>

        <Text style={styles.lockCriteriaSubtext}>
          Supreme Goal + 3 Habits to Lock ({completedHabits}/3) ✦
        </Text>

        {/* Action Button: Check-in if eligible, or shortcut to Create Tab */}
        <TouchableOpacity
          style={[
            styles.checkInActionBtn,
            isAlreadyCheckedIn && styles.actionBtnDone,
            !isAlreadyCheckedIn && isEligible && styles.actionBtnReady,
            !isAlreadyCheckedIn && !isEligible && styles.actionBtnPending
          ]}
          onPress={isEligible || isAlreadyCheckedIn ? onCheckIn : onNavigateToCreate}
          disabled={isCheckingIn}
          activeOpacity={0.8}
        >
          <Ionicons
            name={
              isAlreadyCheckedIn
                ? 'checkmark-done-circle'
                : isEligible
                ? 'flame'
                : 'add-circle'
            }
            size={18}
            color="#ffffff"
          />
          <Text style={styles.checkInActionText}>
            {isAlreadyCheckedIn
              ? `Day ${currentStreak} Checked In ✓`
              : isEligible
              ? 'Lock In Streak Now 🔥'
              : 'Complete Habits & Mission in (+) Tab →'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: THEME.bgCard,
    borderRadius: 24,
    borderWidth: 1.5,
    marginHorizontal: 12,
    marginVertical: 8,
    padding: 16,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
    overflow: 'hidden'
  },
  aiBanner: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14
  },
  aiHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6
  },
  aiIcon: {
    fontSize: 16
  },
  aiHeaderTitle: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace'
  },
  aiBodyText: {
    color: THEME.textSecondary,
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: '600'
  },
  gaugeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 4
  },
  svgHorseshoe: {
    transform: [{ rotateZ: '0deg' }]
  },
  centerTextOverlay: {
    position: 'absolute',
    top: 45,
    alignItems: 'center',
    justifyContent: 'center'
  },
  centerIconWrap: {
    marginBottom: 2
  },
  streakNumberText: {
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: 1.5,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace'
  },
  streakStatusLabel: {
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace'
  },
  wingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 16,
    marginTop: -8,
    marginBottom: 10
  },
  wingPillLeft: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: THEME.bgInput,
    borderWidth: 1,
    borderColor: THEME.borderMedium,
    alignItems: 'center',
    justifyContent: 'center'
  },
  wingPillRight: {
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 14,
    backgroundColor: THEME.bgInput,
    borderWidth: 1,
    borderColor: THEME.borderMedium,
    alignItems: 'center',
    justifyContent: 'center'
  },
  wingPillRed: {
    borderColor: 'rgba(255, 0, 63, 0.4)',
    backgroundColor: 'rgba(255, 0, 63, 0.08)'
  },
  targetLabel: {
    color: THEME.textMuted,
    fontSize: 9.5,
    fontWeight: '800',
    textTransform: 'uppercase',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace'
  },
  targetValue: {
    fontSize: 13,
    fontWeight: '900'
  },
  freezePillCard: {
    backgroundColor: THEME.bgInput,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: THEME.borderMedium,
    padding: 12,
    marginTop: 6,
    marginBottom: 14
  },
  freezeInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  freezeLeft: {
    flex: 1
  },
  freezeTitle: {
    color: THEME.textSecondary,
    fontSize: 12,
    fontWeight: '600'
  },
  coinEmoji: {
    fontSize: 13
  },
  shieldCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: THEME.blueBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.blue
  },
  shieldCountText: {
    color: THEME.blueLight,
    fontSize: 12,
    fontWeight: '800'
  },
  freezeTrack: {
    width: '100%',
    height: 6,
    backgroundColor: '#0d1524',
    borderRadius: 3,
    overflow: 'hidden'
  },
  freezeFill: {
    height: '100%',
    borderRadius: 3
  },
  lockStatusSection: {
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: THEME.borderSubtle,
    paddingTop: 12
  },
  lockHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4
  },
  lockStatusTitle: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace'
  },
  lockCriteriaSubtext: {
    color: THEME.textMuted,
    fontSize: 11.5,
    marginBottom: 12,
    textAlign: 'center'
  },
  checkInActionBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4
  },
  actionBtnReady: {
    backgroundColor: THEME.crimson,
    borderColor: THEME.marigold,
    borderWidth: 2,
    shadowColor: THEME.marigold
  },
  actionBtnDone: {
    backgroundColor: '#065f46',
    borderColor: THEME.success,
    shadowColor: THEME.success
  },
  actionBtnPending: {
    backgroundColor: THEME.bgCardElevated,
    borderColor: THEME.borderMedium,
    shadowColor: THEME.blue
  },
  checkInActionText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.4
  }
});

