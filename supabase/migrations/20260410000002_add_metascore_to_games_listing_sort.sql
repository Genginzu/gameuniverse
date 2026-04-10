-- Migration: Add metascore to get_games_listing sort order
--
-- Adds metascore DESC NULLS LAST as secondary sort after view_count,
-- so popular games with high ratings appear first.

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
  -- Count total matching games
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
      SELECT count(*) INTO v_total_count FROM games;
    END IF;
  END IF;

  -- Fetch paginated games with all relations in a single query
  -- Sort: cover first, then view_count, then metascore, then activity/popularity
  SELECT json_agg(row_data) INTO v_games
  FROM (
    SELECT json_build_object(
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
      'title', COALESCE(
        (SELECT gt.title FROM game_translations gt
         WHERE gt.game_id = g.id AND gt.language_code = p_locale
         LIMIT 1),
        (SELECT gt.title FROM game_translations gt
         WHERE gt.game_id = g.id
         LIMIT 1),
        'Untitled'
      ),
      'description', CASE WHEN p_include_description THEN
        COALESCE(
          (SELECT gt.description FROM game_translations gt
           WHERE gt.game_id = g.id AND gt.language_code = p_locale
           LIMIT 1),
          (SELECT gt.description FROM game_translations gt
           WHERE gt.game_id = g.id
           LIMIT 1)
        )
      ELSE NULL END,
      'genres', COALESCE(
        (SELECT json_agg(json_build_object('name', gname))
         FROM (
           SELECT COALESCE(
             (SELECT grt.name FROM genre_translations grt
              WHERE grt.genre_id = gr.id AND grt.language_code = p_locale
              LIMIT 1),
             (SELECT grt.name FROM genre_translations grt
              WHERE grt.genre_id = gr.id
              LIMIT 1),
             'Unknown'
           ) AS gname
           FROM game_genres gg
           INNER JOIN genres gr ON gr.id = gg.genre_id
           WHERE gg.game_id = g.id
         ) sub_genres),
        '[]'::json
      ),
      'developer', COALESCE(
        (SELECT c.name FROM game_companies gc
         INNER JOIN companies c ON c.id = gc.company_id
         WHERE gc.game_id = g.id AND gc.role = 'developer'
         ORDER BY gc.is_primary DESC NULLS LAST
         LIMIT 1),
        'Unknown'
      ),
      'publisher', COALESCE(
        (SELECT c.name FROM game_companies gc
         INNER JOIN companies c ON c.id = gc.company_id
         WHERE gc.game_id = g.id AND gc.role = 'publisher'
         ORDER BY gc.is_primary DESC NULLS LAST
         LIMIT 1),
        'Unknown'
      )
    ) AS row_data
    FROM games g
    LEFT JOIN user_library ul
      ON p_in_library AND ul.game_id = g.id AND ul.user_id = p_user_id
    WHERE
      (NOT p_in_library OR ul.user_id IS NOT NULL)
      AND (p_game_ids IS NULL OR g.id = ANY(p_game_ids))
    ORDER BY
      CASE WHEN g.cover_image_url IS NOT NULL THEN 0 ELSE 1 END,
      g.metascore DESC NULLS LAST,
      g.view_count DESC,
      g.last_activity_at DESC NULLS LAST,
      g.popularity_score DESC,
      g.created_at DESC
    LIMIT p_limit
    OFFSET p_offset
  ) sub;

  RETURN json_build_object(
    'games', COALESCE(v_games, '[]'::json),
    'totalCount', v_total_count
  );
END;
$$;

COMMENT ON FUNCTION public.get_games_listing IS
  'Optimized server-side function for the games listing API. Returns paginated games sorted by cover presence, then view count, then metascore, then activity/popularity, with translations, genres, and companies.';
