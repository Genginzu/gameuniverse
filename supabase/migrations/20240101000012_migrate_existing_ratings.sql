-- Migration 012: Suppression des anciennes colonnes de classification
-- Supprime les colonnes pegi_rating et esrb_rating de la table games

-- Supprimer les anciennes colonnes de classification
ALTER TABLE games DROP COLUMN IF EXISTS pegi_rating;
ALTER TABLE games DROP COLUMN IF EXISTS esrb_rating;
