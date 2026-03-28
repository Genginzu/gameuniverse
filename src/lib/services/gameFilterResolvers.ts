import type { SupabaseClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";

/**
 * Resolve search, platform, and genre filters into a set of matching game IDs.
 * Returns null if no filters are active (meaning "all games").
 * Returns an empty array if filters matched nothing.
 */
export async function resolveGameIdFilters(
  supabase: SupabaseClient,
  options: {
    search: string;
    genres: string[];
    platforms: string[];
  }
): Promise<{ gameIds: string[] | null; error: string | null }> {
  const { search, genres, platforms } = options;
  let matchingGameIds: string[] | null = null;

  // Search by title across all translations
  if (search.trim()) {
    const searchWords = search.trim().split(/\s+/).filter(Boolean);
    let searchQuery = supabase.from("game_translations").select("game_id").limit(10000);

    for (const word of searchWords) {
      searchQuery = searchQuery.ilike("title", `%${word}%`);
    }

    const { data: matchingTranslations, error: searchError } = await searchQuery;

    if (searchError) {
      logger.error("Error searching game translations", { error: searchError });
      return { gameIds: null, error: "Failed to search games" };
    }

    matchingGameIds = [
      ...new Set(
        matchingTranslations?.map((t) => t.game_id).filter((id): id is string => id !== null) ?? []
      ),
    ];

    if (matchingGameIds.length === 0) return { gameIds: [], error: null };
  }

  // Filter by platform slugs
  if (platforms.length > 0) {
    const { data: platformRows } = await supabase
      .from("platforms")
      .select("id")
      .in("slug", platforms);

    if (platformRows && platformRows.length > 0) {
      const platformIds = platformRows.map((p: { id: string }) => p.id);
      const { data: gpRows } = await supabase
        .from("game_platforms")
        .select("game_id")
        .in("platform_id", platformIds);

      const platformGameIds = [
        ...new Set(gpRows?.map((r: { game_id: string }) => r.game_id) ?? []),
      ];

      matchingGameIds = matchingGameIds
        ? matchingGameIds.filter((id) => platformGameIds.includes(id))
        : platformGameIds;

      if (matchingGameIds.length === 0) return { gameIds: [], error: null };
    }
  }

  // Filter by genre names
  if (genres.length > 0) {
    const { data: genreRows } = await supabase
      .from("genre_translations")
      .select("genre_id, name")
      .in("name", genres);

    if (!genreRows || genreRows.length === 0) return { gameIds: [], error: null };

    const genreIds = [
      ...new Set(genreRows.filter((g) => g.genre_id !== null).map((g) => g.genre_id as string)),
    ];
    const { data: ggRows } = await supabase
      .from("game_genres")
      .select("game_id")
      .in("genre_id", genreIds);

    const genreGameIds = [...new Set(ggRows?.map((r: { game_id: string }) => r.game_id) ?? [])];

    matchingGameIds = matchingGameIds
      ? matchingGameIds.filter((id) => genreGameIds.includes(id))
      : genreGameIds;

    if (matchingGameIds.length === 0) return { gameIds: [], error: null };
  }

  return { gameIds: matchingGameIds, error: null };
}
