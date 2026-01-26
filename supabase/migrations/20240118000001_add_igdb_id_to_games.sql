-- Add IGDB ID column to games table for hybrid search deduplication
-- This allows linking local games to their IGDB counterparts

ALTER TABLE games ADD COLUMN IF NOT EXISTS igdb_id INTEGER UNIQUE;

-- Create index for efficient lookups by IGDB ID
CREATE INDEX IF NOT EXISTS idx_games_igdb_id ON games(igdb_id);

-- Add last_synced_at column to track when game data was last synchronized with IGDB
ALTER TABLE games ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ;

COMMENT ON COLUMN games.igdb_id IS 'IGDB game identifier for deduplication and synchronization';
COMMENT ON COLUMN games.last_synced_at IS 'Timestamp of last synchronization with IGDB API';
