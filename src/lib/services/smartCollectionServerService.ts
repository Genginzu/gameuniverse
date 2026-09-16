import { createRouteHandlerClient } from "@/lib/supabase-server";
import { logger } from "@/lib/logger";
import { generateSlug } from "./collectionService";
import type { LibrarySuggestionGame } from "@/types/smartCollection";

// Tables/relations not yet in generated Supabase types.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UntypedFrom = any;

interface GenreTranslationRow {
  name: string;
  language_code: string;
}

interface LibraryGameRow {
  id: string;
  slug: string;
  metascore: number | null;
  cover_image_url: string | null;
  game_translations: Array<{ title: string; language_code: string }> | null;
  game_genres: Array<{
    genres: { genre_translations: GenreTranslationRow[] | null } | null;
  }> | null;
}

interface LibraryRow {
  game_id: string;
  status: string;
  added_at: string;
  play_time_hours: number | null;
  source_platform: string | null;
  games: LibraryGameRow | null;
}

/** Pick the translation for `locale`, falling back to the first available. */
function pickTranslation<T extends { language_code: string }>(
  rows: T[] | null | undefined,
  locale: string
): T | undefined {
  if (!rows || rows.length === 0) return undefined;
  return rows.find((r) => r.language_code === locale) ?? rows[0];
}

/** Map a raw library row into the shape consumed by the suggestion engine. */
function transformRow(row: LibraryRow, locale: string): LibrarySuggestionGame | null {
  const game = row.games;
  if (!game) return null;

  const title = pickTranslation(game.game_translations, locale)?.title ?? "Untitled Game";

  const genres = (game.game_genres ?? [])
    .map((gg) => pickTranslation(gg.genres?.genre_translations, locale)?.name)
    .filter((name): name is string => Boolean(name));

  return {
    id: game.id,
    slug: game.slug,
    title,
    coverImage: game.cover_image_url,
    genres,
    metascore: game.metascore,
    status: row.status,
    addedAt: row.added_at,
    playTimeHours: row.play_time_hours,
    sourcePlatform: row.source_platform,
  };
}

/**
 * Server-side service backing GET/POST /api/collections/suggestions.
 * Reads the authenticated user's library and creates collections from
 * accepted suggestions.
 */
export class SmartCollectionServerService {
  /**
   * Fetch the user's library flattened for the suggestion engine.
   * Returns an empty array when the table is missing (migration not applied).
   */
  static async fetchLibraryForSuggestions(
    userId: string,
    locale: string = "fr"
  ): Promise<LibrarySuggestionGame[]> {
    const supabase = await createRouteHandlerClient();

    const { data, error } = await supabase
      .from("user_library")
      .select(
        `game_id, status, added_at, play_time_hours, source_platform,
         games (
           id, slug, metascore, cover_image_url,
           game_translations (title, language_code),
           game_genres ( genres ( genre_translations (name, language_code) ) )
         )`
      )
      .eq("user_id", userId);

    if (error) {
      if (error.code === "PGRST205") return [];
      logger.error("Failed to fetch library for suggestions", { error: error.message, userId });
      throw new Error(error.message ?? "Failed to fetch library for suggestions");
    }

    return ((data ?? []) as unknown as LibraryRow[])
      .map((row) => transformRow(row, locale))
      .filter((g): g is LibrarySuggestionGame => g !== null);
  }

  /**
   * Fetch the set of game ids already present in any of the user's
   * collections. Used to avoid re-proposing already-organized games (and
   * therefore duplicate collections). Empty set when tables are missing.
   */
  static async fetchCollectedGameIds(userId: string): Promise<Set<string>> {
    const supabase = await createRouteHandlerClient();

    const { data: cols, error: colError } = await supabase
      .from("game_collections" as UntypedFrom)
      .select("id")
      .eq("user_id", userId);

    if (colError) {
      if (colError.code === "PGRST205") return new Set();
      logger.error("Failed to fetch collection ids", { error: colError.message, userId });
      throw new Error(colError.message ?? "Failed to fetch collection ids");
    }

    const collectionIds = ((cols ?? []) as unknown as Array<{ id: string }>).map((c) => c.id);
    if (collectionIds.length === 0) return new Set();

    const { data: items, error: itemsError } = await supabase
      .from("game_collection_items" as UntypedFrom)
      .select("game_id")
      .in("collection_id", collectionIds);

    if (itemsError) {
      if (itemsError.code === "PGRST205") return new Set();
      logger.error("Failed to fetch collection items", { error: itemsError.message, userId });
      throw new Error(itemsError.message ?? "Failed to fetch collection items");
    }

    return new Set(
      ((items ?? []) as unknown as Array<{ game_id: string }>).map((i) => i.game_id)
    );
  }

  /**
   * Create a collection pre-filled with the given games.
   * Games are inserted in the provided order (position 0..N-1).
   */
  static async createCollectionFromSuggestion(
    userId: string,
    name: string,
    gameIds: string[],
    isPublic: boolean = false
  ): Promise<{ id: string; slug: string }> {
    const supabase = await createRouteHandlerClient();
    const slug = generateSlug(name);

    const { data: created, error: createError } = await supabase
      .from("game_collections" as UntypedFrom)
      .insert({ user_id: userId, name, slug, is_public: isPublic })
      .select("id, slug")
      .single();

    if (createError) {
      logger.error("Failed to create collection from suggestion", {
        error: createError.message,
        userId,
      });
      throw new Error(createError.message ?? "Failed to create collection");
    }

    const collection = created as unknown as { id: string; slug: string };

    // Deduplicate while preserving order, then bulk insert items.
    const uniqueGameIds = [...new Set(gameIds)];
    if (uniqueGameIds.length > 0) {
      const items = uniqueGameIds.map((gameId, index) => ({
        collection_id: collection.id,
        game_id: gameId,
        position: index,
      }));

      const { error: itemsError } = await supabase
        .from("game_collection_items" as UntypedFrom)
        .insert(items);

      if (itemsError) {
        logger.error("Failed to insert suggestion items", {
          error: itemsError.message,
          collectionId: collection.id,
        });
        throw new Error(itemsError.message ?? "Failed to insert collection items");
      }
    }

    return collection;
  }
}
