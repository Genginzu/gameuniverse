import { IGDBGame } from "@/types/igdb";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { IGDBService } from "../igdbService";
import {
  collectDlcExtensionIds,
  transformIgdbToDlcExtensionRow,
} from "@/lib/utils/dlcExtensionUtils";
import { untypedTable } from "@/lib/utils/untypedTable";
import { logger } from "@/lib/logger";

/**
 * Creates game versions (editions) from IGDB data.
 */
export async function createVersions(gameId: string, igdbId: number): Promise<void> {
  try {
    const versions = await IGDBService.getGameVersions(igdbId);

    if (!versions || versions.length === 0) {
      return;
    }

    const supabase = await getSupabaseAdmin();

    const versionEntries = versions.map((version, index) => ({
      game_id: gameId,
      igdb_id: version.id,
      version_title: version.version_title || version.name,
      description: version.summary || null,
      cover_image_url: version.cover?.image_id
        ? IGDBService.buildImageUrl(version.cover.image_id, "cover_big")
        : null,
      display_order: index,
    }));

    const { error } = await (
      supabase.from("game_versions") as ReturnType<typeof supabase.from>
    ).insert(versionEntries as unknown[]);

    if (error) {
      logger.error("Failed to insert game versions", { gameId, error });
    }
  } catch (error) {
    logger.error("Error creating game versions", { gameId, igdbId, error });
  }
}

/**
 * Updates game versions for an existing game.
 */
export async function updateVersions(gameId: string, igdbId: number): Promise<void> {
  const supabase = await getSupabaseAdmin();

  await (supabase.from("game_versions") as ReturnType<typeof supabase.from>)
    .delete()
    .eq("game_id", gameId);

  await createVersions(gameId, igdbId);
}

/**
 * Creates DLC, expansion, and bundle entries for a game from IGDB data.
 */
export async function createDlcExtensions(gameId: string, igdbGame: IGDBGame): Promise<void> {
  try {
    const taggedIds = collectDlcExtensionIds(igdbGame);

    if (taggedIds.length === 0) {
      return;
    }

    const categoryByIgdbId = new Map(
      taggedIds.map(({ id, sourceCategory }) => [id, sourceCategory])
    );

    const allIds = taggedIds.map(({ id }) => id);
    const dlcDetails = await IGDBService.getDlcExtensions(allIds);

    if (!dlcDetails || dlcDetails.length === 0) {
      return;
    }

    const rows = dlcDetails.map((ext, index) => {
      const sourceCategory = categoryByIgdbId.get(ext.id) ?? "dlc";
      return transformIgdbToDlcExtensionRow(ext, gameId, sourceCategory, index);
    });

    const supabase = await getSupabaseAdmin();

    const { error } = await (
      supabase.from("game_dlc_extensions") as ReturnType<typeof supabase.from>
    ).upsert(rows as unknown[], { onConflict: "game_id,igdb_id" });

    if (error) {
      logger.error("Failed to upsert DLC extensions", { gameId, error });
    }
  } catch (error) {
    logger.error("Error creating DLC extensions", { gameId, error });
  }
}

/**
 * Updates DLC extensions for a game.
 */
export async function updateDlcExtensions(gameId: string, igdbGame: IGDBGame): Promise<void> {
  try {
    const supabase = await getSupabaseAdmin();

    await (supabase.from("game_dlc_extensions") as ReturnType<typeof supabase.from>)
      .delete()
      .eq("game_id", gameId);

    await createDlcExtensions(gameId, igdbGame);
  } catch (error) {
    logger.error("Error updating DLC extensions", { gameId, error });
  }
}

/**
 * Create similar games entries from IGDB similar_games IDs.
 */
export async function createSimilarGames(gameId: string, igdbGame: IGDBGame): Promise<void> {
  if (!igdbGame.similar_games || igdbGame.similar_games.length === 0) return;

  try {
    const supabase = await getSupabaseAdmin();

    const { data: localGames } = await supabase
      .from("games")
      .select("id, igdb_id")
      .in("igdb_id", igdbGame.similar_games);

    const igdbToLocal = new Map(
      (localGames ?? []).map((g) => [g.igdb_id as number, g.id as string])
    );

    const rows = igdbGame.similar_games.map((igdbId, index) => ({
      game_id: gameId,
      similar_igdb_id: igdbId,
      similar_game_id: igdbToLocal.get(igdbId) ?? null,
      display_order: index,
    }));

    const { error } = await untypedTable(supabase, "game_similar_games").upsert(rows, {
      onConflict: "game_id,similar_igdb_id",
    });

    if (error) {
      logger.error("Failed to create similar games", { gameId, error });
    }
  } catch (error) {
    logger.error("Error creating similar games", { gameId, error });
  }
}

/**
 * Update similar games — replace with fresh IGDB data.
 */
export async function updateSimilarGames(gameId: string, igdbGame: IGDBGame): Promise<void> {
  try {
    const supabase = await getSupabaseAdmin();

    await untypedTable(supabase, "game_similar_games").delete().eq("game_id", gameId);

    await createSimilarGames(gameId, igdbGame);
  } catch (error) {
    logger.error("Error updating similar games", { gameId, error });
  }
}
