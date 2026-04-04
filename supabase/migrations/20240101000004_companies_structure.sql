-- Migration 004: Structure des entreprises (developers/publishers)
-- Création d'une table companies avec relations many-to-many

-- Table des entreprises (développeurs et éditeurs)
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) UNIQUE NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  website_url TEXT,
  logo_url TEXT,
  founded_year INTEGER,
  headquarters VARCHAR(255),
  company_type VARCHAR(50) DEFAULT 'both', -- developer, publisher, both
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
-- Table de liaison jeux-entreprises avec rôles
CREATE TABLE public.game_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE NOT NULL,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  role VARCHAR(50) NOT NULL, -- developer, publisher, co-developer, co-publisher
  is_primary BOOLEAN DEFAULT FALSE, -- entreprise principale pour ce rôle
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(game_id, company_id, role)
);
-- Index pour les performances
CREATE INDEX idx_companies_slug ON companies(slug);
CREATE INDEX idx_companies_name ON companies(name);
CREATE INDEX idx_companies_type ON companies(company_type);
CREATE INDEX idx_companies_active ON companies(is_active) WHERE is_active = true;
CREATE INDEX idx_game_companies_game_id ON game_companies(game_id);
CREATE INDEX idx_game_companies_company_id ON game_companies(company_id);
CREATE INDEX idx_game_companies_role ON game_companies(role);
CREATE INDEX idx_game_companies_primary ON game_companies(game_id, role, is_primary) WHERE is_primary = true;
-- Trigger pour updated_at
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- Migrer les données existantes vers la nouvelle structure
-- Créer les entreprises à partir des développeurs existants
INSERT INTO companies (name, slug, company_type)
SELECT DISTINCT 
    developer,
    LOWER(REPLACE(REPLACE(REPLACE(developer, ' ', '-'), '.', ''), '&', 'and')),
    'developer'
FROM games 
WHERE developer IS NOT NULL
ON CONFLICT (name) DO NOTHING;
-- Créer les entreprises à partir des éditeurs existants
INSERT INTO companies (name, slug, company_type)
SELECT DISTINCT 
    publisher,
    LOWER(REPLACE(REPLACE(REPLACE(publisher, ' ', '-'), '.', ''), '&', 'and')),
    'publisher'
FROM games 
WHERE publisher IS NOT NULL
ON CONFLICT (name) DO UPDATE SET company_type = 'both' WHERE companies.company_type != 'both';
-- Créer les relations développeur
INSERT INTO game_companies (game_id, company_id, role, is_primary)
SELECT 
    g.id,
    c.id,
    'developer',
    true
FROM games g
JOIN companies c ON c.name = g.developer
WHERE g.developer IS NOT NULL
ON CONFLICT (game_id, company_id, role) DO NOTHING;
-- Créer les relations éditeur
INSERT INTO game_companies (game_id, company_id, role, is_primary)
SELECT 
    g.id,
    c.id,
    'publisher',
    true
FROM games g
JOIN companies c ON c.name = g.publisher
WHERE g.publisher IS NOT NULL
ON CONFLICT (game_id, company_id, role) DO NOTHING;
-- Supprimer les anciennes colonnes developer et publisher
ALTER TABLE games DROP COLUMN IF EXISTS developer;
ALTER TABLE games DROP COLUMN IF EXISTS publisher;
-- RLS pour les nouvelles tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_companies ENABLE ROW LEVEL SECURITY;
-- Politiques pour lecture publique
CREATE POLICY "Companies are viewable by everyone" ON companies 
  FOR SELECT USING (true);
CREATE POLICY "Game companies relations are viewable by everyone" ON game_companies 
  FOR SELECT USING (true);
-- Politiques pour administration
CREATE POLICY "Admins can manage companies" ON companies 
  FOR ALL USING (public.is_admin());
CREATE POLICY "Admins can manage game companies" ON game_companies 
  FOR ALL USING (public.is_admin());
-- Politiques pour développement (à supprimer en production)
CREATE POLICY "Allow insert companies for development" ON companies 
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow insert game companies for development" ON game_companies 
  FOR INSERT WITH CHECK (true);
-- Fonction utilitaire pour récupérer les entreprises d'un jeu par rôle
CREATE OR REPLACE FUNCTION get_game_companies(game_uuid UUID, company_role TEXT DEFAULT NULL)
RETURNS TABLE (
    company_id UUID,
    company_name VARCHAR(255),
    company_slug VARCHAR(255),
    role VARCHAR(50),
    is_primary BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.name,
        c.slug,
        gc.role,
        gc.is_primary
    FROM companies c
    JOIN game_companies gc ON c.id = gc.company_id
    WHERE gc.game_id = game_uuid
    AND (company_role IS NULL OR gc.role = company_role)
    ORDER BY gc.is_primary DESC, c.name;
END;
$$ LANGUAGE plpgsql;
