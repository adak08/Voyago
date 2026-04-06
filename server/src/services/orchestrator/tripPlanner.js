const normalizeTier = (raw = "") => {
  const lower = raw.toLowerCase();
  if (["low", "budget", "cheap", "economy"].includes(lower)) return "low";
  if (["high", "luxury", "premium", "expensive"].includes(lower)) return "high";
  return "medium";
};


const resolveDates = (startDate, days) => {
  const start = startDate ? new Date(startDate) : new Date();
  const end = new Date(start);
  end.setDate(end.getDate() + Math.max(1, days) - 1);

  const fmt = (d) => d.toISOString().split("T")[0];
  return { startDate: fmt(start), endDate: fmt(end) };
};

const resolvePythonServiceBaseUrl = () => {
  const raw = process.env.PYTHON_SERVICE_URL || "http://127.0.0.1:8000";
  return raw.replace(/\/+$/, "");
};


export const planTrip = async ({
  destination,
  origin = "",
  days = 5,
  people = 1,
  budget = "medium",
  vibe = "balanced",
  preferences = "",
  startDate = null,
  currency = "INR",
} = {}) => {
  if (!destination) {
    return {
      success: false,
      error: "destination is required",
      generatedAt: new Date().toISOString(),
    };
  }

  const safeDays = Math.max(1, Math.min(30, Number(days) || 5));
  const safePeople = Math.max(1, Number(people) || 1);
  const tier = normalizeTier(budget);
  const { startDate: resolvedStart } = resolveDates(startDate, safeDays);
  const pythonServiceBaseUrl = resolvePythonServiceBaseUrl();

  console.log(
    `[Orchestrator] Calling Python AI service: ${pythonServiceBaseUrl}/plan | ${destination} | ${safeDays}d | ${tier}`
  );

  let pythonRes;
  try {
    pythonRes = await fetch(
      `${pythonServiceBaseUrl}/plan`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination,
          origin,
          days: safeDays,
          people: safePeople,
          budget: tier,
          vibe,
          preferences,
          start_date: resolvedStart,
          currency,
        }),
        signal: AbortSignal.timeout(120_000),
      }
    );
  } catch (error) {
    console.error("[Orchestrator] Could not reach Python AI service:", error?.message || error);
    return {
      success: false,
      error: `Could not connect to AI service at ${pythonServiceBaseUrl}. Ensure ai_service is running.`,
      generatedAt: new Date().toISOString(),
    };
  }

  if (!pythonRes.ok) {
    const err = await pythonRes.text();
    console.error("[Orchestrator] Python service error:", err);
    return {
      success: false,
      error: err,
      generatedAt: new Date().toISOString()
    };
  }

  const body = await pythonRes.json();

  if (!body.success) {
    console.error("[Orchestrator] Python returned error:", body.message);
    return {
      success: false,
      error: body.message,
      generatedAt: new Date().toISOString()
    };
  }

  return {
    success: true,
    ...body.data,
    generatedAt: new Date().toISOString(),
  };
};