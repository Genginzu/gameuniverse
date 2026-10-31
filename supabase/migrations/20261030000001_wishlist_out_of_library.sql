-- Migration: wishlist games are not part of the owned library
--
-- Context:
--   user_library.status = 'wishlist' marks a game the player wants but has not
--   bought yet. These rows are listed on /library/wishlist and must not appear
--   in the library listing (get_games_listing with p_in_library) nor in its
--   aggregates (get_user_library_stats).
--
-- Both functions keep their signature (CREATE OR REPLACE keeps the grants).
-- get_user_library_stats stays SECURITY INVOKER (20261019000002) so the
-- user_library RLS (stats_private) still applies.

-- =============================================================================
-- 1. get_user_library_stats: aggregates of the owned library only
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_user_library_stats(user_uuid UUID)
RETURNS TABLE (
  total_games INTEGER,
  owned_games INTEGER,
  completed_games INTEGER,
  total_play_time INTEGER,
  average_rating DECIMAL(3,2)
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER AS total_games,
    COUNT(*) FILTER (WHERE ul.status = 'owned')::INTEGER AS owned_games,
    COUNT(*) FILTER (
      WHERE ul.status = 'completed'
         OR COALESCE(ul.play_time_hours, 0) > 0
    )::INTEGER AS completed_games,
    COALESCE(SUM(ul.play_time_hours), 0)::INTEGER AS total_play_time,
    ROUND(AVG(ul.rating), 2) AS average_rating
  FROM public.user_library ul
  WHERE ul.user_id = user_uuid
    AND ul.status IS DISTINCT FROM 'wishlist';
END;
$$;

COMMENT ON FUNCTION public.get_user_library_stats(UUID) IS
  'Library aggregates of a player (owned, playing, completed). Wishlist games are excluded.';

-- =============================================================================
-- 2. get_games_listing: p_in_library lists the owned library only
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_games_listing(
  p_locale TEXT DEFAULT 'fr',
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0,
  p_game_ids UUID[] DEFAULT NULL,
  p_in_library BOOLEAN DEFAULT FALSE,
  p_user_id UUID DEFAULT NULL,
  p_include_description BOOLEAN DEFAULT FALSE,
  p_sort_by TEXT DEFAULT 'recommended',
  p_esport BOOLEAN DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_count INT;
  v_games JSON;
  v_sort TEXT := COALESCE(p_sort_by, 'recommended');
BEGIN
  IF v_sort NOT IN ('recommended', 'popularity', 'activity', 'rating', 'recent') THEN
    v_sort := 'recommended';
  END IF;

  -- STEP 1: Total count
  IF p_in_library AND p_user_id IS NOT NULL THEN
    IF p_game_ids IS NOT NULL THEN
      SELECT count(*) INTO v_total_count
      FROM games g
      INNER JOIN user_library ul
        ON ul.game_id = g.id AND ul.user_id = p_user_id
       AND ul.status IS DISTINCT FROM 'wishlist'
      WHERE g.id = ANY(p_game_ids)
        AND (p_esport IS NULL OR g.is_esport = p_esport);
    ELSE
      SELECT count(*) INTO v_total_count
      FROM games g
      INNER JOIN user_library ul
        ON ul.game_id = g.id AND ul.user_id = p_user_id
       AND ul.status IS DISTINCT FROM 'wishlist'
      WHERE (p_esport IS NULL OR g.is_esport = p_esport);
    END IF;
  ELSE
    IF p_game_ids IS NOT NULL THEN
      SELECT count(*) INTO v_total_count
      FROM games g
      WHERE g.id = ANY(p_game_ids)
        AND (p_esport IS NULL OR g.is_esport = p_esport);
    ELSE
      IF p_esport IS NULL THEN
        SELECT fast_count_estimate('games')::int INTO v_total_count;
      ELSE
        SELECT count(*) INTO v_total_count
        FROM games g WHERE g.is_esport = p_esport;
      END IF;
    END IF;
  END IF;

  -- STEP 2: Paginate IDs first then enrich
  SELECT json_agg(row_data ORDER BY rn) INTO v_games
  FROM (
    SELECT
      json_build_object(
        'id', g.id,
        'slug', g.slug,
        'igdb_id', g.igdb_id,
        'cover_image_url', g.cover_image_url,
        'background_image_url', g.background_image_url,
        'background_color', g.background_color,
        'release_date', g.release_date,
        'metascore', g.metascore,
        'created_at', g.created_at,
        'view_count', g.view_count,
        'is_esport', g.is_esport,
        'title', COALESCE(t_loc.title, t_any.title, 'Untitled'),
        'description', CASE WHEN p_include_description
          THEN COALESCE(t_loc.description, t_any.description)
          ELSE NULL END,
        'genres', COALESCE(genre_agg.genres, '[]'::json),
        'developer', COALESCE(dev.name, 'Unknown'),
        'publisher', COALESCE(pub.name, 'Unknown')
      ) AS row_data,
      page.rn
    FROM (
      SELECT g2.id,
             ROW_NUMBER() OVER () AS rn
      FROM games g2
      LEFT JOIN user_library ul
        ON p_in_library AND ul.game_id = g2.id AND ul.user_id = p_user_id
       AND ul.status IS DISTINCT FROM 'wishlist'
      WHERE
        (NOT p_in_library OR ul.user_id IS NOT NULL)
        AND (p_game_ids IS NULL OR g2.id = ANY(p_game_ids))
        AND (p_esport IS NULL OR g2.is_esport = p_esport)
      ORDER BY
        CASE WHEN v_sort = 'recommended' AND g2.cover_image_url IS NOT NULL THEN 0
             WHEN v_sort = 'recommended' THEN 1
             ELSE 0 END,
        CASE WHEN v_sort = 'recommended' THEN g2.metascore END DESC NULLS LAST,
        CASE WHEN v_sort = 'recommended' THEN g2.view_count END DESC,
        CASE WHEN v_sort = 'recommended' THEN g2.last_activity_at END DESC NULLS LAST,
        CASE WHEN v_sort = 'recommended' THEN g2.popularity_score END DESC,
        CASE WHEN v_sort = 'popularity' THEN g2.hybrid_popularity_score END DESC NULLS LAST,
        CASE WHEN v_sort = 'activity' THEN g2.view_count END DESC,
        CASE WHEN v_sort = 'activity' THEN g2.last_activity_at END DESC NULLS LAST,
        CASE WHEN v_sort = 'rating' THEN g2.metascore END DESC NULLS LAST,
        CASE WHEN v_sort = 'recent' THEN g2.release_date END DESC NULLS LAST,
        g2.created_at DESC
      LIMIT p_limit
      OFFSET p_offset
    ) page
    JOIN games g ON g.id = page.id
    LEFT JOIN LATERAL (
      SELECT gt.title, gt.description
      FROM game_translations gt
      WHERE gt.game_id = g.id AND gt.language_code = p_locale
      LIMIT 1
    ) t_loc ON true
    LEFT JOIN LATERAL (
      SELECT gt.title, gt.description
      FROM game_translations gt
      WHERE gt.game_id = g.id
      LIMIT 1
    ) t_any ON t_loc.title IS NULL
    LEFT JOIN LATERAL (
      SELECT json_agg(json_build_object('name',
        COALESCE(grt_loc.name, grt_any.name, 'Unknown')
      )) AS genres
      FROM game_genres gg
      INNER JOIN genres gr ON gr.id = gg.genre_id
      LEFT JOIN genre_translations grt_loc
        ON grt_loc.genre_id = gr.id AND grt_loc.language_code = p_locale
      LEFT JOIN LATERAL (
        SELECT grt2.name FROM genre_translations grt2
        WHERE grt2.genre_id = gr.id
        LIMIT 1
      ) grt_any ON grt_loc.name IS NULL
      WHERE gg.game_id = g.id
    ) genre_agg ON true
    LEFT JOIN LATERAL (
      SELECT c.name
      FROM game_companies gc
      INNER JOIN companies c ON c.id = gc.company_id
      WHERE gc.game_id = g.id AND gc.role = 'developer'
      ORDER BY gc.is_primary DESC NULLS LAST
      LIMIT 1
    ) dev ON true
    LEFT JOIN LATERAL (
      SELECT c.name
      FROM game_companies gc
      INNER JOIN companies c ON c.id = gc.company_id
      WHERE gc.game_id = g.id AND gc.role = 'publisher'
      ORDER BY gc.is_primary DESC NULLS LAST
      LIMIT 1
    ) pub ON true
  ) sub;

  RETURN json_build_object(
    'games', COALESCE(v_games, '[]'::json),
    'totalCount', v_total_count
  );
END;
$$;

COMMENT ON FUNCTION public.get_games_listing IS
  'Games listing RPC with esport filter. Paginates IDs first then LATERAL-joins translations and relations. p_in_library lists the owned library of p_user_id (wishlist games excluded). Accepts p_esport (NULL=all, TRUE=esport only, FALSE=non-esport only).';
