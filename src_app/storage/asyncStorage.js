import AsyncStorage from '@react-native-async-storage/async-storage';

// Current active user ID for storage scoping
let currentUserId = 'default';

export const setActiveUserStorageId = (userId) => {
  currentUserId = userId || 'default';
};

export const getActiveUserStorageId = () => currentUserId;

// Storage keys generator for isolated per-user data
export const getScopedKey = (baseKey) => `${baseKey}_${currentUserId}`;

/**
 * Universal Multi-Key Retriever:
 * Checks current scoped key -> 'jyotiraditya_369' -> 'default' -> unscoped baseKey.
 * If data is found in a fallback key, it auto-migrates it to the active scope so data is never lost.
 */
export const getMultiScopedItem = async (baseKey) => {
  try {
    const keysToTry = [
      getScopedKey(baseKey),
      `${baseKey}_jyotiraditya_369`,
      `${baseKey}_default`,
      baseKey
    ];

    for (const key of keysToTry) {
      const val = await AsyncStorage.getItem(key);
      if (val !== null && val !== undefined) {
        const target = getScopedKey(baseKey);
        if (key !== target) {
          try {
            await AsyncStorage.setItem(target, val);
          } catch (e) {}
        }
        return val;
      }
    }
    return null;
  } catch (e) {
    return null;
  }
};

/**
 * Universal Multi-Key Setter:
 * Writes to current scoped key AND mirrors to 'jyotiraditya_369', 'default', and unscoped baseKey.
 * This guarantees data is 100% resilient across server restarts, auth state transitions, and reloads.
 */
export const setMultiScopedItem = async (baseKey, value) => {
  try {
    const currentTarget = getScopedKey(baseKey);
    const keysToWrite = Array.from(
      new Set([
        currentTarget,
        `${baseKey}_jyotiraditya_369`,
        `${baseKey}_default`,
        baseKey
      ])
    );
    await Promise.all(keysToWrite.map((k) => AsyncStorage.setItem(k, value)));
  } catch (e) {
    console.warn(`Failed to setMultiScopedItem for ${baseKey}:`, e);
  }
};

export const GLOBAL_STORAGE_KEYS = {
  ACCOUNTS: '@streak_all_user_accounts',
  ACTIVE_SESSION: '@streak_current_active_session'
};

export const STORAGE_KEYS = {
  CHALLENGE: '@streak_active_challenge',
  MICRO_HABITS: '@streak_micro_habits',
  HISTORY: '@streak_activity_history',
  JOURNAL: '@streak_journal_logs',
  FREEZE_COINS: '@streak_freeze_coins',
  LAST_EVALUATED_DATE: '@streak_last_eval_date',
  API_KEY: '@streak_custom_api_key',
  SUPREME_GOAL: '@streak_supreme_goal',
  VISION_BOARD: '@streak_vision_board'
};

// Date format helper: YYYY-MM-DD in local time
export const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Calculate difference in calendar days between two YYYY-MM-DD strings
export const getDayDifference = (dateStrA, dateStrB) => {
  const [y1, m1, d1] = dateStrA.split('-').map(Number);
  const [y2, m2, d2] = dateStrB.split('-').map(Number);
  const utcA = Date.UTC(y1, m1 - 1, d1);
  const utcB = Date.UTC(y2, m2 - 1, d2);
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.floor((utcB - utcA) / msPerDay);
};

// Default initial challenge data
export const DEFAULT_CHALLENGE = {
  title: '100 Days of Code',
  targetDays: 100,
  startDate: getLocalDateString(),
  currentStreak: 0,
  bestStreak: 0,
  lastActiveDate: null,
  isBroken: false,
  status: 'ACTIVE'
};

// 4 Mandatory Non-Editable Core Foundational Habits
export const CORE_HABITS = [
  {
    id: 'core_exercise',
    title: 'Daily 1hr Exercise',
    icon: 'barbell-outline',
    completedToday: false,
    isNonEditable: true,
    category: 'fitness',
    color: '#e11d48'
  },
  {
    id: 'core_water',
    title: 'Daily Drink 4L Water',
    icon: 'water-outline',
    completedToday: false,
    isNonEditable: true,
    category: 'health',
    color: '#38bdf8'
  },
  {
    id: 'core_reading',
    title: 'Read at least 10 Pages of Book',
    icon: 'book-outline',
    completedToday: false,
    isNonEditable: true,
    category: 'intellect',
    color: '#f59e0b'
  },
  {
    id: 'core_sleep',
    title: 'Wake Up & Sleep at Fixed Time',
    icon: 'alarm-outline',
    completedToday: false,
    isNonEditable: true,
    category: 'circadian',
    color: '#c084fc'
  }
];

// Default starter micro-habits
export const DEFAULT_HABITS = [...CORE_HABITS];

/**
 * ============================================================================
 * AUTHENTICATION & MULTI-USER STORAGE HELPERS
 * ============================================================================
 */

export const getAllStoredAccounts = async () => {
  try {
    const raw = await AsyncStorage.getItem(GLOBAL_STORAGE_KEYS.ACCOUNTS);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

export const saveAllStoredAccounts = async (accounts) => {
  try {
    await AsyncStorage.setItem(GLOBAL_STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
  } catch (e) {
    console.error('Failed to save accounts', e);
  }
};

export const getStoredActiveSession = async () => {
  try {
    return await AsyncStorage.getItem(GLOBAL_STORAGE_KEYS.ACTIVE_SESSION);
  } catch (e) {
    return null;
  }
};

export const saveStoredActiveSession = async (userId) => {
  try {
    if (userId) {
      await AsyncStorage.setItem(GLOBAL_STORAGE_KEYS.ACTIVE_SESSION, userId);
    } else {
      await AsyncStorage.removeItem(GLOBAL_STORAGE_KEYS.ACTIVE_SESSION);
    }
  } catch (e) {
    console.error('Failed to save session', e);
  }
};

/**
 * ============================================================================
 * STREAK & DATA PER-USER LOGIC
 * ============================================================================
 */

export const evaluateStreakIntegrity = async () => {
  try {
    const today = getLocalDateString();
    const challengeData = await getChallenge();
    let freezeCoins = await getFreezeCoins();
    const history = await getActivityHistory();

    // 1. If today has logged activity OR challengeData.lastActiveDate is today:
    // The streak is 100% active, protected, and will never be reset!
    const isTodayActivityDone = Boolean(history[today]?.completed);
    if (isTodayActivityDone || challengeData.lastActiveDate === today) {
      challengeData.lastActiveDate = today;
      challengeData.isBroken = false;
      challengeData.status = 'ACTIVE';
      if (challengeData.currentStreak <= 0) {
        challengeData.currentStreak = 1;
      }
      await saveChallenge(challengeData);
      return { challenge: challengeData, freezeCoins, history, statusChanged: false };
    }

    if (!challengeData.lastActiveDate) {
      return { challenge: challengeData, freezeCoins, history, statusChanged: false };
    }

    const daysMissed = getDayDifference(challengeData.lastActiveDate, today);

    if (daysMissed <= 1) {
      return { challenge: challengeData, freezeCoins, history, statusChanged: false };
    }

    // Days missed (daysMissed > 1)
    if (freezeCoins > 0 && challengeData.currentStreak > 0) {
      freezeCoins -= 1;
      await saveFreezeCoins(freezeCoins);

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = getLocalDateString(yesterday);

      history[yesterdayStr] = {
        completed: true,
        ratio: 1.0,
        completedHabits: ['Streak Protected via Freeze Coin'],
        freezeUsed: true,
        timestamp: Date.now()
      };
      await saveActivityHistory(history);

      challengeData.lastActiveDate = yesterdayStr;
      challengeData.status = 'FROZEN';
      await saveChallenge(challengeData);

      return {
        challenge: challengeData,
        freezeCoins,
        history,
        statusChanged: true,
        message: 'A Freeze Coin was automatically consumed to shield your streak! ❄️'
      };
    } else {
      challengeData.currentStreak = 0;
      challengeData.isBroken = true;
      challengeData.status = 'BROKEN';
      await saveChallenge(challengeData);

      return {
        challenge: challengeData,
        freezeCoins,
        history,
        statusChanged: true,
        message: 'You missed a calendar day. Strict rule triggered: Streak reset to 0! 💀'
      };
    }
  } catch (error) {
    console.error('Error evaluating streak integrity:', error);
    const fallbackChallenge = await getChallenge();
    const fallbackCoins = await getFreezeCoins();
    const fallbackHistory = await getActivityHistory();
    return { challenge: fallbackChallenge, freezeCoins: fallbackCoins, history: fallbackHistory, statusChanged: false };
  }
};

export const getChallenge = async () => {
  try {
    const raw = await getMultiScopedItem(STORAGE_KEYS.CHALLENGE);
    const data = raw ? JSON.parse(raw) : DEFAULT_CHALLENGE;
    if (!data.startDate) {
      data.startDate = getLocalDateString();
    }
    return data;
  } catch (e) {
    return { ...DEFAULT_CHALLENGE, startDate: getLocalDateString() };
  }
};

export const saveChallenge = async (challenge) => {
  try {
    await setMultiScopedItem(STORAGE_KEYS.CHALLENGE, JSON.stringify(challenge));
  } catch (e) {
    console.error('Failed to save challenge', e);
  }
};

export const getMicroHabits = async () => {
  try {
    const today = getLocalDateString();
    const lastEval = await getMultiScopedItem(STORAGE_KEYS.LAST_EVALUATED_DATE);
    const rawHabits = await getMultiScopedItem(STORAGE_KEYS.MICRO_HABITS);
    let habits = rawHabits ? JSON.parse(rawHabits) : DEFAULT_HABITS;

    // Guaranteed core habit migration: ensure the 4 non-editable core habits are always present at index 0-3
    const coreIds = CORE_HABITS.map((c) => c.id);
    const existingCoreMap = {};
    (habits || []).forEach((h) => {
      if (coreIds.includes(h.id)) {
        existingCoreMap[h.id] = h;
      }
    });

    // Check today's activity history so we NEVER accidentally erase today's completed habits!
    const history = await getActivityHistory();
    const todayHistory = history[today];
    const todayDoneIds = todayHistory?.completedHabitIds || [];

    const guaranteedCore = CORE_HABITS.map((core) => {
      const existing = existingCoreMap[core.id];
      const isDone = Boolean(existing?.completedToday || todayDoneIds.includes(core.id));
      return { ...core, completedToday: isDone };
    });

    // Custom habits added by user (excluding old legacy dummy habits '1','2','3','4')
    const customHabits = (habits || [])
      .filter((h) => !coreIds.includes(h.id) && !['1', '2', '3', '4'].includes(h.id))
      .map((h) => ({
        ...h,
        completedToday: Boolean(h.completedToday || todayDoneIds.includes(h.id))
      }));

    habits = [...guaranteedCore, ...customHabits];

    if (lastEval !== today) {
      if (todayDoneIds.length > 0) {
        // User already has today's habits done, keep them preserved!
      } else {
        // Genuine new day with 0 prior check-in
        habits = habits.map((h) => ({ ...h, completedToday: false }));
      }
      await setMultiScopedItem(STORAGE_KEYS.MICRO_HABITS, JSON.stringify(habits));
      await setMultiScopedItem(STORAGE_KEYS.LAST_EVALUATED_DATE, today);
    } else {
      await setMultiScopedItem(STORAGE_KEYS.MICRO_HABITS, JSON.stringify(habits));
    }
    return habits;
  } catch (e) {
    return DEFAULT_HABITS;
  }
};

export const saveMicroHabits = async (habits) => {
  try {
    await setMultiScopedItem(STORAGE_KEYS.MICRO_HABITS, JSON.stringify(habits));
  } catch (e) {
    console.error('Failed to save habits', e);
  }
};

export const toggleMicroHabit = async (habitId) => {
  const habits = await getMicroHabits();
  const updated = habits.map((h) =>
    h.id === habitId ? { ...h, completedToday: !h.completedToday } : h
  );
  await saveMicroHabits(updated);

  // Sync today's real-time habit completion to activity history
  try {
    const today = getLocalDateString();
    const history = await getActivityHistory();
    const currentEntry = history[today] || {
      completed: false,
      ratio: 0,
      completedHabits: [],
      completedHabitIds: [],
      timestamp: Date.now()
    };

    const completed = updated.filter((h) => h.completedToday);
    currentEntry.completedHabits = completed.map((h) => h.title);
    currentEntry.completedHabitIds = completed.map((h) => h.id);
    currentEntry.ratio = updated.length > 0 ? completed.length / updated.length : 0;
    history[today] = currentEntry;
    await saveActivityHistory(history);
  } catch (err) {
    console.warn('Failed to sync habit toggle to history:', err);
  }

  return updated;
};

export const deleteMicroHabit = async (habitId) => {
  // 4 foundational core habits cannot be deleted
  if (habitId?.startsWith('core_')) {
    return await getMicroHabits();
  }
  const habits = await getMicroHabits();
  const updated = habits.filter((h) => h.id !== habitId);
  await saveMicroHabits(updated);
  return updated;
};

export const performDailyCheckIn = async () => {
  const today = getLocalDateString();
  const challenge = await getChallenge();
  let freezeCoins = await getFreezeCoins();
  const history = await getActivityHistory();
  const habits = await getMicroHabits();

  const isAlreadyCheckedInToday = challenge.lastActiveDate === today;
  let newStreak = challenge.currentStreak;
  let earnedNewFreezeCoin = false;

  if (!isAlreadyCheckedInToday) {
    newStreak += 1;
    challenge.currentStreak = newStreak;
    if (newStreak > (challenge.bestStreak || 0)) {
      challenge.bestStreak = newStreak;
    }
    challenge.lastActiveDate = today;
    challenge.isBroken = false;
    challenge.status = 'ACTIVE';

    if (newStreak > 0 && newStreak % 10 === 0) {
      freezeCoins += 1;
      earnedNewFreezeCoin = true;
      await saveFreezeCoins(freezeCoins);
    }
    await saveChallenge(challenge);
  }

  const totalHabits = habits.length > 0 ? habits.length : 1;
  const completedHabitsList = habits.filter((h) => h.completedToday);
  const completedCount = completedHabitsList.length;
  const ratio = Math.min(1.0, completedCount / totalHabits);
  const supremeGoal = await getSupremeGoal();

  history[today] = {
    completed: true,
    ratio: ratio > 0 ? ratio : 1.0,
    completedHabits: completedHabitsList.map((h) => h.title),
    completedHabitIds: completedHabitsList.map((h) => h.id),
    supremeGoal: supremeGoal?.dailyGoal?.completed ? supremeGoal.dailyGoal.text : null,
    freezeUsed: false,
    timestamp: Date.now()
  };
  await saveActivityHistory(history);

  return { success: true, newStreak, earnedNewFreezeCoin, freezeCoins, challenge, history: { ...history } };
};

export const getFreezeCoins = async () => {
  try {
    const raw = await getMultiScopedItem(STORAGE_KEYS.FREEZE_COINS);
    return raw !== null ? parseInt(raw, 10) : 1;
  } catch (e) {
    return 1;
  }
};

export const saveFreezeCoins = async (count) => {
  try {
    await setMultiScopedItem(STORAGE_KEYS.FREEZE_COINS, count.toString());
  } catch (e) {
    console.error('Failed to save freeze coins', e);
  }
};

export const spendFreezeCoin = async (dateStr = getLocalDateString()) => {
  const coins = await getFreezeCoins();
  if (coins <= 0) {
    return { success: false, message: 'No Freeze Coins remaining! Earn more with a 10-day streak.' };
  }
  const updatedCoins = coins - 1;
  await saveFreezeCoins(updatedCoins);

  const history = await getActivityHistory();
  history[dateStr] = {
    completed: true,
    ratio: 1.0,
    completedHabits: ['Protected by Freeze Coin'],
    freezeUsed: true,
    timestamp: Date.now()
  };
  await saveActivityHistory(history);

  const challenge = await getChallenge();
  challenge.status = 'FROZEN';
  challenge.isBroken = false;
  challenge.lastActiveDate = dateStr;
  await saveChallenge(challenge);

  return { success: true, remainingCoins: updatedCoins, challenge, history };
};

export const getActivityHistory = async () => {
  try {
    const raw = await getMultiScopedItem(STORAGE_KEYS.HISTORY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
};

export const saveActivityHistory = async (history) => {
  try {
    await setMultiScopedItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
  } catch (e) {
    console.error('Failed to save activity history', e);
  }
};

export const getJournalEntry = async (dateStr = getLocalDateString()) => {
  try {
    const raw = await getMultiScopedItem(STORAGE_KEYS.JOURNAL);
    const journals = raw ? JSON.parse(raw) : {};
    return journals[dateStr] || null;
  } catch (e) {
    return null;
  }
};

export const saveJournalEntry = async (entry, dateStr = getLocalDateString()) => {
  try {
    const raw = await getMultiScopedItem(STORAGE_KEYS.JOURNAL);
    const journals = raw ? JSON.parse(raw) : {};
    journals[dateStr] = { ...entry, date: dateStr, timestamp: Date.now() };
    await setMultiScopedItem(STORAGE_KEYS.JOURNAL, JSON.stringify(journals));
    return journals[dateStr];
  } catch (e) {
    console.error('Failed to save journal entry', e);
    throw e;
  }
};

export const getAllJournalEntries = async () => {
  try {
    const raw = await getMultiScopedItem(STORAGE_KEYS.JOURNAL);
    const journals = raw ? JSON.parse(raw) : {};
    return Object.values(journals).sort((a, b) => b.timestamp - a.timestamp);
  } catch (e) {
    return [];
  }
};

export const getJournalTheme = async () => {
  try {
    const raw = await getMultiScopedItem('@streak_journal_theme');
    return raw || 'anime_sky';
  } catch (e) {
    return 'anime_sky';
  }
};

export const saveJournalTheme = async (themeId) => {
  try {
    await setMultiScopedItem('@streak_journal_theme', themeId);
    return themeId;
  } catch (e) {
    return 'anime_sky';
  }
};

export const getFocusStatsForDate = async (dateStr = getLocalDateString()) => {
  try {
    // Check scoped user key first, then fallback to global key
    let raw = await AsyncStorage.getItem(getScopedKey(`@streak_focus_stats_${dateStr}`));
    if (!raw) {
      raw = await AsyncStorage.getItem(`@streak_focus_stats_${dateStr}`);
    }
    if (raw) {
      return JSON.parse(raw);
    }
    return { minutes: 0, sessions: 0 };
  } catch (e) {
    return { minutes: 0, sessions: 0 };
  }
};

export const saveFocusStatsForDate = async (dateStr, { minutes = 0, sessions = 0 }) => {
  try {
    const payload = JSON.stringify({ minutes, sessions });
    // Write both scoped and unscoped for backwards compatibility
    await AsyncStorage.setItem(getScopedKey(`@streak_focus_stats_${dateStr}`), payload);
    await AsyncStorage.setItem(`@streak_focus_stats_${dateStr}`, payload);
    return { minutes, sessions };
  } catch (e) {
    console.warn('Failed to save focus stats for date:', e);
    return { minutes, sessions };
  }
};

export const addFocusStatsForDate = async (minutesToAdd, isSession = false, dateStr = getLocalDateString()) => {
  try {
    const current = await getFocusStatsForDate(dateStr);
    const newMinutes = (current.minutes || 0) + Math.max(0, minutesToAdd);
    const newSessions = (current.sessions || 0) + (isSession ? 1 : 0);
    return await saveFocusStatsForDate(dateStr, { minutes: newMinutes, sessions: newSessions });
  } catch (e) {
    console.warn('Failed to add focus stats:', e);
    return { minutes: minutesToAdd, sessions: isSession ? 1 : 0 };
  }
};

export const getWeeklyFocusStats = async () => {
  try {
    const today = new Date();
    const daysData = [];
    const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // 7 days ending on today (chronological order)
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = getLocalDateString(d);
      const dayName = DAY_NAMES[d.getDay()];
      const stats = await getFocusStatsForDate(dateStr);
      daysData.push({
        dateStr,
        dayLabel: dayName,
        minutes: stats.minutes || 0,
        sessions: stats.sessions || 0,
        isToday: i === 0
      });
    }

    const totalMinutes = daysData.reduce((sum, d) => sum + d.minutes, 0);
    const totalSessions = daysData.reduce((sum, d) => sum + d.sessions, 0);
    const avgMinutes = Math.round(totalMinutes / 7);
    const maxMinutes = Math.max(...daysData.map((d) => d.minutes), 0);
    const peakDay = daysData.find((d) => d.minutes === maxMinutes && maxMinutes > 0);

    return {
      daysData,
      totalMinutes,
      totalSessions,
      avgMinutes,
      maxMinutes,
      peakDay: peakDay ? `${peakDay.dayLabel} (${peakDay.minutes}m)` : 'None yet'
    };
  } catch (e) {
    console.error('Failed to get weekly focus stats', e);
    return {
      daysData: [],
      totalMinutes: 0,
      totalSessions: 0,
      avgMinutes: 0,
      maxMinutes: 0,
      peakDay: 'None yet'
    };
  }
};

export const resetStreakManually = async () => {
  const challenge = await getChallenge();
  challenge.currentStreak = 0;
  challenge.isBroken = true;
  challenge.status = 'BROKEN';
  challenge.lastActiveDate = null;
  await saveChallenge(challenge);
  return challenge;
};

/**
 * ============================================================================
 * SUPREME GOAL & DAILY MISSION STORAGE
 * ============================================================================
 */

export const DEFAULT_SUPREME_GOAL = {
  title: 'Full Stack Engineer Mastery',
  description: 'Master advanced architecture, build production-grade systems, and scale real-world apps.',
  deadline: '2027-12-31',
  attachmentUri: null,
  attachmentName: null,
  roadmap: [
    { id: '1', title: 'Phase 1: React Native, Expo & Advanced UI Systems', completed: true },
    { id: '2', title: 'Phase 2: Node.js, Distributed Backends & Databases', completed: false },
    { id: '3', title: 'Phase 3: Launch Production Apps & Scale to 10k Users', completed: false }
  ],
  dailyGoal: {
    date: getLocalDateString(),
    text: '',
    completed: false,
    photoUri: null,
    fileName: null
  }
};

export const getSupremeGoal = async () => {
  try {
    const today = getLocalDateString();
    const raw = await getMultiScopedItem(STORAGE_KEYS.SUPREME_GOAL);
    let data = raw ? JSON.parse(raw) : DEFAULT_SUPREME_GOAL;
    if (!data.dailyGoal || data.dailyGoal.date !== today) {
      data.dailyGoal = {
        date: today,
        text: data.dailyGoal?.date === today ? (data.dailyGoal.text || '') : '',
        completed: false,
        photoUri: null,
        fileName: null
      };
      await saveSupremeGoal(data);
    }
    return data;
  } catch (e) {
    return DEFAULT_SUPREME_GOAL;
  }
};

export const saveSupremeGoal = async (supremeGoal) => {
  try {
    await setMultiScopedItem(STORAGE_KEYS.SUPREME_GOAL, JSON.stringify(supremeGoal));
  } catch (e) {
    console.error('Failed to save supreme goal', e);
  }
};

export const updateSupremeDailyGoalText = async (text, photoUri = undefined, fileName = undefined) => {
  const goal = await getSupremeGoal();
  const today = getLocalDateString();
  goal.dailyGoal = {
    date: today,
    text: (text || '').trim(),
    completed: goal.dailyGoal?.completed || false,
    photoUri: photoUri !== undefined ? photoUri : (goal.dailyGoal?.photoUri || null),
    fileName: fileName !== undefined ? fileName : (goal.dailyGoal?.fileName || null)
  };
  await saveSupremeGoal(goal);
  return goal;
};

export const setSupremeDailyProof = async (photoUri, fileName = null) => {
  const goal = await getSupremeGoal();
  const today = getLocalDateString();
  goal.dailyGoal = {
    ...(goal.dailyGoal || { date: today, text: '', completed: false }),
    date: today,
    photoUri,
    fileName
  };
  await saveSupremeGoal(goal);
  return goal;
};

export const toggleSupremeDailyGoal = async () => {
  const goal = await getSupremeGoal();
  const today = getLocalDateString();
  const currentCompleted = Boolean(goal.dailyGoal?.completed);
  goal.dailyGoal = {
    date: today,
    text: goal.dailyGoal?.text || '',
    photoUri: goal.dailyGoal?.photoUri || null,
    fileName: goal.dailyGoal?.fileName || null,
    completed: !currentCompleted
  };
  await saveSupremeGoal(goal);
  return goal;
};

export const updateSupremeDetails = async ({ title, description, deadline, attachmentUri, attachmentName, attachmentType }) => {
  const goal = await getSupremeGoal();
  if (title !== undefined) goal.title = title.trim();
  if (description !== undefined) goal.description = description.trim();
  if (deadline !== undefined) goal.deadline = deadline;
  if (attachmentUri !== undefined) goal.attachmentUri = attachmentUri;
  if (attachmentName !== undefined) goal.attachmentName = attachmentName;
  if (attachmentType !== undefined) goal.attachmentType = attachmentType;
  await saveSupremeGoal(goal);
  return goal;
};

export const updateSupremeRoadmap = async (roadmap) => {
  const goal = await getSupremeGoal();
  goal.roadmap = roadmap;
  await saveSupremeGoal(goal);
  return goal;
};

export const toggleSupremeMilestone = async (milestoneId) => {
  const goal = await getSupremeGoal();
  goal.roadmap = (goal.roadmap || []).map((m) =>
    m.id === milestoneId ? { ...m, completed: !m.completed } : m
  );
  await saveSupremeGoal(goal);
  return goal;
};

export const addSupremeMilestone = async (title) => {
  const goal = await getSupremeGoal();
  const newMilestone = {
    id: Date.now().toString(),
    title: (title || '').trim(),
    completed: false
  };
  goal.roadmap = [...(goal.roadmap || []), newMilestone];
  await saveSupremeGoal(goal);
  return goal;
};

export const deleteSupremeMilestone = async (milestoneId) => {
  const goal = await getSupremeGoal();
  goal.roadmap = (goal.roadmap || []).filter((m) => m.id !== milestoneId);
  await saveSupremeGoal(goal);
  return goal;
};

/**
 * ============================================================================
 * VISION BOARD HELPERS (Mistakes Handwritten Note vs Dream Vision)
 * ============================================================================
 */

export const DEFAULT_VISION_BOARD = {
  mistakesNotePhotoUri: null,
  mistakesNoteName: null,
  mistakesNoteUpdatedAt: null,
  dreamVisionPhotoUri: null,
  dreamVisionName: null,
  dreamVisionUpdatedAt: null
};

export const getVisionBoard = async () => {
  try {
    const raw = await getMultiScopedItem(STORAGE_KEYS.VISION_BOARD);
    if (!raw) return { ...DEFAULT_VISION_BOARD };
    return { ...DEFAULT_VISION_BOARD, ...JSON.parse(raw) };
  } catch (e) {
    console.error('Failed to get vision board:', e);
    return { ...DEFAULT_VISION_BOARD };
  }
};

export const saveVisionBoard = async (data) => {
  try {
    const updated = { ...DEFAULT_VISION_BOARD, ...data };
    await setMultiScopedItem(STORAGE_KEYS.VISION_BOARD, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Failed to save vision board:', e);
    throw e;
  }
};

export const updateVisionBoardItem = async (type, { uri, name }) => {
  const current = await getVisionBoard();
  if (type === 'mistakes') {
    current.mistakesNotePhotoUri = uri;
    current.mistakesNoteName = name || 'Handwritten_Mistakes_Note.jpg';
    current.mistakesNoteUpdatedAt = Date.now();
  } else if (type === 'dream') {
    current.dreamVisionPhotoUri = uri;
    current.dreamVisionName = name || 'Dream_Vision_Goal.jpg';
    current.dreamVisionUpdatedAt = Date.now();
  }
  await saveVisionBoard(current);
  return current;
};

