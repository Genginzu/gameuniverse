-- Migration: Add view_count to games and characters
-- Enables sorting by popularity based on page views.
-- Games/characters without covers are pushed to the end of listings.

-- ============================================================================
-- 1. Add view_count column to games and characters
-- ============================================================================

ALTER TABLE public.games
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0 NOT NULL;

COMMENT ON COLUMN public.games.view_count IS 'Number of page views for this game, used for popularity sorting';

ALTER TABLE public.characters
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0 NOT NULL;

COMMENT ON COLUMN public.characters.view_count IS 'Number of page views for this character, used for popularity sorting';

-- ============================================================================
-- 2. Indexes for sorting by view_count
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_games_view_count
  ON public.games (view_count DESC);

CREATE INDEX IF NOT EXISTS idx_characters_view_count
  ON public.characters (view_count DESC);

-- Composite index: cover presence + view_count for the "no cover last" sort
CREATE INDEX IF NOT EXISTS idx_games_cover_view_count
  ON public.games ((CASE WHEN cover_image_url IS NOT NULL THEN 0 ELSE 1 END), view_count DESC);

CREATE INDEX IF NOT EXISTS idx_characters_cover_view_count
  ON public.characters ((CASE WHEN main_image IS NOT NULL THEN 0 ELSE 1 END), view_count DESC);

-- ============================================================================
-- 3. Function to atomically increment view_count for a game
-- ============================================================================

CREATE OR REPLACE FUNCTION public.increment_game_view_count(p_game_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.games
  SET view_count = view_count + 1
  WHERE id = p_game_id;
END;
$$;

COMMENT ON FUNCTION public.increment_game_view_count IS
  'Atomically increments the view_count for a game by 1.';

-- ============================================================================
-- 4. Function to atomically increment view_count for a character
-- ============================================================================

CREATE OR REPLACE FUNCTION public.increment_character_view_count(p_character_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.characters
  SET view_count = view_count + 1
  WHERE id = p_character_id;
END;
$$;

COMMENT ON FUNCTION public.increment_character_view_count IS
  'Atomically increments the view_count for a character by 1.';

-- ============================================================================
-- 5. Update get_games_listing to sort by cover presence then view_count
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
  -- Sort: games with covers first (by view_count desc), then games without covers
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
  'Optimized server-side function for the games listing API. Returns paginated games sorted by cover presence, then view count, then activity/popularity, with translations, genres, and companies.';
