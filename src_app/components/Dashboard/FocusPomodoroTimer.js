import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useFocusTimer } from '../../context/FocusTimerContext';
import { THEME } from '../../theme';
import { FlipClockDisplay } from './FlipClock/FlipClockDisplay';

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
    PRESETS
  } = useFocusTimer();

  const progressRatio = initialSeconds > 0 ? (initialSeconds - secondsLeft) / initialSeconds : 0;
  const isBreak = mode === 'shortBreak' || mode === 'longBreak';
  const primaryColor = isBreak ? THEME.blueLight : (mode === 'deepWork' ? THEME.marigold : THEME.crimson);

  const remainingMins = Math.floor(secondsLeft / 60);
  const remainingSecs = secondsLeft % 60;

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

      <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit>
        Focus & Pomodoro Timer
      </Text>
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

      {/* Professional Mechanical Flip Clock Display */}
      <View style={styles.timerDisplayWrap}>
        {/* Top Status Pill */}
        <View
          style={[
            styles.statusPill,
            isRunning && {
              borderColor: `${primaryColor}66`,
              backgroundColor: `${primaryColor}18`
            }
          ]}
        >
          <View
            style={[
              styles.statusLiveDot,
              { backgroundColor: isRunning ? primaryColor : '#64748b' }
            ]}
          />
          <Text
            style={[
              styles.statusText,
              isRunning && { color: primaryColor, fontWeight: '800' }
            ]}
          >
            {isRunning ? (isBreak ? 'RECHARGING BREAK' : 'FOCUS IN SESSION') : 'TIMER PAUSED'}
          </Text>
        </View>

        {/* The Animated Mechanical Flip Clock */}
        <FlipClockDisplay
          secondsLeft={secondsLeft}
          isRunning={isRunning}
          accentColor={primaryColor}
          mode={mode}
        />

        {/* Linear Progress Bar & Readout */}
        <View style={styles.progressBarWrap}>
          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${Math.round(progressRatio * 100)}%`,
                  backgroundColor: primaryColor,
                  shadowColor: primaryColor
                }
              ]}
            />
          </View>
          <View style={styles.progressTextRow}>
            <Text style={styles.progressTimeRemaining} numberOfLines={1}>
              {remainingMins}m {remainingSecs}s remaining
            </Text>
            <Text style={[styles.progressPercentText, { color: primaryColor }]} numberOfLines={1}>
              {Math.round(progressRatio * 100)}% Conquered
            </Text>
          </View>
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
          <Feather name="rotate-ccw" size={16} color={THEME.textMuted} />
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
            size={21}
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
    marginBottom: 12
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
  /* Flip Clock Display Container */
  timerDisplayWrap: {
    backgroundColor: '#070b13',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginVertical: 8,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 4
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: '#101622',
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 6
  },
  statusLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 0.8,
    textTransform: 'uppercase'
  },
  progressBarWrap: {
    width: '100%',
    maxWidth: 270,
    marginTop: 8
  },
  progressBarTrack: {
    height: 5,
    backgroundColor: '#121824',
    borderRadius: 3,
    overflow: 'hidden'
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 4
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6
  },
  progressTimeRemaining: {
    fontSize: 10.5,
    color: '#8b949e',
    fontWeight: '600'
  },
  progressPercentText: {
    fontSize: 10.5,
    fontWeight: '800'
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
