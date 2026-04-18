-- Migration: Optimize get_games_listing performance
--
-- Fixes statement timeout (57014) on GET /api/games by:
-- 1. Adding a composite index matching the exact ORDER BY clause
-- 2. Rewriting the function to paginate IDs first (cheap), then enrich (only N rows)
-- 3. Using relcount estimate for unfiltered total count (avoids full table scan)
-- 4. Replacing correlated subqueries with LEFT JOIN LATERAL for translations

-- ============================================================================
-- 1. Composite index matching the full ORDER BY clause
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_games_listing_sort
  ON public.games (
    (CASE WHEN cover_image_url IS NOT NULL THEN 0 ELSE 1 END),
    metascore DESC NULLS LAST,
    view_count DESC,
    last_activity_at DESC NULLS LAST,
    popularity_score DESC,
    created_at DESC
  );

-- ============================================================================
-- 2. Helper: fast estimated row count for a table (avoids seq scan)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.fast_count_estimate(table_name TEXT)
RETURNS BIGINT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT GREATEST(
    (SELECT reltuples::bigint FROM pg_class WHERE relname = table_name),
    0
  );
$$;

-- ============================================================================
-- 3. Rewrite get_games_listing with CTE-first pagination
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_games_listing(
  p_locale TEXT DEFAULT 'fr',
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0,
  p_game_ids UUID[] DEFAULT NULL,
  p_in_library BOOLEAN DEFAULT FALSE,
  p_user_id UUID DEFAULT NULL,
  p_include_description BOOLEAN DEFAULT FALSE
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
BEGIN
  -- -----------------------------------------------------------------------
  -- STEP 1: Total count (fast path for unfiltered)
  -- -----------------------------------------------------------------------
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
      -- Fast estimate instead of full sequential scan
      SELECT fast_count_estimate('games')::int INTO v_total_count;
    END IF;
  END IF;

  -- -----------------------------------------------------------------------
  -- STEP 2: Paginate IDs first (cheap — uses the composite index),
  --         then enrich only the selected rows with translations/relations
  -- -----------------------------------------------------------------------
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
      -- Inner pagination: only fetches IDs + sort columns
      SELECT g2.id,
             ROW_NUMBER() OVER () AS rn
      FROM games g2
      LEFT JOIN user_library ul
        ON p_in_library AND ul.game_id = g2.id AND ul.user_id = p_user_id
      WHERE
        (NOT p_in_library OR ul.user_id IS NOT NULL)
        AND (p_game_ids IS NULL OR g2.id = ANY(p_game_ids))
      ORDER BY
        CASE WHEN g2.cover_image_url IS NOT NULL THEN 0 ELSE 1 END,
        g2.metascore DESC NULLS LAST,
        g2.view_count DESC,
        g2.last_activity_at DESC NULLS LAST,
        g2.popularity_score DESC,
        g2.created_at DESC
      LIMIT p_limit
      OFFSET p_offset
    ) page
    JOIN games g ON g.id = page.id
    -- Locale-specific translation
    LEFT JOIN LATERAL (
      SELECT gt.title, gt.description
      FROM game_translations gt
      WHERE gt.game_id = g.id AND gt.language_code = p_locale
      LIMIT 1
    ) t_loc ON true
    -- Fallback translation (any language)
    LEFT JOIN LATERAL (
      SELECT gt.title, gt.description
      FROM game_translations gt
      WHERE gt.game_id = g.id
      LIMIT 1
    ) t_any ON t_loc.title IS NULL
    -- Genres aggregation
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
    -- Developer (primary first)
    LEFT JOIN LATERAL (
      SELECT c.name
      FROM game_companies gc
      INNER JOIN companies c ON c.id = gc.company_id
      WHERE gc.game_id = g.id AND gc.role = 'developer'
      ORDER BY gc.is_primary DESC NULLS LAST
      LIMIT 1
    ) dev ON true
    -- Publisher (primary first)
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
  'Optimized server-side function for the games listing API. Uses CTE pagination (IDs first) then LATERAL joins for enrichment. Fast estimated count for unfiltered queries.';
