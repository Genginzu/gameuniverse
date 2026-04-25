import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { getStripe } from "@/lib/stripe";
import { logger } from "@/lib/logger";

import { NotificationServerService } from "@/lib/services/notificationServerService";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type S = any;

/** POST /api/coaching/stripe/verify — Verify a Stripe checkout session and update payment status */
export async function POST(request: NextRequest) {
  try {
    const supabase: S = await createRouteHandlerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { checkoutSessionId } = await request.json();
    if (!checkoutSessionId)
      return NextResponse.json({ error: "checkoutSessionId required" }, { status: 400 });

    const stripe = getStripe();
    const checkoutSession = await stripe.checkout.sessions.retrieve(checkoutSessionId);

    if (checkoutSession.payment_status !== "paid") {
      return NextResponse.json(
        { error: "Payment not completed", status: checkoutSession.payment_status },
        { status: 400 }
      );
    }

    const coachingSessionId = checkoutSession.metadata?.coaching_session_id;
    if (!coachingSessionId)
      return NextResponse.json({ error: "No session linked" }, { status: 400 });

    // Verify the user is the student
    const { data: session } = await supabase
      .from("coaching_sessions")
      .select("student_id, payment_status")
      .eq("id", coachingSessionId)
      .single();
    if (!session || session.student_id !== user.id)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Already paid — idempotent
    if (session.payment_status === "paid") {
      return NextResponse.json({ success: true, alreadyPaid: true });
    }

    await supabase
      .from("coaching_sessions")
      .update({ payment_status: "paid" })
      .eq("id", coachingSessionId);

    // Notify coach that payment was received
    try {
      const { data: fullSession } = await supabase
        .from("coaching_sessions")
        .select("coach_id")
        .eq("id", coachingSessionId)
        .single();
      if (fullSession) {
        const { data: coach } = await supabase
          .from("coach_profiles")
          .select("player_id")
          .eq("id", fullSession.coach_id)
          .single();
        if (coach?.player_id) {
          await NotificationServerService.create(
            coach.player_id,
            user.id,
            "coaching_paid",
            coachingSessionId,
            "coaching_paid"
          );
        }
      }
    } catch {
      /* non-blocking */
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error verifying payment", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
