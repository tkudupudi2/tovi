import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { generateDemoData } from "@/lib/demo-data";
import { DashboardData, ToolName, ToolSummary, UserUsageSummary } from "@/lib/types";
import { differenceInDays, addDays, format } from "date-fns";

export async function GET() {
  try {
    const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

    if (isDemoMode) {
      return NextResponse.json(generateDemoData());
    }

    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: org } = await supabase
      .from("organizations")
      .select("id")
      .eq("owner_email", user.email)
      .single();

    if (!org) {
      return NextResponse.json({ error: "No organization" }, { status: 404 });
    }

    const { data: records } = await supabase
      .from("usage_records")
      .select("*")
      .eq("org_id", org.id);

    if (!records || records.length === 0) {
      const emptyData: DashboardData = {
        total_spend: 0,
        total_remaining: 0,
        tool_summaries: [],
        user_summaries: [],
        burn_rate_per_day: 0,
        projected_exhaustion_date: null,
        ghost_seat_count: 0,
      };
      return NextResponse.json(emptyData);
    }

    // Aggregate by tool
    const toolMap = new Map<ToolName, ToolSummary>();
    const userMap = new Map<string, UserUsageSummary>();

    for (const r of records) {
      // Tool summary
      const existing = toolMap.get(r.tool_name) || {
        tool_name: r.tool_name,
        total_used: 0,
        total_remaining: 0,
        active_users: 0,
        ghost_seats: 0,
      };
      existing.total_used += Number(r.credits_used);
      existing.total_remaining += Number(r.credits_remaining);

      const daysInactive = differenceInDays(new Date(), new Date(r.last_active));
      const isGhost = daysInactive >= 14;

      if (isGhost) {
        existing.ghost_seats++;
      } else {
        existing.active_users++;
      }
      toolMap.set(r.tool_name, existing);

      // User summary
      const userKey = r.user_email;
      const userSummary: UserUsageSummary = userMap.get(userKey) || {
        user_email: r.user_email,
        total_credits_used: 0,
        tools: [],
        last_active: r.last_active,
        is_ghost: true,
      };
      userSummary.total_credits_used += Number(r.credits_used);
      userSummary.tools.push({
        tool_name: r.tool_name,
        credits_used: Number(r.credits_used),
        credits_remaining: Number(r.credits_remaining),
      });

      if (new Date(r.last_active) > new Date(userSummary.last_active)) {
        userSummary.last_active = r.last_active;
      }
      if (!isGhost) {
        userSummary.is_ghost = false;
      }

      userMap.set(userKey, userSummary);
    }

    const toolSummaries = Array.from(toolMap.values());
    const userSummaries = Array.from(userMap.values()).sort(
      (a, b) => b.total_credits_used - a.total_credits_used
    );

    const totalSpend = toolSummaries.reduce((s, t) => s + t.total_used, 0);
    const totalRemaining = toolSummaries.reduce((s, t) => s + t.total_remaining, 0);
    const dayOfMonth = new Date().getDate();
    const burnRate = dayOfMonth > 0 ? totalSpend / dayOfMonth : 0;

    let projectedExhaustionDate: string | null = null;
    if (burnRate > 0) {
      const daysLeft = Math.ceil(totalRemaining / burnRate);
      projectedExhaustionDate = format(addDays(new Date(), daysLeft), "MMM d, yyyy");
    }

    const data: DashboardData = {
      total_spend: totalSpend,
      total_remaining: totalRemaining,
      tool_summaries: toolSummaries,
      user_summaries: userSummaries,
      burn_rate_per_day: Math.round(burnRate),
      projected_exhaustion_date: projectedExhaustionDate,
      ghost_seat_count: userSummaries.filter((u) => u.is_ghost).length,
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error("[dashboard] Error:", error);
    return NextResponse.json({ error: "Failed to load dashboard" }, { status: 500 });
  }
}
