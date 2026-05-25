export type ToolName = "windsurf" | "anthropic" | "copilot";

export interface UsageRecord {
  id?: string;
  org_id: string;
  user_email: string;
  tool_name: ToolName;
  credits_used: number;
  credits_remaining: number;
  last_active: string;
  synced_at: string;
}

export interface ApiConnection {
  id?: string;
  org_id: string;
  tool_name: ToolName;
  api_key_encrypted: string;
  is_active: boolean;
  created_at?: string;
}

export interface AlertRule {
  id?: string;
  org_id: string;
  rule_type: "user_threshold" | "burn_rate";
  threshold_value: number;
  is_active: boolean;
  created_at?: string;
}

export interface Organization {
  id: string;
  name: string;
  owner_email: string;
  onboarding_complete: boolean;
  created_at?: string;
}

export interface ToolSummary {
  tool_name: ToolName;
  total_used: number;
  total_remaining: number;
  active_users: number;
  ghost_seats: number;
}

export interface UserUsageSummary {
  user_email: string;
  total_credits_used: number;
  tools: {
    tool_name: ToolName;
    credits_used: number;
    credits_remaining: number;
  }[];
  last_active: string;
  is_ghost: boolean;
}

export interface DashboardData {
  total_spend: number;
  total_remaining: number;
  tool_summaries: ToolSummary[];
  user_summaries: UserUsageSummary[];
  burn_rate_per_day: number;
  projected_exhaustion_date: string | null;
  ghost_seat_count: number;
}

// ============================================
// Org Hierarchy Types
// ============================================

export type RoleType = "vp" | "director" | "manager" | "member";
export type TeamLevel = "department" | "team";

export const ROLE_ACCESS = {
  vp: "full_org",
  director: "department",
  manager: "team",
  member: "self",
} as const;

export interface Team {
  id: string;
  org_id: string;
  parent_team_id: string | null;
  name: string;
  level: TeamLevel;
  budget_credits: number;
  created_at?: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_email: string;
  role: "manager" | "member";
  joined_at?: string;
}

export interface OrgRole {
  id: string;
  user_email: string;
  org_id: string;
  role_type: RoleType;
  scope_team_id: string | null;
  created_at?: string;
}

export interface TeamSummary {
  team_id: string;
  team_name: string;
  level: TeamLevel;
  parent_team_id: string | null;
  total_spend: number;
  budget_credits: number;
  active_users: number;
  ghost_seats: number;
  burn_rate_per_day: number;
  efficiency_score: number; // 0-100, higher is better
  tool_breakdown: ToolSummary[];
}

export interface DepartmentSummary extends TeamSummary {
  child_teams: TeamSummary[];
}

export interface VPDashboardData {
  org_name: string;
  total_spend: number;
  total_budget: number;
  spend_vs_last_month: number; // percentage change
  burn_rate_per_day: number;
  projected_monthly_spend: number;
  total_ghost_seats: number;
  total_active_users: number;
  departments: DepartmentSummary[];
  tool_breakdown: ToolSummary[];
  insights: string[];
  projected_exhaustion_date: string | null;
}

export interface DirectorDashboardData {
  department_name: string;
  department_id: string;
  total_spend: number;
  budget_credits: number;
  efficiency_score: number;
  headcount: number;
  ghost_seats: number;
  burn_rate_per_day: number;
  teams: TeamSummary[];
  tool_breakdown: ToolSummary[];
  budget_allocation: { team_name: string; budget: number; actual: number }[];
}

export interface ManagerDashboardData extends DashboardData {
  team_name: string;
  team_id: string;
  team_efficiency_score: number;
  org_avg_efficiency: number;
  department_rank: number;
  department_team_count: number;
}

// ============================================
// Model Efficiency Types
// ============================================

export type ModelTier = "premium" | "mid" | "efficient";

export const MODEL_TIERS: Record<ModelTier, string[]> = {
  premium: ["claude-opus-4", "gpt-4o", "windsurf-swe-1"],
  mid: ["claude-sonnet-4", "gpt-4o-mini", "windsurf-swe-1-lite"],
  efficient: ["claude-haiku-3", "gpt-3.5-turbo"],
};

export const MODEL_TIER_LABELS: Record<ModelTier, string> = {
  premium: "Premium",
  mid: "Mid-tier",
  efficient: "Efficient",
};

export const MODEL_COST_PER_1K: Record<string, number> = {
  "claude-opus-4": 0.075,
  "gpt-4o": 0.060,
  "windsurf-swe-1": 0.050,
  "claude-sonnet-4": 0.015,
  "gpt-4o-mini": 0.010,
  "windsurf-swe-1-lite": 0.012,
  "claude-haiku-3": 0.001,
  "gpt-3.5-turbo": 0.002,
};

export function getModelTier(modelName: string): ModelTier {
  for (const [tier, models] of Object.entries(MODEL_TIERS)) {
    if (models.includes(modelName)) return tier as ModelTier;
  }
  return "mid";
}

export interface ModelUsageRecord {
  id?: string;
  user_email: string;
  tool_name: ToolName;
  model_name: string;
  token_count: number;
  request_type: string;
  timestamp: string;
  org_id: string;
}

export interface UserModelBreakdown {
  model_name: string;
  tier: ModelTier;
  request_count: number;
  total_tokens: number;
  avg_tokens: number;
  pct_of_requests: number;
}

export interface UserEfficiencyRow {
  user_email: string;
  most_used_model: string;
  avg_tokens_per_request: number;
  total_requests: number;
  premium_usage_pct: number;
  efficiency_score: number;
  efficiency_rating: "green" | "amber" | "red";
  model_breakdown: UserModelBreakdown[];
  potential_saving: number;
}

export interface TeamModelAggregate {
  model_name: string;
  tier: ModelTier;
  total_requests: number;
  total_tokens: number;
  pct_of_requests: number;
}

export interface EfficiencyRecommendation {
  type: "pattern" | "spike" | "suggestion";
  message: string;
  severity: "info" | "warning";
}

export interface EfficiencyDashboardData {
  users: UserEfficiencyRow[];
  team_aggregate: TeamModelAggregate[];
  team_avg_score: number;
  total_potential_saving: number;
  recommendations: EfficiencyRecommendation[];
  score_formula: string;
}
