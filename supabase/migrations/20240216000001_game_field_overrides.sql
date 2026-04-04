-- Migration: game_field_overrides
-- Objectif: Créer la table de suivi des modifications manuelles des champs de jeux
-- après import IGDB. Permet de protéger les champs modifiés manuellement lors
-- d'une synchronisation ou d'un nouvel import.

CREATE TABLE IF NOT EXISTS public.game_field_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  modified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  modified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(game_id, field_name)
);
-- Index pour accélérer les requêtes par jeu
CREATE INDEX IF NOT EXISTS idx_game_field_overrides_game_id
  ON game_field_overrides(game_id);
-- Activer Row Level Security
ALTER TABLE game_field_overrides ENABLE ROW LEVEL SECURITY;
-- Seuls les admins peuvent lire et modifier les overrides
CREATE POLICY "Admins can manage game field overrides"
  ON game_field_overrides FOR ALL USING (public.is_admin());
-- Documentation de la table et des colonnes
COMMENT ON TABLE game_field_overrides IS
  'Suivi des champs de jeux modifiés manuellement par un administrateur. '
  'Les champs présents dans cette table sont protégés lors d''un import/sync IGDB.';
COMMENT ON COLUMN game_field_overrides.id IS
  'Identifiant unique de l''override';
COMMENT ON COLUMN game_field_overrides.game_id IS
  'Référence vers le jeu concerné (CASCADE à la suppression)';
COMMENT ON COLUMN game_field_overrides.field_name IS
  'Catégorie de champ modifié manuellement (ex: translations, cover_image, genres)';
COMMENT ON COLUMN game_field_overrides.modified_by IS
  'Administrateur ayant effectué la dernière modification manuelle (SET NULL si supprimé)';
COMMENT ON COLUMN game_field_overrides.modified_at IS
  'Date et heure de la dernière modification manuelle';
