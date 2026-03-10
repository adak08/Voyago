import { GoogleGenAI } from "@google/genai";

const safeParseJSON = (text) => {
  // 1) Fast path: valid strict JSON payload.
  try {
    return JSON.parse(text);
  } catch {}

  // 2) Common fallback: wrapped in ```json ... ``` fences.
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    try {
      return JSON.parse(fenced[1].trim());
    } catch {}
  }

  // 3) Last resort: parse the largest outer JSON object.
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const candidate = text.slice(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(candidate);
    } catch {}
  }

  throw new Error("Gemini returned invalid JSON");
};

const repairJSONWithModel = async (ai, invalidText, model, maxOutputTokens) => {
  const repairPrompt = `
You are a JSON repair assistant.
Convert the following content into strictly valid JSON.

RULES:
1. Return ONLY valid JSON.
2. Do not add markdown fences.
3. Preserve original structure and values as much as possible.

CONTENT TO REPAIR:
${invalidText}
`.trim();

  const repaired = await ai.models.generateContent({
    model,
    contents: repairPrompt,
    config: {
      responseMimeType: "application/json",
      maxOutputTokens,
    },
  });

  const repairedText = (repaired.text || "").trim();
  if (!repairedText) {
    throw new Error("Gemini JSON repair returned an empty response");
  }

  return safeParseJSON(repairedText);
};

const getGeminiClient = () => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
};

// ─── Retry with exponential backoff ──────────────────────────────────────────
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const withRetry = async (fn, { maxAttempts = 3, baseDelayMs = 2000 } = {}) => {
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;

      // Parse error code — Gemini SDK wraps it in err.error.code or err.status
      const code =
        err?.error?.code ||
        err?.status ||
        err?.code ||
        (typeof err?.message === "string" && err.message.match(/"code":(\d+)/)?.[1]);

      const isRetryable =
        code === 503 ||
        code === "503" ||
        code === 429 ||
        code === "429" ||
        /503|429|unavailable|rate.?limit|too many/i.test(err?.message || "");

      if (!isRetryable || attempt === maxAttempts) {
        throw err;
      }

      const delay = baseDelayMs * Math.pow(2, attempt - 1); // 2s, 4s, 8s
      console.warn(
        `[GeminiClient] Attempt ${attempt}/${maxAttempts} failed (${code || "unknown"}) — retrying in ${delay / 1000}s...`
      );
      await sleep(delay);
    }
  }

  throw lastError;
};


export const generateJSON = async (
  prompt,
  model = "gemini-2.5-flash-lite",
  maxOutputTokens = 8192
) => {
  const ai = getGeminiClient();

  const rawText = await withRetry(async () => {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        maxOutputTokens,
      },
    });

    const text = (response.text || "").trim();
    if (!text) throw new Error("Gemini returned an empty response");
    return text;
  });

  try {
    return safeParseJSON(rawText);
  } catch {
    try {
      return await repairJSONWithModel(ai, rawText, model, maxOutputTokens);
    } catch {
      throw new Error("Gemini returned invalid JSON (initial + repair attempt failed)");
    }
  }
};