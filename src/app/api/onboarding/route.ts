import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
    if (isDemoMode) {
      return NextResponse.json({ success: true, demo: true });
    }

    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { org_name, connections } = body;

    // Create or get organization
    let { data: org } = await supabase
      .from("organizations")
      .select("id")
      .eq("owner_email", user.email)
      .single();

    if (!org) {
      const { data: newOrg, error } = await supabase
        .from("organizations")
        .insert({
          name: org_name,
          owner_email: user.email,
          onboarding_complete: false,
        })
        .select()
        .single();

      if (error) throw error;
      org = newOrg;
    }

    // Save API connections
    for (const conn of connections) {
      if (conn.api_key) {
        await supabase
          .from("api_connections")
          .upsert({
            org_id: org!.id,
            tool_name: conn.tool_name,
            api_key_encrypted: conn.api_key, // In production, encrypt before storing
            is_active: true,
          }, {
            onConflict: "org_id,tool_name",
          });
      }
    }

    // Mark onboarding complete
    await supabase
      .from("organizations")
      .update({ onboarding_complete: true })
      .eq("id", org!.id);

    return NextResponse.json({ success: true, org_id: org!.id });
  } catch (error) {
    console.error("[onboarding] Error:", error);
    return NextResponse.json({ error: "Onboarding failed" }, { status: 500 });
  }
}
