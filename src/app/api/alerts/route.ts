import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { generateDemoAlerts } from "@/lib/demo-data";

export async function GET() {
  try {
    const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
    if (isDemoMode) {
      return NextResponse.json(generateDemoAlerts());
    }

    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: org } = await supabase
      .from("organizations")
      .select("id")
      .eq("owner_email", user.email)
      .single();

    if (!org) return NextResponse.json([], { status: 200 });

    const { data: rules } = await supabase
      .from("alert_rules")
      .select("*")
      .eq("org_id", org.id)
      .order("created_at", { ascending: false });

    return NextResponse.json(rules || []);
  } catch (error) {
    console.error("[alerts] Error:", error);
    return NextResponse.json({ error: "Failed to load alerts" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
    if (isDemoMode) {
      const body = await request.json();
      return NextResponse.json({
        id: `demo-${Date.now()}`,
        ...body,
        org_id: "demo-org",
        is_active: true,
        created_at: new Date().toISOString(),
      });
    }

    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: org } = await supabase
      .from("organizations")
      .select("id")
      .eq("owner_email", user.email)
      .single();

    if (!org) return NextResponse.json({ error: "No organization" }, { status: 404 });

    const body = await request.json();
    const { data: rule, error } = await supabase
      .from("alert_rules")
      .insert({
        org_id: org.id,
        rule_type: body.rule_type,
        threshold_value: body.threshold_value,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(rule);
  } catch (error) {
    console.error("[alerts] Error:", error);
    return NextResponse.json({ error: "Failed to create alert" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
    if (isDemoMode) {
      return NextResponse.json({ success: true });
    }

    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    await supabase.from("alert_rules").delete().eq("id", id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[alerts] Error:", error);
    return NextResponse.json({ error: "Failed to delete alert" }, { status: 500 });
  }
}
