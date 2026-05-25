import { NextResponse } from "next/server";
import {
  generateVPDashboard,
  generateDirectorDashboard,
  generateManagerDashboard,
} from "@/lib/demo-org-data";
import type { RoleType } from "@/lib/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const role = (searchParams.get("role") as RoleType) || "vp";
  const teamId = searchParams.get("team_id") || null;

  // In production, you would:
  // 1. Get the user's email from the session
  // 2. Look up their role in the roles table
  // 3. Validate they have access to the requested scope
  // 4. Return scoped data from the database
  // For now, we use demo data with server-side role enforcement

  try {
    switch (role) {
      case "vp": {
        const data = generateVPDashboard();
        // VP never gets individual user data — already enforced in the generator
        return NextResponse.json(data);
      }

      case "director": {
        if (!teamId) {
          return NextResponse.json(
            { error: "team_id required for director view" },
            { status: 400 }
          );
        }
        const data = generateDirectorDashboard(teamId);
        if (!data) {
          return NextResponse.json(
            { error: "Department not found" },
            { status: 404 }
          );
        }
        // Director sees team aggregates, not individual users
        return NextResponse.json(data);
      }

      case "manager": {
        if (!teamId) {
          return NextResponse.json(
            { error: "team_id required for manager view" },
            { status: 400 }
          );
        }
        const data = generateManagerDashboard(teamId);
        if (!data) {
          return NextResponse.json(
            { error: "Team not found" },
            { status: 404 }
          );
        }
        // Manager sees individual users on their team only
        return NextResponse.json(data);
      }

      default:
        return NextResponse.json(
          { error: "Invalid role" },
          { status: 403 }
        );
    }
  } catch (err) {
    console.error("Org dashboard error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
