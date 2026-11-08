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
  resetStreakManually,
  getSupremeGoal,
  saveSupremeGoal,
  updateSupremeDailyGoalText,
  setSupremeDailyProof,
  toggleSupremeDailyGoal,
  updateSupremeDetails,
  updateSupremeRoadmap,
  toggleSupremeMilestone,
  updateSupremeMilestone,
  setSupremeFinalMilestone,
  addSupremeMilestone,
  deleteSupremeMilestone,
  DEFAULT_SUPREME_GOAL
} from '../storage/asyncStorage';
import { generateAIMessage } from '../services/aiService';
import { syncToNativeWidget } from '../storage/widgetBridge';
import {
  scheduleAllAppNotifications,
  sendInstantTestNotification,
  requestNotificationPermissions
} from '../services/notificationService';
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
  const [supremeGoal, setSupremeGoal] = useState(DEFAULT_SUPREME_GOAL);
  const [freezeCoins, setFreezeCoins] = useState(1);
  const [history, setHistory] = useState({});
  const [todayJournal, setTodayJournal] = useState(null);
  const [aiMessage, setAiMessage] = useState('Booting up your streak motivation...');
  const [aiType, setAiType] = useState('hype'); // 'hype' | 'roast'
  const [isLoading, setIsLoading] = useState(true);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [statusNotification, setStatusNotification] = useState(null);

  // Celebration animation state
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationData, setCelebrationData] = useState({ streak: 1, isMilestone: false });

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

      // Step 2: Load habits, today's journal, and supreme goal
      const loadedHabits = await getMicroHabits();
      setHabits(loadedHabits);

      const loadedSupreme = await getSupremeGoal();
      setSupremeGoal(loadedSupreme);

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

      // Step 4: Sync to native widgets with all details
      const todayHabitsCount = loadedHabits.length;
      const todayCompletedCount = loadedHabits.filter((h) => h.completedToday).length;
      const todayIncompleteCount = Math.max(0, todayHabitsCount - todayCompletedCount);
      const isDailyGoalDone = Boolean(
        loadedSupreme?.dailyGoal?.completed && loadedSupreme?.dailyGoal?.text?.trim()
      );

      await syncToNativeWidget({
        streakCount: evalResult.challenge.currentStreak,
        challengeTitle: evalResult.challenge.title,
        status: evalResult.challenge.status,
        aiMotivation: aiRes.text,
        supremeGoalTitle: loadedSupreme?.dailyGoal?.text || loadedSupreme?.title || '',
        isSupremeGoalDone: isDailyGoalDone,
        completedHabitsCount: todayCompletedCount,
        totalHabitsCount: todayHabitsCount,
        incompleteHabitsCount: todayIncompleteCount
      });

      // Schedule 3x daily reminders and Supreme Goal deadline alerts
      await scheduleAllAppNotifications(loadedSupreme);
    } catch (err) {
      console.error('Initialization error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Centralized helper to sync all streak, habit, and supreme goal progress to native widgets
  const syncWidgetState = useCallback(
    async ({
      challenge: chOverride,
      status: statusOverride,
      aiText: aiOverride,
      habits: habitsOverride,
      supreme: supremeOverride
    } = {}) => {
      try {
        const activeChallenge = chOverride || challenge;
        const currentHabits = habitsOverride || habits || [];
        const currentSupreme = supremeOverride || supremeGoal;
        const currentStreak = activeChallenge?.currentStreak ?? 0;
        const currentTitle = activeChallenge?.title || 'Challenge';
        const currentStatus = statusOverride || activeChallenge?.status || 'ACTIVE';
        const currentAi = aiOverride || aiMessage;

        const completedHabitsCount = currentHabits.filter((h) => h.completedToday).length;
        const totalHabitsCount = currentHabits.length;
        const incompleteHabitsCount = Math.max(0, totalHabitsCount - completedHabitsCount);

        const hasGoalText = Boolean(currentSupreme?.dailyGoal?.text?.trim());
        const isSupremeGoalDone = Boolean(currentSupreme?.dailyGoal?.completed && hasGoalText);
        const supremeGoalTitle =
          currentSupreme?.dailyGoal?.text?.trim() || currentSupreme?.title || '';

        await syncToNativeWidget({
          streakCount: currentStreak,
          challengeTitle: currentTitle,
          status: currentStatus,
          aiMotivation: currentAi,
          supremeGoalTitle,
          isSupremeGoalDone,
          completedHabitsCount,
          totalHabitsCount,
          incompleteHabitsCount
        });
      } catch (err) {
        console.warn('[StreakContext] syncWidgetState error:', err);
      }
    },
    [challenge, habits, supremeGoal, aiMessage]
  );

  useEffect(() => {
    if (currentUser) {
      initApp();
    }
  }, [currentUser, initApp]);

  // Check if today meets the strict criteria for check-in:
  // 1. Today's supreme goal is set and checked complete
  // 2. At least 3 micro-habits are checked complete
  const checkStreakEligibility = useCallback(
    (currentHabits = habits, currentSupreme = supremeGoal) => {
      const completedHabitsCount = (currentHabits || []).filter((h) => h.completedToday).length;
      const hasDailyGoalText = Boolean(currentSupreme?.dailyGoal?.text?.trim());
      const isDailyGoalCompleted = Boolean(currentSupreme?.dailyGoal?.completed && hasDailyGoalText);
      const isHabitsMet = completedHabitsCount >= 3;

      return {
        isEligible: isDailyGoalCompleted && isHabitsMet,
        isDailyGoalCompleted,
        hasDailyGoalText,
        isHabitsMet,
        completedHabitsCount,
        requiredHabits: 3
      };
    },
    [habits, supremeGoal]
  );

  // Complete Daily Check-in
  const checkIn = useCallback(
    async (options = { showAnimation: true }) => {
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

        await syncWidgetState({
          challenge: result.challenge,
          aiText: aiRes.text
        });

        if (options.showAnimation) {
          setCelebrationData({
            streak: result.newStreak,
            isMilestone: result.earnedNewFreezeCoin
          });
          setShowCelebration(true);
        }

        return result;
      } catch (e) {
        setIsAiLoading(false);
        throw e;
      }
    },
    [habits, todayJournal, syncWidgetState]
  );

  // Auto check-in trigger when criteria is fulfilled
  const checkAndTriggerAutoCheckIn = useCallback(
    async (updatedHabits, updatedSupreme) => {
      const today = getLocalDateString();
      if (challenge?.lastActiveDate === today) {
        // Already checked in for today
        return;
      }

      const eligibility = checkStreakEligibility(updatedHabits, updatedSupreme);
      if (eligibility.isEligible) {
        await checkIn({ showAnimation: true });
      }
    },
    [challenge, checkStreakEligibility, checkIn]
  );

  // Toggle habit checkbox
  const toggleHabit = async (habitId) => {
    const updated = await toggleMicroHabit(habitId);
    setHabits(updated);
    const updatedHistory = await getActivityHistory();
    setHistory({ ...updatedHistory });
    await syncWidgetState({ habits: updated });
    await checkAndTriggerAutoCheckIn(updated, supremeGoal);
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
    await syncWidgetState({ habits: updated });
  };

  // Remove a micro-habit (Core foundational habits are protected)
  const deleteHabit = async (habitId) => {
    if (habitId?.startsWith('core_')) {
      showCyberNotification({
        type: 'warning',
        title: 'Core Pillar Locked 🔒',
        message: 'The 4 non-negotiable core habits cannot be deleted.',
        hudTag: '[HABIT // NON_EDITABLE]'
      });
      return;
    }
    const updated = habits.filter((h) => h.id !== habitId);
    setHabits(updated);
    await saveMicroHabits(updated);
    await syncWidgetState({ habits: updated });
  };

  // Supreme Goal handlers
  const saveSupremeDailyGoal = async (text, photoUri = undefined, fileName = undefined) => {
    const updated = await updateSupremeDailyGoalText(text, photoUri, fileName);
    setSupremeGoal(updated);
    await syncWidgetState({ supreme: updated });
    await checkAndTriggerAutoCheckIn(habits, updated);
    return updated;
  };

  const attachDailyProof = async (photoUri, fileName = null) => {
    const updated = await setSupremeDailyProof(photoUri, fileName);
    setSupremeGoal(updated);
    return updated;
  };

  const toggleSupremeGoal = async () => {
    const updated = await toggleSupremeDailyGoal();
    setSupremeGoal(updated);
    await syncWidgetState({ supreme: updated });
    await checkAndTriggerAutoCheckIn(habits, updated);
    return updated;
  };

  const updateSupremeInfo = async (details) => {
    const updated = await updateSupremeDetails(details);
    setSupremeGoal(updated);
    await syncWidgetState({ supreme: updated });
    // Reschedule notifications with updated deadline & goal title
    await scheduleAllAppNotifications(updated);
    return updated;
  };

  const toggleMilestone = async (milestoneId) => {
    const updated = await toggleSupremeMilestone(milestoneId);
    setSupremeGoal(updated);
    return updated;
  };

  const updateMilestone = async (milestoneId, updates) => {
    const updated = await updateSupremeMilestone(milestoneId, updates);
    setSupremeGoal(updated);
    return updated;
  };

  const setFinalMilestone = async (milestoneId) => {
    const updated = await setSupremeFinalMilestone(milestoneId);
    setSupremeGoal(updated);
    return updated;
  };

  const addMilestone = async (title, isFinal = false) => {
    const updated = await addSupremeMilestone(title, isFinal);
    setSupremeGoal(updated);
    return updated;
  };

  const deleteMilestone = async (milestoneId) => {
    const updated = await deleteSupremeMilestone(milestoneId);
    setSupremeGoal(updated);
    return updated;
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

    await syncWidgetState({
      aiText: aiRes.text
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

      await syncWidgetState({
        challenge: res.challenge,
        status: 'FROZEN',
        aiText: aiRes.text
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

    await syncWidgetState({
      aiText: aiRes.text
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

    await syncWidgetState({
      challenge: updated,
      status: 'BROKEN',
      aiText: aiRes.text
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
        supremeGoal,
        freezeCoins,
        history,
        todayJournal,
        aiMessage,
        aiType,
        isLoading,
        isAiLoading,
        statusNotification,
        clearStatusNotification: () => setStatusNotification(null),
        showCelebration,
        celebrationData,
        closeCelebration: () => setShowCelebration(false),
        triggerCelebration: (streak, isMilestone = false) => {
          setCelebrationData({ streak, isMilestone });
          setShowCelebration(true);
        },
        toggleHabit,
        addHabit,
        deleteHabit,
        saveSupremeDailyGoal,
        attachDailyProof,
        toggleSupremeGoal,
        updateSupremeInfo,
        toggleMilestone,
        updateMilestone,
        setFinalMilestone,
        addMilestone,
        deleteMilestone,
        checkStreakEligibility,
        checkIn,
        saveJournal,
        activateFreezeShield,
        refreshAIMessage,
        resetStreak,
        simulateMissedDay,
        syncWidgetState,
        initApp,
        scheduleAllAppNotifications,
        sendInstantTestNotification,
        requestNotificationPermissions
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
