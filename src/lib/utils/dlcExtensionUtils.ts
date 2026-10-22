/**
 * DLC & Extension Utilities
 *
 * Pure utility functions for transforming DLC/expansion/bundle data
 * from IGDB into application-ready formats.
 *
 * @module dlcExtensionUtils
 */

import type { IGDBDlcExtension, IGDBGame } from "@/types/igdb";
import type { DlcExtensionCategory } from "@/types/game";

const IGDB_COVER_URL_PREFIX = "https://images.igdb.com/igdb/image/upload/t_cover_big/";

interface TaggedId {
  id: number;
  sourceCategory: DlcExtensionCategory;
}

interface DlcExtensionRow {
  game_id: string;
  igdb_id: number;
  name: string;
  slug: string;
  summary: string | null;
  category: DlcExtensionCategory;
  cover_image_url: string | null;
  release_date: string | null;
  display_order: number;
}

/**
 * Converts a Unix timestamp (seconds) to an ISO date string (YYYY-MM-DD).
 * Returns null if the timestamp is undefined or null.
 */
function unixToDateString(timestamp: number | undefined): string | null {
  if (timestamp === undefined || timestamp === null) return null;
  return new Date(timestamp * 1000).toISOString().split("T")[0];
}

/**
 * Builds an IGDB cover image URL from an image_id.
 * Returns null if no image_id is provided.
 */
function buildCoverImageUrl(imageId: string | undefined): string | null {
  if (!imageId) return null;
  return `${IGDB_COVER_URL_PREFIX}${imageId}.jpg`;
}

/**
 * Maps an IGDB game_type number to our internal DlcExtensionCategory.
 * Returns "dlc" as fallback for unknown types.
 *
 * IGDB game_type values:
 * 0=main_game (excluded), 1=dlc_addon, 2=expansion, 3=bundle,
 * 4=standalone_expansion (excluded), 5=mod, 6=episode, 7=season,
 * 8=remake, 9=remaster, 10=expanded_game, 11=port, 12=fork, 13=pack, 14=update
 */
const IGDB_GAME_TYPE_MAP: Record<number, DlcExtensionCategory> = {
  1: "dlc",
  2: "expansion",
  3: "bundle",
  5: "mod",
  6: "episode",
  7: "season",
  8: "remake",
  9: "remaster",
  10: "expanded_game",
  11: "port",
  12: "fork",
  13: "pack",
  14: "update",
};

export function gameTypeToDlcCategory(gameType: number | undefined): DlcExtensionCategory {
  if (gameType === undefined) return "dlc";
  return IGDB_GAME_TYPE_MAP[gameType] ?? "dlc";
}

/**
 * Transforms an IGDB DLC/extension object into a database row.
 *
 * The category is determined by the IGDB game_type field of the content,
 * with a fallback to the sourceCategory derived from the parent game's
 * dlcs/expansions/bundles arrays.
 *
 * @param extension - The IGDB DLC/extension data
 * @param gameId - UUID of the parent game in our database
 * @param sourceCategory - Fallback category from the parent game's source field
 * @param displayOrder - Sort order within the parent game
 * @returns A database-ready row object
 */
export function transformIgdbToDlcExtensionRow(
  extension: IGDBDlcExtension,
  gameId: string,
  sourceCategory: DlcExtensionCategory,
  displayOrder: number
): DlcExtensionRow {
  return {
    game_id: gameId,
    igdb_id: extension.id,
    name: extension.name,
    slug: extension.slug,
    summary: extension.summary ?? null,
    category:
      extension.game_type !== undefined
        ? gameTypeToDlcCategory(extension.game_type)
        : sourceCategory,
    cover_image_url: buildCoverImageUrl(extension.cover?.image_id),
    release_date: unixToDateString(extension.first_release_date),
    display_order: displayOrder,
  };
}

/**
 * Collects and tags DLC/expansion/bundle IDs from an IGDB game object.
 *
 * Each ID is tagged with its source category so we know whether it came
 * from the `dlcs`, `expansions`, or `bundles` field of the parent game.
 *
 * @param igdbGame - The IGDB game object containing dlcs/expansions/bundles arrays
 * @returns Array of tagged IDs with their source category
 */
export function collectDlcExtensionIds(igdbGame: IGDBGame): TaggedId[] {
  const taggedIds: TaggedId[] = [];

  const sources: Array<{
    ids: number[] | undefined;
    category: DlcExtensionCategory;
  }> = [
    { ids: igdbGame.dlcs, category: "dlc" },
    { ids: igdbGame.expansions, category: "expansion" },
    { ids: igdbGame.bundles, category: "bundle" },
  ];

  for (const source of sources) {
    if (source.ids) {
      for (const id of source.ids) {
        taggedIds.push({ id, sourceCategory: source.category });
      }
    }
  }

  return taggedIds;
}
