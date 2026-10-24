import { NextResponse } from "next/server";
import { z } from "zod";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { defineRoute, forbidden, notFound } from "@/lib/api/route";
import { getCoachingLifecycle } from "@/lib/services/coaching-lifecycle";
import type { ApplyActionResult, SessionAction } from "@/types/coaching-lifecycle";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = any;

const FAILURE_STATUS: Record<Extract<ApplyActionResult, { ok: false }>["reason"], number> = {
  invalid_action: 400,
  not_found: 404,
  forbidden: 403,
  invalid_transition: 409,
  conflict: 409,
};

const sessionUpdateSchema = z.looseObject({
  action: z.unknown().optional(),
  cancellationReason: z.unknown().optional(),
});

/** Check if user is the coach (via coach_profiles) or the student. */
async function getUserRole(
  supabase: AnySupabase,
  session: AnySupabase,
  userId: string
): Promise<"coach" | "student" | null> {
  if (session.student_id === userId) return "student";
  const { data } = await supabase
    .from("coach_profiles")
    .select("player_id")
    .eq("id", session.coach_id)
    .single();
  return data?.player_id === userId ? "coach" : null;
}

/**
 * GET /api/coaching/sessions/[id]
 * Get session detail. Auth required, must be coach or student.
 */
export const GET = defineRoute({ auth: "required" }, async ({ user, params }) => {
  const supabase: AnySupabase = await createRouteHandlerClient();

  const { id } = params;

  const { data: session, error } = await supabase
    .from("coaching_sessions")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !session) throw notFound("Session not found");

  const role = await getUserRole(supabase, session, user.id);
  if (!role) throw forbidden("Forbidden");

  return NextResponse.json({ session, role });
});

/**
 * PATCH /api/coaching/sessions/[id]
 * Apply a session action through the coaching lifecycle. Body: { action, cancellationReason? }
 * Failure bodies keep the lifecycle reason as `error`, which the client reads.
 */
export const PATCH = defineRoute(
  { auth: "required", rateLimit: "coachingBooking", body: sessionUpdateSchema },
  async ({ user, params, body }) => {
    const result = await getCoachingLifecycle().applyAction({
      sessionId: params.id,
      actorId: user.id,
      action: body.action as SessionAction,
      cancellationReason: body.cancellationReason as string | undefined,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.reason }, { status: FAILURE_STATUS[result.reason] });
    }
    return NextResponse.json({ session: result.session, refund: result.refund ?? null });
  }
);
