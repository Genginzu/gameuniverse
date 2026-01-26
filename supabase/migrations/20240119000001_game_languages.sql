-- Migration: Add game languages support
-- Stores audio and subtitle language support for games from IGDB

-- Table for game language support
CREATE TABLE public.game_languages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE NOT NULL,
  language_code VARCHAR(10) NOT NULL, -- ISO 639-1 code (e.g., 'en', 'fr', 'ja')
  language_name VARCHAR(100) NOT NULL, -- Full name (e.g., 'English', 'French')
  has_audio BOOLEAN DEFAULT FALSE,
  has_subtitles BOOLEAN DEFAULT FALSE,
  has_interface BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(game_id, language_code)
);

-- Index for performance
CREATE INDEX idx_game_languages_game_id ON game_languages(game_id);
CREATE INDEX idx_game_languages_language_code ON game_languages(language_code);

-- RLS policies
ALTER TABLE game_languages ENABLE ROW LEVEL SECURITY;

-- Everyone can read game languages
CREATE POLICY "Game languages are viewable by everyone"
  ON game_languages FOR SELECT
  USING (true);

-- Only authenticated users can insert (for import)
CREATE POLICY "Authenticated users can insert game languages"
  ON game_languages FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Only authenticated users can update
CREATE POLICY "Authenticated users can update game languages"
  ON game_languages FOR UPDATE
  TO authenticated
  USING (true);

-- Only authenticated users can delete
CREATE POLICY "Authenticated users can delete game languages"
  ON game_languages FOR DELETE
  TO authenticated
  USING (true);
