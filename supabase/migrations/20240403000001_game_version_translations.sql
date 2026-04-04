-- Migration: game_version_translations
-- Objectif: Permettre la traduction du titre et de la description des versions de jeux.
-- Les champs version_title et description de game_versions deviennent les valeurs
-- par défaut (fallback) ; les traductions localisées sont dans cette nouvelle table.

CREATE TABLE IF NOT EXISTS public.game_version_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_version_id UUID NOT NULL REFERENCES game_versions(id) ON DELETE CASCADE,
  language_code VARCHAR(2) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(game_version_id, language_code)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_game_version_translations_version_id
  ON public.game_version_translations(game_version_id);
CREATE INDEX IF NOT EXISTS idx_game_version_translations_lang
  ON public.game_version_translations(game_version_id, language_code);

-- RLS
ALTER TABLE public.game_version_translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to game_version_translations"
  ON public.game_version_translations FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated insert to game_version_translations"
  ON public.game_version_translations FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update to game_version_translations"
  ON public.game_version_translations FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated delete to game_version_translations"
  ON public.game_version_translations FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Allow anon insert to game_version_translations"
  ON public.game_version_translations FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon update to game_version_translations"
  ON public.game_version_translations FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anon delete to game_version_translations"
  ON public.game_version_translations FOR DELETE
  TO anon
  USING (true);

-- Documentation
COMMENT ON TABLE public.game_version_translations IS
  'Traductions localisées (titre + description) des versions/éditions de jeux.';
COMMENT ON COLUMN public.game_version_translations.language_code IS
  'Code langue ISO 639-1 (fr, en).';
