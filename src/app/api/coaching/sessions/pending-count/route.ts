import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { logger } from "@/lib/logger";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type S = any;

/**
 * GET /api/coaching/sessions/pending-count
 * Returns count of sessions requiring action from the current user.
 * - As student: confirmed sessions with payment_status != 'paid'
 * - As coach: requested sessions (need accept/decline) + confirmed+paid (need start)
 */
export async function GET() {
  try {
    const supabase: S = await createRouteHandlerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ count: 0 });

    let count = 0;

    // Student: sessions needing payment
    const { count: studentCount } = await supabase
      .from("coaching_sessions")
      .select("id", { count: "exact", head: true })
      .eq("student_id", user.id)
      .eq("status", "confirmed")
      .neq("payment_status", "paid");
    count += studentCount ?? 0;

    // Coach: sessions needing action
    const { data: coachProfile } = await supabase
      .from("coach_profiles")
      .select("id")
      .eq("player_id", user.id)
      .single();

    if (coachProfile) {
      // Requested sessions (need accept/decline)
      const { count: requestedCount } = await supabase
        .from("coaching_sessions")
        .select("id", { count: "exact", head: true })
        .eq("coach_id", coachProfile.id)
        .eq("status", "requested");
      count += requestedCount ?? 0;

      // Confirmed + paid (need start)
      const { count: paidCount } = await supabase
        .from("coaching_sessions")
        .select("id", { count: "exact", head: true })
        .eq("coach_id", coachProfile.id)
        .eq("status", "confirmed")
        .eq("payment_status", "paid");
      count += paidCount ?? 0;

      // In progress (need complete)
      const { count: progressCount } = await supabase
        .from("coaching_sessions")
        .select("id", { count: "exact", head: true })
        .eq("coach_id", coachProfile.id)
        .eq("status", "in_progress");
      count += progressCount ?? 0;
    }

    return NextResponse.json({ count });
  } catch (error) {
    logger.error("Error fetching pending coaching count", { error });
    return NextResponse.json({ count: 0 });
  }
}
