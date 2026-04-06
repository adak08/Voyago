COST_INDEX = {
    "goa":         3500,
    "manali":      3000,
    "jaipur":      2500,
    "kerala":      3200,
    "bali":        4000,
    "dubai":       8000,
    "mumbai":      4500,
    "delhi":       3000,
    "bangalore":   3500,
    "shimla":      2800,
}

ACTIVITY_TO_BUDGET_BUCKET = {
    "travel": "transport",
    "transport": "transport",
    "food": "food",
    "meal": "food",
    "accommodation": "hotel",
    "hotel": "hotel",
    "stay": "hotel",
    "activity": "activities",
    "other": "activities",
}

TIER_MULTIPLIERS = {
    "low":    0.6,
    "medium": 1.0,
    "high":   1.8,
    "budget": 0.6,
    "luxury": 2.5,
}

TIPS_MAP = {
    ("low", "budget"): [
        "Travel in off-season for lower prices",
        "Use public transport instead of cabs",
        "Cook your own meals when possible",
        "Look for free attractions and walking tours",
        "Book accommodation on hostel apps"
    ],
    "medium": [
        "Book transport 2 weeks in advance",
        "Use UPI payments for local discounts",
        "Mix free beaches/parks with paid activities",
        "Eat at local restaurants over tourist spots",
        "Use group tour packages to save on activities"
    ],
    ("high", "luxury"): [
        "Pre-book premium experiences to avoid last-minute surcharges",
        "Choose curated local experiences over generic tours",
        "Use concierge services for best restaurant reservations",
        "Consider private transfers for comfort and reliability"
    ]
}

def get_tips(tier: str) -> list:
    """Return 3-5 tips based on budget tier."""
    tier_lower = tier.lower()
    
    if tier_lower in ("low", "budget"):
        return TIPS_MAP[("low", "budget")]
    elif tier_lower == "medium":
        return TIPS_MAP["medium"]
    elif tier_lower in ("high", "luxury"):
        return TIPS_MAP[("high", "luxury")]
    else:
        return TIPS_MAP["medium"]  # default

def estimate_budget(destination: str, days: int, people: int,
                    tier: str, currency: str) -> dict:
    """
    Estimate trip budget with breakdown.
    
    Pure rule-based. NO external API.
    """
    
    # Get base cost per person per day
    base_per_person_per_day = COST_INDEX.get(destination.lower(), 3000)
    
    # Get multiplier for tier
    multiplier = TIER_MULTIPLIERS.get(tier.lower(), 1.0)
    
    # Calculate total
    daily_per_person = base_per_person_per_day * multiplier
    total = daily_per_person * days * people
    
    # Breakdown by category (percentages)
    transport  = round(total * 0.25)
    hotel      = round(total * 0.40)
    food       = round(total * 0.20)
    activities = round(total * 0.15)
    
    # Per-person and per-day averages
    per_person = round(total / people)
    per_day    = round(total / days)
    
    return {
        "available": True,
        "destination": destination,
        "days": days,
        "people": people,
        "tier": tier,
        "currency": currency,
        "breakdown": {
            "transport":  transport,
            "hotel":      hotel,
            "food":       food,
            "activities": activities,
            "total":      total,
            "per_person": per_person,
            "per_day":    per_day
        },
        "tips": get_tips(tier)
    }

def _to_numeric_cost(raw_cost) -> float:
    """Parse activity cost safely from numbers or string values."""
    if raw_cost is None:
        return 0.0
    if isinstance(raw_cost, (int, float)):
        return max(0.0, float(raw_cost))
    if isinstance(raw_cost, str):
        filtered = "".join(ch for ch in raw_cost if ch.isdigit() or ch == ".")
        if not filtered:
            return 0.0
        try:
            return max(0.0, float(filtered))
        except ValueError:
            return 0.0
    return 0.0

def recompute_budget_from_itinerary(base_budget: dict, itinerary: dict,
                                    days: int, people: int) -> dict:
    """
    Recompute budget breakdown from itinerary activity-level costs.

    Falls back to the base rule-based budget when itinerary costs are missing.
    """
    if not isinstance(base_budget, dict):
        return base_budget
    if not isinstance(itinerary, dict) or not itinerary.get("available"):
        return base_budget

    day_items = itinerary.get("days", []) or []
    if not day_items:
        return base_budget

    buckets = {
        "transport": 0.0,
        "hotel": 0.0,
        "food": 0.0,
        "activities": 0.0,
    }

    for day in day_items:
        for activity in day.get("activities", []) or []:
            amount = _to_numeric_cost(activity.get("cost", 0))
            category = str(activity.get("category", "activity")).strip().lower()
            bucket = ACTIVITY_TO_BUDGET_BUCKET.get(category, "activities")
            buckets[bucket] += amount

    total = sum(buckets.values())
    if total <= 0:
        return base_budget

    safe_people = max(1, int(people or 1))
    safe_days = max(1, int(days or len(day_items) or 1))

    dynamic_breakdown = {
        "transport": int(round(buckets["transport"])),
        "hotel": int(round(buckets["hotel"])),
        "food": int(round(buckets["food"])),
        "activities": int(round(buckets["activities"])),
        "total": int(round(total)),
        "per_person": int(round(total / safe_people)),
        "per_day": int(round(total / safe_days)),
    }

    merged = dict(base_budget)
    merged["breakdown"] = dynamic_breakdown
    merged["source"] = "itinerary"
    return merged
