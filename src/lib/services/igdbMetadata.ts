/**
 * IGDB game metadata: themes, game modes, player perspectives, franchises and
 * series, keywords, engines, websites, multiplayer modes and total rating.
 *
 * Every writer (sync, import, webhook, backfill) goes through the
 * `set_games_metadata` RPC (migration 20261026000001): it upserts the
 * reference rows by IGDB id and replaces only the keys present, so one field
 * can be synced without touching the others.
 */

import type { IGDBGame, IGDBMultiplayerMode, IGDBNamedEntity, IGDBWebsite } from "@/types/igdb";

/** Tracked fields written through `set_games_metadata`. */
export const METADATA_FIELDS = [
  "themes",
  "game_modes",
  "player_perspectives",
  "multiplayer_modes",
  "franchises",
  "keywords",
  "game_engines",
  "websites",
  "igdb_rating",
] as const;

export type MetadataField = (typeof METADATA_FIELDS)[number];

const named = (field: string) => `${field}.id, ${field}.name, ${field}.slug`;

/** APICalypse fields expanding every metadata field of `/games`. */
export const IGDB_METADATA_FIELDS = [
  named("themes"),
  named("game_modes"),
  named("player_perspectives"),
  named("franchise"),
  named("franchises"),
  named("collections"),
  named("keywords"),
  named("game_engines"),
  "websites.url, websites.type, websites.trusted",
  "multiplayer_modes.platform, multiplayer_modes.campaigncoop, multiplayer_modes.dropin, " +
    "multiplayer_modes.lancoop, multiplayer_modes.offlinecoop, multiplayer_modes.offlinecoopmax, " +
    "multiplayer_modes.offlinemax, multiplayer_modes.onlinecoop, multiplayer_modes.onlinecoopmax, " +
    "multiplayer_modes.onlinemax, multiplayer_modes.splitscreen, multiplayer_modes.splitscreenonline",
  "total_rating, total_rating_count",
].join(", ");

type NamedEntry = number | IGDBNamedEntity;

export interface GameMetadata {
  themes?: NamedEntry[];
  game_modes?: NamedEntry[];
  player_perspectives?: NamedEntry[];
  franchises?: NamedEntry[];
  collections?: NamedEntry[];
  keywords?: NamedEntry[];
  game_engines?: NamedEntry[];
  websites?: Array<{ url: string; type: number | null; trusted: boolean }>;
  multiplayer_modes?: IGDBMultiplayerMode[];
  rating?: { total_rating: number | null; total_rating_count: number | null };
}

export interface GameMetadataItem {
  game_id: string;
  metadata: GameMetadata;
}

const entryId = (entry: NamedEntry) => (typeof entry === "number" ? entry : entry.id);

/** Main franchise first, then the other franchises, without duplicates. */
function mergeFranchises(game: Pick<IGDBGame, "franchise" | "franchises">): NamedEntry[] {
  const all = [...(game.franchise ? [game.franchise] : []), ...(game.franchises ?? [])];
  const seen = new Set<number>();
  return all.filter((entry) => {
    const id = entryId(entry);
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

/** Expanded entries only: ids alone carry no URL or capabilities. */
function websitesOf(game: IGDBGame): NonNullable<GameMetadata["websites"]> {
  return (game.websites ?? [])
    .filter((site): site is IGDBWebsite => typeof site === "object" && Boolean(site.url))
    .map((site) => ({ url: site.url as string, type: site.type ?? null, trusted: Boolean(site.trusted) }));
}

function multiplayerModesOf(game: IGDBGame): IGDBMultiplayerMode[] {
  return (game.multiplayer_modes ?? []).filter(
    (mode): mode is IGDBMultiplayerMode => typeof mode === "object"
  );
}

const PICKERS: Record<MetadataField, (game: IGDBGame) => GameMetadata> = {
  themes: (game) => ({ themes: game.themes ?? [] }),
  game_modes: (game) => ({ game_modes: game.game_modes ?? [] }),
  player_perspectives: (game) => ({ player_perspectives: game.player_perspectives ?? [] }),
  multiplayer_modes: (game) => ({ multiplayer_modes: multiplayerModesOf(game) }),
  franchises: (game) => ({ franchises: mergeFranchises(game), collections: game.collections ?? [] }),
  keywords: (game) => ({ keywords: game.keywords ?? [] }),
  game_engines: (game) => ({ game_engines: game.game_engines ?? [] }),
  websites: (game) => ({ websites: websitesOf(game) }),
  igdb_rating: (game) => ({
    rating: {
      total_rating: game.total_rating ?? null,
      total_rating_count: game.total_rating_count ?? null,
    },
  }),
};

/** Metadata payload of a game fetched with `IGDB_METADATA_FIELDS` (all fields by default). */
export function toGameMetadata(
  game: IGDBGame,
  fields: readonly MetadataField[] = METADATA_FIELDS
): GameMetadata {
  return Object.assign({}, ...fields.map((field) => PICKERS[field](game))) as GameMetadata;
}

/** Minimal client surface: any Supabase client (typed or not) exposes `rpc`. */
export interface MetadataRpcClient {
  rpc: (
    fn: "set_games_metadata",
    args: { p_items: GameMetadataItem[] }
  ) => PromiseLike<{ error: { message: string } | null }>;
}

/** Writes the metadata of many games (one RPC call). */
export async function saveGameMetadata(
  supabase: MetadataRpcClient,
  items: GameMetadataItem[]
): Promise<void> {
  if (items.length === 0) return;
  const { error } = await supabase.rpc("set_games_metadata", { p_items: items });
  if (error) throw new Error(`Failed to save game metadata: ${error.message}`);
}

/**
 * FIELD_SYNC_MAP syncer for one metadata field: `igdbGame` comes from
 * `getGameDetails`. Typed clients do not know the RPC yet (types not
 * regenerated), hence `unknown`.
 */
export function metadataSyncer(field: MetadataField) {
  return async (supabase: unknown, gameId: string, igdbGame: IGDBGame): Promise<void> => {
    await saveGameMetadata(supabase as MetadataRpcClient, [
      { game_id: gameId, metadata: toGameMetadata(igdbGame, [field]) },
    ]);
  };
}

/** Writes every metadata field of a freshly imported game. */
export async function syncAllMetadata(
  supabase: unknown,
  gameId: string,
  igdbGame: IGDBGame
): Promise<void> {
  await saveGameMetadata(supabase as MetadataRpcClient, [
    { game_id: gameId, metadata: toGameMetadata(igdbGame) },
  ]);
}
