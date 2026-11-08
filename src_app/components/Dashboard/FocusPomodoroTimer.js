import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Dimensions
} from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useFocusTimer } from '../../context/FocusTimerContext';
import { THEME } from '../../theme';

export const FocusPomodoroTimer = () => {
  const {
    mode,
    initialSeconds,
    secondsLeft,
    isRunning,
    todayMinutes,
    todaySessions,
    selectPreset,
    adjustMinutes,
    togglePlay,
    handleReset,
    formatTime,
    PRESETS
  } = useFocusTimer();

  // SVG Ring Progress Calculations
  const radius = 68;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const progressRatio = initialSeconds > 0 ? (initialSeconds - secondsLeft) / initialSeconds : 0;
  const strokeDashoffset = circumference * (1 - progressRatio);

  const isBreak = mode === 'shortBreak' || mode === 'longBreak';
  const primaryColor = isBreak ? THEME.blueLight : (mode === 'deepWork' ? THEME.marigold : THEME.crimson);

  return (
    <View style={styles.container}>
      {/* HUD Header Tag */}
      <View style={styles.headerRow}>
        <View style={styles.tagWrapper}>
          <View style={[styles.tagDot, { backgroundColor: primaryColor }]} />
          <Text style={[styles.tagText, { color: primaryColor }]} numberOfLines={1}>
            [FOCUS_ENGINE // {isBreak ? 'RECHARGE' : 'FLOW_MATRIX'}]
          </Text>
        </View>

        <View style={styles.statsBadge}>
          <MaterialCommunityIcons name="lightning-bolt" size={13} color={THEME.marigold} />
          <Text style={styles.statsBadgeText} numberOfLines={1}>
            {todayMinutes}m Today ({todaySessions} Sprints)
          </Text>
        </View>
      </View>

      <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit>Focus & Pomodoro Timer</Text>
      <Text style={styles.subtitle}>
        Eliminate distractions. Lock in uninterrupted flow state for your Supreme Mission.
      </Text>

      {/* Preset Pills */}
      <View style={styles.presetsRow}>
        {PRESETS.map((p) => {
          const isSelected = mode === p.id;
          const activeBorder = p.color;
          const activeBg = p.type === 'focus' ? THEME.crimsonBg : THEME.blueBg;

          return (
            <TouchableOpacity
              key={p.id}
              style={[
                styles.presetPill,
                isSelected && { borderColor: activeBorder, backgroundColor: activeBg, borderWidth: 1.5 }
              ]}
              onPress={() => selectPreset(p)}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.presetText,
                  isSelected && { color: activeBorder, fontWeight: '900' }
                ]}
                numberOfLines={1}
              >
                {p.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Circular Progress Gauge & Countdown */}
      <View style={styles.timerDisplayWrap}>
        <Svg width={164} height={164} style={styles.svgRing}>
          <Defs>
            <LinearGradient id="timerGradFocus" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={THEME.blue} />
              <Stop offset="50%" stopColor={THEME.marigold} />
              <Stop offset="100%" stopColor={THEME.crimson} />
            </LinearGradient>
            <LinearGradient id="timerGradBreak" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={THEME.blueDeep} />
              <Stop offset="100%" stopColor={THEME.blueLight} />
            </LinearGradient>
          </Defs>

          {/* Background Track Circle */}
          <Circle
            cx={82}
            cy={82}
            r={radius}
            stroke="#0d1626"
            strokeWidth={strokeWidth}
            fill="none"
          />

          {/* Animated Progress Circle */}
          <Circle
            cx={82}
            cy={82}
            r={radius}
            stroke={isBreak ? 'url(#timerGradBreak)' : 'url(#timerGradFocus)'}
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="none"
            transform="rotate(-90 82 82)"
          />
        </Svg>

        {/* Center Clock Digits & Label */}
        <View style={styles.timerCenterContent}>
          <Text style={[styles.timeDigits, { color: primaryColor }]} numberOfLines={1}>
            {formatTime(secondsLeft)}
          </Text>
          <Text style={styles.timerModeLabel} numberOfLines={1}>
            {isRunning ? (isBreak ? 'RECHARGING' : 'FOCUS IN SESSION') : 'PAUSED'}
          </Text>
        </View>
      </View>

      {/* Stepper Buttons for Quick +/- 5m (Enabled when paused) */}
      {!isRunning && (
        <View style={styles.stepperRow}>
          <TouchableOpacity
            style={styles.stepBtn}
            onPress={() => adjustMinutes(-5)}
            activeOpacity={0.7}
          >
            <Text style={styles.stepBtnText}>- 5 Min</Text>
          </TouchableOpacity>
          <View style={styles.stepDivider} />
          <TouchableOpacity
            style={styles.stepBtn}
            onPress={() => adjustMinutes(5)}
            activeOpacity={0.7}
          >
            <Text style={styles.stepBtnText}>+ 5 Min</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Primary Action Controls: Play / Pause & Reset */}
      <View style={styles.controlsRow}>
        {/* Reset Button */}
        <TouchableOpacity
          style={styles.resetBtn}
          onPress={handleReset}
          activeOpacity={0.7}
        >
          <Feather name="rotate-ccw" size={17} color={THEME.textMuted} />
          <Text style={styles.resetBtnText}>Reset</Text>
        </TouchableOpacity>

        {/* Big Start / Pause Button */}
        <TouchableOpacity
          style={[
            styles.playBtn,
            {
              backgroundColor: isRunning ? '#180a0e' : primaryColor,
              borderColor: primaryColor
            }
          ]}
          onPress={togglePlay}
          activeOpacity={0.85}
        >
          <Ionicons
            name={isRunning ? 'pause' : 'play'}
            size={22}
            color={isRunning ? primaryColor : (isBreak ? '#000000' : '#ffffff')}
            style={!isRunning ? { marginLeft: 2 } : null}
          />
          <Text
            style={[
              styles.playBtnText,
              { color: isRunning ? primaryColor : (isBreak ? '#000000' : '#ffffff') }
            ]}
            numberOfLines={1}
          >
            {isRunning ? 'Pause Sprint' : 'Start Focus Sprint'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Motivation Footer Tag */}
      <View style={styles.footerRow}>
        <Ionicons name="shield-checkmark" size={13} color={THEME.marigold} />
        <Text style={styles.footerText} numberOfLines={1}>
          Focus stats seamlessly sync to your Daily Analytics and 365-day Matrix.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: THEME.bgCard,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: THEME.borderMedium,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 10,
    maxWidth: '100%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
    gap: 6
  },
  tagWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexShrink: 1
  },
  tagDot: {
    width: 6,
    height: 6,
    borderRadius: 3
  },
  tagText: {
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.8,
    textTransform: 'uppercase'
  },
  statsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: THEME.bgInput,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: THEME.borderMedium,
    flexShrink: 1
  },
  statsBadgeText: {
    color: THEME.textSecondary,
    fontSize: 10.5,
    fontWeight: '700'
  },
  title: {
    color: THEME.textWhite,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.3,
    marginBottom: 3
  },
  subtitle: {
    color: THEME.textMuted,
    fontSize: 11.5,
    lineHeight: 16,
    marginBottom: 14
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14
  },
  presetPill: {
    backgroundColor: THEME.bgInput,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: THEME.borderMedium,
    minWidth: 0
  },
  presetText: {
    color: THEME.textMuted,
    fontSize: 11,
    fontWeight: '700'
  },
  timerDisplayWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
    position: 'relative'
  },
  svgRing: {
    transform: [{ rotateZ: '0deg' }]
  },
  timerCenterContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: 140
  },
  timeDigits: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center'
  },
  timerModeLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: THEME.textMuted,
    letterSpacing: 1,
    marginTop: 2,
    textTransform: 'uppercase',
    textAlign: 'center'
  },
  stepperRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.bgInput,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: THEME.borderMedium,
    alignSelf: 'center',
    marginVertical: 6,
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  stepBtn: {
    paddingHorizontal: 12,
    paddingVertical: 4
  },
  stepBtnText: {
    color: THEME.textSecondary,
    fontSize: 11.5,
    fontWeight: '700'
  },
  stepDivider: {
    width: 1,
    height: 14,
    backgroundColor: THEME.borderLight
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 10,
    flexWrap: 'wrap'
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: THEME.bgInput,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: THEME.borderMedium
  },
  resetBtnText: {
    color: THEME.textMuted,
    fontSize: 12.5,
    fontWeight: '700'
  },
  playBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    minWidth: 160,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3
  },
  playBtnText: {
    fontSize: 13.5,
    fontWeight: '900',
    letterSpacing: 0.3
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: THEME.borderSubtle
  },
  footerText: {
    color: THEME.textMuted,
    fontSize: 10.5,
    fontWeight: '600',
    flexShrink: 1
  }
});
