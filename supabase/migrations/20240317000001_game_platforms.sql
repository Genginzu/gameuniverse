-- Migration: game_platforms
-- Objective: Create tables for game platforms support with i18n translations.
-- Adds platforms, platform_translations, and game_platforms (many-to-many) tables.
-- Follows the same pattern as genres (main table + translations + junction table).
-- Requirements: 1.1, 1.2, 1.3, 1.4, 1.5

-- 1. Create platforms table
CREATE TABLE IF NOT EXISTS public.platforms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  igdb_id INTEGER UNIQUE,
  icon_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- 2. Create platform_translations table
CREATE TABLE IF NOT EXISTS public.platform_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_id UUID NOT NULL REFERENCES platforms(id) ON DELETE CASCADE,
  language_code TEXT NOT NULL,
  name TEXT NOT NULL,
  abbreviation TEXT,
  UNIQUE(platform_id, language_code)
);
-- 3. Create game_platforms junction table (many-to-many)
CREATE TABLE IF NOT EXISTS public.game_platforms (
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  platform_id UUID NOT NULL REFERENCES platforms(id) ON DELETE CASCADE,
  PRIMARY KEY (game_id, platform_id)
);
-- 4. Indexes for filtering performance
CREATE INDEX IF NOT EXISTS idx_game_platforms_game_id ON public.game_platforms(game_id);
CREATE INDEX IF NOT EXISTS idx_game_platforms_platform_id ON public.game_platforms(platform_id);
-- 5. Enable RLS on all tables
ALTER TABLE public.platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_platforms ENABLE ROW LEVEL SECURITY;
-- 6. Public read policies
CREATE POLICY "Public read platforms" ON public.platforms
  FOR SELECT USING (true);
CREATE POLICY "Public read platform_translations" ON public.platform_translations
  FOR SELECT USING (true);
CREATE POLICY "Public read game_platforms" ON public.game_platforms
  FOR SELECT USING (true);
-- 7. Admin write policies
CREATE POLICY "Admin write platforms" ON public.platforms
  FOR ALL USING (auth.jwt() ->> 'is_admin' = 'true');
CREATE POLICY "Admin write platform_translations" ON public.platform_translations
  FOR ALL USING (auth.jwt() ->> 'is_admin' = 'true');
CREATE POLICY "Admin write game_platforms" ON public.game_platforms
  FOR ALL USING (auth.jwt() ->> 'is_admin' = 'true');
-- 8. Documentation
COMMENT ON TABLE public.platforms IS 'Video game platforms (PS5, Xbox, PC, Switch, etc.)';
COMMENT ON COLUMN public.platforms.id IS 'Primary key (UUID, auto-generated)';
COMMENT ON COLUMN public.platforms.slug IS 'Unique URL-friendly identifier (e.g. playstation-5)';
COMMENT ON COLUMN public.platforms.igdb_id IS 'IGDB platform ID for deduplication during import';
COMMENT ON COLUMN public.platforms.icon_url IS 'URL to the platform icon image';
COMMENT ON COLUMN public.platforms.created_at IS 'Timestamp when the platform was created';
COMMENT ON COLUMN public.platforms.updated_at IS 'Timestamp when the platform was last updated';
COMMENT ON TABLE public.platform_translations IS 'i18n translations for platform names (FR/EN)';
COMMENT ON COLUMN public.platform_translations.id IS 'Primary key (UUID, auto-generated)';
COMMENT ON COLUMN public.platform_translations.platform_id IS 'FK to platforms — the translated platform';
COMMENT ON COLUMN public.platform_translations.language_code IS 'ISO 639-1 language code (fr, en)';
COMMENT ON COLUMN public.platform_translations.name IS 'Translated platform name';
COMMENT ON COLUMN public.platform_translations.abbreviation IS 'Optional short abbreviation (e.g. PS5, XSX)';
COMMENT ON TABLE public.game_platforms IS 'Many-to-many junction between games and platforms';
COMMENT ON COLUMN public.game_platforms.game_id IS 'FK to games — the game available on this platform';
COMMENT ON COLUMN public.game_platforms.platform_id IS 'FK to platforms — the platform the game is available on';
