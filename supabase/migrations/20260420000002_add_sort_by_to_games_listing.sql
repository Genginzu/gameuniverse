-- Migration: Add p_sort_by to get_games_listing
--
-- Extends the games listing RPC to accept a sort key so the public games
-- listing can surface games by IGDB popularity, player activity, critic
-- rating, or release date in addition to the default recommended mix.
--
-- Accepted values for p_sort_by:
--   'recommended' (default) — preserves the legacy composite ordering
--   'popularity'            — IGDB PopScore (games.popularity_score)
--   'activity'              — player activity (view_count + last_activity_at)
--   'rating'                — critic score (games.metascore)
--   'recent'                — most recent release date

-- Drop the prior 7-arg overload so CREATE OR REPLACE doesn't leave two
-- versions side-by-side (which would make COMMENT ON FUNCTION ambiguous).
DROP FUNCTION IF EXISTS public.get_games_listing(TEXT, INT, INT, UUID[], BOOLEAN, UUID, BOOLEAN);

CREATE OR REPLACE FUNCTION public.get_games_listing(
  p_locale TEXT DEFAULT 'fr',
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0,
  p_game_ids UUID[] DEFAULT NULL,
  p_in_library BOOLEAN DEFAULT FALSE,
  p_user_id UUID DEFAULT NULL,
  p_include_description BOOLEAN DEFAULT FALSE,
  p_sort_by TEXT DEFAULT 'recommended'
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

  -- STEP 1: Total count (fast path for unfiltered)
  IF p_in_library AND p_user_id IS NOT NULL THEN
    IF p_game_ids IS NOT NULL THEN
      SELECT count(*) INTO v_total_count
      FROM games g
      INNER JOIN user_library ul ON ul.game_id = g.id AND ul.user_id = p_user_id
      WHERE g.id = ANY(p_game_ids);
    ELSE
      SELECT count(*) INTO v_total_count
      FROM user_library ul
      WHERE ul.user_id = p_user_id;
    END IF;
  ELSE
    IF p_game_ids IS NOT NULL THEN
      SELECT count(*) INTO v_total_count
      FROM games g WHERE g.id = ANY(p_game_ids);
    ELSE
      SELECT fast_count_estimate('games')::int INTO v_total_count;
    END IF;
  END IF;

  -- STEP 2: Paginate IDs first then enrich. ORDER BY uses CASE gates so only
  -- the columns matching the requested sort participate; the default path
  -- still matches the composite idx_games_listing_sort index.
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
      WHERE
        (NOT p_in_library OR ul.user_id IS NOT NULL)
        AND (p_game_ids IS NULL OR g2.id = ANY(p_game_ids))
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
  'Games listing RPC. Paginates IDs first (covered by idx_games_listing_sort for the default "recommended" sort) then LATERAL-joins translations and relations. Accepts p_sort_by in (recommended, popularity, activity, rating, recent).';
