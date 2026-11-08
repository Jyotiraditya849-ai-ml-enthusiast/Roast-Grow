import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { getLocalDateString, getFocusStatsForDate, saveFocusStatsForDate, addFocusStatsForDate } from '../storage/asyncStorage';
import { showGlobalCyberNotification } from './NotificationContext';
import { THEME } from '../theme';

const STORAGE_KEY_ACTIVE_TIMER = '@streak_focus_active_timer';

export const PRESETS = [
  { id: 'pomodoro', label: '25m Pomodoro', minutes: 25, type: 'focus', color: THEME.crimson },
  { id: 'shortBreak', label: '5m Break', minutes: 5, type: 'break', color: THEME.blueLight },
  { id: 'deepWork', label: '45m Deep Work', minutes: 45, type: 'focus', color: THEME.marigold },
  { id: 'longBreak', label: '15m Long Break', minutes: 15, type: 'break', color: THEME.blue }
];

const FocusTimerContext = createContext(null);

export const FocusTimerProvider = ({ children }) => {
  const [mode, setMode] = useState('pomodoro');
  const [initialSeconds, setInitialSeconds] = useState(25 * 60);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [targetEndTime, setTargetEndTime] = useState(null);

  // Daily focus stats
  const [todayMinutes, setTodayMinutes] = useState(0);
  const [todaySessions, setTodaySessions] = useState(0);

  const timerRef = useRef(null);

  // Load today's cumulative stats
  const loadDailyStats = useCallback(async () => {
    try {
      const stats = await getFocusStatsForDate();
      setTodayMinutes(stats.minutes || 0);
      setTodaySessions(stats.sessions || 0);
    } catch (e) {
      // Ignore
    }
  }, []);

  // Central method to safely accrue focus minutes into storage and state
  const creditFocusTime = useCallback(async (minutesToAdd, isSprintComplete = false, targetMode = 'pomodoro') => {
    if (minutesToAdd <= 0) return;
    const isFocus = targetMode === 'pomodoro' || targetMode === 'deepWork';
    if (!isFocus) return;

    try {
      const today = getLocalDateString();
      const updated = await addFocusStatsForDate(minutesToAdd, isSprintComplete, today);
      setTodayMinutes(updated.minutes);
      setTodaySessions(updated.sessions);

      showGlobalCyberNotification({
        type: 'success',
        title: isSprintComplete ? 'Focus Sprint Complete! 🎯' : 'Focus Telemetry Saved! ⏱️',
        message: `+${minutesToAdd}m saved to today's focus telemetry. (${updated.minutes}m total today, ${updated.sessions} sprints).`,
        hudTag: '[FOCUS_CORE // TELEMETRY_SYNCED]'
      });
      return updated;
    } catch (e) {
      console.warn('Failed to credit focus time:', e);
    }
  }, []);

  // Restore active timer state from storage on app boot
  useEffect(() => {
    loadDailyStats();

    const restoreTimer = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY_ACTIVE_TIMER);
        if (!raw) return;
        const saved = JSON.parse(raw);
        if (!saved) return;

        const savedMode = saved.mode || 'pomodoro';
        const savedInitSecs = saved.initialSeconds || 25 * 60;
        setMode(savedMode);
        setInitialSeconds(savedInitSecs);

        if (saved.isRunning && saved.targetEndTime) {
          const now = Date.now();
          const remaining = Math.max(0, Math.ceil((saved.targetEndTime - now) / 1000));
          if (remaining > 0) {
            setSecondsLeft(remaining);
            setTargetEndTime(saved.targetEndTime);
            setIsRunning(true);
          } else {
            // Timer expired while app/tab was away
            setSecondsLeft(0);
            setIsRunning(false);
            setTargetEndTime(null);
            // Session completed in background
            await handleSessionCompleteInternal(savedMode, savedInitSecs);
          }
        } else {
          setSecondsLeft(saved.secondsLeft !== undefined ? saved.secondsLeft : savedInitSecs);
          setIsRunning(false);
          setTargetEndTime(null);
        }
      } catch (e) {
        console.warn('Failed to restore active focus timer:', e);
      }
    };

    restoreTimer();
  }, [loadDailyStats]);

  // Persist timer state to AsyncStorage whenever it changes meaningfully
  const persistTimer = useCallback(async (timerState) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY_ACTIVE_TIMER, JSON.stringify(timerState));
    } catch (e) {
      // Ignore
    }
  }, []);

  // Session completion handler
  const handleSessionCompleteInternal = useCallback(async (completedMode, completedInitSecs) => {
    const isFocus = completedMode === 'pomodoro' || completedMode === 'deepWork';
    const minutesAdded = Math.round(completedInitSecs / 60);

    if (Platform.OS !== 'web') {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (e) {}
    }

    if (isFocus) {
      await creditFocusTime(minutesAdded, true, completedMode);
    } else {
      showGlobalCyberNotification({
        type: 'info',
        title: 'Break Concluded! ⚡',
        message: 'Mind refreshed. Time to initiate the next focus sprint!',
        hudTag: '[FOCUS_CORE // BREAK_FINISHED]'
      });
    }

    setIsRunning(false);
    setTargetEndTime(null);
    setSecondsLeft(completedInitSecs);

    await AsyncStorage.setItem(
      STORAGE_KEY_ACTIVE_TIMER,
      JSON.stringify({
        mode: completedMode,
        initialSeconds: completedInitSecs,
        secondsLeft: completedInitSecs,
        isRunning: false,
        targetEndTime: null
      })
    );
  }, [creditFocusTime]);

  // Primary High-Precision Timer Loop (Timestamp-based: Immune to tab switches & JS throttling)
  useEffect(() => {
    if (isRunning && targetEndTime) {
      timerRef.current = setInterval(() => {
        const now = Date.now();
        const diff = Math.max(0, Math.ceil((targetEndTime - now) / 1000));
        setSecondsLeft(diff);

        if (diff <= 0) {
          clearInterval(timerRef.current);
          handleSessionCompleteInternal(mode, initialSeconds);
        }
      }, 500);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, targetEndTime, mode, initialSeconds, handleSessionCompleteInternal]);

  // Mode Selection
  const selectPreset = useCallback(async (preset) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.selectionAsync();
      } catch (e) {}
    }

    // If previous session had elapsed focus time, credit it before switching!
    const isFocus = mode === 'pomodoro' || mode === 'deepWork';
    const elapsedSeconds = Math.max(0, initialSeconds - secondsLeft);
    const elapsedMinutes = Math.floor(elapsedSeconds / 60);
    if (isFocus && elapsedMinutes >= 1) {
      const countsAsSession = elapsedMinutes >= 5;
      await creditFocusTime(elapsedMinutes, countsAsSession, mode);
    }

    const secs = preset.minutes * 60;
    setMode(preset.id);
    setInitialSeconds(secs);
    setSecondsLeft(secs);
    setIsRunning(false);
    setTargetEndTime(null);

    persistTimer({
      mode: preset.id,
      initialSeconds: secs,
      secondsLeft: secs,
      isRunning: false,
      targetEndTime: null
    });
  }, [mode, initialSeconds, secondsLeft, persistTimer, creditFocusTime]);

  // Stepper adjustments (+/- 5m)
  const adjustMinutes = useCallback((deltaMinutes) => {
    if (isRunning) return;
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {}
    }
    setInitialSeconds((prevInit) => {
      const newSecs = Math.max(60, prevInit + deltaMinutes * 60);
      setSecondsLeft(newSecs);
      persistTimer({
        mode,
        initialSeconds: newSecs,
        secondsLeft: newSecs,
        isRunning: false,
        targetEndTime: null
      });
      return newSecs;
    });
  }, [isRunning, mode, persistTimer]);

  // Play / Pause Toggle
  const togglePlay = useCallback(() => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (e) {}
    }

    if (!isRunning) {
      // Start or Resume
      const newTargetEndTime = Date.now() + secondsLeft * 1000;
      setTargetEndTime(newTargetEndTime);
      setIsRunning(true);

      persistTimer({
        mode,
        initialSeconds,
        secondsLeft,
        isRunning: true,
        targetEndTime: newTargetEndTime
      });
    } else {
      // Pause
      setIsRunning(false);
      setTargetEndTime(null);

      persistTimer({
        mode,
        initialSeconds,
        secondsLeft,
        isRunning: false,
        targetEndTime: null
      });
    }
  }, [isRunning, secondsLeft, mode, initialSeconds, persistTimer]);

  // Reset Timer to current preset with automatic credit for work done
  const handleReset = useCallback(async () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {}
    }

    // Calculate elapsed focus work
    const isFocus = mode === 'pomodoro' || mode === 'deepWork';
    const elapsedSeconds = Math.max(0, initialSeconds - secondsLeft);
    const elapsedMinutes = Math.floor(elapsedSeconds / 60);

    if (isFocus && elapsedMinutes >= 1) {
      // Credit accumulated partial minutes into today's focus stats
      const countsAsSession = elapsedMinutes >= 5;
      await creditFocusTime(elapsedMinutes, countsAsSession, mode);
    }

    setIsRunning(false);
    setTargetEndTime(null);
    setSecondsLeft(initialSeconds);

    persistTimer({
      mode,
      initialSeconds,
      secondsLeft: initialSeconds,
      isRunning: false,
      targetEndTime: null
    });
  }, [mode, initialSeconds, secondsLeft, persistTimer, creditFocusTime]);

  // Format time helper MM:SS
  const formatTime = useCallback((secs) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(remainingSecs).padStart(2, '0')}`;
  }, []);

  return (
    <FocusTimerContext.Provider
      value={{
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
      }}
    >
      {children}
    </FocusTimerContext.Provider>
  );
};

export const useFocusTimer = () => {
  const ctx = useContext(FocusTimerContext);
  if (!ctx) {
    throw new Error('useFocusTimer must be used within a FocusTimerProvider');
  }
  return ctx;
};

