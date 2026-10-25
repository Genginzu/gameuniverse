/**
 * Admin edition of the IGDB metadata of a game (`/api/admin/games/[id]`):
 * loads it in the admin form shape and replaces it on save. Writes go
 * through RLS (admins manage these tables), like the other game relations.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import { untypedTable } from "@/lib/utils/untypedTable";
import type { AdminGameMetadataFormData } from "@/lib/utils/game-api-transform";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Client = SupabaseClient<any>;

type LinkField =
  | "themes"
  | "game_modes"
  | "player_perspectives"
  | "franchises"
  | "series"
  | "game_engines"
  | "keywords";

interface LinkSpec {
  field: LinkField;
  table: string;
  fk: string;
  ref: string;
}

const LINKS: LinkSpec[] = [
  { field: "themes", table: "game_themes", fk: "theme_id", ref: "themes" },
  { field: "game_modes", table: "game_game_modes", fk: "game_mode_id", ref: "game_modes" },
  {
    field: "player_perspectives",
    table: "game_player_perspectives",
    fk: "player_perspective_id",
    ref: "player_perspectives",
  },
  { field: "franchises", table: "game_franchises", fk: "franchise_id", ref: "franchises" },
  { field: "series", table: "game_series", fk: "series_id", ref: "series" },
  { field: "game_engines", table: "game_game_engines", fk: "game_engine_id", ref: "game_engines" },
  { field: "keywords", table: "game_keywords", fk: "keyword_id", ref: "keywords" },
];

const MULTIPLAYER_COLUMNS =
  "igdb_platform_id, campaign_coop, drop_in, lan_coop, offline_coop, offline_coop_max, offline_max, online_coop, online_coop_max, online_max, splitscreen, splitscreen_online";

/** IGDB theme flagging a game as adult (also applied by `set_games_metadata`). */
const EROTIC_THEME_IGDB_ID = 42;

async function loadLinks(supabase: Client, spec: LinkSpec, gameId: string) {
  const { data, error } = await untypedTable(supabase, spec.table)
    .select(`${spec.fk}, ${spec.ref}(name)`)
    .eq("game_id", gameId);
  if (error) throw new Error(`${spec.table}: ${error.message}`);
  return ((data ?? []) as unknown as Array<Record<string, unknown>>).map((row) => ({
    [spec.fk]: row[spec.fk] as string,
    name: ((row[spec.ref] as { name?: string | null } | null)?.name ?? undefined) || undefined,
  }));
}

/** IGDB metadata of a game in the admin form shape (with display names for chips). */
export async function loadAdminGameMetadata(
  supabase: Client,
  gameId: string
): Promise<AdminGameMetadataFormData> {
  const [links, websites, multiplayer, rating] = await Promise.all([
    Promise.all(LINKS.map((spec) => loadLinks(supabase, spec, gameId))),
    untypedTable(supabase, "game_websites")
      .select("url, type_id, trusted")
      .eq("game_id", gameId)
      .order("position"),
    untypedTable(supabase, "game_multiplayer_modes").select(MULTIPLAYER_COLUMNS).eq("game_id", gameId),
    untypedTable(supabase, "games")
      .select("igdb_total_rating, igdb_total_rating_count")
      .eq("id", gameId)
      .maybeSingle(),
  ]);
  for (const result of [websites, multiplayer, rating]) {
    if (result.error) throw new Error(result.error.message);
  }
  const ratingRow = rating.data as { igdb_total_rating: number | null; igdb_total_rating_count: number | null } | null;
  const byField = Object.fromEntries(LINKS.map((spec, index) => [spec.field, links[index]]));

  return {
    ...(byField as unknown as Pick<AdminGameMetadataFormData, LinkField>),
    websites: (websites.data ?? []) as AdminGameMetadataFormData["websites"],
    multiplayer_modes: (multiplayer.data ?? []) as AdminGameMetadataFormData["multiplayer_modes"],
    igdb_total_rating: ratingRow?.igdb_total_rating ?? "",
    igdb_total_rating_count: ratingRow?.igdb_total_rating_count ?? "",
  };
}

async function replaceRows(supabase: Client, table: string, gameId: string, rows: object[]) {
  const { error: deleteError } = await untypedTable(supabase, table).delete().eq("game_id", gameId);
  if (deleteError) throw new Error(`${table}: ${deleteError.message}`);
  if (rows.length === 0) return;
  const { error } = await untypedTable(supabase, table).insert(rows);
  if (error) throw new Error(`${table}: ${error.message}`);
}

async function isAdultFromThemes(supabase: Client, themeIds: string[]): Promise<boolean> {
  if (themeIds.length === 0) return false;
  const { data, error } = await untypedTable(supabase, "themes").select("igdb_id").in("id", themeIds);
  if (error) throw new Error(`themes: ${error.message}`);
  return ((data ?? []) as Array<{ igdb_id: number }>).some((row) => row.igdb_id === EROTIC_THEME_IGDB_ID);
}

const toNullableNumber = (value: unknown) =>
  value === "" || value === null || value === undefined ? null : Number(value);

/** Replaces the submitted metadata fields of a game; absent fields are left untouched. */
export async function saveAdminGameMetadata(
  supabase: Client,
  gameId: string,
  metadata: Partial<AdminGameMetadataFormData>
): Promise<void> {
  for (const spec of LINKS) {
    const rows = metadata[spec.field] as Array<Record<string, unknown>> | undefined;
    if (!rows) continue;
    const ids = [...new Set(rows.map((row) => row[spec.fk] as string))];
    await replaceRows(supabase, spec.table, gameId, ids.map((id) => ({ game_id: gameId, [spec.fk]: id })));
  }

  if (metadata.websites) {
    const seen = new Set<string>();
    const rows = metadata.websites
      .filter((site) => !seen.has(site.url) && seen.add(site.url))
      .map((site, position) => ({ game_id: gameId, url: site.url, type_id: site.type_id, trusted: site.trusted, position }));
    await replaceRows(supabase, "game_websites", gameId, rows);
  }

  if (metadata.multiplayer_modes) {
    await replaceRows(
      supabase,
      "game_multiplayer_modes",
      gameId,
      metadata.multiplayer_modes.map((mode) => ({ ...mode, game_id: gameId }))
    );
  }

  const gameUpdate: Record<string, unknown> = {};
  if (metadata.igdb_total_rating !== undefined) {
    gameUpdate.igdb_total_rating = toNullableNumber(metadata.igdb_total_rating);
  }
  if (metadata.igdb_total_rating_count !== undefined) {
    gameUpdate.igdb_total_rating_count = toNullableNumber(metadata.igdb_total_rating_count);
  }
  if (metadata.themes) {
    gameUpdate.is_adult = await isAdultFromThemes(supabase, metadata.themes.map((row) => row.theme_id));
  }
  if (Object.keys(gameUpdate).length > 0) {
    const { error } = await untypedTable(supabase, "games").update(gameUpdate).eq("id", gameId);
    if (error) throw new Error(`games: ${error.message}`);
  }
}
