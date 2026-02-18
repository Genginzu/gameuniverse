-- Migration: Character Favorites System
-- Table de favoris de personnages permettant aux utilisateurs de marquer
-- des personnages comme favoris, avec compteur public et politiques RLS.

-- Table character_favorites
CREATE TABLE IF NOT EXISTS public.character_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  character_id UUID REFERENCES characters(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, character_id)
);

COMMENT ON TABLE public.character_favorites IS 'Favoris de personnages des utilisateurs';
COMMENT ON COLUMN public.character_favorites.user_id IS 'Référence vers l''utilisateur propriétaire du favori';
COMMENT ON COLUMN public.character_favorites.character_id IS 'Référence vers le personnage mis en favori';
COMMENT ON COLUMN public.character_favorites.created_at IS 'Date d''ajout du favori';

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_character_favorites_user_id ON character_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_character_favorites_character_id ON character_favorites(character_id);
CREATE INDEX IF NOT EXISTS idx_character_favorites_created_at ON character_favorites(created_at);

-- RLS pour la sécurité
ALTER TABLE character_favorites ENABLE ROW LEVEL SECURITY;

-- Lecture publique (pour le compteur et les profils joueurs)
CREATE POLICY "Anyone can view character favorites" ON character_favorites
  FOR SELECT USING (true);

-- Insertion limitée au propriétaire
CREATE POLICY "Users can insert own character favorites" ON character_favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Suppression limitée au propriétaire
CREATE POLICY "Users can delete own character favorites" ON character_favorites
  FOR DELETE USING (auth.uid() = user_id);

-- Fonction : compteur de favoris pour un personnage
CREATE OR REPLACE FUNCTION get_character_favorite_count(character_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM character_favorites
    WHERE character_id = character_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_character_favorite_count(UUID) IS 'Retourne le nombre total de favoris pour un personnage donné';

-- Fonction : vérifier si un personnage est en favori pour un utilisateur
CREATE OR REPLACE FUNCTION is_character_favorited(user_uuid UUID, character_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM character_favorites
    WHERE user_id = user_uuid AND character_id = character_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION is_character_favorited(UUID, UUID) IS 'Vérifie si un personnage est dans les favoris d''un utilisateur';
