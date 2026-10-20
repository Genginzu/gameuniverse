import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { logger } from "@/lib/logger";
import { createSessionConversation } from "@/lib/services/coachingConversationService";
import { coachingSessionTransitioned } from "@/lib/services/notifications";
import type { CoachingTransitionNotificationType } from "@/types/notification";
import { refundCancelledSession } from "@/lib/services/coachingRefundService";

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

const TRANSITION_NOTIFICATIONS: Record<SessionAction, CoachingTransitionNotificationType> = {
  confirm: "coaching_confirmed",
  decline: "coaching_declined",
  start: "coaching_started",
  complete: "coaching_completed",
  cancel: "coaching_cancelled",
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

    // Build update payload. Payment columns are server-only (DB trigger), so
    // only the status and cancellation fields are written with the user client.
    const updates: Record<string, unknown> = { status: transition.to };

    if (action === "cancel" || action === "decline") {
      updates.cancelled_by = user.id;
      updates.cancelled_at = new Date().toISOString();
      if (typeof body.cancellationReason === "string" && body.cancellationReason) {
        updates.cancellation_reason = body.cancellationReason.slice(0, 1000);
      }
    }

    // Conditional on the status we read: two concurrent requests cannot both
    // apply the transition (and both trigger a refund).
    const { data: claimed, error: updateError } = await supabase
      .from("coaching_sessions")
      .update(updates)
      .eq("id", id)
      .eq("status", session.status)
      .select()
      .maybeSingle();

    if (updateError) {
      logger.error("Error updating coaching session", { error: updateError });
      return NextResponse.json({ error: "Failed to update session" }, { status: 500 });
    }

    if (!claimed) {
      return NextResponse.json({ error: "Session status changed, retry" }, { status: 409 });
    }

    let updated = claimed;
    if (action === "cancel") {
      try {
        const { data: coach } = await supabase
          .from("coach_profiles")
          .select("cancellation_policy")
          .eq("id", session.coach_id)
          .single();
        await refundCancelledSession(session, coach?.cancellation_policy ?? null);
        const { data: refreshed } = await supabase
          .from("coaching_sessions")
          .select("*")
          .eq("id", id)
          .single();
        if (refreshed) updated = refreshed;
      } catch (refundError) {
        logger.error("Stripe refund failed", { error: refundError, sessionId: id });
      }
    }

    // Auto-create conversation on confirm
    if (action === "confirm") {
      try {
        const coachPlayerId = await resolveCoachPlayerId(supabase, session.coach_id);
        if (coachPlayerId) {
          await createSessionConversation(coachPlayerId, session.student_id, id);
        }
      } catch (convError) {
        logger.error("Error creating session conversation", { error: convError });
      }
    }

    const notifyCoach = action === "cancel" && role === "student";
    await coachingSessionTransitioned({
      sessionId: id,
      actorId: user.id,
      recipientId: notifyCoach
        ? await resolveCoachPlayerId(supabase, session.coach_id)
        : session.student_id,
      type: TRANSITION_NOTIFICATIONS[action],
    });

    return NextResponse.json({ session: updated });
  } catch (error) {
    logger.error("Error in coaching session PATCH", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
