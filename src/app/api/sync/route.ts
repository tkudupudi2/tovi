import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { TOOL_FETCHERS } from "@/lib/sync-service";
import { generateDemoData } from "@/lib/demo-data";
import { ToolName } from "@/lib/types";

export async function POST(_request: NextRequest) {
  try {
    // Check for demo mode
    const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

    if (isDemoMode) {
      return NextResponse.json({
        success: true,
        demo: true,
        data: generateDemoData(),
      });
    }

    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get organization
    const { data: org } = await supabase
      .from("organizations")
      .select("id")
      .eq("owner_email", user.email)
      .single();

    if (!org) {
      return NextResponse.json({ error: "No organization found" }, { status: 404 });
    }

    // Get all active connections
    const { data: connections } = await supabase
      .from("api_connections")
      .select("*")
      .eq("org_id", org.id)
      .eq("is_active", true);

    if (!connections || connections.length === 0) {
      return NextResponse.json({ error: "No active connections" }, { status: 404 });
    }

    // Fetch usage for each connected tool
    const allRecords = [];
    for (const conn of connections) {
      const fetcher = TOOL_FETCHERS[conn.tool_name as ToolName];
      if (fetcher) {
        const records = await fetcher(conn.api_key_encrypted, org.id);
        allRecords.push(...records);
      }
    }

    // Upsert usage records
    if (allRecords.length > 0) {
      // Clear old records for this org and re-insert
      await supabase
        .from("usage_records")
        .delete()
        .eq("org_id", org.id);

      await supabase
        .from("usage_records")
        .insert(allRecords);
    }

    return NextResponse.json({ success: true, records: allRecords.length });
  } catch (error) {
    console.error("[sync] Error:", error);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
