-- Migration: Add is_colors_synced column to igdb_global_sync table

ALTER TABLE igdb_global_sync
  ADD COLUMN IF NOT EXISTS is_colors_synced BOOLEAN DEFAULT FALSE;

CREATE INDEX idx_igdb_global_sync_not_colors
  ON igdb_global_sync(is_colors_synced) WHERE is_colors_synced = FALSE;

COMMENT ON COLUMN igdb_global_sync.is_colors_synced IS 'Whether color extraction from cover has been done for this game';
