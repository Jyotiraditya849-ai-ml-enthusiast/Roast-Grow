import { API_CONFIG } from '../config/apiConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../storage/asyncStorage';

// ============================================================================
// HIGH-IMPACT PSYCHOLOGICAL AI MOTIVATION & REALITY CHECK ENGINE
// ============================================================================

// 1. STOIC & BRUTAL REALITY CHECKS (0-Day Resets, Broken Streaks & Missed Days)
const ROAST_REALITY_CHECKS = [
  (missedDays) =>
    `💀 Zero days build zero empires. Procrastination is paying high interest on a loan of temporary comfort. Stop bargaining with weakness—complete habit #1 right now!`,
  (missedDays) =>
    `🚨 Marcus Aurelius warned us: "You could be good today; yet you choose tomorrow." Tomorrow is where dreams rot. Reclaim your self-respect and check in!`,
  (missedDays) =>
    `⚡ Comfort is the silent killer of greatness. You broke the streak, not your destiny. Stand up, take a deep breath, and begin the comeback of a lifetime!`,
  (missedDays) =>
    `🔥 David Goggins rule: The mind quits 100 times before you actually fail. Don't negotiate with resistance. Pick up the pen, do the rep, and resurrect Day 1.`,
  (missedDays) =>
    `🪦 Look at your "Why I Failed" handwritten note. Are you really going to surrender to the exact same trap today? Break the cycle NOW!`,
  (missedDays) =>
    `💎 Discipline is choosing between what you want NOW and what you want MOST. Day 0 ends the very second you conquer your first micro-habit. Move!`,
  (missedDays) =>
    `🎯 A year from today, you will either celebrate this comeback or weep over another wasted cycle. What you do in the next 15 minutes decides that future.`,
  (missedDays) =>
    `🌪️ Your brain is whispering that "starting Monday is better". That's resistance lying to your face. True champions restart on the darkest hour of a broken day.`,
  (missedDays) =>
    `🛡️ The distance between who you are and who you want to be is what you do when you don't feel like doing it. Silence the excuses and lock in today!`,
  (missedDays) =>
    `👑 Every master was once a disaster. But masters never stayed on the bench complaining. Clear the slate, reset your stance, and register Day 1!`
];

// 2. EARLY CRUCIBLE (Days 1 - 6: The Battle of Neural Rewiring)
const HYPE_EARLY_CRUCIBLE = [
  (streak, habitCount, mood) =>
    `🔥 Day ${streak}! The first week is the psychological filter where 90% surrender to inertia. You held the line today—your neural pathways are restructuring!`,
  (streak, habitCount, mood) =>
    `⚡ Day ${streak} in the bag! You didn't negotiate with laziness today. Small disciplines repeated daily create undeniable momentum. Keep this fire burning!`,
  (streak, habitCount, mood) =>
    `🛡️ Day ${streak} conquered! Showing up on low-friction days is easy; showing up today proves character. You are laying the foundation of an absolute powerhouse.`,
  (streak, habitCount, mood) =>
    `🚀 Day ${streak}! The hardest step is breaking inertia. Now you're moving. Rule #1 of greatness: Never break the chain two days in a row!`,
  (streak, habitCount, mood) =>
    `💎 Day ${streak} locked! Mood: ${mood || '🔥'}. You kept a promise to yourself today, and self-trust is the bedrock of unstoppable confidence.`
];

// 3. IDENTITY SHIFT (Days 7 - 20: Transcending Effort into Automatic Habit)
const HYPE_IDENTITY_SHIFT = [
  (streak, habitCount, mood) =>
    `💎 Day ${streak}! You have entered identity-shift territory. You are no longer someone "trying" to stay consistent; you ARE someone who executes daily without debate.`,
  (streak, habitCount, mood) =>
    `⚡ Day ${streak}! The friction is dissolving and the routine is taking command. You have built undeniable proof that you are in control of your destiny.`,
  (streak, habitCount, mood) =>
    `🔥 Day ${streak} secured! Two weeks of ruthless self-accountability. While others look for shortcuts, you are building an impregnable fortress of discipline.`,
  (streak, habitCount, mood) =>
    `🎯 Day ${streak}! The noise of doubt is fading, replaced by the rhythm of routine. Protect this streak like your life depends on it—momentum is sacred!`
];

// 4. ELITE FLOW (Days 21 - 49: The Top 1% Standard)
const HYPE_ELITE_FLOW = [
  (streak, habitCount, mood) =>
    `👑 Day ${streak}! You've crossed the 21-day threshold into elite territory. What was once hard is now your baseline. Elevate the quality of every single rep today!`,
  (streak, habitCount, mood) =>
    `⚔️ Day ${streak}! 99% of people quit their resolutions before this point. You are operating on a frequency that average minds cannot comprehend. Dominate!`,
  (streak, habitCount, mood) =>
    `⚡ Day ${streak}! Consistency is the greatest unfair advantage in the modern world. Your compounding results are quietly multiplying behind the scenes.`,
  (streak, habitCount, mood) =>
    `💎 Day ${streak} locked in! Mood: ${mood || '🤩'}. You don't need motivation anymore—you have built a cold, clean machine of daily execution.`
];

// 5. CENTURY VANGUARD (Days 50 - 99: The Unstoppable Compounding Dynamo)
const HYPE_CENTURY_VANGUARD = [
  (streak, habitCount, mood) =>
    `🌟 Day ${streak}! Over halfway to the legendary 100-Day Centurion status! You are outworking your former self and silencing every whisper of doubt.`,
  (streak, habitCount, mood) =>
    `🔥 Day ${streak}! Half a century of consecutive execution. The habits you conquer today will echo in your career and character for the next decade!`,
  (streak, habitCount, mood) =>
    `⚡ Day ${streak}! You are in rare air now. Most people never witness what they are truly capable of. You are witnessing it every single morning.`
];

// 6. CENTURION & BEYOND (Days 100+: Living Legend)
const HYPE_CENTURION = [
  (streak) =>
    `👑 100 DAYS CENTURION! You conquered the entire 100-Day Crucible! What 99% abandoned as impossible, you transformed into your daily reality. You are officially top 1%!`,
  (streak) =>
    `🏛️ Day ${streak}! You are a living monument to relentless consistency. What started as a challenge is now your lifelong empire. There is no ceiling for you!`
];

/**
 * Format intelligent habit and mood tag to append to AI messages
 */
const getHabitContextTag = (habitCount) => {
  if (habitCount >= 4) {
    return ' [✓ All 4 Core Habits locked with military precision]';
  } else if (habitCount > 0) {
    return ` [⚡ ${habitCount}/4 Habits secured — finish the rest!]`;
  }
  return '';
};

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
          ? `User is on Day ${streak} of "${challengeTitle}". Mood: ${mood}. Today's habits done: ${completedHabitCount}/4. Journal reflection: "${journalText}". Give them a high-energy, deeply inspiring and psychological 2-sentence momentum boost!`
          : `User has broken their streak (0 days active) on "${challengeTitle}". Missed days: ${missedDays || 1}. Journal excuse: "${journalText}". Give them a stoic, punchy, tough-love reality check under 3 sentences to get them back into action immediately!`;

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
                temperature: 0.85,
                maxOutputTokens: 140
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
    let pool;
    if (streak >= 100) {
      pool = HYPE_CENTURION;
    } else if (streak >= 50) {
      pool = HYPE_CENTURY_VANGUARD;
    } else if (streak >= 21) {
      pool = HYPE_ELITE_FLOW;
    } else if (streak >= 7) {
      pool = HYPE_IDENTITY_SHIFT;
    } else {
      pool = HYPE_EARLY_CRUCIBLE;
    }

    const generator = pool[Math.floor(Math.random() * pool.length)];
    const baseText = generator(streak, completedHabitCount, mood);
    const habitTag = getHabitContextTag(completedHabitCount);

    return {
      text: `${baseText}${habitTag}`,
      type: 'hype',
      source: 'offline-engine'
    };
  } else {
    const generator = ROAST_REALITY_CHECKS[Math.floor(Math.random() * ROAST_REALITY_CHECKS.length)];
    return {
      text: generator(missedDays),
      type: 'roast',
      source: 'offline-engine'
    };
  }
};
