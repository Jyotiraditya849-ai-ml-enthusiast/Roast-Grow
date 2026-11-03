import { API_CONFIG } from '../config/apiConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../storage/asyncStorage';

// Built-in intelligent fallback messages for offline or keyless use
const FALLBACK_HYPE_MESSAGES = [
  (streak, habitCount, mood) =>
    `🔥 Day ${streak}! You're operating on pure discipline. ${habitCount} micro-habits conquered. Keep this fire burning!`,
  (streak, habitCount, mood) =>
    `⚡ Unstoppable! ${streak} consecutive days of relentless focus. The leaderboard is looking up at you!`,
  (streak, habitCount, mood) =>
    `🚀 Streak status: LEGENDARY (${streak} Days). You turned intentions into cold hard execution today. Respect!`,
  (streak, habitCount, mood) =>
    `💎 ${streak} days locked in! Mood: ${mood || '🤩'}. Excellence isn't an act, it's your daily habit now.`,
  (streak, habitCount, mood) =>
    `👑 Day ${streak} in the bag! Every single rep counts. You are building an undeniable future self.`
];

const FALLBACK_ROAST_MESSAGES = [
  (missedDays) =>
    `💀 Oh look who decided to show up! Did your goals take a vacation too? Day 0 looks cozy on you. Get up and code!`,
  (missedDays) =>
    `🚨 Breaking news: The streak has died of severe neglect. Zero days. No excuses. Reset your ego and check in!`,
  (missedDays) =>
    `🫠 You had one job: show up. Even my Wi-Fi disconnects with more dignity than that. Restart now or stay average!`,
  (missedDays) =>
    `🪦 Here lies your streak: 2026 - 2026. Cause of death: "I'll do it tomorrow". Get back to work right now!`,
  (missedDays) =>
    `🤡 0-Day Warrior! Your future self is currently facepalming so hard. Prove me wrong and check in today!`
];

/**
 * Generate AI motivation or roast based on user state
 * @param {Object} params
 * @param {number} params.streak - Current active streak
 * @param {string} params.challengeTitle - Challenge name
 * @param {string} params.mood - Mood emoji or string
 * @param {string} params.journalText - Daily journal reflection
 * @param {number} params.completedHabitCount - Number of habits completed today
 * @param {boolean} params.isBroken - Whether the streak was broken
 * @param {number} params.missedDays - Days missed
 */
export const generateAIMessage = async ({
  streak = 0,
  challengeTitle = 'Challenge',
  mood = '🤩',
  journalText = '',
  completedHabitCount = 0,
  isBroken = false,
  missedDays = 0
}) => {
  // Check if user set a custom API key in Settings
  let activeKey = API_CONFIG.API_KEY;
  try {
    const customKey = await AsyncStorage.getItem(STORAGE_KEYS.API_KEY);
    if (customKey && customKey.trim().length > 0) {
      activeKey = customKey.trim();
    }
  } catch (e) {
    // ignore
  }

  const isHype = streak > 0 && !isBroken;
  const isRoast = streak === 0 || isBroken;

  // If valid API key is present, attempt live LLM call
  if (activeKey && activeKey !== 'YOUR_GEMINI_API_KEY_HERE' && activeKey.length > 10) {
    try {
      if (API_CONFIG.PROVIDER === 'gemini') {
        const prompt = isHype
          ? `User is on Day ${streak} of "${challengeTitle}". Mood: ${mood}. Today's habits done: ${completedHabitCount}. Journal reflection: "${journalText}". Give them a high-energy, 2-sentence hype boost!`
          : `User has broken their streak (0 days active) on "${challengeTitle}". Missed days: ${missedDays || 1}. Journal excuse: "${journalText}". Give them a funny, witty, strict tough-love roast under 3 sentences to get them moving!`;

        const response = await fetch(
          `${API_CONFIG.GEMINI_ENDPOINT}?key=${activeKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              systemInstruction: {
                parts: [{ text: isHype ? API_CONFIG.PROMPTS.HYPE_SYSTEM : API_CONFIG.PROMPTS.ROAST_SYSTEM }]
              },
              generationConfig: {
                temperature: 0.8,
                maxOutputTokens: 120
              }
            })
          }
        );

        if (response.ok) {
          const data = await response.json();
          const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (generatedText && generatedText.trim().length > 0) {
            return {
              text: generatedText.trim(),
              type: isHype ? 'hype' : 'roast',
              source: 'gemini-live'
            };
          }
        }
      }
    } catch (err) {
      console.warn('AI API call failed or timed out, using high-voltage offline engine:', err);
    }
  }

  // High-voltage contextual offline generative engine
  if (isHype) {
    if (streak === 100) {
      return {
        text: '👑 100 DAYS CENTURION! You conquered the entire 100-Day Challenge! What 99% quit, you conquered. You are officially in the top 1%!',
        type: 'hype',
        source: 'offline-engine'
      };
    }
    if (streak > 100) {
      return {
        text: `⚡ Day ${streak}! You went beyond the 100-day target and now you're building an unstoppable developer empire day by day!`,
        type: 'hype',
        source: 'offline-engine'
      };
    }

    const generator = FALLBACK_HYPE_MESSAGES[Math.floor(Math.random() * FALLBACK_HYPE_MESSAGES.length)];
    return {
      text: generator(streak, completedHabitCount, mood),
      type: 'hype',
      source: 'offline-engine'
    };
  } else {
    const generator = FALLBACK_ROAST_MESSAGES[Math.floor(Math.random() * FALLBACK_ROAST_MESSAGES.length)];
    return {
      text: generator(missedDays),
      type: 'roast',
      source: 'offline-engine'
    };
  }
};

