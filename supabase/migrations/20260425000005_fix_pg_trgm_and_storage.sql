-- Move pg_trgm from public to extensions schema (Security Advisor warning 0014)
-- and restrict public bucket SELECT policies to prevent file listing (warning 0025)

-- ============================================================================
-- 1. Move pg_trgm to extensions schema
-- ============================================================================

-- Drop indexes that depend on pg_trgm operators
DROP INDEX IF EXISTS public.idx_profiles_username_trgm;
DROP INDEX IF EXISTS public.idx_game_translations_title_trgm;
DROP INDEX IF EXISTS public.idx_character_translations_name_trgm;
DROP INDEX IF EXISTS public.idx_player_posts_content_trgm;

-- Move extension
DROP EXTENSION IF EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS pg_trgm SCHEMA extensions;

-- Recreate indexes using extensions schema operators
CREATE INDEX IF NOT EXISTS idx_profiles_username_trgm
  ON public.profiles USING gin (username extensions.gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_game_translations_title_trgm
  ON public.game_translations USING gin (title extensions.gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_character_translations_name_trgm
  ON public.character_translations USING gin (name extensions.gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_player_posts_content_trgm
  ON public.player_posts USING gin (content extensions.gin_trgm_ops);

-- ============================================================================
-- 2. Remove broad SELECT policies on public buckets (warning 0025)
-- Public buckets serve files via direct URL without needing a SELECT policy.
-- The SELECT policy only enables listing all files, which is a security risk.
-- ============================================================================

DROP POLICY IF EXISTS "Avatars are publicly readable" ON storage.objects;
DROP POLICY IF EXISTS "Banners are publicly readable" ON storage.objects;
DROP POLICY IF EXISTS "Post images are publicly readable" ON storage.objects;
