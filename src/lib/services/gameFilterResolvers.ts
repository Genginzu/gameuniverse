import type { SupabaseClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";
import { untypedTable } from "@/lib/utils/untypedTable";

const MAX_LINK_ROWS = 10000;

export interface GameIdFilterOptions {
  search: string;
  genres: string[];
  platforms: string[];
  /** IGDB metadata slugs (theme, game mode, perspective, engine, franchise or series). */
  themes?: string[];
  gameModes?: string[];
  perspectives?: string[];
  engines?: string[];
  franchises?: string[];
}

interface SlugFilter {
  refTable: string;
  linkTable: string;
  fkColumn: string;
}

const THEMES: SlugFilter = { refTable: "themes", linkTable: "game_themes", fkColumn: "theme_id" };
const GAME_MODES: SlugFilter = { refTable: "game_modes", linkTable: "game_game_modes", fkColumn: "game_mode_id" };
const PERSPECTIVES: SlugFilter = {
  refTable: "player_perspectives",
  linkTable: "game_player_perspectives",
  fkColumn: "player_perspective_id",
};
const ENGINES: SlugFilter = {
  refTable: "game_engines",
  linkTable: "game_game_engines",
  fkColumn: "game_engine_id",
};
const FRANCHISES: SlugFilter = {
  refTable: "franchises",
  linkTable: "game_franchises",
  fkColumn: "franchise_id",
};
const SERIES: SlugFilter = { refTable: "series", linkTable: "game_series", fkColumn: "series_id" };

const unique = (ids: Array<string | null | undefined>) =>
  [...new Set(ids.filter((id): id is string => typeof id === "string"))];

function narrow(current: string[] | null, next: string[]): string[] {
  if (current === null) return next;
  const allowed = new Set(next);
  return current.filter((id) => allowed.has(id));
}

/** Games linked to any of the given reference ids. */
async function gameIdsLinkedTo(supabase: SupabaseClient, filter: SlugFilter, refIds: string[]) {
  if (refIds.length === 0) return [];
  const { data, error } = await untypedTable(supabase, filter.linkTable)
    .select("game_id")
    .in(filter.fkColumn, refIds)
    .limit(MAX_LINK_ROWS);
  if (error) throw new Error(`${filter.linkTable}: ${error.message}`);
  return unique(((data ?? []) as Array<{ game_id?: string }>).map((row) => row.game_id));
}

/** Games linked to any reference row (theme, engine…) whose slug is listed. */
async function gameIdsForSlugs(supabase: SupabaseClient, filter: SlugFilter, slugs: string[]) {
  const { data, error } = await untypedTable(supabase, filter.refTable).select("id").in("slug", slugs);
  if (error) throw new Error(`${filter.refTable}: ${error.message}`);
  const refIds = unique(((data ?? []) as Array<{ id?: string }>).map((row) => row.id));
  return gameIdsLinkedTo(supabase, filter, refIds);
}

const escapeLike = (value: string) => value.replace(/[\\%_]/g, (char) => `\\${char}`);

/** Games tagged with an IGDB keyword named exactly like the search (case-insensitive). */
async function gameIdsForKeyword(supabase: SupabaseClient, search: string) {
  const { data, error } = await untypedTable(supabase, "keywords")
    .select("id")
    .ilike("name", escapeLike(search))
    .limit(20);
  if (error) throw new Error(`keywords: ${error.message}`);
  const keywordIds = unique(((data ?? []) as Array<{ id?: string }>).map((row) => row.id));
  return gameIdsLinkedTo(
    supabase,
    { refTable: "keywords", linkTable: "game_keywords", fkColumn: "keyword_id" },
    keywordIds
  );
}

/** Title matches (every word, any translation) plus exact keyword matches. */
async function searchGameIds(supabase: SupabaseClient, search: string) {
  const searchWords = search.split(/\s+/).filter(Boolean);
  let searchQuery = supabase.from("game_translations").select("game_id").limit(MAX_LINK_ROWS);
  for (const word of searchWords) {
    searchQuery = searchQuery.ilike("title", `%${word}%`);
  }
  const [{ data, error }, keywordGameIds] = await Promise.all([
    searchQuery,
    gameIdsForKeyword(supabase, search).catch((keywordError) => {
      logger.warn("Keyword search failed", { error: keywordError });
      return [] as string[];
    }),
  ]);
  if (error) throw new Error(`game_translations: ${error.message}`);
  return unique([...(data ?? []).map((row) => row.game_id), ...keywordGameIds]);
}

async function platformGameIds(supabase: SupabaseClient, platforms: string[]) {
  const { data: platformRows } = await supabase.from("platforms").select("id").in("slug", platforms);
  // Unknown platform slugs are ignored rather than emptying the listing.
  if (!platformRows || platformRows.length === 0) return null;
  const { data: gpRows } = await supabase
    .from("game_platforms")
    .select("game_id")
    .in(
      "platform_id",
      platformRows.map((p: { id: string }) => p.id)
    );
  return unique(gpRows?.map((r: { game_id: string }) => r.game_id) ?? []);
}

async function genreGameIds(supabase: SupabaseClient, genres: string[]) {
  const { data: genreRows } = await supabase
    .from("genre_translations")
    .select("genre_id, name")
    .in("name", genres);
  const genreIds = unique((genreRows ?? []).map((g) => g.genre_id));
  if (genreIds.length === 0) return [];
  const { data: ggRows } = await supabase.from("game_genres").select("game_id").in("genre_id", genreIds);
  return unique(ggRows?.map((r: { game_id: string }) => r.game_id) ?? []);
}

/**
 * Resolve search, platform, genre and IGDB metadata filters into a set of
 * matching game IDs (intersection of every active filter).
 * Returns null if no filters are active (meaning "all games").
 * Returns an empty array if filters matched nothing.
 */
export async function resolveGameIdFilters(
  supabase: SupabaseClient,
  options: GameIdFilterOptions
): Promise<{ gameIds: string[] | null; error: string | null }> {
  const search = options.search.trim();
  const steps: Array<() => Promise<string[] | null>> = [];

  if (search) steps.push(() => searchGameIds(supabase, search));
  if (options.platforms.length > 0) steps.push(() => platformGameIds(supabase, options.platforms));
  if (options.genres.length > 0) steps.push(() => genreGameIds(supabase, options.genres));

  const slugFilters: Array<[SlugFilter, string[] | undefined]> = [
    [THEMES, options.themes],
    [GAME_MODES, options.gameModes],
    [PERSPECTIVES, options.perspectives],
    [ENGINES, options.engines],
  ];
  for (const [filter, slugs] of slugFilters) {
    if (slugs?.length) steps.push(() => gameIdsForSlugs(supabase, filter, slugs));
  }

  const franchises = options.franchises ?? [];
  if (franchises.length > 0) {
    steps.push(async () => {
      const [franchiseIds, seriesIds] = await Promise.all([
        gameIdsForSlugs(supabase, FRANCHISES, franchises),
        gameIdsForSlugs(supabase, SERIES, franchises),
      ]);
      return unique([...franchiseIds, ...seriesIds]);
    });
  }

  let matchingGameIds: string[] | null = null;
  try {
    for (const step of steps) {
      const stepIds = await step();
      if (stepIds === null) continue;
      matchingGameIds = narrow(matchingGameIds, stepIds);
      if (matchingGameIds.length === 0) return { gameIds: [], error: null };
    }
  } catch (error) {
    logger.error("Error resolving game filters", { error });
    return { gameIds: null, error: "Failed to search games" };
  }

  return { gameIds: matchingGameIds, error: null };
}
