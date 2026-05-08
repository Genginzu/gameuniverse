/**
 * DLC & Extension utilities — Deno port of src/lib/utils/dlcExtensionUtils.ts.
 *
 * Only the helpers used by the import pipeline are kept; sorting/grouping
 * helpers used by the UI stay on the Next.js side.
 */

import type {
  DlcExtensionCategory,
  IGDBDlcExtension,
  IGDBGame,
} from "./igdb-types.ts";

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

function unixToDateString(timestamp: number | undefined): string | null {
  if (timestamp === undefined || timestamp === null) return null;
  return new Date(timestamp * 1000).toISOString().split("T")[0];
}

function buildCoverImageUrl(imageId: string | undefined): string | null {
  if (!imageId) return null;
  return `${IGDB_COVER_URL_PREFIX}${imageId}.jpg`;
}

export function gameTypeToDlcCategory(gameType: number | undefined): DlcExtensionCategory {
  if (gameType === undefined) return "dlc";
  return IGDB_GAME_TYPE_MAP[gameType] ?? "dlc";
}

export function transformIgdbToDlcExtensionRow(
  extension: IGDBDlcExtension,
  gameId: string,
  sourceCategory: DlcExtensionCategory,
  displayOrder: number,
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

export function collectDlcExtensionIds(igdbGame: IGDBGame): TaggedId[] {
  const taggedIds: TaggedId[] = [];

  const sources: Array<{ ids: number[] | undefined; category: DlcExtensionCategory }> = [
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
