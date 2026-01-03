-- Migration 006: Table des prix de jeux
-- Création de la table game_prices pour gérer les prix sur différents magasins

-- Table des prix de jeux
CREATE TABLE public.game_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE NOT NULL,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
  
  -- Informations de prix
  price DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
  
  -- Informations de plateforme et disponibilité
  platform VARCHAR(50) NOT NULL,
  store_url TEXT,
  is_available BOOLEAN DEFAULT TRUE,
  
  -- Métadonnées
  last_updated TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Contraintes de validation
ALTER TABLE game_prices ADD CONSTRAINT game_prices_price_positive 
  CHECK (price >= 0);

ALTER TABLE game_prices ADD CONSTRAINT game_prices_currency_format 
  CHECK (LENGTH(currency) = 3 AND currency = UPPER(currency));

ALTER TABLE game_prices ADD CONSTRAINT game_prices_platform_not_empty 
  CHECK (LENGTH(TRIM(platform)) > 0);

ALTER TABLE game_prices ADD CONSTRAINT game_prices_store_url_format 
  CHECK (store_url IS NULL OR store_url ~ '^https?://');

-- Contrainte d'unicité : un seul prix par jeu/magasin/plateforme
ALTER TABLE game_prices ADD CONSTRAINT game_prices_unique_combination 
  UNIQUE(game_id, store_id, platform);

-- Index pour les performances
CREATE INDEX idx_game_prices_game_id ON game_prices(game_id);
CREATE INDEX idx_game_prices_store_id ON game_prices(store_id);
CREATE INDEX idx_game_prices_platform ON game_prices(platform);
CREATE INDEX idx_game_prices_available ON game_prices(is_available);
CREATE INDEX idx_game_prices_price ON game_prices(price);
CREATE INDEX idx_game_prices_last_updated ON game_prices(last_updated);

-- Index composites pour les requêtes courantes
CREATE INDEX idx_game_prices_game_available ON game_prices(game_id, is_available);
CREATE INDEX idx_game_prices_game_platform ON game_prices(game_id, platform);
CREATE INDEX idx_game_prices_game_store_platform ON game_prices(game_id, store_id, platform);

-- Trigger pour updated_at
CREATE TRIGGER update_game_prices_updated_at BEFORE UPDATE ON game_prices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour mettre à jour last_updated lors des modifications de prix
CREATE OR REPLACE FUNCTION update_price_last_updated()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.price IS DISTINCT FROM NEW.price OR 
       OLD.is_available IS DISTINCT FROM NEW.is_available THEN
        NEW.last_updated = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_game_prices_last_updated BEFORE UPDATE ON game_prices
    FOR EACH ROW EXECUTE FUNCTION update_price_last_updated();

-- Commentaires pour documentation
COMMENT ON TABLE game_prices IS 'Prix des jeux sur différents magasins et plateformes';
COMMENT ON COLUMN game_prices.game_id IS 'Référence vers le jeu';
COMMENT ON COLUMN game_prices.store_id IS 'Référence vers le magasin';
COMMENT ON COLUMN game_prices.price IS 'Prix du jeu (doit être positif)';
COMMENT ON COLUMN game_prices.currency IS 'Code devise ISO 4217 (3 lettres majuscules)';
COMMENT ON COLUMN game_prices.platform IS 'Plateforme de jeu (PC, PlayStation, Xbox, etc.)';
COMMENT ON COLUMN game_prices.store_url IS 'URL directe vers la page du jeu sur ce magasin';
COMMENT ON COLUMN game_prices.is_available IS 'Indique si le jeu est disponible à l''achat';
COMMENT ON COLUMN game_prices.last_updated IS 'Dernière mise à jour du prix ou de la disponibilité';