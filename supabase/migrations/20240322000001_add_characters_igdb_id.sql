-- Migration: Add igdb_id column to characters table
-- Allows tracking which characters were imported from IGDB to avoid duplicates

ALTER TABLE public.characters
  ADD COLUMN IF NOT EXISTS igdb_id INTEGER UNIQUE;

COMMENT ON COLUMN public.characters.igdb_id IS 'IGDB character ID for deduplication during bulk import';

CREATE INDEX IF NOT EXISTS idx_characters_igdb_id ON public.characters(igdb_id);
