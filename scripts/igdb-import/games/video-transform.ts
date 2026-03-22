/**
 * Pure transformation function for IGDB videos → game_videos rows.
 * Shared between game-importer (bulk import) and sync service.
 */

export interface IGDBVideo {
  video_id: string;
  name: string;
}

export interface GameVideoRow {
  game_id: string;
  url: string;
  thumbnail_url: string;
  title: string;
  video_type: string;
  display_order: number;
  is_featured: boolean;
}

/**
 * Transforms an array of IGDB videos into game_videos table rows.
 * Pure function — no side effects, no DB calls.
 */
export function transformIgdbVideos(videos: IGDBVideo[], gameId: string): GameVideoRow[] {
  return videos.map((video, index) => ({
    game_id: gameId,
    url: `https://www.youtube.com/watch?v=${video.video_id}`,
    thumbnail_url: `https://img.youtube.com/vi/${video.video_id}/maxresdefault.jpg`,
    title: video.name,
    video_type: "trailer",
    display_order: index,
    is_featured: index === 0,
  }));
}
