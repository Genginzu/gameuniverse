-- Migration: Add sync status columns to igdb_global_sync table
-- is_synced: whether the game has been imported/synced to our database
-- is_metascore_synced: whether the metascore has been fetched from IGDB

ALTER TABLE igdb_global_sync
  ADD COLUMN IF NOT EXISTS is_synced BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_metascore_synced BOOLEAN DEFAULT FALSE;

CREATE INDEX idx_igdb_global_sync_not_synced
  ON igdb_global_sync(is_synced) WHERE is_synced = FALSE;

COMMENT ON COLUMN igdb_global_sync.is_synced IS 'Whether this game has been imported/synced to our database';
COMMENT ON COLUMN igdb_global_sync.is_metascore_synced IS 'Whether the metascore has been fetched from IGDB';
