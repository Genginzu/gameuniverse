-- Migration 005: Table des magasins
-- Création de la table stores pour gérer les magasins en ligne

-- Table des magasins
CREATE TABLE public.stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  website_url TEXT,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Contraintes de validation
ALTER TABLE stores ADD CONSTRAINT stores_name_not_empty 
  CHECK (LENGTH(TRIM(name)) > 0);

ALTER TABLE stores ADD CONSTRAINT stores_website_url_format 
  CHECK (website_url IS NULL OR website_url ~ '^https?://');

-- Index pour les performances
CREATE INDEX idx_stores_name ON stores(name);
CREATE INDEX idx_stores_active ON stores(is_active);
CREATE INDEX idx_stores_name_active ON stores(name, is_active);

-- Trigger pour updated_at
CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON stores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Commentaires pour documentation
COMMENT ON TABLE stores IS 'Magasins en ligne où acheter des jeux (Steam, Epic Games Store, etc.)';
COMMENT ON COLUMN stores.name IS 'Nom unique du magasin';
COMMENT ON COLUMN stores.website_url IS 'URL du site web du magasin';
COMMENT ON COLUMN stores.logo_url IS 'URL du logo du magasin';
COMMENT ON COLUMN stores.is_active IS 'Indique si le magasin est actif';