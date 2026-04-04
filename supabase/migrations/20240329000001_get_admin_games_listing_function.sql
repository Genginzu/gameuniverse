-- Migration: Server-side function for the admin games listing endpoint
-- Replaces the deeply nested PostgREST select with a single optimized query
-- to avoid statement timeouts on large datasets.
-- Mirrors get_games_listing() but includes admin-specific fields:
--   system_requirements, updated_at, media counts, all translations, full companies.

CREATE OR REPLACE FUNCTION public.get_admin_games_listing(
  p_locale     TEXT DEFAULT 'fr',
  p_limit      INT  DEFAULT 20,
  p_offset     INT  DEFAULT 0,
  p_search     TEXT DEFAULT NULL,
  p_sort_by    TEXT DEFAULT 'created_at',
  p_sort_order TEXT DEFAULT 'desc'
)
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_total_count INT;
  v_games       JSON;
  v_search_ids  UUID[];
  v_order_dir   TEXT;
  v_sql         TEXT;
BEGIN
  -- Sanitise sort direction (prevent SQL injection)
  IF p_sort_order = 'asc' THEN v_order_dir := 'ASC';
  ELSE v_order_dir := 'DESC';
  END IF;

  ----------------------------------------------------------------
  -- 1. Search: resolve matching game IDs via game_translations
  ----------------------------------------------------------------
  IF p_search IS NOT NULL AND p_search <> '' THEN
    SELECT array_agg(DISTINCT gt.game_id)
      INTO v_search_ids
      FROM game_translations gt
     WHERE gt.title ILIKE '%' || p_search || '%';

    IF v_search_ids IS NULL THEN
      RETURN json_build_object('games', '[]'::json, 'totalCount', 0);
    END IF;
  END IF;

  ----------------------------------------------------------------
  -- 2. Total count (respects search filter)
  ----------------------------------------------------------------
  IF v_search_ids IS NOT NULL THEN
    SELECT count(*) INTO v_total_count
      FROM games g WHERE g.id = ANY(v_search_ids);
  ELSE
    SELECT count(*) INTO v_total_count FROM games;
  END IF;

  ----------------------------------------------------------------
  -- 3. Build dynamic query for paginated games
  --    Using EXECUTE so we can parameterise ORDER BY direction.
  --    All user inputs are passed via USING to prevent injection.
  ----------------------------------------------------------------
  v_sql := $q$
    SELECT json_agg(row_data)
    FROM (
      SELECT json_build_object(
        'id',                   g.id,
        'slug',                 g.slug,
        'cover_image_url',      g.cover_image_url,
        'background_image_url', g.background_image_url,
        'background_color',     g.background_color,
        'release_date',         g.release_date,
        'metascore',            g.metascore,
        'system_requirements',  g.system_requirements,
        'created_at',           g.created_at,
        'updated_at',           g.updated_at,
        'title', COALESCE(
          (SELECT gt.title FROM game_translations gt
           WHERE gt.game_id = g.id AND gt.language_code = $1 LIMIT 1),
          (SELECT gt.title FROM game_translations gt
           WHERE gt.game_id = g.id LIMIT 1),
          'Untitled'
        ),
        'description', COALESCE(
          (SELECT gt.description FROM game_translations gt
           WHERE gt.game_id = g.id AND gt.language_code = $1 LIMIT 1),
          (SELECT gt.description FROM game_translations gt
           WHERE gt.game_id = g.id LIMIT 1)
        ),
        'translations', COALESCE(
          (SELECT json_agg(json_build_object(
             'id', gt.id, 'title', gt.title,
             'description', gt.description,
             'language_code', gt.language_code
           )) FROM game_translations gt WHERE gt.game_id = g.id),
          '[]'::json
        ),
        'genres', COALESCE(
          (SELECT json_agg(json_build_object(
             'id', gr.id, 'slug', gr.slug,
             'name', COALESCE(
               (SELECT grt.name FROM genre_translations grt
                WHERE grt.genre_id = gr.id AND grt.language_code = $1 LIMIT 1),
               (SELECT grt.name FROM genre_translations grt
                WHERE grt.genre_id = gr.id LIMIT 1),
               'Unknown'
             )))
           FROM game_genres gg
           INNER JOIN genres gr ON gr.id = gg.genre_id
           WHERE gg.game_id = g.id),
          '[]'::json
        ),
        'companies', json_build_object(
          'developers', COALESCE(
            (SELECT json_agg(json_build_object(
               'id', gc.id, 'company_id', c.id,
               'name', c.name, 'slug', c.slug,
               'is_primary', gc.is_primary
             ) ORDER BY gc.is_primary DESC NULLS LAST)
             FROM game_companies gc
             INNER JOIN companies c ON c.id = gc.company_id
             WHERE gc.game_id = g.id AND gc.role = 'developer'),
            '[]'::json),
          'publishers', COALESCE(
            (SELECT json_agg(json_build_object(
               'id', gc.id, 'company_id', c.id,
               'name', c.name, 'slug', c.slug,
               'is_primary', gc.is_primary
             ) ORDER BY gc.is_primary DESC NULLS LAST)
             FROM game_companies gc
             INNER JOIN companies c ON c.id = gc.company_id
             WHERE gc.game_id = g.id AND gc.role = 'publisher'),
            '[]'::json)
        ),
        'mediaCount', json_build_object(
          'screenshots', (SELECT count(*) FROM game_screenshots gs WHERE gs.game_id = g.id),
          'artwork',     (SELECT count(*) FROM game_artwork ga     WHERE ga.game_id = g.id),
          'videos',      (SELECT count(*) FROM game_videos gv      WHERE gv.game_id = g.id),
          'prices',      (SELECT count(*) FROM game_prices gp      WHERE gp.game_id = g.id)
        )
      ) AS row_data
      FROM games g
      WHERE ($4::uuid[] IS NULL OR g.id = ANY($4))
      ORDER BY
        CASE $5
          WHEN 'title' THEN COALESCE(
            (SELECT gt.title FROM game_translations gt
             WHERE gt.game_id = g.id AND gt.language_code = $1 LIMIT 1),
            (SELECT gt.title FROM game_translations gt
             WHERE gt.game_id = g.id LIMIT 1),
            'zzz')
          WHEN 'release_date' THEN COALESCE(g.release_date::text, '0000-01-01')
          ELSE g.created_at::text
        END
  $q$
  || ' ' || v_order_dir || ' LIMIT $2 OFFSET $3 ) sub';

  EXECUTE v_sql INTO v_games
    USING p_locale, p_limit, p_offset, v_search_ids, p_sort_by;

  RETURN json_build_object(
    'games',      COALESCE(v_games, '[]'::json),
    'totalCount', v_total_count
  );
END;
$fn$;
COMMENT ON FUNCTION public.get_admin_games_listing IS
  'Optimized server-side function for the admin games listing API. Returns paginated games with all translations, genres, companies, and media counts in a single query to avoid PostgREST nested-join timeouts.';
