-- Migration: Public Profiles RLS Policy
-- Permet la lecture publique des profils (sans email) pour les pages joueurs

-- Politique pour permettre la lecture publique des profils
-- Note: L'email ne sera pas exposé dans l'API publique, cette restriction
-- est gérée au niveau de l'application (service layer)
CREATE POLICY "Public profiles are viewable by everyone" ON profiles 
  FOR SELECT USING (true);
-- Politique pour permettre la lecture publique de la bibliothèque utilisateur
-- Nécessaire pour afficher la bibliothèque sur les pages de profil public
CREATE POLICY "Public can view user libraries" ON user_library 
  FOR SELECT USING (true);
-- Index pour améliorer les performances des requêtes de liste des joueurs
CREATE INDEX IF NOT EXISTS idx_profiles_full_name ON profiles(full_name);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at);
-- Fonction pour compter les jeux d'un utilisateur (utilisée pour le filtrage)
CREATE OR REPLACE FUNCTION get_user_games_count(user_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER 
    FROM user_library 
    WHERE user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
