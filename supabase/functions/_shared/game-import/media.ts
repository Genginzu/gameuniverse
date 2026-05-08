/**
 * Game media (screenshots, artwork, videos) and EN translations.
 * Deno port of src/lib/services/game-import/media.ts.
 */

import { getSupabaseAdmin } from "../supabase-admin.ts";
import { IGDBService } from "../igdb-service.ts";
import { untypedTable } from "../untyped-table.ts";
import type { IGDBGame } from "../igdb-types.ts";

export async function createMedia(gameId: string, igdbGame: IGDBGame): Promise<void> {
  const supabase = getSupabaseAdmin();

  if (igdbGame.screenshots && igdbGame.screenshots.length > 0) {
    const screenshots = igdbGame.screenshots.map((ss, index) => ({
      game_id: gameId,
      url: IGDBService.buildImageUrl(ss.image_id, "1080p"),
      display_order: index,
      is_featured: index === 0,
    }));
    await supabase.from("game_screenshots").insert(screenshots);
  }

  if (igdbGame.artworks && igdbGame.artworks.length > 0) {
    const artworks = igdbGame.artworks.map((art, index) => ({
      game_id: gameId,
      url: IGDBService.buildImageUrl(art.image_id, "1080p"),
      artwork_type: "promotional",
      display_order: index,
      is_featured: index === 0,
    }));
    await supabase.from("game_artwork").insert(artworks);
  }

  if (igdbGame.videos && igdbGame.videos.length > 0) {
    const videos = igdbGame.videos.map((video, index) => ({
      game_id: gameId,
      url: `https://www.youtube.com/watch?v=${video.video_id}`,
      thumbnail_url: `https://img.youtube.com/vi/${video.video_id}/maxresdefault.jpg`,
      title: video.name || "Video",
      video_type: "trailer",
      display_order: index,
      is_featured: index === 0,
    }));
    await supabase.from("game_videos").insert(videos);
  }
}

export async function updateMedia(gameId: string, igdbGame: IGDBGame): Promise<void> {
  const supabase = getSupabaseAdmin();

  await supabase.from("game_screenshots").delete().eq("game_id", gameId);
  await supabase.from("game_artwork").delete().eq("game_id", gameId);
  await supabase.from("game_videos").delete().eq("game_id", gameId);

  await createMedia(gameId, igdbGame);
}

export async function createTranslations(gameId: string, igdbGame: IGDBGame): Promise<void> {
  const supabase = getSupabaseAdmin();
  const description = igdbGame.summary || null;
  const storyline = igdbGame.storyline || null;

  await untypedTable(supabase, "game_translations").insert({
    game_id: gameId,
    language_code: "en",
    title: igdbGame.name,
    description,
    storyline,
  });
}

export async function updateTranslations(gameId: string, igdbGame: IGDBGame): Promise<void> {
  const supabase = getSupabaseAdmin();
  const description = igdbGame.summary || null;
  const storyline = igdbGame.storyline || null;

  await untypedTable(supabase, "game_translations")
    .update({
      title: igdbGame.name,
      description,
      storyline,
    })
    .eq("game_id", gameId)
    .eq("language_code", "en");
}
