import { IGDBService } from "./igdbService";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { extractColorsFromCover } from "@/lib/utils/color-extraction";
import { logger } from "@/lib/logger";
import type { Database } from "@/lib/database.types";

/**
 * Lightweight field-specific sync from IGDB.
 * Only fetches and updates the requested field, not a full game sync.
 * Respects manual overrides: if an admin edited the field, it is skipped.
 */

interface SyncResult {
  success: boolean;
  value?: unknown;
  error?: string;
}

/** Minimal IGDB query per field — only fetch what's needed */
const FIELD_QUERIES: Record<string, string> = {
  cover: "fields cover.image_id; where id = {id};",
  background: "fields artworks.image_id, screenshots.image_id; where id = {id};",
  playtime: "", // Uses separate endpoint
  metascore: "fields aggregated_rating; where id = {id};",
  releaseDate: "fields first_release_date; where id = {id};",
};

/** Maps bulk-import field keys to TrackableField override names */
export const BULK_FIELD_TO_OVERRIDE: Record<string, string> = {
  cover: "cover_image",
  background: "background_image",
  playtime: "playtime",
  metascore: "metascore",
  releaseDate: "release_date",
  popularity: "popularity",
};

async function isFieldOverridden(gameId: string, field: string): Promise<boolean> {
  const overrideName = BULK_FIELD_TO_OVERRIDE[field];
  if (!overrideName) return false;
  const supabase = await createRouteHandlerClient();
  const { count } = await supabase
    .from("game_field_overrides")
    .select("id", { count: "exact", head: true })
    .eq("game_id", gameId)
    .eq("field_name", overrideName);
  return (count ?? 0) > 0;
}

export async function syncSingleField(
  gameId: string,
  igdbId: number,
  field: string
): Promise<SyncResult> {
  try {
    if (await isFieldOverridden(gameId, field)) {
      return { success: true, value: null, error: "skipped:override" };
    }

    switch (field) {
      case "cover":
        return await syncCover(gameId, igdbId);
      case "background":
        return await syncBackground(gameId, igdbId);
      case "playtime":
        return await syncPlaytime(gameId, igdbId);
      case "metascore":
        return await syncMetascore(gameId, igdbId);
      case "releaseDate":
        return await syncReleaseDate(gameId, igdbId);
      case "popularity":
        return await syncPopularity(gameId, igdbId);
      default:
        return { success: false, error: `Unknown field: ${field}` };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error("bulkFieldSync failed", { gameId, igdbId, field, error });
    return { success: false, error: message };
  }
}

async function fetchIGDBField(
  igdbId: number,
  fields: string
): Promise<Record<string, unknown> | null> {
  const body = `${fields.replace("{id}", String(igdbId))}`;
  const res = await IGDBService["igdbFetch"]("games", body);
  if (!res.ok) return null;
  const data = await res.json();
  return data.length > 0 ? data[0] : null;
}

async function syncCover(gameId: string, igdbId: number): Promise<SyncResult> {
  const game = await fetchIGDBField(igdbId, FIELD_QUERIES.cover);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const imageId = (game?.cover as any)?.image_id;

  if (!imageId) return { success: true, value: null };

  const coverUrl = IGDBService.buildImageUrl(imageId, "cover_big");
  const supabase = await createRouteHandlerClient();

  // Also extract colors from the cover
  const updateData: Record<string, unknown> = { cover_image_url: coverUrl };
  try {
    const colors = await extractColorsFromCover(coverUrl);
    if (colors) {
      updateData.background_color = colors.background_color;
      updateData.accent_color = colors.accent_color;
      updateData.label_color = colors.label_color;
      updateData.text_color = colors.text_color;
    }
  } catch {
    // Color extraction failed, still update cover
  }

  await supabase
    .from("games")
    .update(updateData as Database["public"]["Tables"]["games"]["Update"])
    .eq("id", gameId);
  return { success: true, value: coverUrl };
}

async function syncBackground(gameId: string, igdbId: number): Promise<SyncResult> {
  const game = await fetchIGDBField(igdbId, FIELD_QUERIES.background);

  let bgUrl: string | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const artworks = game?.artworks as any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const screenshots = game?.screenshots as any[];

  if (artworks?.length > 0 && artworks[0]?.image_id) {
    bgUrl = IGDBService.buildImageUrl(artworks[0].image_id, "1080p");
  } else if (screenshots?.length > 0 && screenshots[0]?.image_id) {
    bgUrl = IGDBService.buildImageUrl(screenshots[0].image_id, "1080p");
  }

  if (!bgUrl) return { success: true, value: null };

  const supabase = await createRouteHandlerClient();
  await supabase.from("games").update({ background_image_url: bgUrl }).eq("id", gameId);
  return { success: true, value: bgUrl };
}

async function syncPlaytime(gameId: string, igdbId: number): Promise<SyncResult> {
  const ttb = await IGDBService.getTimeToBeat(igdbId);
  if (!ttb) return { success: true, value: null };

  const supabase = await createRouteHandlerClient();
  await supabase
    .from("games")
    .update({
      playtime_hastily: ttb.hastily ?? null,
      playtime_normally: ttb.normally ?? null,
      playtime_completely: ttb.completely ?? null,
      playtime_updated_at: new Date().toISOString(),
    })
    .eq("id", gameId);

  return { success: true, value: ttb.normally };
}

async function syncMetascore(gameId: string, igdbId: number): Promise<SyncResult> {
  const game = await fetchIGDBField(igdbId, FIELD_QUERIES.metascore);
  const rating = game?.aggregated_rating as number | undefined;

  if (!rating) return { success: true, value: null };

  const score = Math.round(rating);
  const supabase = await createRouteHandlerClient();
  await supabase.from("games").update({ metascore: score }).eq("id", gameId);
  return { success: true, value: score };
}

async function syncReleaseDate(gameId: string, igdbId: number): Promise<SyncResult> {
  const game = await fetchIGDBField(igdbId, FIELD_QUERIES.releaseDate);
  const timestamp = game?.first_release_date as number | undefined;

  if (!timestamp) return { success: true, value: null };

  const date = new Date(timestamp * 1000).toISOString().split("T")[0];
  const supabase = await createRouteHandlerClient();
  await supabase.from("games").update({ release_date: date }).eq("id", gameId);
  return { success: true, value: date };
}

/**
 * Sync IGDB popularity primitives. Always stamps igdb_pop_updated_at so a
 * subsequent "missing" query won't pick the game up again even when IGDB
 * returns no primitive rows (common for obscure games).
 */
async function syncPopularity(gameId: string, igdbId: number): Promise<SyncResult> {
  const primitives = await IGDBService.getPopularityPrimitives(igdbId);
  const supabase = await createRouteHandlerClient();

  // Columns added by migration 20260420000001 but not yet in generated types.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from("games") as any)
    .update({
      igdb_pop_visits: primitives?.visits ?? null,
      igdb_pop_want_to_play: primitives?.wantToPlay ?? null,
      igdb_pop_playing: primitives?.playing ?? null,
      igdb_pop_updated_at: new Date().toISOString(),
    })
    .eq("id", gameId);

  return { success: true, value: primitives?.visits ?? null };
}
