-- Migration: Add customizable color columns to games table
-- These columns allow admins to configure per-game page theming
-- (accent, label, text colors) for better contrast on game detail pages.

ALTER TABLE games
  ADD COLUMN IF NOT EXISTS accent_color TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS label_color TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS text_color TEXT DEFAULT NULL;
-- Add check constraints for valid hex color format
ALTER TABLE games
  ADD CONSTRAINT chk_accent_color_hex CHECK (accent_color IS NULL OR accent_color ~ '^#[0-9A-Fa-f]{6}$'),
  ADD CONSTRAINT chk_label_color_hex CHECK (label_color IS NULL OR label_color ~ '^#[0-9A-Fa-f]{6}$'),
  ADD CONSTRAINT chk_text_color_hex CHECK (text_color IS NULL OR text_color ~ '^#[0-9A-Fa-f]{6}$');
COMMENT ON COLUMN games.accent_color IS 'Hex color for accent/icon elements on the game detail page';
COMMENT ON COLUMN games.label_color IS 'Hex color for label text on the game detail page';
COMMENT ON COLUMN games.text_color IS 'Hex color for main text on the game detail page';
