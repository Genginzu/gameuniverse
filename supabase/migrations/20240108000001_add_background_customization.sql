-- Migration: Add background customization fields
-- Add backgroundColor and backgroundImage fields to games table for per-game background customization

-- Add background customization fields to games table
ALTER TABLE games ADD COLUMN background_color TEXT;
ALTER TABLE games ADD COLUMN background_image_url TEXT;
-- Add comments for documentation
COMMENT ON COLUMN games.background_color IS 'Hex color code for game page background (e.g., #0f172a)';
COMMENT ON COLUMN games.background_image_url IS 'URL for background image displayed on game details page';
