import {
  PlayerSummary,
  PlayerDetails,
  PlayerLibraryGame,
  PlayersResponse,
  GAME_COUNT_RANGES,
  GameCountRangeKey,
} from "@/types/player";
import { createServerClient } from "@/lib/supabase-server";
import { isStatsPrivate } from "./playerStatsDbHelpers";
import { logger } from "@/lib/logger";
import { calculatePlayerStats } from "./playerService.stats";
import { computeLevel } from "./levelSystem";
import type { ProfileRow, LibraryEntry } from "./playerService.types";

/**
 * Récupère la liste des joueurs directement depuis la base de données
 */
export async function fetchPlayersFromDB(
  options: {
    search?: string;
    gameCountRange?: string;
    page?: number;
    limit?: number;
  } = {}
): Promise<PlayersResponse> {
  const { search = "", gameCountRange, page = 1, limit = 20 } = options;

  const supabase = await createServerClient();
  const offset = (page - 1) * limit;

  let query = supabase.from("profiles").select(
    `
      id,
      username,
      avatar_url,
      banner_url,
      created_at
    `,
    { count: "exact" }
  );

  if (search.trim()) {
    query = query.ilike("username", `%${search.trim()}%`);
  }

  const { data: allProfiles, error: queryError } = await query;

  if (queryError) {
    logger.error("Error fetching players", { error: queryError });
    throw new Error(`Failed to fetch players: ${queryError.message}`);
  }

  const profileIds = (allProfiles || []).map((p) => p.id);
  const gameCounts: Record<string, number> = {};
  const reviewCounts: Record<string, number> = {};
  const xpTotals: Record<string, number> = {};

  if (profileIds.length > 0) {
    const { data: libraryCounts, error: countError } = await supabase
      .from("user_library")
      .select("user_id")
      .in("user_id", profileIds);

    if (countError) {
      logger.warn("Error fetching library counts", { error: countError });
    } else if (libraryCounts) {
      for (const entry of libraryCounts) {
        gameCounts[entry.user_id] = (gameCounts[entry.user_id] || 0) + 1;
      }
    }

    const { data: reviewData, error: reviewError } = await supabase
      .from("game_reviews")
      .select("user_id")
      .in("user_id", profileIds);

    if (reviewError) {
      logger.warn("Error fetching review counts", { error: reviewError });
    } else if (reviewData) {
      for (const entry of reviewData) {
        reviewCounts[entry.user_id] = (reviewCounts[entry.user_id] || 0) + 1;
      }
    }

    const { data: xpData, error: xpError } = await supabase
      .from("player_xp")
      .select("user_id, xp_total")
      .in("user_id", profileIds);

    if (xpError) {
      logger.warn("Error fetching player XP", { error: xpError });
    } else if (xpData) {
      for (const entry of xpData) {
        xpTotals[entry.user_id] = entry.xp_total ?? 0;
      }
    }
  }

  let transformedPlayers: PlayerSummary[] = ((allProfiles as unknown as ProfileRow[]) || []).map(
    (profile) => {
      const gamesCount = gameCounts[profile.id] || 0;
      return {
        id: profile.id,
        fullName: profile.username,
        avatarUrl: profile.avatar_url,
        bannerUrl: profile.banner_url,
        gamesCount,
        level: computeLevel(xpTotals[profile.id] ?? 0),
        socialLinks: {},
        reviewCount: reviewCounts[profile.id] || 0,
        createdAt: profile.created_at || new Date().toISOString(),
      };
    }
  );

  if (gameCountRange && gameCountRange in GAME_COUNT_RANGES) {
    const range = GAME_COUNT_RANGES[gameCountRange as GameCountRangeKey];
    transformedPlayers = transformedPlayers.filter(
      (player) => player.gamesCount >= range.min && player.gamesCount <= range.max
    );
  }

  transformedPlayers.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const totalCount = transformedPlayers.length;
  const totalPages = Math.ceil(totalCount / limit);
  const hasNextPage = page < totalPages;
  const hasPreviousPage = page > 1;
  const paginatedPlayers = transformedPlayers.slice(offset, offset + limit);

  return {
    players: paginatedPlayers,
    pagination: {
      currentPage: page,
      totalPages,
      totalCount,
      hasNextPage,
      hasPreviousPage,
    },
  };
}

/**
 * Récupère les détails d'un joueur directement depuis la base de données
 */
export async function fetchPlayerDetailsFromDB(
  playerId: string,
  locale: string = "fr"
): Promise<PlayerDetails | null> {
  const supabase = await createServerClient();

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(
      `
      id,
      username,
      avatar_url,
      banner_url,
      preferred_locale,
      created_at,
      updated_at
    `
    )
    .eq("id", playerId)
    .single();

  if (profileError) {
    if (profileError.code === "PGRST116") return null;
    logger.error("Error fetching player details", { playerId, error: profileError });
    throw new Error(`Failed to fetch player details: ${profileError.message}`);
  }

  if (!profile) return null;

  const { count: libraryTotalCount } = await supabase
    .from("user_library")
    .select("id", { count: "exact", head: true })
    .eq("user_id", playerId);

  const { data: statsData } = await supabase
    .from("user_library")
    .select(
      "status, play_time_hours, play_time_hastily, play_time_normally, play_time_completely, rating"
    )
    .eq("user_id", playerId);

  const SSR_LIBRARY_LIMIT = 30;
  const { data: libraryData, error: libraryError } = await supabase
    .from("user_library")
    .select(
      `
      id,
      game_id,
      status,
      play_time_hours,
      play_time_hastily,
      play_time_normally,
      play_time_completely,
      rating,
      added_at,
      games(
        id,
        slug,
        cover_image_url,
        game_translations(
          title,
          language_code
        )
      )
    `
    )
    .eq("user_id", playerId)
    .order("added_at", { ascending: false })
    .range(0, SSR_LIBRARY_LIMIT - 1);

  if (libraryError) {
    logger.warn("Error fetching user library", { error: libraryError });
  }

  const library: PlayerLibraryGame[] = ((libraryData || []) as LibraryEntry[])
    .map((entry) => {
      const game = entry.games;
      if (!game) return null;
      const translation =
        game.game_translations?.find((t) => t.language_code === locale) ||
        game.game_translations?.[0];
      return {
        id: entry.id,
        gameId: entry.game_id,
        slug: game.slug,
        title: translation?.title || "Unknown",
        coverImage: game.cover_image_url,
        status: entry.status as PlayerLibraryGame["status"],
        playTimeHours: Math.max(
          entry.play_time_completely || 0,
          entry.play_time_normally || 0,
          entry.play_time_hastily || 0
        ),
        rating: entry.rating,
        addedAt: entry.added_at,
      };
    })
    .filter((entry): entry is PlayerLibraryGame => entry !== null);

  const statsLibrary: PlayerLibraryGame[] = (statsData || []).map((row, i) => ({
    id: String(i),
    gameId: "",
    slug: "",
    title: "",
    coverImage: null,
    status: row.status as PlayerLibraryGame["status"],
    playTimeHours: Math.max(
      row.play_time_completely || 0,
      row.play_time_normally || 0,
      row.play_time_hastily || 0
    ),
    rating: row.rating,
    addedAt: "",
  }));
  const stats = calculatePlayerStats(statsLibrary);

  const statsPrivate = await isStatsPrivate(supabase, playerId);

  const { data: xpRow, error: xpError } = await supabase
    .from("player_xp")
    .select("xp_total")
    .eq("user_id", playerId)
    .maybeSingle();

  if (xpError) {
    logger.warn("Error fetching player XP", { playerId, error: xpError });
  }

  const level = computeLevel(xpRow?.xp_total ?? 0);

  return {
    id: profile.id,
    fullName: profile.username,
    avatarUrl: profile.avatar_url,
    bannerUrl: profile.banner_url || null,
    socialLinks: {},
    level,
    preferredLocale: profile.preferred_locale || "fr",
    createdAt: profile.created_at || new Date().toISOString(),
    updatedAt: profile.updated_at || new Date().toISOString(),
    statsPrivate,
    stats,
    library,
    libraryTotalCount: libraryTotalCount ?? library.length,
  };
}
