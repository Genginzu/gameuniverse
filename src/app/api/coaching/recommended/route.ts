import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { logger } from "@/lib/logger";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type S = any;

/** GET /api/coaching/recommended — Coaches matching the player's library games */
export async function GET() {
  try {
    const supabase: S = await createRouteHandlerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Get player's library game IDs
    const { data: library } = await supabase
      .from("player_game_library")
      .select("game_id")
      .eq("player_id", user.id);

    const gameIds = (library || []).map((l: S) => l.game_id);
    if (gameIds.length === 0) return NextResponse.json({ coaches: [] });

    // Find coaches who coach these games
    const { data: coachGames } = await supabase
      .from("coach_games")
      .select("coach_id, game_id")
      .in("game_id", gameIds)
      .eq("is_active", true);

    const coachIds = [...new Set((coachGames || []).map((cg: S) => cg.coach_id))];
    if (coachIds.length === 0) return NextResponse.json({ coaches: [] });

    // Fetch coach profiles
    const { data: coaches } = await supabase
      .from("coach_profiles")
      .select(
        "id, player_id, bio, average_rating, total_reviews, total_sessions, is_verified, profiles!coach_profiles_player_id_fkey(username, avatar_url, display_name)"
      )
      .in("id", coachIds)
      .eq("is_active", true)
      .neq("player_id", user.id)
      .order("average_rating", { ascending: false })
      .limit(6);

    // Map game matches per coach
    const coachGameMap = new Map<string, string[]>();
    for (const cg of coachGames || []) {
      if (!coachGameMap.has(cg.coach_id)) coachGameMap.set(cg.coach_id, []);
      coachGameMap.get(cg.coach_id)!.push(cg.game_id);
    }

    const result = (coaches || []).map((c: S) => ({
      id: c.id,
      username: c.profiles?.username,
      displayName: c.profiles?.display_name,
      avatarUrl: c.profiles?.avatar_url,
      bio: c.bio,
      averageRating: c.average_rating,
      totalReviews: c.total_reviews,
      totalSessions: c.total_sessions,
      isVerified: c.is_verified,
      matchingGameIds: coachGameMap.get(c.id) || [],
    }));

    return NextResponse.json({ coaches: result });
  } catch (error) {
    logger.error("Error fetching recommended coaches", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
