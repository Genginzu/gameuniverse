-- Migration 009: Nettoyage de l'ancien schéma de prix
-- Suppression des colonnes de prix obsolètes de la table games

-- Supprimer les anciennes colonnes de prix
ALTER TABLE games DROP COLUMN IF EXISTS launch_price;
ALTER TABLE games DROP COLUMN IF EXISTS current_price;
ALTER TABLE games DROP COLUMN IF EXISTS currency;

-- Commentaire sur la migration
COMMENT ON TABLE games IS 'Table games nettoyée - les prix sont maintenant gérés dans la table game_prices';