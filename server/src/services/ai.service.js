// 1. Notice the new package import
import { GoogleGenAI } from "@google/genai";

export const generateAIItinerary = async ({
    destination,
    days,
    vibe,
    preferences,
}) => {
    try {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error("Gemini API key not configured");
        }

        // 2. The new SDK initializes slightly differently
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

        const prompt = `
You are a travel expert.

Generate a detailed ${days}-day itinerary for ${destination}.

Travel vibe: ${vibe || "balanced"}
Preferences: ${preferences || "none"}

Return ONLY valid JSON strictly matching this schema:

{
  "days": [
    {
      "day": 1,
      "title": "Day title",
      "activities": [
        {
          "time": "9:00 AM",
          "title": "Activity name",
          "description": "Brief description",
          "location": "Specific location",
          "category": "food|travel|activity|accommodation|other",
          "cost": 500
        }
      ]
    }
  ]
}

Include 4-6 activities per day.
Use realistic places and estimated costs in INR.
`;

        // 3. The generation method now sits under "ai.models"
        // and configuration options are passed inside a "config" object
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
            },
        });

        // 4. IMPORTANT: In the new SDK, 'text' is a property, NOT a method!
        // (Old SDK: result.response.text(), New SDK: response.text)
        const text = response.text;

        const parsed = JSON.parse(text);

        (parsed.days || []).forEach((day) => {
            day.activities.forEach((activity) => {
                activity.source = "ai";
            });
        });

        return parsed.days || [];
    } catch (error) {
        console.error("Gemini AI Error:", error);
        throw new Error("Failed to generate itinerary using Gemini AI");
    }
};
