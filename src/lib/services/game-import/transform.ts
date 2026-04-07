import { IGDBGame } from "@/types/igdb";
import { IGDBService } from "../igdbService";
import { GameInsertData } from "./types";

/**
 * Transforms IGDB game data to Supabase insert format
 */
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

  const metascore = igdbGame.aggregated_rating ? Math.round(igdbGame.aggregated_rating) : null;

  return {
    slug: igdbGame.slug,
    igdb_id: igdbGame.id,
    release_date: releaseDate,
    metascore,
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

/**
 * Transforms IGDB game data to Supabase update format.
 * Only includes fields that should be updated during sync.
 */
export function transformIGDBToSupabaseUpdate(igdbGame: IGDBGame): Partial<GameInsertData> {
  const baseData = transformIGDBToSupabase(igdbGame);

  return {
    release_date: baseData.release_date,
    metascore: baseData.metascore,
    cover_image_url: baseData.cover_image_url,
    background_image_url: baseData.background_image_url,
    background_color: baseData.background_color,
    accent_color: baseData.accent_color,
    label_color: baseData.label_color,
    text_color: baseData.text_color,
    last_synced_at: baseData.last_synced_at,
  };
}
