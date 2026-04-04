-- Migration: Table game_versions
-- Création de la table pour stocker les différentes versions/éditions d'un jeu
-- (Collector, Deluxe, GOTY, Complete Edition, etc.)

-- Table des versions de jeux
CREATE TABLE public.game_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  igdb_id INTEGER NOT NULL,
  version_title VARCHAR(255) NOT NULL,
  cover_image_url TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(game_id, igdb_id)
);
-- Index pour les performances
CREATE INDEX idx_game_versions_game_id ON game_versions(game_id);
CREATE INDEX idx_game_versions_igdb_id ON game_versions(igdb_id);
-- Activation RLS
ALTER TABLE game_versions ENABLE ROW LEVEL SECURITY;
-- Politique de lecture publique
CREATE POLICY "Allow public read access to game_versions"
  ON game_versions FOR SELECT
  USING (true);
-- Politique d'écriture pour service_role uniquement
CREATE POLICY "Allow service role full access to game_versions"
  ON game_versions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
