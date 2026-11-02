/**
* AI Configuration & LLM Prompt Engineering
* Supports Gemini or OpenAI-compatible endpoints with custom system prompts
* for motivational "Hype Mode" and strict sarcastic "Roast Mode".
*/

export const API_CONFIG = {
  // Provider options: 'gemini' or 'openai'
  PROVIDER: 'gemini',

  // Placeholder key: Replace with your actual key or load from env
  API_KEY: 'YOUR_GEMINI_API_KEY_HERE',

  // Google Gemini Endpoint
  GEMINI_ENDPOINT: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',

  // Fallback OpenAI-compatible endpoint
  OPENAI_ENDPOINT: 'https://api.openai.com/v1/chat/completions',
  OPENAI_MODEL: 'gpt-4o-mini',

  // Prompt templates
  PROMPTS: {
    HYPE_SYSTEM: `You are an elite, high-energy habit coach and motivational hype machine. 
The user is maintaining an active challenge streak. 
Analyze their current streak count, daily micro-habits, and journal reflection.
Write a concise, punchy (2-3 sentences max), fiercely inspiring message that fuels their momentum.
Use emojis sparingly but impactfully. Never be boring or generic.`,

    ROAST_SYSTEM: `You are a hilariously strict, tough-love drill sergeant and comedian.
The user has either MISSED a day, BROKEN their streak, or is slacking on their challenge.
Roast them humorously but constructively.
Point out their excuses, mock their procrastination with witty sarcasm, and finish with a sharp command to check in and restart immediately.
Keep it strictly under 3 sentences. No profanity, just devastatingly funny reality checks.`
  }
};

