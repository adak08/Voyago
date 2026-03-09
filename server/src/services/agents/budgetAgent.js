const COST_INDEX = {
  // Domestic popular
  goa:         { low: 1800, medium: 3500, high: 7000 },
  manali:      { low: 1500, medium: 2800, high: 5500 },
  jaipur:      { low: 1200, medium: 2200, high: 4500 },
  kerala:      { low: 1600, medium: 3000, high: 6000 },
  ladakh:      { low: 2000, medium: 3800, high: 7500 },
  rishikesh:   { low: 1000, medium: 2000, high: 4000 },
  mumbai:      { low: 2200, medium: 4000, high: 8000 },
  delhi:       { low: 2000, medium: 3500, high: 7000 },
  bangalore:   { low: 2200, medium: 4000, high: 8000 },
  kolkata:     { low: 1500, medium: 2800, high: 5500 },
  hyderabad:   { low: 1800, medium: 3200, high: 6500 },
  // International
  dubai:       { low: 5000, medium: 10000, high: 25000 },
  singapore:   { low: 6000, medium: 12000, high: 28000 },
  bangkok:     { low: 3500, medium: 7000, high: 15000 },
  bali:        { low: 3000, medium: 6000, high: 14000 },
  paris:       { low: 8000, medium: 15000, high: 35000 },
  london:      { low: 9000, medium: 18000, high: 40000 },
  tokyo:       { low: 7000, medium: 14000, high: 30000 },
  // Default fallback
  default:     { low: 2000, medium: 4000, high: 9000 },
};

// Cost split ratios by category (they must sum to 1)
const SPLIT = {
  transport:  0.25,
  hotel:      0.40,
  food:       0.20,
  activities: 0.15,
};

// One-way transport cost multipliers relative to total daily budget * days
const TRANSPORT_MULTIPLIER = { low: 0.15, medium: 0.22, high: 0.30 };

/**
 * Resolve per-day cost for a destination.
 * @param {string} destination
 * @param {"low"|"medium"|"high"} tier
 * @returns {number} cost per person per day in INR
 */
const getPerDayCost = (destination = "", tier = "medium") => {
  const key = Object.keys(COST_INDEX).find((k) =>
    destination.toLowerCase().includes(k)
  );
  const index = key ? COST_INDEX[key] : COST_INDEX.default;
  return index[tier] || index.medium;
};

/**
 * Estimate the total budget breakdown for a trip.
 *
 * @param {object} params
 * @param {string}  params.destination
 * @param {number}  params.days
 * @param {number}  [params.people=1]       - Number of travellers
 * @param {"low"|"medium"|"high"} [params.tier="medium"]
 * @param {string}  [params.currency="INR"] - Display currency label
 * @returns {Promise<{
 *   available: boolean,
 *   destination: string,
 *   days: number,
 *   people: number,
 *   tier: string,
 *   currency: string,
 *   breakdown: {
 *     transport: number,
 *     hotel: number,
 *     food: number,
 *     activities: number,
 *     total: number,
 *     per_person: number,
 *     per_day: number
 *   },
 *   tips: string[],
 *   summary: string
 * }>}
 */
export const estimateBudget = async ({
  destination = "India",
  days = 5,
  people = 1,
  tier = "medium",
  currency = "INR",
} = {}) => {
  try {
    const safeDays = Math.max(1, Number(days) || 5);
    const safePeople = Math.max(1, Number(people) || 1);
    const safeTier = ["low", "medium", "high"].includes(tier)
      ? tier
      : "medium";

    const perDayCost = getPerDayCost(destination, safeTier);
    const totalDailyCost = perDayCost * safeDays * safePeople;

    // Separate out transport (one-time, not per-day)
    const transportMultiplier = TRANSPORT_MULTIPLIER[safeTier] || 0.22;
    const transportCost = Math.round(
      perDayCost * safeDays * safePeople * transportMultiplier
    );

    // Remaining budget distributed across hotel, food, activities
    const remainingCost = totalDailyCost - transportCost;
    const hotelCost = Math.round(
      remainingCost * (SPLIT.hotel / (1 - SPLIT.transport))
    );
    const foodCost = Math.round(
      remainingCost * (SPLIT.food / (1 - SPLIT.transport))
    );
    const activitiesCost = Math.round(
      remainingCost * (SPLIT.activities / (1 - SPLIT.transport))
    );

    const total = transportCost + hotelCost + foodCost + activitiesCost;
    const perPerson = Math.round(total / safePeople);
    const perDay = Math.round(total / safeDays);

    // Generate tier-specific saving tips
    const tips = buildTips(safeTier, destination);

    const summary =
      `Estimated ${safeTier} budget for ${safePeople} person${safePeople > 1 ? "s" : ""} ` +
      `in ${destination} for ${safeDays} day${safeDays > 1 ? "s" : ""}: ` +
      `${currency} ${total.toLocaleString("en-IN")} total ` +
      `(${currency} ${perPerson.toLocaleString("en-IN")} per person).`;

    return {
      available: true,
      destination,
      days: safeDays,
      people: safePeople,
      tier: safeTier,
      currency,
      breakdown: {
        transport: transportCost,
        hotel: hotelCost,
        food: foodCost,
        activities: activitiesCost,
        total,
        per_person: perPerson,
        per_day: perDay,
      },
      tips,
      summary,
    };
  } catch (error) {
    console.error("[BudgetAgent] Error:", error.message);
    return {
      available: false,
      destination,
      days,
      people,
      tier,
      currency,
      breakdown: {
        transport: 0, hotel: 0, food: 0, activities: 0,
        total: 0, per_person: 0, per_day: 0,
      },
      tips: [],
      summary: "Budget estimation unavailable.",
      error: error.message,
    };
  }
};

/** Return saving tips based on budget tier */
const buildTips = (tier, destination) => {
  const base = [
    "Book transport and accommodation at least 2 weeks in advance for better rates.",
    "Use UPI / digital payments to avoid currency conversion fees.",
    "Check Google Maps for local eateries instead of tourist restaurants.",
  ];

  const tierTips = {
    low: [
      "Consider shared dormitories or homestays to cut accommodation costs.",
      "Travel on overnight trains/buses to save on one night's stay.",
      "Buy local SIM cards on arrival — cheaper than roaming.",
    ],
    medium: [
      "Look for hotels with free breakfast included.",
      "Mix free attractions (beaches, temples) with paid activities.",
      "Use ride-sharing apps instead of metered taxis.",
    ],
    high: [
      "Premium beach resorts often include meals — compare package deals.",
      "Private guided tours offer flexibility for luxury travellers.",
      "Book airport transfers in advance to avoid surge pricing.",
    ],
  };

  return [...base, ...(tierTips[tier] || tierTips.medium)].slice(0, 5);
};