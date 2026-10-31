import type { createRouteHandlerClient } from "@/lib/supabase-server";
import { untypedTable } from "@/lib/utils/untypedTable";
import type { GoalProgressSources } from "@/lib/utils/playerGoalProgress";

type SupabaseClient = Awaited<ReturnType<typeof createRouteHandlerClient>>;

/** Loads the raw activity rows from which every personal goal's progress is derived. */
export async function fetchGoalProgressSources(
  supabase: SupabaseClient,
  playerId: string
): Promise<GoalProgressSources> {
  const [sessionsRes, libraryRes, reviewsRes, collectionsRes] = await Promise.all([
    untypedTable(supabase, "game_sessions")
      .select("started_at, duration_minutes")
      .eq("user_id", playerId),
    supabase
      .from("user_library")
      .select("added_at")
      .eq("user_id", playerId)
      .eq("status", "completed"),
    supabase.from("game_reviews").select("created_at").eq("user_id", playerId),
    supabase.from("game_collections").select("created_at").eq("user_id", playerId),
  ]);
  const sessions = (sessionsRes.data ?? []) as Array<{
    started_at: string;
    duration_minutes: number;
  }>;
  return {
    sessions: sessions.map((s) => ({ startedAt: s.started_at, durationMinutes: s.duration_minutes })),
    completedGames: (libraryRes.data ?? []).map((g) => ({ addedAt: g.added_at })),
    reviews: (reviewsRes.data ?? []).map((r) => ({ createdAt: r.created_at })),
    collections: (collectionsRes.data ?? []).map((c) => ({ createdAt: c.created_at })),
  };
}
