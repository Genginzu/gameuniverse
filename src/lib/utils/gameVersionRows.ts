import type { IGDBGameVersion } from "@/types/igdb";

const IGDB_COVER_BASE_URL = "https://images.igdb.com/igdb/image/upload/t_cover_big";

export type GameVersionRow = {
  game_id: string;
  igdb_id: number;
  version_title: string;
  description: string | null;
  cover_image_url: string | null;
  display_order: number;
};

/**
 * Maps IGDB versions (editions) to `game_versions` rows for a parent game.
 * `display_order` follows the IGDB response order.
 */
export function toGameVersionRows(gameId: string, versions: IGDBGameVersion[]): GameVersionRow[] {
  return versions.map((version, index) => ({
    game_id: gameId,
    igdb_id: version.id,
    version_title: version.version_title || version.name,
    description: version.summary || null,
    cover_image_url: version.cover?.image_id
      ? `${IGDB_COVER_BASE_URL}/${version.cover.image_id}.jpg`
      : null,
    display_order: index,
  }));
}
