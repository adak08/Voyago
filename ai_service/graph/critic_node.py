from graph.state import GraphState

async def critic_node(state: GraphState) -> GraphState:
    """
    Validate itinerary quality and identify issues.
    Checks: day count, activity count, budget, weather conflicts, required fields.
    """
    itinerary = state.get("itinerary", {})
    weather = state.get("weather", {})
    budget = state.get("budget", {})
    expected_days = state.get("days", 0)
    
    issues = []
    
    # If itinerary unavailable, skip all checks
    if not itinerary.get("available"):
        state["issues"] = []
        return state
    
    days_list = itinerary.get("days", [])
    
    # CHECK 1: Day count mismatch
    if len(days_list) != expected_days:
        issues.append(
            f"Day count mismatch: got {len(days_list)} days, expected {expected_days}"
        )
    
    # CHECK 2: Activity count per day
    for day_obj in days_list:
        activities = day_obj.get("activities", [])
        if len(activities) < 3:
            issues.append(
                f"Day {day_obj.get('day', '?')} has only {len(activities)} activities, minimum is 3"
            )
    
    # CHECK 3: Budget alignment
    total_activity_cost = 0
    for day_obj in days_list:
        for activity in day_obj.get("activities", []):
            total_activity_cost += activity.get("cost", 0)
    
    budget_total = budget.get("breakdown", {}).get("total", 0)
    if budget_total > 0 and total_activity_cost > budget_total * 1.2:
        issues.append(
            f"Total activity cost {total_activity_cost} exceeds budget {budget_total} by >20%"
        )
    
    # CHECK 4: Weather conflicts
    forecast_by_day = {}
    for forecast_item in weather.get("forecast", []):
        forecast_by_day[forecast_item.get("day")] = forecast_item
    
    for day_obj in days_list:
        day_num = day_obj.get("day")
        forecast = forecast_by_day.get(day_num, {})
        condition = forecast.get("condition", "")
        
        if condition in ("Rainy", "Thunderstorm"):
            outdoor_activities = [
                a for a in day_obj.get("activities", [])
                if a.get("category") == "activity"
            ]
            all_activities = day_obj.get("activities", [])
            
            if all_activities and len(outdoor_activities) / len(all_activities) > 0.5:
                issues.append(
                    f"Day {day_num} is {condition} but has too many outdoor activities"
                )
    
    # CHECK 5: Required fields in activities
    required_fields = ["time", "title", "location", "category"]
    for day_obj in days_list:
        for activity in day_obj.get("activities", []):
            missing = [f for f in required_fields if f not in activity or not activity.get(f)]
            if missing:
                issues.append(
                    f"Day {day_obj.get('day')} activity missing fields: {missing}"
                )
    
    state["issues"] = issues
    return state
