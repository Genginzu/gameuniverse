/**
 * Server helpers of the game page (`GET /api/games/[slug]`): IGDB metadata
 * (themes, modes, perspectives, engines, franchises and series, websites,
 * multiplayer modes), other games of the same franchises, and the related
 * game cards shared with the similar games section.
 *
 * Metadata tables come from migration 20261026000001 (not yet in the
 * generated types, hence `untypedTable`). Every query is best-effort: a
 * failure yields empty lists rather than breaking the page.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import { logger } from "@/lib/logger";
import { untypedTable } from "@/lib/utils/untypedTable";
import type {
  GameDetailMetadata,
  GameFranchiseLink,
  GameMultiplayerMode,
  GameTaxonomyTag,
  GameWebsite,
  RelatedGameCard,
} from "@/types/game-metadata";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Client = SupabaseClient<any>;

interface NamedRow {
  id?: string;
  igdb_id: number | null;
  slug: string | null;
  name: string | null;
}

const MAX_FRANCHISE_GAMES = 12;

export const EMPTY_GAME_METADATA: GameDetailMetadata = {
  themes: [],
  gameModes: [],
  playerPerspectives: [],
  gameEngines: [],
  franchises: [],
  websites: [],
  multiplayerModes: [],
  franchiseGames: [],
};

function pickTranslation<T extends { language_code: string }>(rows: T[], locale: string): T | undefined {
  return rows.find((row) => row.language_code === locale) ?? rows.find((row) => row.language_code === "en") ?? rows[0];
}

async function linkedRows(
  supabase: Client,
  linkTable: string,
  refTable: string,
  gameId: string
): Promise<NamedRow[]> {
  const { data, error } = await untypedTable(supabase, linkTable)
    .select(`${refTable}(id, igdb_id, slug, name)`)
    .eq("game_id", gameId);
  if (error) throw new Error(`${linkTable}: ${error.message}`);
  return ((data ?? []) as unknown as Array<Record<string, NamedRow | null>>)
    .map((row) => row[refTable])
    .filter((row): row is NamedRow => Boolean(row?.slug && row?.name));
}

function toTags(rows: NamedRow[]): GameTaxonomyTag[] {
  return rows
    .map((row) => ({ igdbId: row.igdb_id, slug: row.slug as string, name: row.name as string }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

async function fetchWebsites(supabase: Client, gameId: string): Promise<GameWebsite[]> {
  const { data, error } = await untypedTable(supabase, "game_websites")
    .select("url, type_id, trusted")
    .eq("game_id", gameId)
    .order("position");
  if (error) throw new Error(`game_websites: ${error.message}`);
  return ((data ?? []) as Array<{ url: string; type_id: number | null; trusted: boolean }>).map(
    (row) => ({ url: row.url, typeId: row.type_id, trusted: row.trusted })
  );
}

interface MultiplayerRow {
  igdb_platform_id: number | null;
  campaign_coop: boolean;
  drop_in: boolean;
  lan_coop: boolean;
  offline_coop: boolean;
  offline_coop_max: number | null;
  offline_max: number | null;
  online_coop: boolean;
  online_coop_max: number | null;
  online_max: number | null;
  splitscreen: boolean;
  splitscreen_online: boolean;
}

async function platformNames(
  supabase: Client,
  igdbIds: number[],
  locale: string
): Promise<Map<number, string>> {
  if (igdbIds.length === 0) return new Map();
  const { data } = await untypedTable(supabase, "platforms")
    .select("igdb_id, slug, platform_translations(name, language_code)")
    .in("igdb_id", igdbIds);
  const rows = (data ?? []) as Array<{
    igdb_id: number;
    slug: string;
    platform_translations: Array<{ name: string; language_code: string }>;
  }>;
  return new Map(
    rows.map((row) => [row.igdb_id, pickTranslation(row.platform_translations ?? [], locale)?.name ?? row.slug])
  );
}

async function fetchMultiplayerModes(
  supabase: Client,
  gameId: string,
  locale: string
): Promise<GameMultiplayerMode[]> {
  const { data, error } = await untypedTable(supabase, "game_multiplayer_modes")
    .select(
      "igdb_platform_id, campaign_coop, drop_in, lan_coop, offline_coop, offline_coop_max, offline_max, online_coop, online_coop_max, online_max, splitscreen, splitscreen_online"
    )
    .eq("game_id", gameId);
  if (error) throw new Error(`game_multiplayer_modes: ${error.message}`);
  const rows = (data ?? []) as MultiplayerRow[];
  const names = await platformNames(
    supabase,
    [...new Set(rows.map((row) => row.igdb_platform_id).filter((id): id is number => id !== null))],
    locale
  );
  return rows.map((row) => ({
    platformName: row.igdb_platform_id ? (names.get(row.igdb_platform_id) ?? null) : null,
    campaignCoop: row.campaign_coop,
    dropIn: row.drop_in,
    lanCoop: row.lan_coop,
    offlineCoop: row.offline_coop,
    offlineCoopMax: row.offline_coop_max,
    offlineMax: row.offline_max,
    onlineCoop: row.online_coop,
    onlineCoopMax: row.online_coop_max,
    onlineMax: row.online_max,
    splitscreen: row.splitscreen,
    splitscreenOnline: row.splitscreen_online,
  }));
}

interface CardRow {
  id: string;
  slug: string;
  cover_image_url: string | null;
  metascore: number | null;
  release_date: string | null;
  game_translations: Array<{ title: string; language_code: string }>;
  game_genres: Array<{ genres: { genre_translations: Array<{ name: string; language_code: string }> } | null }>;
  game_companies: Array<{ role: string; is_primary: boolean; companies: { name: string } | null }>;
}

function toCard(row: CardRow, locale: string): RelatedGameCard {
  const developer =
    row.game_companies?.find((c) => c.role === "developer" && c.is_primary) ??
    row.game_companies?.find((c) => c.role === "developer");
  return {
    id: row.id,
    slug: row.slug,
    title: pickTranslation(row.game_translations ?? [], locale)?.title || row.slug,
    coverImage: row.cover_image_url,
    genres: (row.game_genres ?? []).map((gg) => ({
      name: pickTranslation(gg.genres?.genre_translations ?? [], locale)?.name || "Unknown",
    })),
    developer: developer?.companies?.name ?? "",
    metascore: row.metascore ?? null,
    releaseDate: row.release_date,
  };
}

/** Card data of local games by id (similar games, same franchise), adult games excluded on request. */
export async function fetchRelatedGameCards(
  supabase: Client,
  gameIds: string[],
  locale: string,
  options: { excludeAdult?: boolean } = {}
): Promise<Map<string, RelatedGameCard>> {
  if (gameIds.length === 0) return new Map();
  let query = untypedTable(supabase, "games")
    .select(
      `id, slug, cover_image_url, metascore, release_date,
       game_translations(title, language_code),
       game_genres(genres(genre_translations(name, language_code))),
       game_companies(role, is_primary, companies(name))`
    )
    .in("id", gameIds);
  if (options.excludeAdult) query = query.eq("is_adult", false);
  const { data, error } = await query;
  if (error) throw new Error(`related games: ${error.message}`);
  return new Map(((data ?? []) as unknown as CardRow[]).map((row) => [row.id, toCard(row, locale)]));
}

async function gameIdsLinkedTo(
  supabase: Client,
  linkTable: string,
  column: string,
  ids: string[]
): Promise<string[]> {
  if (ids.length === 0) return [];
  const { data } = await untypedTable(supabase, linkTable).select("game_id").in(column, ids).limit(200);
  return ((data ?? []) as Array<{ game_id: string }>).map((row) => row.game_id);
}

async function fetchFranchiseGames(
  supabase: Client,
  gameId: string,
  franchiseRows: NamedRow[],
  seriesRows: NamedRow[],
  locale: string
): Promise<RelatedGameCard[]> {
  const ids = new Set([
    ...(await gameIdsLinkedTo(supabase, "game_franchises", "franchise_id", franchiseRows.map((r) => r.id as string))),
    ...(await gameIdsLinkedTo(supabase, "game_series", "series_id", seriesRows.map((r) => r.id as string))),
  ]);
  ids.delete(gameId);
  const cards = await fetchRelatedGameCards(supabase, [...ids], locale, { excludeAdult: true });
  return [...cards.values()]
    .sort((a, b) => (a.releaseDate ?? "9999").localeCompare(b.releaseDate ?? "9999"))
    .slice(0, MAX_FRANCHISE_GAMES);
}

/** Franchises first; a series sharing a franchise slug is the same series. */
function toFranchiseLinks(franchises: NamedRow[], series: NamedRow[]): GameFranchiseLink[] {
  const slugs = new Set(franchises.map((row) => row.slug));
  return [
    ...franchises.map((row) => ({ kind: "franchise" as const, slug: row.slug as string, name: row.name as string })),
    ...series
      .filter((row) => !slugs.has(row.slug))
      .map((row) => ({ kind: "series" as const, slug: row.slug as string, name: row.name as string })),
  ];
}

export async function fetchGameDetailMetadata(
  supabase: Client,
  gameId: string,
  locale: string
): Promise<GameDetailMetadata> {
  try {
    const [themes, modes, perspectives, engines, franchises, series, websites, multiplayerModes] =
      await Promise.all([
        linkedRows(supabase, "game_themes", "themes", gameId),
        linkedRows(supabase, "game_game_modes", "game_modes", gameId),
        linkedRows(supabase, "game_player_perspectives", "player_perspectives", gameId),
        linkedRows(supabase, "game_game_engines", "game_engines", gameId),
        linkedRows(supabase, "game_franchises", "franchises", gameId),
        linkedRows(supabase, "game_series", "series", gameId),
        fetchWebsites(supabase, gameId),
        fetchMultiplayerModes(supabase, gameId, locale),
      ]);
    return {
      themes: toTags(themes),
      gameModes: toTags(modes),
      playerPerspectives: toTags(perspectives),
      gameEngines: toTags(engines),
      franchises: toFranchiseLinks(franchises, series),
      websites,
      multiplayerModes,
      franchiseGames: await fetchFranchiseGames(supabase, gameId, franchises, series, locale),
    };
  } catch (error) {
    logger.warn("Game metadata not available", { gameId, error });
    return EMPTY_GAME_METADATA;
  }
}
