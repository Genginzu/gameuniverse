-- Migration: Add storyline column to game_translations
-- Objectif: Stocker le champ storyline d'IGDB séparément de la description (summary).
-- Le storyline est le scénario/histoire détaillée du jeu, distinct du résumé court.

ALTER TABLE public.game_translations
  ADD COLUMN IF NOT EXISTS storyline TEXT;

COMMENT ON COLUMN public.game_translations.storyline IS
  'Scénario / histoire détaillée du jeu (champ storyline IGDB). Distinct de description qui stocke le résumé court (summary).';
