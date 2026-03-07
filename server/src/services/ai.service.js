import OpenAI from "openai";

// const openai = process.env.OPENAI_API_KEY
//     ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
//     : null;


export const generateAIItinerary = async ({
    destination,
    days,
    vibe,
    preferences,
}) => {
  // if(!openai){
  //   throw new Error("Api Key is not visible");
    
  // }
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const prompt = `
You are a travel expert. Generate a detailed ${days}-day itinerary for ${destination} with a ${vibe || "balanced"} vibe.
${preferences ? `Additional preferences: ${preferences}` : ""}

Return ONLY a JSON array with this exact structure:
[
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

Include 4-6 activities per day. Be specific with locations and times. Include estimated costs in INR.
`;

    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 3000,
        response_format: { type: "json_object" },
    });

    let content = response.choices[0].message.content;

    // Parse the response
    const parsed = JSON.parse(content);
    // Handle both {itinerary: [...]} and [...] formats
    const itinerary = Array.isArray(parsed)
        ? parsed
        : parsed.itinerary || parsed.days || [];

    return itinerary;
};
