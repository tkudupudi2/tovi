import { NextRequest, NextResponse } from "next/server";
import { generateDemoData } from "@/lib/demo-data";

// Force dynamic route
export const dynamic = 'force-dynamic';

// Vercel cron job endpoint — runs every Monday
// Add to vercel.json: { "crons": [{ "path": "/api/cron/weekly-digest", "schedule": "0 9 * * 1" }] }
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = generateDemoData();

    const topUsers = data.user_summaries.slice(0, 3);
    const ghostSeats = data.user_summaries.filter((u) => u.is_ghost);

    // Build email HTML
    const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #0a0a0a; font-size: 24px;">ToVi Weekly Digest</h1>
        <p style="color: #666;">Here's your AI tool usage summary for this week.</p>

        <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <h3 style="margin: 0 0 8px;">Total Spend: ${data.total_spend.toLocaleString()} credits</h3>
          <p style="margin: 0; color: #666;">Burn rate: ${data.burn_rate_per_day} credits/day</p>
          ${data.projected_exhaustion_date ? `<p style="margin: 4px 0 0; color: #e11d48;">Projected exhaustion: ${data.projected_exhaustion_date}</p>` : ""}
        </div>

        <h3>Top 3 Users</h3>
        <ul>
          ${topUsers.map((u) => `<li>${u.user_email} — ${u.total_credits_used.toLocaleString()} credits</li>`).join("")}
        </ul>

        ${ghostSeats.length > 0 ? `
          <h3 style="color: #e11d48;">Ghost Seats Detected (${ghostSeats.length})</h3>
          <ul>
            ${ghostSeats.map((u) => `<li>${u.user_email} — inactive since ${new Date(u.last_active).toLocaleDateString()}</li>`).join("")}
          </ul>
        ` : ""}

        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #999; font-size: 12px;">Sent by ToVi · Token Visualizer</p>
      </div>
    `;

    // Send via Resend if API key is configured
    if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== "your-resend-api-key") {
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);

      await resend.emails.send({
        from: "ToVi <noreply@tovi.dev>",
        to: ["manager@acme.dev"], // In production, query all org owners
        subject: "ToVi Weekly Digest — AI Tool Usage Summary",
        html: emailHtml,
      });
    }

    return NextResponse.json({
      success: true,
      summary: {
        total_spend: data.total_spend,
        top_users: topUsers.map((u) => u.user_email),
        ghost_seats: ghostSeats.length,
        burn_rate: data.burn_rate_per_day,
      },
    });
  } catch (error) {
    console.error("[weekly-digest] Error:", error);
    return NextResponse.json({ error: "Digest failed" }, { status: 500 });
  }
}
