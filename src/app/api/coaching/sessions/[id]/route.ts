import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { logger } from "@/lib/logger";
import { createSessionConversation } from "@/lib/services/coachingConversationService";
import { calculateRefund } from "@/lib/services/cancellationService";
import { getStripe } from "@/lib/stripe";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = any;

type RouteParams = { params: Promise<{ id: string }> };

type SessionAction = "confirm" | "decline" | "start" | "complete" | "cancel";

/** Resolve coach_profiles.player_id for a given coach_profiles.id. */
async function resolveCoachPlayerId(
  supabase: AnySupabase,
  coachProfileId: string
): Promise<string | null> {
  const { data } = await supabase
    .from("coach_profiles")
    .select("player_id")
    .eq("id", coachProfileId)
    .single();
  return data?.player_id ?? null;
}

/** Check if user is the coach (via coach_profiles) or the student. */
async function getUserRole(
  supabase: AnySupabase,
  session: AnySupabase,
  userId: string
): Promise<"coach" | "student" | null> {
  if (session.student_id === userId) return "student";
  const coachPlayerId = await resolveCoachPlayerId(supabase, session.coach_id);
  if (coachPlayerId === userId) return "coach";
  return null;
}

/** State machine transitions: action -> { from, to, allowedRoles } */
const TRANSITIONS: Record<
  SessionAction,
  { from: string[]; to: string; allowedRoles: ("coach" | "student")[] }
> = {
  confirm: { from: ["requested"], to: "confirmed", allowedRoles: ["coach"] },
  decline: { from: ["requested"], to: "cancelled", allowedRoles: ["coach"] },
  start: { from: ["confirmed"], to: "in_progress", allowedRoles: ["coach"] },
  complete: { from: ["in_progress"], to: "completed", allowedRoles: ["coach"] },
  cancel: {
    from: ["requested", "confirmed"],
    to: "cancelled",
    allowedRoles: ["coach", "student"],
  },
};

/**
 * GET /api/coaching/sessions/[id]
 * Get session detail. Auth required, must be coach or student.
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const supabase: AnySupabase = await createRouteHandlerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const { data: session, error } = await supabase
      .from("coaching_sessions")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const role = await getUserRole(supabase, session, user.id);
    if (!role) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ session, role });
  } catch (error) {
    logger.error("Error in coaching session GET", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/coaching/sessions/[id]
 * Update session status via state machine. Body: { action, cancellationReason? }
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase: AnySupabase = await createRouteHandlerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const action = body.action as SessionAction;

    if (!action || !TRANSITIONS[action]) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Fetch current session
    const { data: session, error: fetchError } = await supabase
      .from("coaching_sessions")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Check user role
    const role = await getUserRole(supabase, session, user.id);
    if (!role) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const transition = TRANSITIONS[action];

    // Check role is allowed for this action
    if (!transition.allowedRoles.includes(role)) {
      return NextResponse.json(
        { error: `Action '${action}' not allowed for ${role}` },
        { status: 403 }
      );
    }

    // Check valid state transition
    if (!transition.from.includes(session.status)) {
      return NextResponse.json(
        { error: `Cannot '${action}' a session with status '${session.status}'` },
        { status: 409 }
      );
    }

    // Build update payload
    const updates: Record<string, unknown> = { status: transition.to };

    if (action === "cancel" || action === "decline") {
      updates.cancelled_by = user.id;
      updates.cancelled_at = new Date().toISOString();
      if (body.cancellationReason) {
        updates.cancellation_reason = body.cancellationReason;
      }
      // Calculate refund if payment exists
      if (action === "cancel" && session.payment_amount) {
        const { data: coach } = await supabase.from("coach_profiles").select("cancellation_policy").eq("id", session.coach_id).single();
        if (coach?.cancellation_policy) {
          const { refundAmount } = calculateRefund(coach.cancellation_policy, session.scheduled_at, session.payment_amount);
          updates.refund_amount = refundAmount;
          // Issue Stripe refund if payment was made
          if (refundAmount > 0 && session.payment_status === "paid") {
            try {
              const stripe = getStripe();
              const payments = await stripe.paymentIntents.search({ query: `metadata["coaching_session_id"]:"${id}"` });
              if (payments.data[0]) {
                await stripe.refunds.create({
                  payment_intent: payments.data[0].id,
                  amount: Math.round(refundAmount * 100),
                });
                updates.payment_status = "refunded";
              }
            } catch (stripeErr) {
              logger.error("Stripe refund failed", { error: stripeErr, sessionId: id });
            }
          }
        }
      }
    }

    const { data: updated, error: updateError } = await supabase
      .from("coaching_sessions")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      logger.error("Error updating coaching session", { error: updateError });
      return NextResponse.json({ error: "Failed to update session" }, { status: 500 });
    }

    // Auto-create conversation on confirm
    if (action === "confirm") {
      try {
        const coachPlayerId = await resolveCoachPlayerId(supabase, session.coach_id);
        if (coachPlayerId) {
          await createSessionConversation(supabase, coachPlayerId, session.student_id, id);
        }
      } catch (convError) {
        logger.error("Error creating session conversation", { error: convError });
      }
    }

    return NextResponse.json({ session: updated });
  } catch (error) {
    logger.error("Error in coaching session PATCH", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
