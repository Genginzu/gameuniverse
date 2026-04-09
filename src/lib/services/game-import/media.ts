import { IGDBGame } from "@/types/igdb";
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { IGDBService } from "../igdbService";

/**
 * Creates media entries (screenshots, artwork, videos) for a game.
 */
export async function createMedia(gameId: string, igdbGame: IGDBGame): Promise<void> {
  const supabase = await createRouteHandlerClient();

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

/**
 * Updates media entries for an existing game.
 * Replaces existing media with fresh data from IGDB.
 */
export async function updateMedia(gameId: string, igdbGame: IGDBGame): Promise<void> {
  const supabase = await createRouteHandlerClient();

  await supabase.from("game_screenshots").delete().eq("game_id", gameId);
  await supabase.from("game_artwork").delete().eq("game_id", gameId);
  await supabase.from("game_videos").delete().eq("game_id", gameId);

  await createMedia(gameId, igdbGame);
}

/**
 * Creates translations for a game (EN only — IGDB data is English).
 */
export async function createTranslations(gameId: string, igdbGame: IGDBGame): Promise<void> {
  const supabase = await createRouteHandlerClient();

  const description = igdbGame.summary || null;
  const storyline = igdbGame.storyline || null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from("game_translations") as any).insert({
    game_id: gameId,
    language_code: "en",
    title: igdbGame.name,
    description,
    storyline,
  });
}

/**
 * Updates translations for an existing game.
 */
export async function updateTranslations(gameId: string, igdbGame: IGDBGame): Promise<void> {
  const supabase = await createRouteHandlerClient();
  const description = igdbGame.summary || null;
  const storyline = igdbGame.storyline || null;

  await supabase
    .from("game_translations")
    .update({ title: igdbGame.name, description, storyline } as unknown as Record<string, never>)
    .eq("game_id", gameId)
    .eq("language_code", "en");
}
