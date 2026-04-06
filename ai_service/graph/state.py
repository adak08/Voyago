from typing import TypedDict, Optional, List

class GraphState(TypedDict):
    # ── Input fields ──────────────────────
    destination: str
    origin: str
    days: int
    people: int
    budget_tier: str           # "low" | "medium" | "high"
    vibe: str
    preferences: str
    start_date: Optional[str]
    currency: str

    # ── Tool outputs ──────────────────────
    weather: Optional[dict]    # set by fetch_tools node
    route: Optional[dict]      # set by fetch_tools node
    budget: Optional[dict]     # set by fetch_tools node

    # ── Planner output ────────────────────
    itinerary: Optional[dict]  # set by planner node

    # ── Critic feedback ───────────────────
    issues: List[str]          # problems found by critic
    revised: bool              # True if critic triggered replanning
    iteration: int             # loop counter, max 3

    # ── Final assembled ───────────────────
    agent_status: dict         # { weather, route, budget, itinerary }
