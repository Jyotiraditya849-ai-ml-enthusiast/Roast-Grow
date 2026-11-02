import AsyncStorage from '@react-native-async-storage/async-storage';

// Current active user ID for storage scoping
let currentUserId = 'default';

export const setActiveUserStorageId = (userId) => {
  currentUserId = userId || 'default';
};

export const getActiveUserStorageId = () => currentUserId;

// Storage keys generator for isolated per-user data
export const getScopedKey = (baseKey) => `${baseKey}_${currentUserId}`;

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
  SUPREME_GOAL: '@streak_supreme_goal'
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

// Default starter micro-habits
export const DEFAULT_HABITS = [
  { id: '1', title: 'Code for 45 minutes', icon: 'code', completedToday: false },
  { id: '2', title: 'Review 1 pull request or article', icon: 'book-open', completedToday: false },
  { id: '3', title: 'Push commit to GitHub', icon: 'git-commit', completedToday: false },
  { id: '4', title: 'Drink 2L of water', icon: 'droplet', completedToday: false }
];

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
    const raw = await AsyncStorage.getItem(getScopedKey(STORAGE_KEYS.CHALLENGE));
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
    await AsyncStorage.setItem(getScopedKey(STORAGE_KEYS.CHALLENGE), JSON.stringify(challenge));
  } catch (e) {
    console.error('Failed to save challenge', e);
  }
};

export const getMicroHabits = async () => {
  try {
    const today = getLocalDateString();
    const lastEval = await AsyncStorage.getItem(getScopedKey(STORAGE_KEYS.LAST_EVALUATED_DATE));
    const rawHabits = await AsyncStorage.getItem(getScopedKey(STORAGE_KEYS.MICRO_HABITS));
    let habits = rawHabits ? JSON.parse(rawHabits) : DEFAULT_HABITS;

    if (lastEval !== today) {
      habits = habits.map((h) => ({ ...h, completedToday: false }));
      await AsyncStorage.setItem(getScopedKey(STORAGE_KEYS.MICRO_HABITS), JSON.stringify(habits));
      await AsyncStorage.setItem(getScopedKey(STORAGE_KEYS.LAST_EVALUATED_DATE), today);
    }
    return habits;
  } catch (e) {
    return DEFAULT_HABITS;
  }
};

export const saveMicroHabits = async (habits) => {
  try {
    await AsyncStorage.setItem(getScopedKey(STORAGE_KEYS.MICRO_HABITS), JSON.stringify(habits));
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
  const completedCount = habits.filter((h) => h.completedToday).length;
  const ratio = Math.min(1.0, completedCount / totalHabits);
  const supremeGoal = await getSupremeGoal();

  history[today] = {
    completed: true,
    ratio: ratio > 0 ? ratio : 0.5,
    completedHabits: habits.filter((h) => h.completedToday).map((h) => h.title),
    supremeGoal: supremeGoal?.dailyGoal?.completed ? supremeGoal.dailyGoal.text : null,
    freezeUsed: false,
    timestamp: Date.now()
  };
  await saveActivityHistory(history);

  return { success: true, newStreak, earnedNewFreezeCoin, freezeCoins, challenge, history };
};

export const getFreezeCoins = async () => {
  try {
    const raw = await AsyncStorage.getItem(getScopedKey(STORAGE_KEYS.FREEZE_COINS));
    return raw !== null ? parseInt(raw, 10) : 1;
  } catch (e) {
    return 1;
  }
};

export const saveFreezeCoins = async (count) => {
  try {
    await AsyncStorage.setItem(getScopedKey(STORAGE_KEYS.FREEZE_COINS), count.toString());
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
    const raw = await AsyncStorage.getItem(getScopedKey(STORAGE_KEYS.HISTORY));
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
};

export const saveActivityHistory = async (history) => {
  try {
    await AsyncStorage.setItem(getScopedKey(STORAGE_KEYS.HISTORY), JSON.stringify(history));
  } catch (e) {
    console.error('Failed to save activity history', e);
  }
};

export const getJournalEntry = async (dateStr = getLocalDateString()) => {
  try {
    const raw = await AsyncStorage.getItem(getScopedKey(STORAGE_KEYS.JOURNAL));
    const journals = raw ? JSON.parse(raw) : {};
    return journals[dateStr] || null;
  } catch (e) {
    return null;
  }
};

export const saveJournalEntry = async (entry, dateStr = getLocalDateString()) => {
  try {
    const raw = await AsyncStorage.getItem(getScopedKey(STORAGE_KEYS.JOURNAL));
    const journals = raw ? JSON.parse(raw) : {};
    journals[dateStr] = { ...entry, date: dateStr, timestamp: Date.now() };
    await AsyncStorage.setItem(getScopedKey(STORAGE_KEYS.JOURNAL), JSON.stringify(journals));
    return journals[dateStr];
  } catch (e) {
    console.error('Failed to save journal entry', e);
    throw e;
  }
};

export const getAllJournalEntries = async () => {
  try {
    const raw = await AsyncStorage.getItem(getScopedKey(STORAGE_KEYS.JOURNAL));
    const journals = raw ? JSON.parse(raw) : {};
    return Object.values(journals).sort((a, b) => b.timestamp - a.timestamp);
  } catch (e) {
    return [];
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
    const raw = await AsyncStorage.getItem(getScopedKey(STORAGE_KEYS.SUPREME_GOAL));
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
    await AsyncStorage.setItem(getScopedKey(STORAGE_KEYS.SUPREME_GOAL), JSON.stringify(supremeGoal));
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
