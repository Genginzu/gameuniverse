-- Migration: Fix Profiles Public Read Access
-- Corrige les politiques RLS pour permettre la lecture publique des profils
-- tout en gardant les restrictions d'écriture

-- Supprimer l'ancienne politique de lecture restrictive qui bloque les requêtes anonymes
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
-- Supprimer la politique publique si elle existe déjà (pour éviter les doublons)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
-- Créer une nouvelle politique qui permet:
-- 1. La lecture publique de tous les profils (pour les pages joueurs)
-- 2. Tout le monde peut voir les profils (anon et authenticated)
CREATE POLICY "Anyone can view profiles" ON profiles 
  FOR SELECT USING (true);
-- Les politiques d'écriture restent inchangées (seul le propriétaire peut modifier)
-- "Users can update own profile" et "Users can insert own profile" sont conservées;
