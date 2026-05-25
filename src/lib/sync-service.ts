import { ToolName, UsageRecord } from "./types";

// NOTE: Windsurf has no public API yet — using mock data
// Replace with real API call when available
async function fetchWindsurfUsage(apiKey: string, orgId: string): Promise<UsageRecord[]> {
  console.log("[sync] Windsurf: no public API — returning mock data");
  return generateMockUsage(orgId, "windsurf", 5000);
}

// Anthropic usage API — https://api.anthropic.com/v1/usage
// This endpoint may not exist yet; falling back to mock data
async function fetchAnthropicUsage(apiKey: string, orgId: string): Promise<UsageRecord[]> {
  try {
    const res = await fetch("https://api.anthropic.com/v1/usage", {
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
    });

    if (!res.ok) {
      console.log("[sync] Anthropic API returned", res.status, "— using mock data");
      return generateMockUsage(orgId, "anthropic", 10000);
    }

    const data = await res.json();
    // Normalize response — adjust when real schema is known
    return (data.users || []).map((u: any) => ({
      org_id: orgId,
      user_email: u.email,
      tool_name: "anthropic" as ToolName,
      credits_used: u.tokens_used || u.credits_used || 0,
      credits_remaining: u.tokens_remaining || u.credits_remaining || 10000,
      last_active: u.last_active || new Date().toISOString(),
      synced_at: new Date().toISOString(),
    }));
  } catch {
    console.log("[sync] Anthropic API unavailable — using mock data");
    return generateMockUsage(orgId, "anthropic", 10000);
  }
}

// GitHub Copilot usage — GET /orgs/{org}/copilot/usage
// Mock if the endpoint is unavailable or returns errors
async function fetchCopilotUsage(token: string, orgId: string): Promise<UsageRecord[]> {
  try {
    const res = await fetch("https://api.github.com/orgs/acme/copilot/usage", {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });

    if (!res.ok) {
      console.log("[sync] GitHub Copilot API returned", res.status, "— using mock data");
      return generateMockUsage(orgId, "copilot", 3000);
    }

    const data = await res.json();
    return (data.seats || []).map((seat: any) => ({
      org_id: orgId,
      user_email: seat.assignee?.login ? `${seat.assignee.login}@github.com` : "unknown@github.com",
      tool_name: "copilot" as ToolName,
      credits_used: seat.usage?.total_suggestions_count || 0,
      credits_remaining: 3000 - (seat.usage?.total_suggestions_count || 0),
      last_active: seat.last_activity_at || new Date().toISOString(),
      synced_at: new Date().toISOString(),
    }));
  } catch {
    console.log("[sync] GitHub Copilot API unavailable — using mock data");
    return generateMockUsage(orgId, "copilot", 3000);
  }
}

function generateMockUsage(orgId: string, toolName: ToolName, limit: number): UsageRecord[] {
  const emails = [
    "sarah.chen@acme.dev",
    "marcus.johnson@acme.dev",
    "priya.patel@acme.dev",
    "alex.rivera@acme.dev",
    "jordan.kim@acme.dev",
    "emma.wilson@acme.dev",
    "david.lee@acme.dev",
    "nina.rodriguez@acme.dev",
    "tyler.brooks@acme.dev",
    "olivia.zhang@acme.dev",
  ];

  const now = new Date();

  return emails.map((email) => {
    const isGhost = email === "emma.wilson@acme.dev" || email === "david.lee@acme.dev";
    const used = isGhost
      ? Math.floor(Math.random() * 100)
      : Math.floor(Math.random() * limit * 0.4);
    const daysAgo = isGhost ? 15 + Math.floor(Math.random() * 20) : Math.floor(Math.random() * 4);

    return {
      org_id: orgId,
      user_email: email,
      tool_name: toolName,
      credits_used: used,
      credits_remaining: limit - used,
      last_active: new Date(now.getTime() - daysAgo * 86400000).toISOString(),
      synced_at: now.toISOString(),
    };
  });
}

export type FetcherFn = (apiKey: string, orgId: string) => Promise<UsageRecord[]>;

export const TOOL_FETCHERS: Record<ToolName, FetcherFn> = {
  windsurf: fetchWindsurfUsage,
  anthropic: fetchAnthropicUsage,
  copilot: fetchCopilotUsage,
};

export { generateMockUsage };
