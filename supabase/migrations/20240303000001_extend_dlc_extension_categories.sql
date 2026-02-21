-- Migration: extend_dlc_extension_categories
-- Objectif: Élargir la contrainte CHECK sur la colonne category de game_dlc_extensions
-- pour supporter tous les game_type IGDB (sauf main_game et standalone_expansion).
-- Nouveaux types : mod, episode, season, remake, remaster, expanded_game, port, fork, pack, update.

-- =============================================================================
-- 1. Supprimer l'ancienne contrainte CHECK
-- =============================================================================
ALTER TABLE public.game_dlc_extensions
  DROP CONSTRAINT IF EXISTS game_dlc_extensions_category_check;

-- =============================================================================
-- 2. Ajouter la nouvelle contrainte avec toutes les catégories
-- =============================================================================
ALTER TABLE public.game_dlc_extensions
  ADD CONSTRAINT game_dlc_extensions_category_check
  CHECK (category IN (
    'dlc', 'expansion', 'bundle',
    'mod', 'episode', 'season',
    'remake', 'remaster', 'expanded_game',
    'port', 'fork', 'pack', 'update'
  ));

-- =============================================================================
-- 3. Mise à jour de la documentation
-- =============================================================================
COMMENT ON COLUMN public.game_dlc_extensions.category IS
  'Type de contenu IGDB : dlc, expansion, bundle, mod, episode, season, remake, remaster, expanded_game, port, fork, pack, update.';
