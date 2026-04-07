import { createRouteHandlerClient } from "@/lib/supabase-server";
import { logger } from "@/lib/logger";
// prettier-ignore
import { ACHIEVEMENT_DEFINITIONS, type AchievementData, type AchievementDefinition, type CompletionStats, type DashboardStatsResponse, type GenreDistributionEntry, type MonthlyActivity, type OverviewMetrics, type PlatformDistributionEntry, type PlaytimeData, type PlayerGoal, type ReviewAnalyticsData, type SessionStatsData, type SocialStatsData } from "@/types/dashboard-stats";
// prettier-ignore
import { computeOverviewMetrics, computeGenreDistribution, computeCompletionStats, computeReviewDistribution, computeReviewStatistics, computeActivityByMonth, computeAveragePlaytime, computeTopGame, computeAchievementProgress, computeSessionFrequency, computePlatformDistribution } from "@/lib/services/dashboardStatsCompute";
import { untypedTable } from "@/lib/utils/untypedTable";

type SupabaseClient = Awaited<ReturnType<typeof createRouteHandlerClient>>;

function logAndThrow(ctx: string, err: { message: string }): Error {
  logger.error(`DashboardStatsService.${ctx} failed`, { error: err });
  return new Error(err.message);
}

/** Helper: count query on a typed table with optional OR filter */
async function countWhere(
  supabase: SupabaseClient,
  table: string,
  filters: Record<string, string>,
  or?: string
): Promise<number> {
  let q = supabase.from(table).select("id", { count: "exact", head: true });
  for (const [k, v] of Object.entries(filters)) q = q.eq(k, v);
  if (or) q = q.or(or);
  const { count } = await q;
  return count ?? 0;
}

/**
 * Server-side service for the player stats dashboard.
 * Each static method queries Supabase then delegates to pure compute functions.
 */
export class DashboardStatsService {
  /** Req 1 — Overview metrics */
  static async fetchOverviewMetrics(playerId: string): Promise<OverviewMetrics> {
    const supabase = await createRouteHandlerClient();
    const orFriend = `user_id.eq.${playerId},friend_id.eq.${playerId}`;
    const [libRes, revRes, colCount, frdCount] = await Promise.all([
      supabase.from("user_library").select("play_time_hours").eq("user_id", playerId),
      supabase.from("game_reviews").select("rating").eq("user_id", playerId),
      countWhere(supabase, "game_collections", { user_id: playerId }),
      countWhere(supabase, "friendships", { status: "accepted" }, orFriend),
    ]);
    if (libRes.error) throw logAndThrow("fetchOverviewMetrics", libRes.error);
    if (revRes.error) throw logAndThrow("fetchOverviewMetrics", revRes.error);
    return computeOverviewMetrics(
      (libRes.data ?? []) as Array<{ play_time_hours: number | null }>,
      (revRes.data ?? []) as Array<{ rating: number }>,
      Array(colCount).fill(null) as unknown[],
      Array(frdCount).fill(null) as unknown[]
    );
  }

  /** Req 2 — Genre distribution (top 5 + "Autres") */
  static async fetchGenreDistribution(
    playerId: string,
    _locale: string
  ): Promise<GenreDistributionEntry[]> {
    const supabase = await createRouteHandlerClient();
    const { data, error } = await supabase
      .from("user_library")
      .select(`game_id, games(game_genres(genres(genre_translations(name))))`)
      .eq("user_id", playerId);
    if (error) throw logAndThrow("fetchGenreDistribution", error);
    const libraryWithGenres = (
      (data ?? []) as Array<{
        games?: {
          game_genres?: Array<{ genres?: { genre_translations?: Array<{ name: string }> } }>;
        };
      }>
    ).map((row) => {
      const genres: string[] = [];
      for (const gg of row.games?.game_genres ?? []) {
        const match = (gg.genres?.genre_translations ?? []).find((t) => t.name);
        if (match?.name) genres.push(match.name);
      }
      return { genres };
    });
    return computeGenreDistribution(libraryWithGenres);
  }

  /** Req 3 — Completion stats by status */
  static async fetchCompletionStats(playerId: string): Promise<CompletionStats> {
    const supabase = await createRouteHandlerClient();
    const { data, error } = await supabase
      .from("user_library")
      .select("status")
      .eq("user_id", playerId);
    if (error) throw logAndThrow("fetchCompletionStats", error);
    return computeCompletionStats(
      (data ?? []) as Array<{ status: "owned" | "playing" | "completed" | "wishlist" }>
    );
  }

  /** Req 4 — Review analytics (distribution + statistics + helpful votes) */
  static async fetchReviewAnalytics(playerId: string): Promise<ReviewAnalyticsData> {
    const supabase = await createRouteHandlerClient();
    const { data: revData, error } = await supabase
      .from("game_reviews")
      .select("id, rating")
      .eq("user_id", playerId);
    if (error) throw logAndThrow("fetchReviewAnalytics", error);
    const reviews = (revData ?? []) as Array<{ id: string; rating: number }>;
    const ratings = reviews.map((r) => r.rating);
    let helpfulVotesReceived = 0;
    if (reviews.length > 0) {
      const { count } = await untypedTable(supabase, "review_votes")
        .select("id", { count: "exact", head: true })
        .in(
          "review_id",
          reviews.map((r) => r.id)
        )
        .eq("vote_type", "helpful");
      helpfulVotesReceived = count ?? 0;
    }
    const stats = computeReviewStatistics(ratings);
    return {
      distribution: computeReviewDistribution(ratings),
      averageRating: stats.average,
      medianRating: stats.median,
      modeRating: stats.mode,
      maxRating: stats.max,
      totalReviews: ratings.length,
      helpfulVotesReceived,
    };
  }

  /** Req 5 — Social stats */
  static async fetchSocialStats(playerId: string): Promise<SocialStatsData> {
    const supabase = await createRouteHandlerClient();
    const orFriend = `user_id.eq.${playerId},friend_id.eq.${playerId}`;
    const [frd, cmt, fav, col] = await Promise.all([
      countWhere(supabase, "friendships", { status: "accepted" }, orFriend),
      countWhere(supabase, "character_comments", { user_id: playerId }),
      countWhere(supabase, "character_favorites", { user_id: playerId }),
      countWhere(supabase, "game_collections", { user_id: playerId }),
    ]);
    return { friendsCount: frd, commentsCount: cmt, favoritesCount: fav, collectionsCount: col };
  }

  /** Req 6 — Activity timeline (last 12 months) */
  static async fetchActivityTimeline(playerId: string, locale: string): Promise<MonthlyActivity[]> {
    const supabase = await createRouteHandlerClient();
    const { data, error } = await supabase
      .from("user_library")
      .select("added_at")
      .eq("user_id", playerId);
    if (error) throw logAndThrow("fetchActivityTimeline", error);
    return computeActivityByMonth((data ?? []) as Array<{ added_at: string }>, new Date(), locale);
  }

  /** Req 7 — Playtime stats (average + top game) */
  static async fetchPlaytimeStats(playerId: string, _locale: string): Promise<PlaytimeData> {
    const supabase = await createRouteHandlerClient();
    const { data, error } = await supabase
      .from("user_library")
      .select(`play_time_hours, game_id, games(id, cover_image_url, game_translations(title))`)
      .eq("user_id", playerId);
    if (error) throw logAndThrow("fetchPlaytimeStats", error);
    const rows = (data ?? []) as Array<{
      play_time_hours: number | null;
      game_id: string;
      games?: {
        id?: string;
        cover_image_url?: string | null;
        game_translations?: Array<{ title: string }>;
      };
    }>;
    const gamesForTop = rows.map((r) => ({
      id: r.games?.id ?? r.game_id,
      title: r.games?.game_translations?.[0]?.title ?? "",
      coverImage: r.games?.cover_image_url ?? null,
      playTimeHours: r.play_time_hours ?? 0,
    }));
    const topGames = [...gamesForTop]
      .filter((g) => g.playTimeHours > 0)
      .sort((a, b) => b.playTimeHours - a.playTimeHours)
      .slice(0, 5);
    return {
      averagePlayTimeHours: computeAveragePlaytime(rows.map((r) => r.play_time_hours ?? 0)),
      topGame: computeTopGame(gamesForTop),
      topGames,
    };
  }

  /** Req 11 — Achievements (unlocked keys + progress) */
  static async fetchAchievements(playerId: string): Promise<{
    achievements: AchievementData[];
    definitions: AchievementDefinition[];
  }> {
    const supabase = await createRouteHandlerClient();
    const orFriend = `user_id.eq.${playerId},friend_id.eq.${playerId}`;
    const [achRes, libRes, revCount, frdCount, colCount] = await Promise.all([
      untypedTable(supabase, "player_achievements")
        .select("achievement_key, unlocked_at")
        .eq("user_id", playerId),
      supabase.from("user_library").select("play_time_hours").eq("user_id", playerId),
      countWhere(supabase, "game_reviews", { user_id: playerId }),
      countWhere(supabase, "friendships", { status: "accepted" }, orFriend),
      countWhere(supabase, "game_collections", { user_id: playerId }),
    ]);
    const unlockedKeys = ((achRes.data ?? []) as Array<{ achievement_key: string }>).map(
      (r) => r.achievement_key
    );
    const libData = (libRes.data ?? []) as Array<{ play_time_hours: number | null }>;
    const totalPlaytime = libData.reduce((s, e) => s + (e.play_time_hours ?? 0), 0);
    const playerCounts: Record<string, number> = {
      library: libData.length,
      reviews: revCount,
      social: Math.max(frdCount, colCount),
      playtime: totalPlaytime,
    };
    const result = computeAchievementProgress(ACHIEVEMENT_DEFINITIONS, playerCounts, unlockedKeys);
    return { achievements: result.achievements, definitions: ACHIEVEMENT_DEFINITIONS };
  }

  /** Req 12 — Session stats */
  static async fetchSessionStats(playerId: string): Promise<SessionStatsData> {
    const supabase = await createRouteHandlerClient();
    const { data, error } = await untypedTable(supabase, "game_sessions")
      .select("started_at, duration_minutes")
      .eq("user_id", playerId);
    if (error && error.code !== "PGRST205") throw logAndThrow("fetchSessionStats", error);
    const rows = (data ?? []) as Array<{ started_at: string; duration_minutes: number }>;
    if (rows.length === 0) {
      return {
        totalSessions: 0,
        averageDurationMinutes: null,
        longestSessionMinutes: null,
        frequencyByDayOfWeek: computeSessionFrequency([]),
      };
    }
    const durations = rows.map((r) => r.duration_minutes);
    const sum = durations.reduce((a, b) => a + b, 0);
    return {
      totalSessions: durations.length,
      averageDurationMinutes: Math.round(sum / durations.length),
      longestSessionMinutes: Math.max(...durations),
      frequencyByDayOfWeek: computeSessionFrequency(rows.map((r) => ({ startedAt: r.started_at }))),
    };
  }

  /** Req 13 — Player goals */
  static async fetchPlayerGoals(playerId: string): Promise<PlayerGoal[]> {
    const supabase = await createRouteHandlerClient();
    const { data, error } = await untypedTable(supabase, "player_goals")
      .select("id, goal_type, target_value, current_value, created_at, deadline")
      .eq("user_id", playerId)
      .order("created_at", { ascending: false });
    if (error && error.code !== "PGRST205") throw logAndThrow("fetchPlayerGoals", error);
    return (
      (data ?? []) as Array<{
        id: string;
        goal_type: string;
        target_value: number;
        current_value: number;
        created_at: string;
        deadline: string | null;
      }>
    ).map((r) => ({
      id: r.id,
      goalType: r.goal_type as PlayerGoal["goalType"],
      targetValue: r.target_value,
      currentValue: r.current_value,
      deadline: r.deadline ?? null,
      createdAt: r.created_at,
    }));
  }

  /** Req 5 (platforms) — Platform distribution from user library */
  static async fetchPlatformDistribution(playerId: string): Promise<PlatformDistributionEntry[]> {
    const supabase = await createRouteHandlerClient();
    const { data, error } = await supabase
      .from("user_library")
      .select(`game_id, games(game_platforms(platforms(platform_translations(name))))`)
      .eq("user_id", playerId);
    if (error) throw logAndThrow("fetchPlatformDistribution", error);
    const libraryWithPlatforms = (
      (data ?? []) as Array<{
        games?: {
          game_platforms?: Array<{
            platforms?: { platform_translations?: Array<{ name: string }> };
          }>;
        };
      }>
    ).map((row) => {
      const platforms: string[] = [];
      for (const gp of row.games?.game_platforms ?? []) {
        const match = (gp.platforms?.platform_translations ?? []).find((t) => t.name);
        if (match?.name) platforms.push(match.name);
      }
      return { platforms };
    });
    return computePlatformDistribution(libraryWithPlatforms);
  }

  /** Fetch all dashboard stats in parallel (Req 9.6) */
  static async fetchAllStats(playerId: string, locale: string): Promise<DashboardStatsResponse> {
    const [
      overview,
      genreDistribution,
      platformDistribution,
      completion,
      reviewAnalytics,
      social,
      activityTimeline,
      playtime,
      achResult,
      sessions,
      goals,
    ] = await Promise.all([
      this.fetchOverviewMetrics(playerId),
      this.fetchGenreDistribution(playerId, locale),
      this.fetchPlatformDistribution(playerId),
      this.fetchCompletionStats(playerId),
      this.fetchReviewAnalytics(playerId),
      this.fetchSocialStats(playerId),
      this.fetchActivityTimeline(playerId, locale),
      this.fetchPlaytimeStats(playerId, locale),
      this.fetchAchievements(playerId),
      this.fetchSessionStats(playerId),
      this.fetchPlayerGoals(playerId),
    ]);
    return {
      overview,
      genreDistribution,
      platformDistribution,
      completion,
      reviewAnalytics,
      social,
      activityTimeline,
      playtime,
      sessions,
      goals,
      achievements: achResult.achievements,
      achievementDefinitions: achResult.definitions,
    };
  }
}
