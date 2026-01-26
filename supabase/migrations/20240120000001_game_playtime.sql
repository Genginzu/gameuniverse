-- Migration: Add game playtime storage
-- Stores HowLongToBeat playtime data for games

-- Add playtime columns to games table
ALTER TABLE public.games
ADD COLUMN IF NOT EXISTS playtime_main DECIMAL(6,1) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS playtime_main_extra DECIMAL(6,1) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS playtime_completionist DECIMAL(6,1) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS playtime_all_styles DECIMAL(6,1) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS hltb_id INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS playtime_updated_at TIMESTAMP DEFAULT NULL;

-- Index for HLTB ID lookups
CREATE INDEX IF NOT EXISTS idx_games_hltb_id ON games(hltb_id);
