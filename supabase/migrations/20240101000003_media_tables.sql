-- Migration 003: Tables de médias séparées
-- Création des tables pour les différents types de médias des jeux

-- Table pour les screenshots
CREATE TABLE public.game_screenshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE NOT NULL,
  url TEXT NOT NULL,
  alt_text TEXT,
  caption TEXT,
  display_order INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table pour les artworks
CREATE TABLE public.game_artwork (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE NOT NULL,
  url TEXT NOT NULL,
  alt_text TEXT,
  caption TEXT,
  artwork_type VARCHAR(50) DEFAULT 'concept', -- concept, promotional, wallpaper, etc.
  display_order INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table pour les vidéos
CREATE TABLE public.game_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE NOT NULL,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  title TEXT NOT NULL,
  description TEXT,
  video_type VARCHAR(50) DEFAULT 'trailer', -- trailer, gameplay, review, etc.
  duration_seconds INTEGER,
  display_order INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX idx_game_screenshots_game_id ON game_screenshots(game_id);
CREATE INDEX idx_game_screenshots_featured ON game_screenshots(game_id, is_featured) WHERE is_featured = true;
CREATE INDEX idx_game_screenshots_order ON game_screenshots(game_id, display_order);

CREATE INDEX idx_game_artwork_game_id ON game_artwork(game_id);
CREATE INDEX idx_game_artwork_type ON game_artwork(game_id, artwork_type);
CREATE INDEX idx_game_artwork_featured ON game_artwork(game_id, is_featured) WHERE is_featured = true;
CREATE INDEX idx_game_artwork_order ON game_artwork(game_id, display_order);

CREATE INDEX idx_game_videos_game_id ON game_videos(game_id);
CREATE INDEX idx_game_videos_type ON game_videos(game_id, video_type);
CREATE INDEX idx_game_videos_featured ON game_videos(game_id, is_featured) WHERE is_featured = true;
CREATE INDEX idx_game_videos_order ON game_videos(game_id, display_order);

-- Supprimer la colonne media de la table games (remplacée par les tables séparées)
ALTER TABLE games DROP COLUMN IF EXISTS media;

-- Ajouter une colonne cover_image_url pour l'image de couverture principale
ALTER TABLE games ADD COLUMN cover_image_url TEXT;

-- RLS pour les nouvelles tables
ALTER TABLE game_screenshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_artwork ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_videos ENABLE ROW LEVEL SECURITY;

-- Politiques pour lecture publique des médias
CREATE POLICY "Game screenshots are viewable by everyone" ON game_screenshots 
  FOR SELECT USING (true);

CREATE POLICY "Game artwork is viewable by everyone" ON game_artwork 
  FOR SELECT USING (true);

CREATE POLICY "Game videos are viewable by everyone" ON game_videos 
  FOR SELECT USING (true);

-- Politiques pour administration
CREATE POLICY "Admins can manage game screenshots" ON game_screenshots 
  FOR ALL USING (public.is_admin());

CREATE POLICY "Admins can manage game artwork" ON game_artwork 
  FOR ALL USING (public.is_admin());

CREATE POLICY "Admins can manage game videos" ON game_videos 
  FOR ALL USING (public.is_admin());

-- Politiques pour développement (à supprimer en production)
CREATE POLICY "Allow insert screenshots for development" ON game_screenshots 
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow insert artwork for development" ON game_artwork 
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow insert videos for development" ON game_videos 
  FOR INSERT WITH CHECK (true);