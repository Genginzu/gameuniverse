import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { logger } from "@/lib/logger";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = any;

/**
 * POST /api/coaching/sessions
 * Create a coaching session request. Auth required (student = current user).
 */
export async function POST(request: NextRequest) {
  try {
    const supabase: AnySupabase = await createRouteHandlerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { coachId, gameId, pricingId, scheduledAt, durationMinutes } = body;

    if (!coachId || !gameId || !scheduledAt || !durationMinutes) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Validate coach exists and is active
    const { data: coach } = await supabase
      .from("coach_profiles")
      .select("id, is_active")
      .eq("id", coachId)
      .single();

    if (!coach) {
      return NextResponse.json({ error: "Coach not found" }, { status: 404 });
    }

    if (!coach.is_active) {
      return NextResponse.json({ error: "Coach is not active" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("coaching_sessions")
      .insert({
        coach_id: coachId,
        student_id: user.id,
        game_id: gameId,
        pricing_id: pricingId,
        scheduled_at: scheduledAt,
        duration_minutes: durationMinutes,
        status: "requested",
      })
      .select()
      .single();

    if (error) {
      logger.error("Error creating coaching session", { error });
      return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
    }

    // Notify coach of new session request
    try {
      const { data: coach } = await supabase.from("coach_profiles").select("player_id").eq("id", coachId).single();
      if (coach?.player_id) {
        const { NotificationServerService } = await import("@/lib/services/notificationServerService");
        await NotificationServerService.create(coach.player_id, user.id, "coaching_requested", data.id, "coaching_requested");
      }
    } catch { /* non-blocking */ }

    return NextResponse.json({ session: data }, { status: 201 });
  } catch (error) {
    logger.error("Error in coaching sessions POST", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/** Resolve coach_profiles.id for a given player_id. */
async function resolveCoachId(supabase: AnySupabase, playerId: string): Promise<string | null> {
  const { data } = await supabase
    .from("coach_profiles")
    .select("id")
    .eq("player_id", playerId)
    .single();
  return data?.id ?? null;
}

/**
 * GET /api/coaching/sessions
 * List sessions for the current user. Query params: role, status, page, limit.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase: AnySupabase = await createRouteHandlerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role") || "student";
    const status = searchParams.get("status");
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit")) || 20));
    const offset = (page - 1) * limit;

    let query = supabase
      .from("coaching_sessions")
      .select("*", { count: "exact" });

    if (role === "coach") {
      const coachId = await resolveCoachId(supabase, user.id);
      if (!coachId) {
        return NextResponse.json({ sessions: [], total: 0, page, limit });
      }
      query = query.eq("coach_id", coachId);
    } else {
      query = query.eq("student_id", user.id);
    }

    if (status) {
      query = query.eq("status", status);
    }

    query = query.order("created_at", { ascending: false }).range(offset, offset + limit - 1);

    const { data: sessions, error, count } = await query;

    if (error) {
      logger.error("Error fetching coaching sessions", { error });
      return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 });
    }

    if (!sessions || sessions.length === 0) {
      return NextResponse.json({ sessions: [], total: 0, page, limit });
    }

    // Collect IDs for joined data
    const gameIds = [...new Set(sessions.map((s: AnySupabase) => s.game_id))];
    const otherPartyIds = [
      ...new Set(
        sessions.map((s: AnySupabase) =>
          role === "coach" ? s.student_id : null
        ).filter(Boolean)
      ),
    ];
    const coachIds = role === "student"
      ? [...new Set(sessions.map((s: AnySupabase) => s.coach_id))]
      : [];

    // Fetch game info
    const { data: games } = await supabase
      .from("games")
      .select("id, cover_image_url, game_translations(title, language_code)")
      .in("id", gameIds);

    const gameMap = new Map<string, { title: string; coverImageUrl: string | null }>(
      (games || []).map((g: AnySupabase) => [
        g.id,
        {
          title: g.game_translations?.[0]?.title ?? "",
          coverImageUrl: g.cover_image_url,
        },
      ])
    );

    // Fetch other party profiles
    // For role=coach, other party is student (direct profile id)
    // For role=student, other party is coach (need to resolve player_id from coach_profiles)
    let profileMap = new Map<string, { username: string | null; avatarUrl: string | null }>();

    if (role === "coach" && otherPartyIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", otherPartyIds);

      profileMap = new Map(
        (profiles || []).map((p: AnySupabase) => [
          p.id,
          { username: p.username, avatarUrl: p.avatar_url },
        ])
      );
    }

    // For role=student, resolve coach player_ids then fetch profiles
    const coachProfileMap = new Map<string, { username: string | null; avatarUrl: string | null }>();
    if (role === "student" && coachIds.length > 0) {
      const { data: coachProfiles } = await supabase
        .from("coach_profiles")
        .select("id, player_id")
        .in("id", coachIds);

      const playerIds = (coachProfiles || []).map((c: AnySupabase) => c.player_id);
      const coachIdToPlayerId = new Map<string, string>(
        (coachProfiles || []).map((c: AnySupabase) => [c.id, c.player_id])
      );

      if (playerIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, username, avatar_url")
          .in("id", playerIds);

        const playerProfileMap = new Map<string, { username: string | null; avatarUrl: string | null }>(
          (profiles || []).map((p: AnySupabase) => [
            p.id,
            { username: p.username, avatarUrl: p.avatar_url },
          ])
        );

        for (const [coachProfileId, playerId] of coachIdToPlayerId) {
          const profile = playerProfileMap.get(playerId);
          if (profile) coachProfileMap.set(coachProfileId, profile);
        }
      }
    }

    const enriched = sessions.map((s: AnySupabase) => {
      const game = gameMap.get(s.game_id);
      const otherParty =
        role === "coach"
          ? profileMap.get(s.student_id)
          : coachProfileMap.get(s.coach_id);

      return {
        id: s.id,
        coachId: s.coach_id,
        studentId: s.student_id,
        gameId: s.game_id,
        pricingId: s.pricing_id,
        status: s.status,
        scheduledAt: s.scheduled_at,
        durationMinutes: s.duration_minutes,
        paymentAmount: s.payment_amount,
        paymentStatus: s.payment_status,
        createdAt: s.created_at,
        gameTitle: game?.title ?? null,
        gameCoverImage: game?.coverImageUrl ?? null,
        otherParty: otherParty ?? null,
        conversationId: s.conversation_id ?? null,
      };
    });

    return NextResponse.json({ sessions: enriched, total: count ?? 0, page, limit });
  } catch (error) {
    logger.error("Error in coaching sessions GET", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
