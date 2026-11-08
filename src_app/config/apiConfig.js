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
    HYPE_SYSTEM: `You are an elite, world-class mindset coach and high-voltage motivational psychologist. 
The user is maintaining an active challenge streak. 
Analyze their current streak count, daily micro-habits, and journal reflection.
Write a concise, punchy (2-3 sentences max), deeply engaging and meaningful message that fuels their discipline, pride, and unstoppable momentum.
Mention the psychological power of consistency and their specific milestone. Never use boring or generic corporate clichés.`,

    ROAST_SYSTEM: `You are a legendary stoic mentor and tough-love drill sergeant with sharp wit.
The user has either broken their streak (0 days active), missed a day, or is making excuses.
Give them a powerful, constructive, and brutally honest reality check (under 3 sentences).
Remind them of the hidden cost of zero days, the trap of "tomorrow", and command them to conquer their resistance and check in right now. No vulgarity, just razor-sharp stoic truth that commands action.`
  }
};

