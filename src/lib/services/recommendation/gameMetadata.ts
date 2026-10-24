/**
 * Card metadata (title, cover, genres, developer) of recommended games,
 * localised with an English fallback. Queries are bounded by the number of
 * picks (≤ 50 games), far below the PostgREST row cap.
 */

import type { GameRecommendation } from "@/types/recommendation";
import type { RecommendationClient } from "./client";

export type GameMetadata = Omit<GameRecommendation, "combinedScore" | "reason">;

interface GameRow {
  id: string;
  slug: string;
  cover_image_url: string | null;
  metascore: number | null;
  game_companies: Array<{ role: string; is_primary: boolean; companies: { name: string } | null }> | null;
}

interface GenreRow {
  game_id: string;
  genres: {
    id: string;
    slug: string;
    genre_translations: Array<{ name: string; language_code: string }> | null;
  } | null;
}

function pickDeveloper(companies: GameRow["game_companies"]): string {
  const developers = (companies ?? []).filter((company) => company.role === "developer");
  const primary = developers.find((company) => company.is_primary) ?? developers[0];
  return primary?.companies?.name ?? "";
}

function localised<T extends { language_code: string }>(rows: T[] | null, locale: string): T | undefined {
  return rows?.find((row) => row.language_code === locale)
    ?? rows?.find((row) => row.language_code === "en")
    ?? rows?.[0];
}

async function fetchTitles(
  supabase: RecommendationClient,
  gameIds: string[],
  locale: string
): Promise<Map<string, string>> {
  const { data, error } = await supabase
    .from("game_translations")
    .select("game_id, title, language_code")
    .in("game_id", gameIds)
    .in("language_code", [...new Set([locale, "en"])]);
  if (error) throw new Error(`Failed to fetch game titles: ${error.message}`);

  const rows = (data ?? []) as Array<{ game_id: string; title: string; language_code: string }>;
  const titles = new Map<string, string>();
  for (const gameId of gameIds) {
    const title = localised(rows.filter((row) => row.game_id === gameId), locale)?.title;
    if (title) titles.set(gameId, title);
  }
  return titles;
}

async function fetchGenres(
  supabase: RecommendationClient,
  gameIds: string[],
  locale: string
): Promise<Map<string, GameMetadata["genres"]>> {
  const { data, error } = await supabase
    .from("game_genres")
    .select("game_id, genres(id, slug, genre_translations(name, language_code))")
    .in("game_id", gameIds);
  if (error) throw new Error(`Failed to fetch game genres: ${error.message}`);

  const genres = new Map<string, GameMetadata["genres"]>();
  for (const row of (data ?? []) as unknown as GenreRow[]) {
    if (!row.genres) continue;
    const name = localised(row.genres.genre_translations, locale)?.name ?? row.genres.slug;
    genres.set(row.game_id, [...(genres.get(row.game_id) ?? []), { id: row.genres.id, name }]);
  }
  return genres;
}

export async function fetchGameMetadata(
  supabase: RecommendationClient,
  gameIds: string[],
  locale: string
): Promise<Map<string, GameMetadata>> {
  const ids = [...new Set(gameIds)];
  if (ids.length === 0) return new Map();

  const [gamesResult, titles, genres] = await Promise.all([
    supabase
      .from("games")
      .select("id, slug, cover_image_url, metascore, game_companies(role, is_primary, companies(name))")
      .in("id", ids),
    fetchTitles(supabase, ids, locale),
    fetchGenres(supabase, ids, locale),
  ]);
  if (gamesResult.error) throw new Error(`Failed to fetch games: ${gamesResult.error.message}`);

  const metadata = new Map<string, GameMetadata>();
  for (const game of (gamesResult.data ?? []) as unknown as GameRow[]) {
    metadata.set(game.id, {
      id: game.id,
      slug: game.slug,
      title: titles.get(game.id) ?? game.slug,
      coverImage: game.cover_image_url,
      genres: genres.get(game.id) ?? [],
      developer: pickDeveloper(game.game_companies),
      metascore: game.metascore ?? null,
    });
  }
  return metadata;
}
