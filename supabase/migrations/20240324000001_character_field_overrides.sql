-- Migration: character_field_overrides
-- Objectif: Créer la table de suivi des modifications manuelles des champs de personnages
-- après import IGDB. Permet de protéger les champs modifiés manuellement lors
-- d'une synchronisation ou d'un nouvel import.

CREATE TABLE IF NOT EXISTS public.character_field_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  overridden_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  overridden_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(character_id, field_name)
);
-- Index pour accélérer les requêtes par personnage
CREATE INDEX IF NOT EXISTS idx_character_field_overrides_character_id
  ON character_field_overrides(character_id);
-- Activer Row Level Security
ALTER TABLE character_field_overrides ENABLE ROW LEVEL SECURITY;
-- Seuls les admins peuvent lire et modifier les overrides
CREATE POLICY "Admins can manage character field overrides"
  ON character_field_overrides FOR ALL USING (public.is_admin());
-- Documentation de la table et des colonnes
COMMENT ON TABLE character_field_overrides IS
  'Suivi des champs de personnages modifiés manuellement par un administrateur. '
  'Les champs présents dans cette table sont protégés lors d''un import/sync IGDB.';
COMMENT ON COLUMN character_field_overrides.id IS
  'Identifiant unique de l''override';
COMMENT ON COLUMN character_field_overrides.character_id IS
  'Référence vers le personnage concerné (CASCADE à la suppression)';
COMMENT ON COLUMN character_field_overrides.field_name IS
  'Catégorie de champ modifié manuellement (ex: translations, main_image, gender, species)';
COMMENT ON COLUMN character_field_overrides.overridden_by IS
  'Administrateur ayant effectué la dernière modification manuelle (SET NULL si supprimé)';
COMMENT ON COLUMN character_field_overrides.overridden_at IS
  'Date et heure de la dernière modification manuelle';
