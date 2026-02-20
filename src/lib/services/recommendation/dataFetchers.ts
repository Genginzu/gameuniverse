/**
 * Supabase data fetchers for the recommendation engine.
 *
 * Each function performs a single, focused query against the database.
 * These are separated from the orchestration logic to keep files small
 * and responsibilities clear.
 */

import { createServerClient } from "@/lib/supabase-server";
import type { GameRecommendation } from "@/types/recommendation";

/** Genre IDs for a single game */
export async function fetchGameGenreIds(gameId: string): Promise<string[]> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("game_genres")
    .select("genre_id")
    .eq("game_id", gameId);

  if (error) throw new Error(`Failed to fetch genres for game ${gameId}: ${error.message}`);
  return (data ?? []).map((row) => row.genre_id);
}

/** Genre IDs for ALL games, grouped by game_id */
export async function fetchAllGameGenres(): Promise<Map<string, string[]>> {
  const supabase = await createServerClient();
  const { data, error } = await supabase.from("game_genres").select("game_id, genre_id");

  if (error) throw new Error(`Failed to fetch all game genres: ${error.message}`);

  const genresByGame = new Map<string, string[]>();
  for (const row of data ?? []) {
    const existing = genresByGame.get(row.game_id) ?? [];
    existing.push(row.genre_id);
    genresByGame.set(row.game_id, existing);
  }
  return genresByGame;
}

/** Co-occurrence counts: how many users own both the source game and each candidate */
export interface CoOccurrenceRow {
  candidateGameId: string;
  coOccurrenceCount: number;
}

export async function fetchCoOccurrences(sourceGameId: string): Promise<{
  coOccurrences: CoOccurrenceRow[];
  sourceLibraryCount: number;
}> {
  const supabase = await createServerClient();
  const validStatuses = ["owned", "completed", "playing"];

  // Count how many users have the source game with valid status
  const { count: sourceCount, error: countError } = await supabase
    .from("user_library")
    .select("*", { count: "exact", head: true })
    .eq("game_id", sourceGameId)
    .in("status", validStatuses);

  if (countError) throw new Error(`Failed to count source library: ${countError.message}`);
  const sourceLibraryCount = sourceCount ?? 0;

  // If fewer than 2 users have the source game, skip the co-occurrence query
  if (sourceLibraryCount < 2) {
    return { coOccurrences: [], sourceLibraryCount };
  }

  // Get users who own the source game with valid status
  const { data: sourceUsers, error: usersError } = await supabase
    .from("user_library")
    .select("user_id")
    .eq("game_id", sourceGameId)
    .in("status", validStatuses);

  if (usersError) throw new Error(`Failed to fetch source users: ${usersError.message}`);

  const userIds = (sourceUsers ?? []).map((row) => row.user_id);

  // Get all games owned by those users (excluding the source game)
  const { data: coOccurrenceData, error: coError } = await supabase
    .from("user_library")
    .select("game_id, user_id")
    .in("user_id", userIds)
    .in("status", validStatuses)
    .neq("game_id", sourceGameId);

  if (coError) throw new Error(`Failed to fetch co-occurrences: ${coError.message}`);

  // Aggregate: count distinct users per candidate game
  const countByGame = new Map<string, Set<string>>();
  for (const row of coOccurrenceData ?? []) {
    const users = countByGame.get(row.game_id) ?? new Set<string>();
    users.add(row.user_id);
    countByGame.set(row.game_id, users);
  }

  const coOccurrences: CoOccurrenceRow[] = [];
  for (const [candidateGameId, users] of countByGame) {
    coOccurrences.push({ candidateGameId, coOccurrenceCount: users.size });
  }

  return { coOccurrences, sourceLibraryCount };
}

/** Review stats (average rating + count) grouped by game_id */
export interface ReviewStats {
  averageRating: number;
  reviewCount: number;
}

export async function fetchReviewStats(): Promise<Map<string, ReviewStats>> {
  const supabase = await createServerClient();
  const { data, error } = await supabase.from("game_reviews").select("game_id, rating");

  if (error) throw new Error(`Failed to fetch review stats: ${error.message}`);

  // Aggregate manually since Supabase JS doesn't support GROUP BY with AVG
  const statsByGame = new Map<string, { sum: number; count: number }>();
  for (const row of data ?? []) {
    const existing = statsByGame.get(row.game_id) ?? { sum: 0, count: 0 };
    existing.sum += row.rating;
    existing.count += 1;
    statsByGame.set(row.game_id, existing);
  }

  const result = new Map<string, ReviewStats>();
  for (const [gameId, stats] of statsByGame) {
    result.set(gameId, {
      averageRating: stats.sum / stats.count,
      reviewCount: stats.count,
    });
  }
  return result;
}

/** Metascores (0-100) grouped by game_id, null entries are omitted */
export async function fetchMetascores(): Promise<Map<string, number>> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("games")
    .select("id, metascore")
    .not("metascore", "is", null);

  if (error) throw new Error(`Failed to fetch metascores: ${error.message}`);

  const result = new Map<string, number>();
  for (const row of data ?? []) {
    if (row.metascore !== null) {
      result.set(row.id, row.metascore);
    }
  }
  return result;
}

/** Fetch game metadata for the final recommendation output */
export async function fetchGameMetadata(
  gameIds: string[]
): Promise<Map<string, GameRecommendation>> {
  if (gameIds.length === 0) return new Map();

  const supabase = await createServerClient();

  // Fetch games basic info + primary developer via game_companies
  const { data: games, error: gamesError } = await supabase
    .from("games")
    .select(
      "id, slug, cover_image_url, metascore, game_companies(role, is_primary, companies(name))"
    )
    .in("id", gameIds);

  if (gamesError) throw new Error(`Failed to fetch games: ${gamesError.message}`);

  // Fetch translations (use 'en' as default locale)
  const { data: translations, error: transError } = await supabase
    .from("game_translations")
    .select("game_id, title")
    .in("game_id", gameIds)
    .eq("language_code", "en");

  if (transError) throw new Error(`Failed to fetch translations: ${transError.message}`);

  const titleByGame = new Map<string, string>();
  for (const t of translations ?? []) {
    if (t.game_id) titleByGame.set(t.game_id, t.title);
  }

  // Fetch genres for these games (names live in genre_translations)
  const { data: gameGenres, error: genresError } = await supabase
    .from("game_genres")
    .select("game_id, genre_id, genres(id, slug, genre_translations(name, language_code))")
    .in("game_id", gameIds);

  if (genresError) throw new Error(`Failed to fetch game genres: ${genresError.message}`);

  const genresByGame = new Map<string, Array<{ id: string; name: string }>>();
  for (const row of gameGenres ?? []) {
    const genres = genresByGame.get(row.game_id) ?? [];
    const genre = row.genres as unknown as {
      id: string;
      slug: string;
      genre_translations: Array<{ name: string; language_code: string }>;
    } | null;
    if (genre) {
      // Prefer English name, fall back to first available translation, then slug
      const enTranslation = genre.genre_translations?.find((t) => t.language_code === "en");
      const firstTranslation = genre.genre_translations?.[0];
      const genreName = enTranslation?.name ?? firstTranslation?.name ?? genre.slug;
      genres.push({ id: genre.id, name: genreName });
    }
    genresByGame.set(row.game_id, genres);
  }

  // Build the metadata map
  const result = new Map<string, GameRecommendation>();
  for (const game of games ?? []) {
    // Extract developer name from game_companies join
    const gameCompanies = (game.game_companies ?? []) as Array<{
      role: string;
      is_primary: boolean;
      companies: { name: string } | null;
    }>;
    const developerCompany =
      gameCompanies.find((gc) => gc.role === "developer" && gc.is_primary) ||
      gameCompanies.find((gc) => gc.role === "developer");
    const developerName = developerCompany?.companies?.name ?? "";

    result.set(game.id, {
      id: game.id,
      slug: game.slug,
      title: titleByGame.get(game.id) ?? game.slug,
      coverImage: game.cover_image_url,
      genres: genresByGame.get(game.id) ?? [],
      developer: developerName,
      metascore: game.metascore ?? null,
      combinedScore: 0, // will be set by the caller
    });
  }
  return result;
}

/** Fetch all game IDs in a user's library */
export async function fetchUserLibraryGameIds(userId: string): Promise<string[]> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("user_library")
    .select("game_id")
    .eq("user_id", userId);

  if (error) throw new Error(`Failed to fetch user library: ${error.message}`);
  return (data ?? []).map((row) => row.game_id);
}
