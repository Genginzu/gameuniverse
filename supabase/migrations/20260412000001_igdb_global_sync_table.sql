-- Migration: Create igdb_global_sync table for one-time IGDB catalog download
-- This table stores all IGDB games with minimal info (name, cover, igdb_id)
-- and optionally links them to existing games in our database.

CREATE TABLE public.igdb_global_sync (
  id BIGSERIAL PRIMARY KEY,
  igdb_id INTEGER NOT NULL UNIQUE,
  name TEXT NOT NULL,
  cover_image_id TEXT,
  matched_game_id UUID REFERENCES games(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_igdb_global_sync_igdb_id ON igdb_global_sync(igdb_id);
CREATE INDEX idx_igdb_global_sync_matched ON igdb_global_sync(matched_game_id);
CREATE INDEX idx_igdb_global_sync_name ON igdb_global_sync USING gin(to_tsvector('simple', name));

COMMENT ON TABLE igdb_global_sync IS 'Temporary table for one-time IGDB full catalog sync tool';
COMMENT ON COLUMN igdb_global_sync.igdb_id IS 'IGDB game identifier';
COMMENT ON COLUMN igdb_global_sync.name IS 'Game name from IGDB';
COMMENT ON COLUMN igdb_global_sync.cover_image_id IS 'IGDB cover image_id for URL building';
COMMENT ON COLUMN igdb_global_sync.matched_game_id IS 'Link to existing game in our database (matched by igdb_id)';

-- RLS
ALTER TABLE igdb_global_sync ENABLE ROW LEVEL SECURITY;

-- Admin-only access via service role (no public access needed)
CREATE POLICY "Admin read igdb_global_sync" ON igdb_global_sync
  FOR SELECT USING (true);
