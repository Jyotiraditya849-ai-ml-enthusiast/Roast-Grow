import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  getChallenge,
  saveChallenge,
  getMicroHabits,
  saveMicroHabits,
  toggleMicroHabit,
  performDailyCheckIn,
  getFreezeCoins,
  spendFreezeCoin,
  getActivityHistory,
  saveActivityHistory,
  getJournalEntry,
  saveJournalEntry,
  evaluateStreakIntegrity,
  getLocalDateString,
  resetStreakManually
} from '../storage/asyncStorage';
import { generateAIMessage } from '../services/aiService';
import { syncToNativeWidget } from '../storage/widgetBridge';
import { useAuth } from './AuthContext';

const StreakContext = createContext(null);

export const StreakProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [challenge, setChallenge] = useState({
    title: '100 Days of Code',
    targetDays: 100,
    currentStreak: 0,
    bestStreak: 0,
    lastActiveDate: null,
    isBroken: false,
    status: 'ACTIVE'
  });

  const [habits, setHabits] = useState([]);
  const [freezeCoins, setFreezeCoins] = useState(1);
  const [history, setHistory] = useState({});
  const [todayJournal, setTodayJournal] = useState(null);
  const [aiMessage, setAiMessage] = useState('Booting up your streak motivation...');
  const [aiType, setAiType] = useState('hype'); // 'hype' | 'roast'
  const [isLoading, setIsLoading] = useState(true);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [statusNotification, setStatusNotification] = useState(null);

  // Initialize and evaluate streak on launch
  const initApp = useCallback(async () => {
    setIsLoading(true);
    try {
      // Step 1: Strict calendar day check
      const evalResult = await evaluateStreakIntegrity();
      setChallenge(evalResult.challenge);
      setFreezeCoins(evalResult.freezeCoins);
      setHistory(evalResult.history);

      if (evalResult.statusChanged && evalResult.message) {
        setStatusNotification(evalResult.message);
      }

      // Step 2: Load habits and today's journal
      const loadedHabits = await getMicroHabits();
      setHabits(loadedHabits);

      const todayStr = getLocalDateString();
      const journal = await getJournalEntry(todayStr);
      setTodayJournal(journal);

      // Step 3: Generate AI motivation or roast
      const completedCount = loadedHabits.filter((h) => h.completedToday).length;
      const aiRes = await generateAIMessage({
        streak: evalResult.challenge.currentStreak,
        challengeTitle: evalResult.challenge.title,
        mood: journal?.mood || '🤩',
        journalText: journal?.text || '',
        completedHabitCount: completedCount,
        isBroken: evalResult.challenge.isBroken
      });

      setAiMessage(aiRes.text);
      setAiType(aiRes.type);

      // Step 4: Sync to native widgets
      await syncToNativeWidget({
        streakCount: evalResult.challenge.currentStreak,
        challengeTitle: evalResult.challenge.title,
        status: evalResult.challenge.status,
        aiMotivation: aiRes.text
      });
    } catch (err) {
      console.error('Initialization error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      initApp();
    }
  }, [currentUser, initApp]);

  // Toggle habit checkbox
  const toggleHabit = async (habitId) => {
    const updated = await toggleMicroHabit(habitId);
    setHabits(updated);
  };

  // Add a new micro-habit to the daily stack
  const addHabit = async (title, icon = 'check-circle') => {
    if (!title || title.trim().length === 0) return;
    const newHabit = {
      id: Date.now().toString(),
      title: title.trim(),
      icon,
      completedToday: false
    };
    const updated = [...habits, newHabit];
    setHabits(updated);
    await saveMicroHabits(updated);
  };

  // Remove a micro-habit
  const deleteHabit = async (habitId) => {
    const updated = habits.filter((h) => h.id !== habitId);
    setHabits(updated);
    await saveMicroHabits(updated);
  };

  // Complete Daily Check-in
  const checkIn = async () => {
    try {
      const result = await performDailyCheckIn();
      setChallenge(result.challenge);
      setFreezeCoins(result.freezeCoins);
      setHistory(result.history);

      const completedCount = habits.filter((h) => h.completedToday).length;
      setIsAiLoading(true);

      const aiRes = await generateAIMessage({
        streak: result.newStreak,
        challengeTitle: result.challenge.title,
        mood: todayJournal?.mood || '🔥',
        journalText: todayJournal?.text || '',
        completedHabitCount: completedCount,
        isBroken: false
      });

      setAiMessage(aiRes.text);
      setAiType(aiRes.type);
      setIsAiLoading(false);

      await syncToNativeWidget({
        streakCount: result.newStreak,
        challengeTitle: result.challenge.title,
        status: result.challenge.status,
        aiMotivation: aiRes.text
      });

      return result;
    } catch (e) {
      setIsAiLoading(false);
      throw e;
    }
  };

  // Save digital journal entry
  const saveJournal = async (entryData) => {
    const todayStr = getLocalDateString();
    const saved = await saveJournalEntry(entryData, todayStr);
    setTodayJournal(saved);

    // Refresh AI motivation with new reflection context
    const completedCount = habits.filter((h) => h.completedToday).length;
    const aiRes = await generateAIMessage({
      streak: challenge.currentStreak,
      challengeTitle: challenge.title,
      mood: saved.mood,
      journalText: saved.text,
      completedHabitCount: completedCount,
      isBroken: challenge.isBroken
    });

    setAiMessage(aiRes.text);
    setAiType(aiRes.type);

    await syncToNativeWidget({
      streakCount: challenge.currentStreak,
      challengeTitle: challenge.title,
      status: challenge.status,
      aiMotivation: aiRes.text
    });

    return saved;
  };

  // Spend Freeze Coin
  const activateFreezeShield = async () => {
    const res = await spendFreezeCoin();
    if (res.success) {
      setFreezeCoins(res.remainingCoins);
      setChallenge(res.challenge);
      setHistory(res.history);

      const aiRes = await generateAIMessage({
        streak: res.challenge.currentStreak,
        challengeTitle: res.challenge.title,
        mood: '❄️',
        journalText: 'Freeze coin applied',
        isBroken: false
      });
      setAiMessage(aiRes.text);
      setAiType(aiRes.type);

      await syncToNativeWidget({
        streakCount: res.challenge.currentStreak,
        challengeTitle: res.challenge.title,
        status: 'FROZEN',
        aiMotivation: aiRes.text
      });
    }
    return res;
  };

  // Refresh AI message on demand
  const refreshAIMessage = async () => {
    setIsAiLoading(true);
    const completedCount = habits.filter((h) => h.completedToday).length;
    const aiRes = await generateAIMessage({
      streak: challenge.currentStreak,
      challengeTitle: challenge.title,
      mood: todayJournal?.mood || '🤩',
      journalText: todayJournal?.text || '',
      completedHabitCount: completedCount,
      isBroken: challenge.isBroken
    });
    setAiMessage(aiRes.text);
    setAiType(aiRes.type);
    setIsAiLoading(false);

    await syncToNativeWidget({
      streakCount: challenge.currentStreak,
      challengeTitle: challenge.title,
      status: challenge.status,
      aiMotivation: aiRes.text
    });
  };

  // Manual reset for debugging / settings
  const resetStreak = async () => {
    const updated = await resetStreakManually();
    setChallenge(updated);
    const aiRes = await generateAIMessage({
      streak: 0,
      challengeTitle: updated.title,
      isBroken: true
    });
    setAiMessage(aiRes.text);
    setAiType(aiRes.type);

    await syncToNativeWidget({
      streakCount: 0,
      challengeTitle: updated.title,
      status: 'BROKEN',
      aiMotivation: aiRes.text
    });
  };

  // Test simulation: simulate missing a day to trigger strict reset & roast
  const simulateMissedDay = async () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 3); // 3 days ago
    const pastDateStr = getLocalDateString(pastDate);

    const ch = await getChallenge();
    ch.lastActiveDate = pastDateStr;
    await saveChallenge(ch);

    await initApp();
  };

  return (
    <StreakContext.Provider
      value={{
        challenge,
        setChallenge,
        habits,
        freezeCoins,
        history,
        todayJournal,
        aiMessage,
        aiType,
        isLoading,
        isAiLoading,
        statusNotification,
        clearStatusNotification: () => setStatusNotification(null),
        toggleHabit,
        addHabit,
        deleteHabit,
        checkIn,
        saveJournal,
        activateFreezeShield,
        refreshAIMessage,
        resetStreak,
        simulateMissedDay,
        initApp
      }}
    >
      {children}
    </StreakContext.Provider>
  );
};

export const useStreak = () => {
  const context = useContext(StreakContext);
  if (!context) {
    throw new Error('useStreak must be used within a StreakProvider');
  }
  return context;
};

