-- Migration: Admin performance indexes
-- Purpose: Speed up ilike-based search and filter columns used heavily in admin routes.
-- The existing btree indexes on username/title handle equality but fall back to seq scans
-- for "%term%" ilike queries. pg_trgm GIN indexes make these O(log n).
--
-- Note: CONCURRENTLY is omitted because the Supabase CLI applies migrations inside a
-- pipeline/transaction (SQLSTATE 25001 otherwise). These tables are small enough that
-- the short ACCESS EXCLUSIVE lock at creation time is acceptable.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ── profiles.username: admin reviews/comments search ──
CREATE INDEX IF NOT EXISTS idx_profiles_username_trgm
  ON public.profiles USING gin (username gin_trgm_ops);

-- ── game_translations.title: admin reviews/comments search by game title ──
CREATE INDEX IF NOT EXISTS idx_game_translations_title_trgm
  ON public.game_translations USING gin (title gin_trgm_ops);

-- ── character_translations.name: admin characters search ──
CREATE INDEX IF NOT EXISTS idx_character_translations_name_trgm
  ON public.character_translations USING gin (name gin_trgm_ops);

-- ── rating_systems counts: supports batched count queries by rating_system_id ──
CREATE INDEX IF NOT EXISTS idx_ratings_rating_system_id
  ON public.ratings (rating_system_id);

CREATE INDEX IF NOT EXISTS idx_content_descriptors_rating_system_id
  ON public.content_descriptors (rating_system_id);

-- ── character_games.is_primary filter for admin characters list ──
CREATE INDEX IF NOT EXISTS idx_character_games_primary
  ON public.character_games (character_id)
  WHERE is_primary = true;
