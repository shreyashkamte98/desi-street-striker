import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';

// Safely initialize
let ai: GoogleGenAI | null = null;
try {
  if (apiKey) {
    ai = new GoogleGenAI({ apiKey });
  }
} catch (e) {
  console.error("Failed to initialize Gemini Client", e);
}

const FALLBACK_MESSAGES = [
  "Wah! Kya shot tha guru!",
  "Arre bhai, thoda aaram se!",
  "Gully Cricket Legend in the making!",
  "Beta tumse na ho payega...",
  "Oooof! Close one!",
  "Next level skills bhai!",
  "Jalwa hai tumhara yahan!",
  "Focus, Focus! Agli baar pakka goal.",
  "Solid effort, but keeper was awake!",
  "Kya baat hai! Zabardast!"
];

export const generateCommentary = async (score: number, stylePoints: number): Promise<string> => {
  // If no API client or key, return fallback immediately
  if (!ai) {
    return FALLBACK_MESSAGES[Math.floor(Math.random() * FALLBACK_MESSAGES.length)];
  }

  try {
    const prompt = `
      You are a funny, energetic Indian street football commentator.
      A player just finished a game of 'Desi Street Striker'.
      Score: ${score} goals.
      Style Points: ${stylePoints}.

      Generate a ONE sentence reaction in 'Hinglish' (Hindi + English mix).
      If the score is low (<3), roast them gently (e.g., 'Beta tumse na ho payega').
      If the score is high (>10), praise them like a god (e.g., 'Arre Messi bhai aap yahan?').
      Keep it short, punchy, and culturally relevant to Indian street sports.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    if (response.text) {
        return response.text.trim();
    }
    throw new Error("Empty response");

  } catch (error: any) {
    // Gracefully handle Rate Limiting (429) and other errors
    const isRateLimit = error?.status === 'RESOURCE_EXHAUSTED' || error?.code === 429 || (error?.message && error.message.includes('429'));
    
    if (isRateLimit) {
        console.warn("Gemini Quota Exceeded (429). Switching to fallback commentary.");
    } else {
        console.error("Gemini API Error:", error);
    }
    
    // Return a random fallback message
    return FALLBACK_MESSAGES[Math.floor(Math.random() * FALLBACK_MESSAGES.length)];
  }
};