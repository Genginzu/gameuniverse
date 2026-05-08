/**
 * Transforms IGDB game data to Supabase row formats.
 * Deno port of src/lib/services/game-import/transform.ts.
 *
 * Note: color extraction (Jimp) is intentionally not ported. Imports
 * triggered by webhooks have null colors; admins can regenerate them
 * later via the Vercel-side bulk import tools.
 */

import { IGDBService } from "../igdb-service.ts";
import type { IGDBGame } from "../igdb-types.ts";

export interface GameInsertData {
  slug: string;
  igdb_id: number;
  release_date: string | null;
  metascore: number | null;
  cover_image_url: string | null;
  background_image_url: string | null;
  background_color: string | null;
  accent_color: string | null;
  label_color: string | null;
  text_color: string | null;
  last_synced_at: string;
  playtime_hastily: number | null;
  playtime_normally: number | null;
  playtime_completely: number | null;
  playtime_updated_at: string | null;
}

export function transformIGDBToSupabase(igdbGame: IGDBGame): GameInsertData {
  const coverUrl = igdbGame.cover?.image_id
    ? IGDBService.buildImageUrl(igdbGame.cover.image_id, "cover_big")
    : null;

  let backgroundUrl: string | null = null;
  if (igdbGame.artworks && igdbGame.artworks.length > 0) {
    backgroundUrl = IGDBService.buildImageUrl(igdbGame.artworks[0].image_id, "1080p");
  } else if (igdbGame.screenshots && igdbGame.screenshots.length > 0) {
    backgroundUrl = IGDBService.buildImageUrl(igdbGame.screenshots[0].image_id, "1080p");
  }

  const releaseDate = igdbGame.first_release_date
    ? new Date(igdbGame.first_release_date * 1000).toISOString().split("T")[0]
    : null;

  return {
    slug: igdbGame.slug,
    igdb_id: igdbGame.id,
    release_date: releaseDate,
    metascore: null,
    cover_image_url: coverUrl,
    background_image_url: backgroundUrl,
    background_color: null,
    accent_color: null,
    label_color: null,
    text_color: null,
    last_synced_at: new Date().toISOString(),
    playtime_hastily: null,
    playtime_normally: null,
    playtime_completely: null,
    playtime_updated_at: null,
  };
}

export function transformIGDBToSupabaseUpdate(
  igdbGame: IGDBGame,
): Partial<GameInsertData> {
  const baseData = transformIGDBToSupabase(igdbGame);

  return {
    release_date: baseData.release_date,
    metascore: baseData.metascore,
    cover_image_url: baseData.cover_image_url,
    background_image_url: baseData.background_image_url,
    last_synced_at: baseData.last_synced_at,
  };
}
