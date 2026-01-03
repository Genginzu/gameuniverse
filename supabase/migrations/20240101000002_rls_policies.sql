-- Migration 002: RLS et politiques de sécurité
-- Configuration de la sécurité Row Level Security

-- Activation RLS sur toutes les tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE genre_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE languages ENABLE ROW LEVEL SECURITY;

-- Politiques pour lecture publique des données de jeux
CREATE POLICY "Games are viewable by everyone" ON games 
  FOR SELECT USING (true);

CREATE POLICY "Game translations are viewable by everyone" ON game_translations 
  FOR SELECT USING (true);

CREATE POLICY "Genres are viewable by everyone" ON genres 
  FOR SELECT USING (true);

CREATE POLICY "Genre translations are viewable by everyone" ON genre_translations 
  FOR SELECT USING (true);

CREATE POLICY "Game genres are viewable by everyone" ON game_genres 
  FOR SELECT USING (true);

CREATE POLICY "Languages are viewable by everyone" ON languages 
  FOR SELECT USING (true);

-- Politiques pour les profils utilisateurs
CREATE POLICY "Users can view own profile" ON profiles 
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles 
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles 
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Fonction pour vérifier si un utilisateur est administrateur
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = user_id 
    AND email LIKE '%@admin.gamesuniverse.com'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Politiques pour administration (rôle admin requis)
CREATE POLICY "Admins can manage games" ON games 
  FOR ALL USING (public.is_admin());

CREATE POLICY "Admins can manage game translations" ON game_translations 
  FOR ALL USING (public.is_admin());

CREATE POLICY "Admins can manage genres" ON genres 
  FOR ALL USING (public.is_admin());

CREATE POLICY "Admins can manage genre translations" ON genre_translations 
  FOR ALL USING (public.is_admin());

CREATE POLICY "Admins can manage game genres" ON game_genres 
  FOR ALL USING (public.is_admin());

CREATE POLICY "Admins can manage languages" ON languages 
  FOR ALL USING (public.is_admin());

-- Politiques pour permettre l'insertion de données de test en développement
-- Ces politiques peuvent être supprimées en production
CREATE POLICY "Allow insert for development" ON games 
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow insert for development" ON game_translations 
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow insert for development" ON genres 
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow insert for development" ON genre_translations 
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow insert for development" ON game_genres 
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow insert for development" ON languages 
  FOR INSERT WITH CHECK (true);

-- Fonction pour nettoyer les données orphelines
CREATE OR REPLACE FUNCTION public.cleanup_orphaned_data()
RETURNS VOID AS $$
BEGIN
  -- Supprimer les traductions de jeux orphelines
  DELETE FROM game_translations 
  WHERE game_id NOT IN (SELECT id FROM games);
  
  -- Supprimer les traductions de genres orphelines
  DELETE FROM genre_translations 
  WHERE genre_id NOT IN (SELECT id FROM genres);
  
  -- Supprimer les associations jeux-genres orphelines
  DELETE FROM game_genres 
  WHERE game_id NOT IN (SELECT id FROM games)
     OR genre_id NOT IN (SELECT id FROM genres);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;