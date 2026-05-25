import { DashboardData, ToolName, UserUsageSummary, ToolSummary, AlertRule } from "./types";
import { subDays, format, addDays } from "date-fns";

const TEAM_MEMBERS = [
  { email: "sarah.chen@acme.dev", active: true },
  { email: "marcus.johnson@acme.dev", active: true },
  { email: "priya.patel@acme.dev", active: true },
  { email: "alex.rivera@acme.dev", active: true },
  { email: "jordan.kim@acme.dev", active: true },
  { email: "emma.wilson@acme.dev", active: false }, // ghost
  { email: "david.lee@acme.dev", active: false }, // ghost
  { email: "nina.rodriguez@acme.dev", active: true },
  { email: "tyler.brooks@acme.dev", active: true },
  { email: "olivia.zhang@acme.dev", active: true },
];

const TOOL_LIMITS: Record<ToolName, number> = {
  windsurf: 5000,
  anthropic: 10000,
  copilot: 3000,
};

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateUserUsage(): UserUsageSummary[] {
  return TEAM_MEMBERS.map((member) => {
    const isGhost = !member.active;
    const lastActive = isGhost
      ? format(subDays(new Date(), randomBetween(15, 45)), "yyyy-MM-dd'T'HH:mm:ss")
      : format(subDays(new Date(), randomBetween(0, 3)), "yyyy-MM-dd'T'HH:mm:ss");

    const tools: UserUsageSummary["tools"] = [];

    if (Math.random() > 0.1) {
      const used = isGhost ? randomBetween(10, 100) : randomBetween(200, 1800);
      tools.push({
        tool_name: "windsurf",
        credits_used: used,
        credits_remaining: TOOL_LIMITS.windsurf - used,
      });
    }

    if (Math.random() > 0.15) {
      const used = isGhost ? randomBetween(20, 200) : randomBetween(500, 4000);
      tools.push({
        tool_name: "anthropic",
        credits_used: used,
        credits_remaining: TOOL_LIMITS.anthropic - used,
      });
    }

    if (Math.random() > 0.2) {
      const used = isGhost ? randomBetween(5, 50) : randomBetween(100, 1200);
      tools.push({
        tool_name: "copilot",
        credits_used: used,
        credits_remaining: TOOL_LIMITS.copilot - used,
      });
    }

    return {
      user_email: member.email,
      total_credits_used: tools.reduce((sum, t) => sum + t.credits_used, 0),
      tools,
      last_active: lastActive,
      is_ghost: isGhost,
    };
  });
}

function generateToolSummaries(users: UserUsageSummary[]): ToolSummary[] {
  const tools: ToolName[] = ["windsurf", "anthropic", "copilot"];

  return tools.map((toolName) => {
    let totalUsed = 0;
    let totalRemaining = 0;
    let activeUsers = 0;
    let ghostSeats = 0;

    users.forEach((user) => {
      const toolData = user.tools.find((t) => t.tool_name === toolName);
      if (toolData) {
        totalUsed += toolData.credits_used;
        totalRemaining += toolData.credits_remaining;
        if (user.is_ghost) {
          ghostSeats++;
        } else {
          activeUsers++;
        }
      }
    });

    return {
      tool_name: toolName,
      total_used: totalUsed,
      total_remaining: totalRemaining,
      active_users: activeUsers,
      ghost_seats: ghostSeats,
    };
  });
}

export function generateDemoData(): DashboardData {
  const users = generateUserUsage();
  const toolSummaries = generateToolSummaries(users);

  const totalSpend = toolSummaries.reduce((sum, t) => sum + t.total_used, 0);
  const totalRemaining = toolSummaries.reduce((sum, t) => sum + t.total_remaining, 0);

  const today = new Date();
  const dayOfMonth = today.getDate();
  const burnRatePerDay = dayOfMonth > 0 ? totalSpend / dayOfMonth : 0;

  let projectedExhaustionDate: string | null = null;
  if (burnRatePerDay > 0) {
    const daysUntilExhaustion = Math.ceil(totalRemaining / burnRatePerDay);
    projectedExhaustionDate = format(addDays(today, daysUntilExhaustion), "MMM d, yyyy");
  }

  const ghostSeatCount = users.filter((u) => u.is_ghost).length;

  return {
    total_spend: totalSpend,
    total_remaining: totalRemaining,
    tool_summaries: toolSummaries,
    user_summaries: users.sort((a, b) => b.total_credits_used - a.total_credits_used),
    burn_rate_per_day: Math.round(burnRatePerDay),
    projected_exhaustion_date: projectedExhaustionDate,
    ghost_seat_count: ghostSeatCount,
  };
}

export function generateDemoAlerts(): AlertRule[] {
  return [
    {
      id: "demo-1",
      org_id: "demo-org",
      rule_type: "user_threshold",
      threshold_value: 3000,
      is_active: true,
      created_at: new Date().toISOString(),
    },
    {
      id: "demo-2",
      org_id: "demo-org",
      rule_type: "burn_rate",
      threshold_value: 80,
      is_active: true,
      created_at: new Date().toISOString(),
    },
  ];
}
