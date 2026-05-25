import {
  ToolName,
  ToolSummary,
  UserUsageSummary,
  Team,
  OrgRole,
  RoleType,
  TeamSummary,
  DepartmentSummary,
  VPDashboardData,
  DirectorDashboardData,
  ManagerDashboardData,
} from "./types";
import { subDays, format, addDays } from "date-fns";

// ============================================
// Demo Org Structure
// ============================================

const DEMO_ORG_ID = "demo-org";
const DEMO_ORG_NAME = "Acme Corp";

// Stable IDs for deterministic structure
const IDS = {
  eng_dept: "dept-engineering",
  product_dept: "dept-product",
  backend_team: "team-backend",
  frontend_team: "team-frontend",
  mobile_team: "team-mobile",
  platform_team: "team-platform",
};

export const DEMO_TEAMS: Team[] = [
  { id: IDS.eng_dept, org_id: DEMO_ORG_ID, parent_team_id: null, name: "Engineering", level: "department", budget_credits: 80000 },
  { id: IDS.product_dept, org_id: DEMO_ORG_ID, parent_team_id: null, name: "Product", level: "department", budget_credits: 40000 },
  { id: IDS.backend_team, org_id: DEMO_ORG_ID, parent_team_id: IDS.eng_dept, name: "Backend", level: "team", budget_credits: 25000 },
  { id: IDS.frontend_team, org_id: DEMO_ORG_ID, parent_team_id: IDS.eng_dept, name: "Frontend", level: "team", budget_credits: 20000 },
  { id: IDS.mobile_team, org_id: DEMO_ORG_ID, parent_team_id: IDS.product_dept, name: "Mobile", level: "team", budget_credits: 20000 },
  { id: IDS.platform_team, org_id: DEMO_ORG_ID, parent_team_id: IDS.eng_dept, name: "Platform", level: "team", budget_credits: 35000 },
];

interface DemoMember {
  email: string;
  team_id: string;
  active: boolean;
  spend_profile: "heavy" | "moderate" | "light" | "ghost";
}

const DEMO_MEMBERS: DemoMember[] = [
  // Backend team (6 members, 1 ghost) — high spend, efficient
  { email: "sarah.chen@acme.dev", team_id: IDS.backend_team, active: true, spend_profile: "heavy" },
  { email: "marcus.johnson@acme.dev", team_id: IDS.backend_team, active: true, spend_profile: "heavy" },
  { email: "priya.patel@acme.dev", team_id: IDS.backend_team, active: true, spend_profile: "moderate" },
  { email: "alex.rivera@acme.dev", team_id: IDS.backend_team, active: true, spend_profile: "moderate" },
  { email: "jordan.kim@acme.dev", team_id: IDS.backend_team, active: true, spend_profile: "light" },
  { email: "emma.wilson@acme.dev", team_id: IDS.backend_team, active: false, spend_profile: "ghost" },

  // Frontend team (5 members, 1 ghost) — moderate spend, some over budget
  { email: "nina.rodriguez@acme.dev", team_id: IDS.frontend_team, active: true, spend_profile: "heavy" },
  { email: "tyler.brooks@acme.dev", team_id: IDS.frontend_team, active: true, spend_profile: "heavy" },
  { email: "olivia.zhang@acme.dev", team_id: IDS.frontend_team, active: true, spend_profile: "moderate" },
  { email: "liam.foster@acme.dev", team_id: IDS.frontend_team, active: true, spend_profile: "light" },
  { email: "david.lee@acme.dev", team_id: IDS.frontend_team, active: false, spend_profile: "ghost" },

  // Mobile team (4 members, 2 ghosts) — has ghost seat problem
  { email: "aria.martinez@acme.dev", team_id: IDS.mobile_team, active: true, spend_profile: "heavy" },
  { email: "kai.nakamura@acme.dev", team_id: IDS.mobile_team, active: true, spend_profile: "moderate" },
  { email: "lucas.wright@acme.dev", team_id: IDS.mobile_team, active: false, spend_profile: "ghost" },
  { email: "maya.gupta@acme.dev", team_id: IDS.mobile_team, active: false, spend_profile: "ghost" },

  // Platform team (5 members, 0 ghosts) — highest efficiency
  { email: "ethan.clark@acme.dev", team_id: IDS.platform_team, active: true, spend_profile: "moderate" },
  { email: "sofia.kim@acme.dev", team_id: IDS.platform_team, active: true, spend_profile: "moderate" },
  { email: "noah.patel@acme.dev", team_id: IDS.platform_team, active: true, spend_profile: "light" },
  { email: "chloe.wang@acme.dev", team_id: IDS.platform_team, active: true, spend_profile: "light" },
  { email: "ben.nguyen@acme.dev", team_id: IDS.platform_team, active: true, spend_profile: "moderate" },
];

export const DEMO_ROLES: OrgRole[] = [
  { id: "role-vp", user_email: "cto@acme.dev", org_id: DEMO_ORG_ID, role_type: "vp", scope_team_id: null },
  { id: "role-dir-eng", user_email: "eng.director@acme.dev", org_id: DEMO_ORG_ID, role_type: "director", scope_team_id: IDS.eng_dept },
  { id: "role-dir-product", user_email: "product.director@acme.dev", org_id: DEMO_ORG_ID, role_type: "director", scope_team_id: IDS.product_dept },
  { id: "role-mgr-backend", user_email: "sarah.chen@acme.dev", org_id: DEMO_ORG_ID, role_type: "manager", scope_team_id: IDS.backend_team },
  { id: "role-mgr-frontend", user_email: "nina.rodriguez@acme.dev", org_id: DEMO_ORG_ID, role_type: "manager", scope_team_id: IDS.frontend_team },
  { id: "role-mgr-mobile", user_email: "aria.martinez@acme.dev", org_id: DEMO_ORG_ID, role_type: "manager", scope_team_id: IDS.mobile_team },
  { id: "role-mgr-platform", user_email: "ethan.clark@acme.dev", org_id: DEMO_ORG_ID, role_type: "manager", scope_team_id: IDS.platform_team },
  ...DEMO_MEMBERS.filter(
    (m) => !["sarah.chen@acme.dev", "nina.rodriguez@acme.dev", "aria.martinez@acme.dev", "ethan.clark@acme.dev"].includes(m.email)
  ).map((m, i) => ({
    id: `role-member-${i}`,
    user_email: m.email,
    org_id: DEMO_ORG_ID,
    role_type: "member" as RoleType,
    scope_team_id: m.team_id,
  })),
];

// ============================================
// Seeded Random (deterministic per session)
// ============================================

let seed = 42;
function seededRandom(): number {
  seed = (seed * 16807 + 0) % 2147483647;
  return (seed - 1) / 2147483646;
}

function randomBetween(min: number, max: number): number {
  return Math.floor(seededRandom() * (max - min + 1)) + min;
}

// ============================================
// Generate user usage for a team
// ============================================

const TOOL_LIMITS: Record<ToolName, number> = {
  windsurf: 5000,
  anthropic: 10000,
  copilot: 3000,
};

function generateMemberUsage(member: DemoMember): UserUsageSummary {
  const isGhost = !member.active;
  const lastActive = isGhost
    ? format(subDays(new Date(), randomBetween(15, 45)), "yyyy-MM-dd'T'HH:mm:ss")
    : format(subDays(new Date(), randomBetween(0, 3)), "yyyy-MM-dd'T'HH:mm:ss");

  const multiplier =
    member.spend_profile === "heavy" ? 1.0
    : member.spend_profile === "moderate" ? 0.55
    : member.spend_profile === "light" ? 0.25
    : 0.05; // ghost

  const tools: UserUsageSummary["tools"] = [];

  const windsurfUsed = Math.round(randomBetween(800, 2000) * multiplier);
  tools.push({
    tool_name: "windsurf",
    credits_used: windsurfUsed,
    credits_remaining: TOOL_LIMITS.windsurf - windsurfUsed,
  });

  const anthropicUsed = Math.round(randomBetween(1500, 5000) * multiplier);
  tools.push({
    tool_name: "anthropic",
    credits_used: anthropicUsed,
    credits_remaining: TOOL_LIMITS.anthropic - anthropicUsed,
  });

  const copilotUsed = Math.round(randomBetween(400, 1500) * multiplier);
  tools.push({
    tool_name: "copilot",
    credits_used: copilotUsed,
    credits_remaining: TOOL_LIMITS.copilot - copilotUsed,
  });

  return {
    user_email: member.email,
    total_credits_used: tools.reduce((sum, t) => sum + t.credits_used, 0),
    tools,
    last_active: lastActive,
    is_ghost: isGhost,
  };
}

function computeToolBreakdown(users: UserUsageSummary[]): ToolSummary[] {
  const tools: ToolName[] = ["windsurf", "anthropic", "copilot"];
  return tools.map((toolName) => {
    let totalUsed = 0;
    let totalRemaining = 0;
    let activeUsers = 0;
    let ghostSeats = 0;
    users.forEach((user) => {
      const t = user.tools.find((x) => x.tool_name === toolName);
      if (t) {
        totalUsed += t.credits_used;
        totalRemaining += t.credits_remaining;
        if (user.is_ghost) ghostSeats++;
        else activeUsers++;
      }
    });
    return { tool_name: toolName, total_used: totalUsed, total_remaining: totalRemaining, active_users: activeUsers, ghost_seats: ghostSeats };
  });
}

function computeEfficiencyScore(spend: number, budget: number, ghostSeats: number, activeUsers: number): number {
  if (budget === 0 || activeUsers === 0) return 50;
  const budgetEfficiency = Math.max(0, 100 - ((spend / budget) * 100 - 70)); // penalize over-budget
  const ghostPenalty = (ghostSeats / (activeUsers + ghostSeats)) * 30;
  const perUserSpend = spend / activeUsers;
  const spendEfficiency = Math.max(0, 100 - (perUserSpend / 200)); // lower per-user spend = better
  return Math.round(Math.min(100, Math.max(0, (budgetEfficiency * 0.5 + spendEfficiency * 0.3 - ghostPenalty + 20))));
}

// ============================================
// Build team summary
// ============================================

function buildTeamSummary(team: Team, members: DemoMember[]): TeamSummary {
  const teamMembers = members.filter((m) => m.team_id === team.id);
  const userSummaries = teamMembers.map(generateMemberUsage);
  const totalSpend = userSummaries.reduce((sum, u) => sum + u.total_credits_used, 0);
  const activeUsers = userSummaries.filter((u) => !u.is_ghost).length;
  const ghostSeats = userSummaries.filter((u) => u.is_ghost).length;
  const dayOfMonth = new Date().getDate();
  const burnRate = dayOfMonth > 0 ? Math.round(totalSpend / dayOfMonth) : 0;
  const efficiency = computeEfficiencyScore(totalSpend, team.budget_credits, ghostSeats, activeUsers);

  return {
    team_id: team.id,
    team_name: team.name,
    level: team.level,
    parent_team_id: team.parent_team_id,
    total_spend: totalSpend,
    budget_credits: team.budget_credits,
    active_users: activeUsers,
    ghost_seats: ghostSeats,
    burn_rate_per_day: burnRate,
    efficiency_score: efficiency,
    tool_breakdown: computeToolBreakdown(userSummaries),
  };
}

// ============================================
// Public API: Generate scoped dashboard data
// ============================================

export function getDemoRole(email: string): OrgRole | null {
  return DEMO_ROLES.find((r) => r.user_email === email) ?? null;
}

export function generateVPDashboard(): VPDashboardData {
  seed = 42; // reset for deterministic data

  const departments = DEMO_TEAMS.filter((t) => t.level === "department");
  const childTeams = DEMO_TEAMS.filter((t) => t.level === "team");

  const deptSummaries: DepartmentSummary[] = departments.map((dept) => {
    const children = childTeams
      .filter((t) => t.parent_team_id === dept.id)
      .map((t) => buildTeamSummary(t, DEMO_MEMBERS));

    const totalSpend = children.reduce((s, c) => s + c.total_spend, 0);
    const activeUsers = children.reduce((s, c) => s + c.active_users, 0);
    const ghostSeats = children.reduce((s, c) => s + c.ghost_seats, 0);
    const burnRate = children.reduce((s, c) => s + c.burn_rate_per_day, 0);
    const allToolBreakdown = mergeToolBreakdowns(children.map((c) => c.tool_breakdown));
    const efficiency = computeEfficiencyScore(totalSpend, dept.budget_credits, ghostSeats, activeUsers);

    return {
      team_id: dept.id,
      team_name: dept.name,
      level: dept.level,
      parent_team_id: dept.parent_team_id,
      total_spend: totalSpend,
      budget_credits: dept.budget_credits,
      active_users: activeUsers,
      ghost_seats: ghostSeats,
      burn_rate_per_day: burnRate,
      efficiency_score: efficiency,
      tool_breakdown: allToolBreakdown,
      child_teams: children,
    };
  });

  const totalSpend = deptSummaries.reduce((s, d) => s + d.total_spend, 0);
  const totalBudget = deptSummaries.reduce((s, d) => s + d.budget_credits, 0);
  const totalGhosts = deptSummaries.reduce((s, d) => s + d.ghost_seats, 0);
  const totalActive = deptSummaries.reduce((s, d) => s + d.active_users, 0);
  const totalBurnRate = deptSummaries.reduce((s, d) => s + d.burn_rate_per_day, 0);
  const dayOfMonth = new Date().getDate();
  const projectedMonthly = Math.round(totalBurnRate * 30);
  const allToolBreakdown = mergeToolBreakdowns(deptSummaries.map((d) => d.tool_breakdown));
  const totalRemaining = allToolBreakdown.reduce((s, t) => s + t.total_remaining, 0);

  let projectedExhaustionDate: string | null = null;
  if (totalBurnRate > 0 && totalRemaining > 0) {
    const daysLeft = Math.ceil(totalRemaining / totalBurnRate);
    projectedExhaustionDate = format(addDays(new Date(), daysLeft), "MMM d, yyyy");
  }

  // Generate insights
  const insights: string[] = [];
  const overBudgetDepts = deptSummaries.filter((d) => {
    const pacePercent = (d.total_spend / d.budget_credits) * (30 / dayOfMonth) * 100;
    return pacePercent > 100;
  });
  overBudgetDepts.forEach((d) => {
    const pacePercent = Math.round((d.total_spend / d.budget_credits) * (30 / dayOfMonth) * 100 - 100);
    insights.push(`${d.team_name} dept is ${pacePercent}% over budget pace.`);
  });

  const ghostyDepts = deptSummaries.filter((d) => d.ghost_seats >= 3);
  ghostyDepts.forEach((d) => {
    insights.push(`${d.team_name} dept has ${d.ghost_seats} ghost seats.`);
  });

  const allTeams = deptSummaries.flatMap((d) => d.child_teams);
  const bestTeam = allTeams.reduce((best, t) => (t.efficiency_score > best.efficiency_score ? t : best), allTeams[0]);
  if (bestTeam) {
    insights.push(`${bestTeam.team_name} team has the highest efficiency score (${bestTeam.efficiency_score}).`);
  }

  const spendVsLastMonth = randomBetween(-15, 25); // simulated

  return {
    org_name: DEMO_ORG_NAME,
    total_spend: totalSpend,
    total_budget: totalBudget,
    spend_vs_last_month: spendVsLastMonth,
    burn_rate_per_day: totalBurnRate,
    projected_monthly_spend: projectedMonthly,
    total_ghost_seats: totalGhosts,
    total_active_users: totalActive,
    departments: deptSummaries,
    tool_breakdown: allToolBreakdown,
    insights,
    projected_exhaustion_date: projectedExhaustionDate,
  };
}

export function generateDirectorDashboard(departmentId: string): DirectorDashboardData | null {
  seed = 42;

  const dept = DEMO_TEAMS.find((t) => t.id === departmentId && t.level === "department");
  if (!dept) return null;

  const childTeams = DEMO_TEAMS.filter((t) => t.parent_team_id === departmentId && t.level === "team");
  const teamSummaries = childTeams.map((t) => buildTeamSummary(t, DEMO_MEMBERS));

  const totalSpend = teamSummaries.reduce((s, t) => s + t.total_spend, 0);
  const headcount = teamSummaries.reduce((s, t) => s + t.active_users + t.ghost_seats, 0);
  const ghostSeats = teamSummaries.reduce((s, t) => s + t.ghost_seats, 0);
  const activeUsers = teamSummaries.reduce((s, t) => s + t.active_users, 0);
  const burnRate = teamSummaries.reduce((s, t) => s + t.burn_rate_per_day, 0);
  const efficiency = computeEfficiencyScore(totalSpend, dept.budget_credits, ghostSeats, activeUsers);
  const allToolBreakdown = mergeToolBreakdowns(teamSummaries.map((t) => t.tool_breakdown));

  const budgetAllocation = teamSummaries.map((t) => ({
    team_name: t.team_name,
    budget: t.budget_credits,
    actual: t.total_spend,
  }));

  return {
    department_name: dept.name,
    department_id: dept.id,
    total_spend: totalSpend,
    budget_credits: dept.budget_credits,
    efficiency_score: efficiency,
    headcount,
    ghost_seats: ghostSeats,
    burn_rate_per_day: burnRate,
    teams: teamSummaries,
    tool_breakdown: allToolBreakdown,
    budget_allocation: budgetAllocation,
  };
}

export function generateManagerDashboard(teamId: string): ManagerDashboardData | null {
  seed = 42;

  const team = DEMO_TEAMS.find((t) => t.id === teamId && t.level === "team");
  if (!team) return null;

  const teamMembers = DEMO_MEMBERS.filter((m) => m.team_id === teamId);
  const userSummaries = teamMembers.map(generateMemberUsage);
  const toolSummaries = computeToolBreakdown(userSummaries);
  const totalSpend = toolSummaries.reduce((s, t) => s + t.total_used, 0);
  const totalRemaining = toolSummaries.reduce((s, t) => s + t.total_remaining, 0);
  const dayOfMonth = new Date().getDate();
  const burnRate = dayOfMonth > 0 ? Math.round(totalSpend / dayOfMonth) : 0;
  const ghostCount = userSummaries.filter((u) => u.is_ghost).length;
  const activeCount = userSummaries.filter((u) => !u.is_ghost).length;

  let projectedExhaustionDate: string | null = null;
  if (burnRate > 0 && totalRemaining > 0) {
    projectedExhaustionDate = format(addDays(new Date(), Math.ceil(totalRemaining / burnRate)), "MMM d, yyyy");
  }

  const teamEfficiency = computeEfficiencyScore(totalSpend, team.budget_credits, ghostCount, activeCount);

  // Compute org average efficiency and department rank
  const allChildTeams = DEMO_TEAMS.filter((t) => t.level === "team");
  const allTeamSummaries = allChildTeams.map((t) => buildTeamSummary(t, DEMO_MEMBERS));
  const orgAvgEfficiency = Math.round(allTeamSummaries.reduce((s, t) => s + t.efficiency_score, 0) / allTeamSummaries.length);

  const deptTeams = allTeamSummaries
    .filter((t) => {
      const teamDef = DEMO_TEAMS.find((d) => d.id === t.team_id);
      return teamDef?.parent_team_id === team.parent_team_id;
    })
    .sort((a, b) => b.efficiency_score - a.efficiency_score);

  const deptRank = deptTeams.findIndex((t) => t.team_id === teamId) + 1;

  return {
    team_name: team.name,
    team_id: team.id,
    team_efficiency_score: teamEfficiency,
    org_avg_efficiency: orgAvgEfficiency,
    department_rank: deptRank,
    department_team_count: deptTeams.length,
    total_spend: totalSpend,
    total_remaining: totalRemaining,
    tool_summaries: toolSummaries,
    user_summaries: userSummaries.sort((a, b) => b.total_credits_used - a.total_credits_used),
    burn_rate_per_day: burnRate,
    projected_exhaustion_date: projectedExhaustionDate,
    ghost_seat_count: ghostCount,
  };
}

// ============================================
// Helpers
// ============================================

function mergeToolBreakdowns(breakdowns: ToolSummary[][]): ToolSummary[] {
  const tools: ToolName[] = ["windsurf", "anthropic", "copilot"];
  return tools.map((toolName) => {
    let totalUsed = 0;
    let totalRemaining = 0;
    let activeUsers = 0;
    let ghostSeats = 0;
    breakdowns.forEach((bd) => {
      const t = bd.find((x) => x.tool_name === toolName);
      if (t) {
        totalUsed += t.total_used;
        totalRemaining += t.total_remaining;
        activeUsers += t.active_users;
        ghostSeats += t.ghost_seats;
      }
    });
    return { tool_name: toolName, total_used: totalUsed, total_remaining: totalRemaining, active_users: activeUsers, ghost_seats: ghostSeats };
  });
}

// Get the current demo role from localStorage
export function getDemoCurrentRole(): RoleType {
  if (typeof window === "undefined") return "vp";
  return (localStorage.getItem("tovi_demo_role") as RoleType) || "vp";
}

export function getDemoCurrentTeamId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("tovi_demo_team_id");
}

export function setDemoRole(role: RoleType, teamId?: string | null) {
  if (typeof window === "undefined") return;
  localStorage.setItem("tovi_demo_role", role);
  if (teamId !== undefined) {
    if (teamId) localStorage.setItem("tovi_demo_team_id", teamId);
    else localStorage.removeItem("tovi_demo_team_id");
  }
}

export { DEMO_ORG_ID, DEMO_ORG_NAME, IDS, DEMO_MEMBERS };
