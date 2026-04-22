-- Migration: Add granular sync state columns to igdb_global_sync
-- Replaces the single is_enriched column with per-field tracking columns.
-- Each column tracks whether a specific enrichment step has been completed.

ALTER TABLE igdb_global_sync
  ADD COLUMN IF NOT EXISTS is_screenshots_synced BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_artworks_synced BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_videos_synced BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_classifications_synced BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_languages_synced BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_versions_synced BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_playtime_synced BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_popularity_synced BOOLEAN DEFAULT FALSE;

-- Partial indexes for each enrichment tab query (WHERE col = FALSE ORDER BY igdb_id)
CREATE INDEX IF NOT EXISTS idx_igs_screenshots ON igdb_global_sync(igdb_id) WHERE is_synced = TRUE AND is_screenshots_synced = FALSE;
CREATE INDEX IF NOT EXISTS idx_igs_artworks ON igdb_global_sync(igdb_id) WHERE is_synced = TRUE AND is_artworks_synced = FALSE;
CREATE INDEX IF NOT EXISTS idx_igs_videos ON igdb_global_sync(igdb_id) WHERE is_synced = TRUE AND is_videos_synced = FALSE;
CREATE INDEX IF NOT EXISTS idx_igs_classifications ON igdb_global_sync(igdb_id) WHERE is_synced = TRUE AND is_classifications_synced = FALSE;
CREATE INDEX IF NOT EXISTS idx_igs_languages ON igdb_global_sync(igdb_id) WHERE is_synced = TRUE AND is_languages_synced = FALSE;
CREATE INDEX IF NOT EXISTS idx_igs_versions ON igdb_global_sync(igdb_id) WHERE is_synced = TRUE AND is_versions_synced = FALSE;
CREATE INDEX IF NOT EXISTS idx_igs_playtime ON igdb_global_sync(igdb_id) WHERE is_synced = TRUE AND is_playtime_synced = FALSE;
CREATE INDEX IF NOT EXISTS idx_igs_popularity ON igdb_global_sync(igdb_id) WHERE is_synced = TRUE AND is_popularity_synced = FALSE;

-- Also add missing composite indexes for existing tabs
CREATE INDEX IF NOT EXISTS idx_igs_unsynced ON igdb_global_sync(igdb_id) WHERE is_synced = FALSE;
CREATE INDEX IF NOT EXISTS idx_igs_uncolors ON igdb_global_sync(igdb_id) WHERE is_synced = TRUE AND is_colors_synced = FALSE;
CREATE INDEX IF NOT EXISTS idx_igs_unmetascore ON igdb_global_sync(igdb_id) WHERE is_synced = TRUE AND is_metascore_synced = FALSE;

COMMENT ON COLUMN igdb_global_sync.is_screenshots_synced IS 'Whether screenshots have been synced from IGDB';
COMMENT ON COLUMN igdb_global_sync.is_artworks_synced IS 'Whether artworks have been synced from IGDB';
COMMENT ON COLUMN igdb_global_sync.is_videos_synced IS 'Whether videos have been synced from IGDB';
COMMENT ON COLUMN igdb_global_sync.is_classifications_synced IS 'Whether age ratings have been synced from IGDB';
COMMENT ON COLUMN igdb_global_sync.is_languages_synced IS 'Whether language supports have been synced from IGDB';
COMMENT ON COLUMN igdb_global_sync.is_versions_synced IS 'Whether game versions/editions have been synced from IGDB';
COMMENT ON COLUMN igdb_global_sync.is_playtime_synced IS 'Whether playtime data has been synced from IGDB';
COMMENT ON COLUMN igdb_global_sync.is_popularity_synced IS 'Whether popularity primitives have been synced from IGDB';
