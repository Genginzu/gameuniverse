-- Migration: Add last_activity_at column and popularity score to games
-- Enables sorting games by recent community activity, then by popularity.
--
-- last_activity_at: updated whenever a review, library entry, or game session
-- is created/updated for this game. Falls back to games.updated_at.
--
-- popularity_score: computed count of reviews + library entries for the game.

-- ============================================================================
-- 1. Add columns
-- ============================================================================

ALTER TABLE public.games
ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS popularity_score INTEGER DEFAULT 0;
COMMENT ON COLUMN public.games.last_activity_at IS 'Timestamp of the most recent community activity (review, library add, session) for this game';
COMMENT ON COLUMN public.games.popularity_score IS 'Cached popularity score = count(reviews) + count(library entries) for sorting';
-- ============================================================================
-- 2. Backfill last_activity_at from existing data
-- ============================================================================

UPDATE public.games g
SET last_activity_at = GREATEST(
  g.updated_at,
  (SELECT MAX(gr.created_at) FROM game_reviews gr WHERE gr.game_id = g.id),
  (SELECT MAX(ul.added_at) FROM user_library ul WHERE ul.game_id = g.id),
  (SELECT MAX(gs.started_at) FROM game_sessions gs WHERE gs.game_id = g.id)
);
-- Games with no activity: fall back to updated_at
UPDATE public.games
SET last_activity_at = updated_at
WHERE last_activity_at IS NULL;
-- ============================================================================
-- 3. Backfill popularity_score from existing data
-- ============================================================================

UPDATE public.games g
SET popularity_score = (
  SELECT COALESCE(
    (SELECT COUNT(*) FROM game_reviews gr WHERE gr.game_id = g.id), 0
  ) + COALESCE(
    (SELECT COUNT(*) FROM user_library ul WHERE ul.game_id = g.id), 0
  )
);
-- ============================================================================
-- 4. Index for the new sort order
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_games_last_activity_at
  ON public.games (last_activity_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_games_popularity_score
  ON public.games (popularity_score DESC);
-- Composite index matching the new ORDER BY clause
CREATE INDEX IF NOT EXISTS idx_games_activity_popularity
  ON public.games (last_activity_at DESC NULLS LAST, popularity_score DESC);
-- ============================================================================
-- 5. Trigger functions to keep last_activity_at and popularity_score in sync
-- ============================================================================

-- 5a. Update last_activity_at on the parent game when activity occurs
CREATE OR REPLACE FUNCTION public.update_game_last_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.games
  SET last_activity_at = NOW()
  WHERE id = COALESCE(NEW.game_id, OLD.game_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
-- 5b. Increment popularity_score when a review or library entry is added
CREATE OR REPLACE FUNCTION public.increment_game_popularity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.games
  SET popularity_score = popularity_score + 1
  WHERE id = NEW.game_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
-- 5c. Decrement popularity_score when a review or library entry is removed
CREATE OR REPLACE FUNCTION public.decrement_game_popularity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.games
  SET popularity_score = GREATEST(popularity_score - 1, 0)
  WHERE id = OLD.game_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
-- ============================================================================
-- 6. Triggers on game_reviews
-- ============================================================================

CREATE TRIGGER trg_review_activity
  AFTER INSERT OR UPDATE ON public.game_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_game_last_activity();
CREATE TRIGGER trg_review_delete_activity
  AFTER DELETE ON public.game_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_game_last_activity();
CREATE TRIGGER trg_review_insert_popularity
  AFTER INSERT ON public.game_reviews
  FOR EACH ROW EXECUTE FUNCTION public.increment_game_popularity();
CREATE TRIGGER trg_review_delete_popularity
  AFTER DELETE ON public.game_reviews
  FOR EACH ROW EXECUTE FUNCTION public.decrement_game_popularity();
-- ============================================================================
-- 7. Triggers on user_library
-- ============================================================================

CREATE TRIGGER trg_library_activity
  AFTER INSERT OR UPDATE ON public.user_library
  FOR EACH ROW EXECUTE FUNCTION public.update_game_last_activity();
CREATE TRIGGER trg_library_delete_activity
  AFTER DELETE ON public.user_library
  FOR EACH ROW EXECUTE FUNCTION public.update_game_last_activity();
CREATE TRIGGER trg_library_insert_popularity
  AFTER INSERT ON public.user_library
  FOR EACH ROW EXECUTE FUNCTION public.increment_game_popularity();
CREATE TRIGGER trg_library_delete_popularity
  AFTER DELETE ON public.user_library
  FOR EACH ROW EXECUTE FUNCTION public.decrement_game_popularity();
-- ============================================================================
-- 8. Triggers on game_sessions (activity only, no popularity impact)
-- ============================================================================

CREATE TRIGGER trg_session_activity
  AFTER INSERT OR UPDATE ON public.game_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_game_last_activity();
-- ============================================================================
-- 9. Update get_games_listing to sort by activity then popularity
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
    ORDER BY g.last_activity_at DESC NULLS LAST, g.popularity_score DESC, g.created_at DESC
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
  'Optimized server-side function for the games listing API. Returns paginated games sorted by recent community activity then popularity, with translations, genres, and companies in a single query.';
