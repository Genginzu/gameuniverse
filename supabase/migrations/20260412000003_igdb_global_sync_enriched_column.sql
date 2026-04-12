-- Migration: Add is_enriched column to igdb_global_sync table
-- Tracks whether a game has been enriched with full data (colors, media, etc.)

ALTER TABLE igdb_global_sync
  ADD COLUMN IF NOT EXISTS is_enriched BOOLEAN DEFAULT FALSE;

CREATE INDEX idx_igdb_global_sync_not_enriched
  ON igdb_global_sync(is_enriched) WHERE is_enriched = FALSE;

COMMENT ON COLUMN igdb_global_sync.is_enriched IS 'Whether this game has been enriched with colors, screenshots, artworks, videos, age ratings, versions, languages, playtime, similar games';
