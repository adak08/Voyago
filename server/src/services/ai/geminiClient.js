import { GoogleGenAI } from "@google/genai";

let _client = null;

/**
 * Returns a singleton GoogleGenAI client.
 * Throws clearly if the API key is missing.
 */
export const getGeminiClient = () => {
  if (_client) return _client;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not set. Add it to server/.env before using AI features."
    );
  }

  _client = new GoogleGenAI({ apiKey });
  return _client;
};

/**
 * Generate content using Gemini with JSON response enforcement.
 *
 * @param {string} prompt        - The full prompt string
 * @param {string} [model]       - Gemini model name (default: gemini-2.5-flash)
 * @param {number} [maxTokens]   - Max output tokens (default: 8192)
 * @returns {Promise<object>}    - Parsed JSON object from Gemini response
 */
export const generateJSON = async (
  prompt,
  model = "gemini-2.5-flash",
  maxTokens = 8192
) => {
  const ai = getGeminiClient();

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      maxOutputTokens: maxTokens,
      temperature: 0.7,
    },
  });

  // In the new SDK `text` is a property, not a method
  const raw = response.text;

  // Strip accidental markdown fences that some prompts can trigger
  const cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  return JSON.parse(cleaned);
};

/**
 * Generate free-form text with Gemini (non-JSON).
 *
 * @param {string} prompt
 * @param {string} [model]
 * @returns {Promise<string>}
 */
export const generateText = async (prompt, model = "gemini-2.5-flash") => {
  const ai = getGeminiClient();

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
  });

  return response.text;
};
