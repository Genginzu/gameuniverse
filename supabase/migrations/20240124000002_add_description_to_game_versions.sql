-- Migration: Add description column to game_versions
-- Stores the summary/description of each game version (Collector, Deluxe, etc.)

ALTER TABLE game_versions ADD COLUMN IF NOT EXISTS description TEXT;
