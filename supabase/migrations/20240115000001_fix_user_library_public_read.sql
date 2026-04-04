-- Migration: Fix User Library Public Read Access
-- Corrige les politiques RLS pour permettre la lecture publique des bibliothèques
-- tout en gardant les restrictions d'écriture

-- Supprimer l'ancienne politique de lecture restrictive
DROP POLICY IF EXISTS "Users can view own library" ON user_library;
-- Supprimer la politique publique si elle existe déjà (pour éviter les doublons)
DROP POLICY IF EXISTS "Public can view user libraries" ON user_library;
-- Créer une nouvelle politique qui permet:
-- 1. La lecture publique de toutes les bibliothèques (pour les pages joueurs)
-- 2. Tout le monde peut voir les bibliothèques
CREATE POLICY "Anyone can view user libraries" ON user_library 
  FOR SELECT USING (true);
-- Les politiques d'écriture restent inchangées (seul le propriétaire peut modifier);
