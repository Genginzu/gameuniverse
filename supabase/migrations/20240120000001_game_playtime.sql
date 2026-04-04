-- Migration: Add game playtime storage
-- NOTE: hltb_id column is removed in migration 20240121000001_remove_hltb_use_igdb_playtime.sql
-- Playtime data now comes from IGDB instead of HowLongToBeat

-- Add playtime columns to games table
ALTER TABLE public.games
ADD COLUMN IF NOT EXISTS playtime_main DECIMAL(6,1) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS playtime_main_extra DECIMAL(6,1) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS playtime_completionist DECIMAL(6,1) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS playtime_all_styles DECIMAL(6,1) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS hltb_id INTEGER DEFAULT NULL, -- Removed in migration 20240121000001
ADD COLUMN IF NOT EXISTS playtime_updated_at TIMESTAMP DEFAULT NULL;
-- Index for HLTB ID lookups (removed in migration 20240121000001)
CREATE INDEX IF NOT EXISTS idx_games_hltb_id ON games(hltb_id);
