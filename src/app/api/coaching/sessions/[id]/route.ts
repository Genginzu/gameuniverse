import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { logger } from "@/lib/logger";
import { getCoachingLifecycle } from "@/lib/services/coaching-lifecycle";
import type { ApplyActionResult, SessionAction } from "@/types/coaching-lifecycle";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = any;

type RouteParams = { params: Promise<{ id: string }> };

const FAILURE_STATUS: Record<Extract<ApplyActionResult, { ok: false }>["reason"], number> = {
  invalid_action: 400,
  not_found: 404,
  forbidden: 403,
  invalid_transition: 409,
  conflict: 409,
};

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
 * Apply a session action through the coaching lifecycle. Body: { action, cancellationReason? }
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

    const result = await getCoachingLifecycle().applyAction({
      sessionId: id,
      actorId: user.id,
      action: body?.action as SessionAction,
      cancellationReason: body?.cancellationReason,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.reason }, { status: FAILURE_STATUS[result.reason] });
    }
    return NextResponse.json({ session: result.session, refund: result.refund ?? null });
  } catch (error) {
    logger.error("Error in coaching session PATCH", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
