import {
  MODEL_TIERS,
  MODEL_COST_PER_1K,
  getModelTier,
  UserModelBreakdown,
  UserEfficiencyRow,
  TeamModelAggregate,
  EfficiencyRecommendation,
  EfficiencyDashboardData,
} from "./types";

// ============================================
// Efficiency Score Formula (transparent)
// ============================================

export const EFFICIENCY_SCORE_FORMULA =
  "Score = 100 − (premium_pct × 0.4) − max(0, (500 − avg_tokens) × 0.06 × premium_pct / 100). " +
  "Penalizes high premium model usage on low-token requests. " +
  "Thresholds: ≥75 = Green, 50–74 = Amber, <50 = Red.";

function computeEfficiencyScore(avgTokens: number, premiumPct: number): number {
  const basePenalty = premiumPct * 0.4;
  const shortRequestPenalty =
    avgTokens < 500 ? (500 - avgTokens) * 0.06 * (premiumPct / 100) : 0;
  const score = Math.round(Math.max(0, Math.min(100, 100 - basePenalty - shortRequestPenalty)));
  return score;
}

function getEfficiencyRating(score: number): "green" | "amber" | "red" {
  if (score >= 75) return "green";
  if (score >= 50) return "amber";
  return "red";
}

// ============================================
// Seeded random for deterministic demo data
// ============================================

let seed = 77;
function seededRandom(): number {
  seed = (seed * 16807 + 0) % 2147483647;
  return (seed - 1) / 2147483646;
}
function randBetween(min: number, max: number): number {
  return Math.floor(seededRandom() * (max - min + 1)) + min;
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(seededRandom() * arr.length)];
}

// ============================================
// User profiles — varied efficiency patterns
// ============================================

interface UserProfile {
  email: string;
  premiumBias: number;   // 0-1, higher = uses more premium
  avgTokenRange: [number, number];
  requestRange: [number, number];
}

const USER_PROFILES: UserProfile[] = [
  // Efficient users — low premium, reasonable tokens
  { email: "sarah.chen@acme.dev", premiumBias: 0.15, avgTokenRange: [800, 1400], requestRange: [120, 180] },
  { email: "priya.patel@acme.dev", premiumBias: 0.20, avgTokenRange: [600, 1000], requestRange: [90, 140] },
  { email: "ethan.clark@acme.dev", premiumBias: 0.10, avgTokenRange: [500, 900], requestRange: [80, 130] },
  { email: "noah.patel@acme.dev", premiumBias: 0.12, avgTokenRange: [700, 1100], requestRange: [60, 100] },

  // Moderate users — mixed patterns
  { email: "marcus.johnson@acme.dev", premiumBias: 0.45, avgTokenRange: [500, 800], requestRange: [100, 160] },
  { email: "alex.rivera@acme.dev", premiumBias: 0.40, avgTokenRange: [400, 700], requestRange: [110, 170] },
  { email: "jordan.kim@acme.dev", premiumBias: 0.50, avgTokenRange: [450, 750], requestRange: [70, 120] },
  { email: "nina.rodriguez@acme.dev", premiumBias: 0.55, avgTokenRange: [550, 850], requestRange: [95, 145] },
  { email: "olivia.zhang@acme.dev", premiumBias: 0.35, avgTokenRange: [600, 950], requestRange: [80, 130] },
  { email: "ben.nguyen@acme.dev", premiumBias: 0.42, avgTokenRange: [480, 780], requestRange: [75, 115] },

  // High premium users — potential waste
  { email: "tyler.brooks@acme.dev", premiumBias: 0.80, avgTokenRange: [200, 450], requestRange: [130, 200] },
  { email: "liam.foster@acme.dev", premiumBias: 0.75, avgTokenRange: [250, 500], requestRange: [100, 160] },
  { email: "aria.martinez@acme.dev", premiumBias: 0.70, avgTokenRange: [300, 550], requestRange: [85, 140] },
  { email: "kai.nakamura@acme.dev", premiumBias: 0.65, avgTokenRange: [350, 600], requestRange: [90, 135] },

  // Ghost / low activity
  { email: "emma.wilson@acme.dev", premiumBias: 0.30, avgTokenRange: [300, 500], requestRange: [5, 15] },
  { email: "david.lee@acme.dev", premiumBias: 0.25, avgTokenRange: [400, 600], requestRange: [3, 10] },
];

function generateUserModelBreakdown(profile: UserProfile): UserModelBreakdown[] {
  const totalRequests = randBetween(profile.requestRange[0], profile.requestRange[1]);
  const breakdownMap: Record<string, { requests: number; tokens: number }> = {};

  for (let i = 0; i < totalRequests; i++) {
    const roll = seededRandom();
    let model: string;
    if (roll < profile.premiumBias) {
      model = pick(MODEL_TIERS.premium);
    } else if (roll < profile.premiumBias + 0.35) {
      model = pick(MODEL_TIERS.mid);
    } else {
      model = pick(MODEL_TIERS.efficient);
    }

    const tokens = randBetween(profile.avgTokenRange[0] * 0.3, profile.avgTokenRange[1] * 1.5);

    if (!breakdownMap[model]) breakdownMap[model] = { requests: 0, tokens: 0 };
    breakdownMap[model].requests++;
    breakdownMap[model].tokens += tokens;
  }

  return Object.entries(breakdownMap)
    .map(([model, data]) => ({
      model_name: model,
      tier: getModelTier(model),
      request_count: data.requests,
      total_tokens: data.tokens,
      avg_tokens: Math.round(data.tokens / data.requests),
      pct_of_requests: Math.round((data.requests / totalRequests) * 100),
    }))
    .sort((a, b) => b.request_count - a.request_count);
}

function computePotentialSaving(breakdown: UserModelBreakdown[]): number {
  let saving = 0;
  const midCost = MODEL_COST_PER_1K["claude-sonnet-4"];

  breakdown.forEach((b) => {
    if (b.tier === "premium" && b.avg_tokens < 500) {
      const premiumCost = MODEL_COST_PER_1K[b.model_name] || 0.06;
      const costDiff = premiumCost - midCost;
      saving += (b.total_tokens / 1000) * costDiff;
    }
  });

  return Math.round(saving * 100) / 100;
}

// ============================================
// Public API
// ============================================

export function generateDemoEfficiencyData(): EfficiencyDashboardData {
  seed = 77; // reset for deterministic output

  const users: UserEfficiencyRow[] = USER_PROFILES.map((profile) => {
    const breakdown = generateUserModelBreakdown(profile);
    const totalRequests = breakdown.reduce((s, b) => s + b.request_count, 0);
    const totalTokens = breakdown.reduce((s, b) => s + b.total_tokens, 0);
    const avgTokens = totalRequests > 0 ? Math.round(totalTokens / totalRequests) : 0;
    const premiumRequests = breakdown
      .filter((b) => b.tier === "premium")
      .reduce((s, b) => s + b.request_count, 0);
    const premiumPct = totalRequests > 0 ? Math.round((premiumRequests / totalRequests) * 100) : 0;
    const score = computeEfficiencyScore(avgTokens, premiumPct);
    const mostUsedModel = breakdown[0]?.model_name || "—";
    const saving = computePotentialSaving(breakdown);

    return {
      user_email: profile.email,
      most_used_model: mostUsedModel,
      avg_tokens_per_request: avgTokens,
      total_requests: totalRequests,
      premium_usage_pct: premiumPct,
      efficiency_score: score,
      efficiency_rating: getEfficiencyRating(score),
      model_breakdown: breakdown,
      potential_saving: saving,
    };
  });

  // Team aggregate
  const aggMap: Record<string, { requests: number; tokens: number }> = {};
  users.forEach((u) => {
    u.model_breakdown.forEach((b) => {
      if (!aggMap[b.model_name]) aggMap[b.model_name] = { requests: 0, tokens: 0 };
      aggMap[b.model_name].requests += b.request_count;
      aggMap[b.model_name].tokens += b.total_tokens;
    });
  });
  const totalTeamRequests = Object.values(aggMap).reduce((s, v) => s + v.requests, 0);
  const teamAggregate: TeamModelAggregate[] = Object.entries(aggMap)
    .map(([model, data]) => ({
      model_name: model,
      tier: getModelTier(model),
      total_requests: data.requests,
      total_tokens: data.tokens,
      pct_of_requests: Math.round((data.requests / totalTeamRequests) * 100),
    }))
    .sort((a, b) => b.total_requests - a.total_requests);

  const teamAvgScore = Math.round(users.reduce((s, u) => s + u.efficiency_score, 0) / users.length);
  const totalPotentialSaving = Math.round(users.reduce((s, u) => s + u.potential_saving, 0) * 100) / 100;

  // Recommendations — rule-based, never judgmental
  const recommendations: EfficiencyRecommendation[] = [];

  const lowTokenPremiumUsers = users.filter(
    (u) => u.avg_tokens_per_request < 400 && u.premium_usage_pct > 60
  );
  if (lowTokenPremiumUsers.length > 0) {
    recommendations.push({
      type: "pattern",
      message: `${lowTokenPremiumUsers.length} user${lowTokenPremiumUsers.length > 1 ? "s" : ""} averaged under 400 tokens per premium model request this week. Consider defaulting to Sonnet for shorter tasks.`,
      severity: "warning",
    });
  }

  const highPremiumUsers = users.filter((u) => u.premium_usage_pct > 70 && u.total_requests > 50);
  if (highPremiumUsers.length > 0) {
    recommendations.push({
      type: "suggestion",
      message: `${highPremiumUsers.length} user${highPremiumUsers.length > 1 ? "s have" : " has"} premium model usage above 70%. Reviewing model selection defaults could reduce costs by ~$${totalPotentialSaving.toFixed(2)}/month.`,
      severity: "info",
    });
  }

  const redUsers = users.filter((u) => u.efficiency_rating === "red");
  if (redUsers.length > 0) {
    recommendations.push({
      type: "pattern",
      message: `${redUsers.length} team member${redUsers.length > 1 ? "s" : ""} scored below 50 on model efficiency. This pattern often indicates premium models being used for quick lookups or simple completions.`,
      severity: "warning",
    });
  }

  // Spike detection (simulated)
  recommendations.push({
    type: "spike",
    message: "Copilot premium requests spiked 3x on Tuesday — unusual pattern worth reviewing.",
    severity: "info",
  });

  if (teamAvgScore >= 65) {
    recommendations.push({
      type: "suggestion",
      message: `Team average efficiency score is ${teamAvgScore} — above the typical benchmark of 60. Good model selection practices across the team.`,
      severity: "info",
    });
  }

  return {
    users: users.sort((a, b) => b.efficiency_score - a.efficiency_score),
    team_aggregate: teamAggregate,
    team_avg_score: teamAvgScore,
    total_potential_saving: totalPotentialSaving,
    recommendations,
    score_formula: EFFICIENCY_SCORE_FORMULA,
  };
}
