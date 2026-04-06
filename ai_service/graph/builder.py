import asyncio
from langgraph.graph import StateGraph, END
from graph.state import GraphState
from graph.planner_node import planner_node
from graph.critic_node import critic_node
from tools.weather_tool import get_weather
from tools.route_tool import get_route
from tools.budget_tool import estimate_budget

# ── fetch_tools node ──────────────────────────────
async def fetch_tools_node(state: GraphState) -> GraphState:
    """Runs all 3 tools in parallel using asyncio.gather"""
    weather, route = await asyncio.gather(
        get_weather(
            state["destination"],
            state["days"],
            state.get("start_date")
        ),
        get_route(state["origin"], state["destination"]),
    )
    budget = estimate_budget(
        state["destination"],
        state["days"],
        state["people"],
        state["budget_tier"],
        state["currency"],
    )
    state["weather"] = weather
    state["route"]   = route
    state["budget"]  = budget
    return state

# ── should_retry conditional edge ────────────────
def should_retry(state: GraphState) -> str:
    """
    If critic found issues AND we haven't hit max iterations,
    loop back to planner. Otherwise end.
    """
    if state["issues"] and state["iteration"] < 3:
        state["iteration"] += 1
        state["revised"] = True
        return "planner"
    return END

# ── Build and compile graph ───────────────────────
def build_graph():
    builder = StateGraph(GraphState)

    builder.add_node("fetch_tools", fetch_tools_node)
    builder.add_node("planner",     planner_node)
    builder.add_node("critic",      critic_node)

    builder.set_entry_point("fetch_tools")
    builder.add_edge("fetch_tools", "planner")
    builder.add_edge("planner",     "critic")
    builder.add_conditional_edges(
        "critic",
        should_retry,
        {
            "planner": "planner",
            END:       END
        }
    )

    return builder.compile()

graph = build_graph()
