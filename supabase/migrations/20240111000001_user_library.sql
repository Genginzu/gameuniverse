-- Migration: User Library System
-- Création de la table pour gérer la bibliothèque personnelle des utilisateurs

-- Table de liaison utilisateur-jeux (bibliothèque personnelle)
CREATE TABLE public.user_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  game_id UUID REFERENCES games(id) ON DELETE CASCADE NOT NULL,
  added_at TIMESTAMP DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'owned', -- owned, wishlist, completed, playing
  play_time_hours INTEGER DEFAULT 0,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  notes TEXT,
  UNIQUE(user_id, game_id)
);
-- Index pour les performances
CREATE INDEX idx_user_library_user_id ON user_library(user_id);
CREATE INDEX idx_user_library_game_id ON user_library(game_id);
CREATE INDEX idx_user_library_status ON user_library(status);
CREATE INDEX idx_user_library_added_at ON user_library(added_at);
-- RLS pour la sécurité
ALTER TABLE user_library ENABLE ROW LEVEL SECURITY;
-- Politiques RLS pour user_library
CREATE POLICY "Users can view own library" ON user_library 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert into own library" ON user_library 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own library" ON user_library 
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete from own library" ON user_library 
  FOR DELETE USING (auth.uid() = user_id);
-- Fonction pour obtenir les statistiques de la bibliothèque utilisateur
CREATE OR REPLACE FUNCTION get_user_library_stats(user_uuid UUID)
RETURNS TABLE (
  total_games INTEGER,
  owned_games INTEGER,
  completed_games INTEGER,
  total_play_time INTEGER,
  average_rating DECIMAL(3,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_games,
    COUNT(*) FILTER (WHERE status = 'owned')::INTEGER as owned_games,
    COUNT(*) FILTER (WHERE status = 'completed')::INTEGER as completed_games,
    COALESCE(SUM(play_time_hours), 0)::INTEGER as total_play_time,
    ROUND(AVG(rating), 2) as average_rating
  FROM user_library 
  WHERE user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Fonction pour vérifier si un jeu est dans la bibliothèque d'un utilisateur
CREATE OR REPLACE FUNCTION is_game_in_user_library(user_uuid UUID, game_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_library 
    WHERE user_id = user_uuid AND game_id = game_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
