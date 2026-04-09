import os
import json
from langchain_google_genai import ChatGoogleGenerativeAI
from graph.state import GraphState

llm = ChatGoogleGenerativeAI(
    model=os.getenv("GEMINI_MODEL", "gemini-2.5-flash"),
    google_api_key=os.getenv("GEMINI_API_KEY"),
    temperature=0.7,
    convert_system_message_to_human=True,
)

SYSTEM_PROMPT = """You are an expert travel planner for Indian and international destinations.
Always return valid JSON only. Never use markdown fences or code blocks.
Generate realistic, specific, location-accurate itineraries.
Every activity must have real place names, accurate timings, and practical local tips."""

def _unique_non_empty(items, limit=8) -> list:
    unique = []
    for item in items:
        text = str(item).strip() if item is not None else ""
        if text and text not in unique:
            unique.append(text)
        if len(unique) >= limit:
            break
    return unique

async def planner_node(state: GraphState) -> GraphState:
    """
    Generate itinerary using LLM.
    Handles chunking for trips > 3 days.
    Fills missing days with fallback.
    """
    try:
        weather = state.get("weather", {})
        route = state.get("route", {})
        budget = state.get("budget", {})
        destination = state.get("destination", "")
        days = state.get("days", 0)
        people = state.get("people", 1)
        budget_tier = state.get("budget_tier", "medium")
        vibe = state.get("vibe", "balanced")
        preferences = state.get("preferences", "")
        start_date = state.get("start_date")
        currency = state.get("currency", "INR")
        critic_issues = state.get("issues", []) or []
        iteration = int(state.get("iteration", 0) or 0)
        revised = bool(state.get("revised", False))

        # Determine if we need to chunk
        if days <= 3:
            chunks = [days]
        else:
            chunks = [3] * (days // 3)
            if days % 3 != 0:
                chunks.append(days % 3)

        all_days = []
        all_highlights = []
        all_packing_tips = []
        all_local_cuisine = []
        day_counter = 1

        for chunk_size in chunks:
            critic_guidance = ""
            if revised and critic_issues:
                issues_text = "\n".join([f"- {issue}" for issue in critic_issues])
                critic_guidance = f"""

REVISION CONTEXT:
- This is revision attempt #{iteration} after critic validation.
- You MUST fix all issues below in this output:
{issues_text}
"""

            user_prompt = f"""Generate a detailed {chunk_size}-day travel itinerary for {people} people
going from {state.get('origin', '')} to {destination}.

Trip details:
- Vibe: {vibe}
- Preferences: {preferences}
- Budget tier: {budget_tier}
- Currency: {currency}
- Start date: {start_date}

Weather forecast:
{json.dumps(weather, indent=2)}

Route information:
{json.dumps(route, indent=2)}

Budget breakdown:
{json.dumps(budget, indent=2)}

{critic_guidance}

IMPORTANT RULES:
1. Generate EXACTLY {chunk_size} day objects — no more, no less
2. Each day must have 4-6 activities
3. activity category must be one of: food|travel|activity|accommodation|other
4. All costs must be in {currency} and realistic for {budget_tier} tier
5. Sum of all activity costs must NOT exceed budget total
6. Use real place names, real timings, real local tips
7. Return ONLY valid JSON matching this exact schema:

{{
  "available": true,
  "destination": "{destination}",
  "highlights": ["highlight1", "highlight2", "highlight3"],
  "packing_tips": ["tip1", "tip2", "tip3"],
  "local_cuisine": ["dish1", "dish2", "dish3"],
  "generatedByAI": true,
  "days": [
    {{
      "day": 1,
      "title": "Day title",
      "weather_note": "Weather note based on forecast",
      "day_summary": "Brief summary of the day",
      "estimated_day_cost": 7500,
      "activities": [
        {{
          "time": "10:00 AM",
          "title": "Activity title",
          "description": "Detailed description",
          "location": "Exact place name",
          "category": "travel",
          "cost": 800,
          "duration_minutes": 90,
          "tips": "Practical local tip",
          "source": "ai"
        }}
      ]
    }}
  ]
}}
"""

            response = await llm.ainvoke([
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt}
            ])

            response_text = response.content
            # Remove markdown fences if present
            if response_text.startswith("```"):
                response_text = response_text.split("```")[1]
                if response_text.startswith("json"):
                    response_text = response_text[4:]
                response_text = response_text.strip()

            itinerary_chunk = json.loads(response_text)

            all_highlights.extend(itinerary_chunk.get("highlights", []))
            all_packing_tips.extend(itinerary_chunk.get("packing_tips", []))
            all_local_cuisine.extend(itinerary_chunk.get("local_cuisine", []))
            
            # Renumber days
            for day_obj in itinerary_chunk.get("days", []):
                day_obj["day"] = day_counter
                all_days.append(day_obj)
                day_counter += 1

        # Fill missing days with fallback
        while len(all_days) < days:
            fallback = {
                "day": day_counter,
                "title": f"Day {day_counter} in {destination}",
                "weather_note": "Check local weather",
                "day_summary": f"Explore {destination} at your own pace",
                "estimated_day_cost": budget.get("breakdown", {}).get("per_day", 3000),
                "activities": [
                    {
                        "time": "09:00 AM",
                        "title": "Morning Exploration",
                        "description": f"Explore local attractions in {destination}",
                        "location": destination,
                        "category": "activity",
                        "cost": 500,
                        "duration_minutes": 120,
                        "tips": "Ask hotel staff for local recommendations",
                        "source": "ai"
                    },
                    {
                        "time": "01:00 PM",
                        "title": "Local Lunch",
                        "description": "Try local cuisine at a nearby restaurant",
                        "location": f"Local restaurant in {destination}",
                        "category": "food",
                        "cost": 400,
                        "duration_minutes": 60,
                        "tips": "Ask locals for restaurant recommendations",
                        "source": "ai"
                    },
                    {
                        "time": "04:00 PM",
                        "title": "Evening Activity",
                        "description": f"Evening leisure in {destination}",
                        "location": destination,
                        "category": "activity",
                        "cost": 300,
                        "duration_minutes": 90,
                        "tips": "Carry water and sunscreen",
                        "source": "ai"
                    }
                ]
            }
            all_days.append(fallback)
            day_counter += 1

        state["itinerary"] = {
            "available": True,
            "destination": destination,
            "highlights": _unique_non_empty(all_highlights) or [
                "Must-visit local landmarks",
                "Local neighborhood exploration",
                "Sunset viewpoint"
            ],
            "packing_tips": _unique_non_empty(all_packing_tips) or [
                "Check weather forecast before departure",
                "Pack comfortable walking shoes",
                "Carry sunscreen and a reusable water bottle"
            ],
            "local_cuisine": _unique_non_empty(all_local_cuisine) or [
                "Regional specialty dishes",
                "Street food favorites",
                "Popular local dessert"
            ],
            "generatedByAI": True,
            "days": all_days
        }

        return state

    except Exception as e:
        state["itinerary"] = {
            "available": False,
            "destination": state.get("destination", ""),
            "days": [],
            "highlights": [],
            "packing_tips": [],
            "local_cuisine": [],
            "generatedByAI": False,
            "error": str(e)
        }
        return state
