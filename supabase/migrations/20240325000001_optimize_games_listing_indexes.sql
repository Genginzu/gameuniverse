-- Migration: Optimize games listing query performance
-- Fixes statement timeout (57014) on GET /api/games by adding missing indexes
-- on the sort column and join paths used by the main listing query.

-- 1. Index on games(created_at DESC) — used for ORDER BY in pagination
CREATE INDEX IF NOT EXISTS idx_games_created_at_desc
  ON public.games (created_at DESC);

-- 2. Composite index on game_translations(game_id, language_code)
--    Covers the join + locale filter in a single index scan
CREATE INDEX IF NOT EXISTS idx_game_translations_game_lang
  ON public.game_translations (game_id, language_code);

-- 3. Composite index on genre_translations(genre_id, language_code)
--    Covers the nested join through game_genres → genres → genre_translations
CREATE INDEX IF NOT EXISTS idx_genre_translations_genre_lang
  ON public.genre_translations (genre_id, language_code);

-- 4. Index on game_genres(genre_id) — reverse lookup used by genre filtering
CREATE INDEX IF NOT EXISTS idx_game_genres_genre_id
  ON public.game_genres (genre_id);

-- 5. Composite index on game_companies(game_id, role, is_primary)
--    Covers the join + developer/publisher lookup pattern
CREATE INDEX IF NOT EXISTS idx_game_companies_game_role_primary
  ON public.game_companies (game_id, role, is_primary);
