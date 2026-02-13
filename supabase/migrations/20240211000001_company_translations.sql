-- Migration: Table de traductions pour les entreprises
-- Suit le même pattern que genre_translations

CREATE TABLE public.company_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  language_code VARCHAR(10) REFERENCES languages(code) ON DELETE CASCADE,
  description TEXT,
  UNIQUE(company_id, language_code)
);

-- Index pour les performances
CREATE INDEX idx_company_translations_company_id ON company_translations(company_id);
CREATE INDEX idx_company_translations_language_code ON company_translations(language_code);

-- RLS
ALTER TABLE company_translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company translations are viewable by everyone" ON company_translations
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage company translations" ON company_translations
  FOR ALL USING (public.is_admin());

CREATE POLICY "Allow insert company translations for development" ON company_translations
  FOR INSERT WITH CHECK (true);

-- Migrer les descriptions existantes vers la table de traductions (en français par défaut)
INSERT INTO company_translations (company_id, language_code, description)
SELECT id, 'fr', description
FROM companies
WHERE description IS NOT NULL AND description != '';
