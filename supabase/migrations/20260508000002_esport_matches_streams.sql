-- Add a `streams` JSONB column to esport_matches to store the PandaScore
-- streams_list payload. This lets the public live page expose stream URLs
-- without hitting PandaScore at runtime.
--
-- Each entry is a `{ language: string, main: boolean, raw_url: string }`
-- object as returned by PandaScore. Stored as JSONB array; a NULL value
-- means the match has no associated streams (yet).

ALTER TABLE public.esport_matches
  ADD COLUMN IF NOT EXISTS streams JSONB;

COMMENT ON COLUMN public.esport_matches.streams IS
  'PandaScore streams_list: array of {language, main, raw_url}. Synced from PandaScore.';

-- Partial index to quickly find matches that have streams (used by the live
-- page query: status=running + streams not null).
CREATE INDEX IF NOT EXISTS idx_esport_matches_streams_present
  ON public.esport_matches ((streams IS NOT NULL))
  WHERE streams IS NOT NULL;
