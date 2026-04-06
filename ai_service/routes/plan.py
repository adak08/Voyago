from fastapi import APIRouter
from schemas.trip_schema import TripPlanRequest
from tools.weather_tool import get_weather
from tools.route_tool import get_route
from tools.budget_tool import estimate_budget, recompute_budget_from_itinerary
import os
from fastapi.responses import JSONResponse
from graph.builder import graph
from datetime import datetime, timedelta

router = APIRouter()

# ── Debug route 1 ─────────────────────────────────
@router.post("/plan-test")
async def plan_test(req: TripPlanRequest):
    """
    Runs all 3 tools directly — no graph, no LLM.
    Used to verify tool connectivity and API keys.
    """
    weather = await get_weather(
        req.destination, req.days, req.start_date
    )
    route = await get_route(req.origin, req.destination)
    budget = estimate_budget(
        req.destination, req.days, req.people,
        req.budget, req.currency
    )

    return {
        "weather": weather,
        "route": route,
        "budget": budget,
        "agentStatus": {
            "weather":  "ok" if weather["available"] else "unavailable",
            "route":    "ok" if route["available"] else "unavailable",
            "budget":   "ok"
        }
    }

# ── Debug route 2 ─────────────────────────────────
@router.get("/agents/status")
def agents_status():
    """
    Returns which API keys are configured in environment.
    """
    google_key    = os.getenv("GOOGLE_API_KEY", "")
    weather_key   = os.getenv("OPENWEATHER_KEY", "")
    ors_key       = os.getenv("ORS_API_KEY", "")

    configured = {
        "gemini":      bool(google_key),
        "openweather": bool(weather_key),
        "ors":         bool(ors_key),
    }

    return {
        "configured": configured,
        "allReady": all(configured.values())
    }

# ── Main plan endpoint ─────────────────────────────
@router.post("/plan")
async def plan_trip(req: TripPlanRequest):
    """
    Generate complete travel itinerary using LangGraph.
    Fetches tools, generates plan via LLM, validates with critic.
    """
    try:
        # 1. Resolve dates
        if req.start_date:
            start    = datetime.strptime(req.start_date, "%Y-%m-%d")
            end      = start + timedelta(days=req.days - 1)
            end_date = end.strftime("%Y-%m-%d")
        else:
            end_date = None

        # 2. Build initial GraphState
        initial_state = {
            "destination":  req.destination,
            "origin":       req.origin or "",
            "days":         req.days,
            "people":       req.people,
            "budget_tier":  req.budget,
            "vibe":         req.vibe,
            "preferences":  req.preferences or "",
            "start_date":   req.start_date,
            "currency":     req.currency,
            "weather":      None,
            "route":        None,
            "budget":       None,
            "itinerary":    None,
            "issues":       [],
            "revised":      False,
            "iteration":    0,
            "agent_status": {},
        }

        # 3. Run graph
        final_state = await graph.ainvoke(initial_state)

        # 4. Extract results
        weather   = final_state.get("weather",   {})
        route     = final_state.get("route",     {})
        budget    = final_state.get("budget",    {})
        itinerary = final_state.get("itinerary", {})

        # Make budget reflect actual itinerary activity costs when available.
        budget = recompute_budget_from_itinerary(
            budget,
            itinerary,
            req.days,
            req.people,
        )

        # 5. Assemble response
        response = {
            "meta": {
                "destination": req.destination,
                "origin":      req.origin or "",
                "days":        req.days,
                "people":      req.people,
                "budget_tier": req.budget,
                "vibe":        req.vibe,
                "preferences": req.preferences or "",
                "start_date":  req.start_date,
                "end_date":    end_date,
                "currency":    req.currency,
            },
            "weather":   weather,
            "route":     route,
            "budget":    budget,
            "itinerary": itinerary,
            "agentStatus": {
                "weather":   "ok" if weather.get("available")   else "unavailable",
                "route":     "ok" if route.get("available")     else "unavailable",
                "budget":    "ok",
                "itinerary": "ok" if itinerary.get("available") else "unavailable",
            }
        }

        return { "success": True, "data": response }

    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={ "success": False, "message": str(e) }
        )
