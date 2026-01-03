-- Migration 013: Politiques RLS pour le système de classification
-- Configuration de la sécurité Row Level Security pour les tables de ratings

-- Activation RLS sur toutes les nouvelles tables de classification
ALTER TABLE rating_systems ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_descriptors ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_descriptor_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_rating_descriptors ENABLE ROW LEVEL SECURITY;

-- Politiques pour lecture publique des données de classification
-- Les systèmes de classification sont publics (PEGI, ESRB, etc.)
CREATE POLICY "Rating systems are viewable by everyone" ON rating_systems 
  FOR SELECT USING (true);

-- Les classifications sont publiques (PEGI 12, ESRB T, etc.)
CREATE POLICY "Ratings are viewable by everyone" ON ratings 
  FOR SELECT USING (true);

-- Les descripteurs de contenu sont publics (Violence, Langage, etc.)
CREATE POLICY "Content descriptors are viewable by everyone" ON content_descriptors 
  FOR SELECT USING (true);

-- Les traductions des descripteurs sont publiques
CREATE POLICY "Content descriptor translations are viewable by everyone" ON content_descriptor_translations 
  FOR SELECT USING (true);

-- Les classifications des jeux sont publiques
CREATE POLICY "Game ratings are viewable by everyone" ON game_ratings 
  FOR SELECT USING (true);

-- Les descripteurs associés aux jeux sont publics
CREATE POLICY "Game rating descriptors are viewable by everyone" ON game_rating_descriptors 
  FOR SELECT USING (true);

-- Politiques pour administration (rôle admin requis)
-- Seuls les admins peuvent modifier les systèmes de classification
CREATE POLICY "Admins can manage rating systems" ON rating_systems 
  FOR ALL USING (public.is_admin());

CREATE POLICY "Admins can manage ratings" ON ratings 
  FOR ALL USING (public.is_admin());

CREATE POLICY "Admins can manage content descriptors" ON content_descriptors 
  FOR ALL USING (public.is_admin());

CREATE POLICY "Admins can manage content descriptor translations" ON content_descriptor_translations 
  FOR ALL USING (public.is_admin());

CREATE POLICY "Admins can manage game ratings" ON game_ratings 
  FOR ALL USING (public.is_admin());

CREATE POLICY "Admins can manage game rating descriptors" ON game_rating_descriptors 
  FOR ALL USING (public.is_admin());

-- Politiques pour permettre l'insertion de données de test en développement
-- Ces politiques peuvent être supprimées en production
CREATE POLICY "Allow insert for development" ON rating_systems 
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow insert for development" ON ratings 
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow insert for development" ON content_descriptors 
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow insert for development" ON content_descriptor_translations 
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow insert for development" ON game_ratings 
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow insert for development" ON game_rating_descriptors 
  FOR INSERT WITH CHECK (true);

-- Fonction pour nettoyer les données orphelines du système de classification
CREATE OR REPLACE FUNCTION public.cleanup_orphaned_rating_data()
RETURNS VOID AS $$
BEGIN
  -- Supprimer les descripteurs de classifications de jeux orphelins
  DELETE FROM game_rating_descriptors 
  WHERE game_rating_id NOT IN (SELECT id FROM game_ratings)
     OR content_descriptor_id NOT IN (SELECT id FROM content_descriptors);
  
  -- Supprimer les classifications de jeux orphelines
  DELETE FROM game_ratings 
  WHERE game_id NOT IN (SELECT id FROM games)
     OR rating_id NOT IN (SELECT id FROM ratings);
  
  -- Supprimer les traductions de descripteurs orphelines
  DELETE FROM content_descriptor_translations 
  WHERE content_descriptor_id NOT IN (SELECT id FROM content_descriptors);
  
  -- Supprimer les descripteurs de contenu orphelins
  DELETE FROM content_descriptors 
  WHERE rating_system_id NOT IN (SELECT id FROM rating_systems);
  
  -- Supprimer les classifications orphelines
  DELETE FROM ratings 
  WHERE rating_system_id NOT IN (SELECT id FROM rating_systems);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mettre à jour la fonction de nettoyage principale pour inclure les ratings
CREATE OR REPLACE FUNCTION public.cleanup_orphaned_data()
RETURNS VOID AS $$
BEGIN
  -- Nettoyer les données de classification
  PERFORM public.cleanup_orphaned_rating_data();
  
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