import { NextResponse } from "next/server";
import { generateDemoEfficiencyData } from "@/lib/demo-efficiency-data";

export async function GET() {
  // In production, you would:
  // 1. Get user session and org_id
  // 2. Query model_usage and model_efficiency_scores tables
  // 3. Compute aggregates server-side with role enforcement
  // For now, serve demo data

  try {
    const data = generateDemoEfficiencyData();
    return NextResponse.json(data);
  } catch (err) {
    console.error("Efficiency API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
