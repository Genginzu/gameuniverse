-- Migration: Character Schema
-- Creates tables for character management system following the games pattern

-- Table principale des personnages
CREATE TABLE public.characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(255) UNIQUE NOT NULL,
  main_image TEXT,
  background_image TEXT,
  background_color VARCHAR(7) DEFAULT '#0f172a',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
-- Table des traductions de personnages
CREATE TABLE public.character_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID REFERENCES characters(id) ON DELETE CASCADE NOT NULL,
  language_code VARCHAR(2) REFERENCES languages(code) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(100),
  description TEXT,
  biography TEXT,
  UNIQUE(character_id, language_code)
);
-- Table de liaison personnages-jeux (many-to-many)
CREATE TABLE public.character_games (
  character_id UUID REFERENCES characters(id) ON DELETE CASCADE NOT NULL,
  game_id UUID REFERENCES games(id) ON DELETE CASCADE NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (character_id, game_id)
);
-- Table des médias de personnages
CREATE TABLE public.character_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID REFERENCES characters(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('screenshot', 'artwork', 'video')),
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  title TEXT,
  description TEXT,
  alt_text TEXT,
  is_featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
-- Index pour les performances
CREATE INDEX idx_characters_slug ON characters(slug);
CREATE INDEX idx_character_translations_character_id ON character_translations(character_id);
CREATE INDEX idx_character_translations_language ON character_translations(language_code);
CREATE INDEX idx_character_games_character_id ON character_games(character_id);
CREATE INDEX idx_character_games_game_id ON character_games(game_id);
CREATE INDEX idx_character_media_character_id ON character_media(character_id);
CREATE INDEX idx_character_media_type ON character_media(type);
-- Recherche full-text multilingue sur les noms de personnages
CREATE INDEX idx_character_translations_name_search ON character_translations
  USING gin(to_tsvector('french', name));
CREATE INDEX idx_character_translations_name_search_en ON character_translations
  USING gin(to_tsvector('english', name));
-- Trigger pour updated_at sur la table characters
CREATE TRIGGER update_characters_updated_at BEFORE UPDATE ON characters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- RLS (Row Level Security) pour les tables de personnages
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_media ENABLE ROW LEVEL SECURITY;
-- Politiques pour lecture publique
CREATE POLICY "Characters are viewable by everyone" ON characters 
  FOR SELECT USING (true);
CREATE POLICY "Character translations are viewable by everyone" ON character_translations 
  FOR SELECT USING (true);
CREATE POLICY "Character games are viewable by everyone" ON character_games 
  FOR SELECT USING (true);
CREATE POLICY "Character media is viewable by everyone" ON character_media 
  FOR SELECT USING (true);
-- Politiques pour administration
CREATE POLICY "Admins can manage characters" ON characters 
  FOR ALL USING (public.is_admin());
CREATE POLICY "Admins can manage character translations" ON character_translations 
  FOR ALL USING (public.is_admin());
CREATE POLICY "Admins can manage character games" ON character_games 
  FOR ALL USING (public.is_admin());
CREATE POLICY "Admins can manage character media" ON character_media 
  FOR ALL USING (public.is_admin());
-- Politiques pour développement (à supprimer en production)
CREATE POLICY "Allow insert characters for development" ON characters 
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow insert character translations for development" ON character_translations 
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow insert character games for development" ON character_games 
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow insert character media for development" ON character_media 
  FOR INSERT WITH CHECK (true);
-- Commentaires pour documentation
COMMENT ON TABLE characters IS 'Main table for video game characters';
COMMENT ON TABLE character_translations IS 'Localized character information (name, role, description, biography)';
COMMENT ON TABLE character_games IS 'Junction table linking characters to games they appear in';
COMMENT ON TABLE character_media IS 'Media assets for characters (screenshots, artwork, videos)';
COMMENT ON COLUMN characters.background_color IS 'Hex color code for character background theme (e.g., #FF5733)';
COMMENT ON COLUMN character_games.is_primary IS 'Indicates if this is the primary/origin game for the character';
