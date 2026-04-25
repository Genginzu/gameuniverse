import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { logger } from "@/lib/logger";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type S = any;

/** GET /api/coaching/payments — Paginated payment history for the current coach */
export async function GET(request: NextRequest) {
  try {
    const supabase: S = await createRouteHandlerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: coach } = await supabase
      .from("coach_profiles").select("id").eq("player_id", user.id).single();
    if (!coach) return NextResponse.json({ error: "Not a coach" }, { status: 403 });

    const page = Number(request.nextUrl.searchParams.get("page")) || 1;
    const limit = Math.min(Number(request.nextUrl.searchParams.get("limit")) || 10, 50);
    const offset = (page - 1) * limit;

    const { data: sessions, count } = await supabase
      .from("coaching_sessions")
      .select("id, status, scheduled_at, duration_minutes, payment_amount, payment_status, platform_fee, coach_payout, student_id, created_at", { count: "exact" })
      .eq("coach_id", coach.id)
      .eq("payment_status", "paid")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Get student usernames
    const studentIds = [...new Set((sessions || []).map((s: S) => s.student_id))];
    const profileMap = new Map<string, string>();
    if (studentIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles").select("id, username").in("id", studentIds);
      for (const p of profiles || []) profileMap.set(p.id, p.username);
    }

    const payments = (sessions || []).map((s: S) => ({
      id: s.id,
      date: s.created_at,
      scheduledAt: s.scheduled_at,
      durationMinutes: s.duration_minutes,
      status: s.status,
      amount: s.payment_amount,
      platformFee: s.platform_fee,
      coachPayout: s.coach_payout,
      studentUsername: profileMap.get(s.student_id) || "?",
    }));

    return NextResponse.json({ payments, total: count ?? 0, page, limit });
  } catch (error) {
    logger.error("Error fetching coach payments", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
