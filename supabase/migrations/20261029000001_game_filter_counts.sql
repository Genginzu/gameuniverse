-- Migration: game counts per filter option of the games listing.
--
-- The genre and platform API routes counted games in JS over a plain
-- `select("genre_id")` / `select("platform_id")` of the link tables. PostgREST
-- caps every response at max_rows (1000), so only a random 1000-row sample of
-- each link table was counted (e.g. "Card & board game" showed 10 instead of
-- ~600). Themes, game modes and perspectives had no count at all.
--
-- This RPC groups the link tables in SQL and returns one row per option
-- (a few hundred rows at most, below the max_rows cap).

CREATE OR REPLACE FUNCTION public.get_game_filter_counts()
RETURNS TABLE (facet TEXT, ref_id UUID, game_count BIGINT)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT 'genre', genre_id, count(DISTINCT game_id)
    FROM public.game_genres WHERE genre_id IS NOT NULL GROUP BY genre_id
  UNION ALL
  SELECT 'platform', platform_id, count(DISTINCT game_id)
    FROM public.game_platforms GROUP BY platform_id
  UNION ALL
  SELECT 'theme', theme_id, count(DISTINCT game_id)
    FROM public.game_themes GROUP BY theme_id
  UNION ALL
  SELECT 'game_mode', game_mode_id, count(DISTINCT game_id)
    FROM public.game_game_modes GROUP BY game_mode_id
  UNION ALL
  SELECT 'perspective', player_perspective_id, count(DISTINCT game_id)
    FROM public.game_player_perspectives GROUP BY player_perspective_id;
$$;

COMMENT ON FUNCTION public.get_game_filter_counts() IS
  'Number of games per genre, platform, theme, game mode and player perspective (facet, ref_id, game_count). Feeds the counts shown next to the games listing filters.';

-- Public catalogue data, read by the anonymous games listing (no default grants since 20261018000017).
GRANT EXECUTE ON FUNCTION public.get_game_filter_counts() TO anon, authenticated;
