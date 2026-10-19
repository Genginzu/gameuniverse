-- Inventory of external image hosts actually stored in the database.
-- Read-only. Run it on production (Supabase SQL editor) and send the result
-- back: it is used to replace `remotePatterns: [{ hostname: "**" }]` in
-- next.config.js with an explicit allowlist.
--
-- Output: one row per host with the number of URLs and the columns using it.

WITH urls AS (
  SELECT 'characters.main_image' AS src, main_image AS url FROM public.characters
  UNION ALL SELECT 'characters.background_image', background_image FROM public.characters
  UNION ALL SELECT 'character_media.url', url FROM public.character_media
  UNION ALL SELECT 'character_media.thumbnail_url', thumbnail_url FROM public.character_media
  UNION ALL SELECT 'communities.image_url', image_url FROM public.communities
  UNION ALL SELECT 'groups.image_url', image_url FROM public.groups
  UNION ALL SELECT 'companies.logo_url', logo_url FROM public.companies
  UNION ALL SELECT 'content_descriptors.icon_url', icon_url FROM public.content_descriptors
  UNION ALL SELECT 'esport_players.image_url', image_url FROM public.esport_players
  UNION ALL SELECT 'esport_teams.image_url', image_url FROM public.esport_teams
  UNION ALL SELECT 'esport_tournaments.league_image_url', league_image_url FROM public.esport_tournaments
  UNION ALL SELECT 'game_artwork.url', url FROM public.game_artwork
  UNION ALL SELECT 'game_collections.cover_image_url', cover_image_url FROM public.game_collections
  UNION ALL SELECT 'game_dlc_extensions.cover_image_url', cover_image_url FROM public.game_dlc_extensions
  UNION ALL SELECT 'game_screenshots.url', url FROM public.game_screenshots
  UNION ALL SELECT 'game_versions.cover_image_url', cover_image_url FROM public.game_versions
  UNION ALL SELECT 'game_videos.thumbnail_url', thumbnail_url FROM public.game_videos
  UNION ALL SELECT 'games.cover_image_url', cover_image_url FROM public.games
  UNION ALL SELECT 'games.background_image_url', background_image_url FROM public.games
  UNION ALL SELECT 'platforms.icon_url', icon_url FROM public.platforms
  UNION ALL SELECT 'player_linked_platforms.platform_avatar_url', platform_avatar_url FROM public.player_linked_platforms
  UNION ALL SELECT 'player_posts.image_url', image_url FROM public.player_posts
  UNION ALL SELECT 'profiles.avatar_url', avatar_url FROM public.profiles
  UNION ALL SELECT 'profiles.banner_url', banner_url FROM public.profiles
  UNION ALL SELECT 'ratings.icon_url', icon_url FROM public.ratings
  UNION ALL SELECT 'stores.logo_url', logo_url FROM public.stores
)
SELECT
  lower(substring(url FROM '^https?://([^/:?#]+)')) AS host,
  count(*) AS urls,
  string_agg(DISTINCT src, ', ' ORDER BY src) AS columns
FROM urls
WHERE url ~* '^https?://'
GROUP BY 1
ORDER BY urls DESC;
