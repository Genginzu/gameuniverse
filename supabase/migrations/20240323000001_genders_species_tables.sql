-- Migration: Genders & Species tables
-- Objectif: Créer les tables genders, gender_translations, species, species_translations
-- et ajouter les colonnes gender_id et species_id à la table characters.
-- Ces entités permettent de catégoriser les personnages par genre et espèce,
-- avec support multilingue via les tables de traductions.

-- ============================================================================
-- Table: genders
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.genders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  igdb_id INTEGER UNIQUE,
  slug VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
COMMENT ON TABLE public.genders IS 'Table des genres de personnages (ex: Male, Female, Other)';
COMMENT ON COLUMN public.genders.igdb_id IS 'Identifiant IGDB du genre pour la synchronisation et déduplication';
COMMENT ON COLUMN public.genders.slug IS 'Slug unique du genre utilisé dans les URLs et comme identifiant lisible';
-- ============================================================================
-- Table: gender_translations
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.gender_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gender_id UUID NOT NULL REFERENCES public.genders(id) ON DELETE CASCADE,
  language_code VARCHAR(2) NOT NULL REFERENCES public.languages(code),
  name VARCHAR(255) NOT NULL,
  UNIQUE(gender_id, language_code)
);
COMMENT ON TABLE public.gender_translations IS 'Traductions des genres de personnages (nom localisé par langue)';
COMMENT ON COLUMN public.gender_translations.gender_id IS 'Référence vers le genre parent (CASCADE à la suppression)';
COMMENT ON COLUMN public.gender_translations.language_code IS 'Code langue ISO 639-1 (ex: fr, en)';
COMMENT ON COLUMN public.gender_translations.name IS 'Nom traduit du genre';
-- ============================================================================
-- Table: species
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.species (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  igdb_id INTEGER UNIQUE,
  slug VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
COMMENT ON TABLE public.species IS 'Table des espèces de personnages (ex: Human, Alien, Robot)';
COMMENT ON COLUMN public.species.igdb_id IS 'Identifiant IGDB de l''espèce pour la synchronisation et déduplication';
COMMENT ON COLUMN public.species.slug IS 'Slug unique de l''espèce utilisé dans les URLs et comme identifiant lisible';
-- ============================================================================
-- Table: species_translations
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.species_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  species_id UUID NOT NULL REFERENCES public.species(id) ON DELETE CASCADE,
  language_code VARCHAR(2) NOT NULL REFERENCES public.languages(code),
  name VARCHAR(255) NOT NULL,
  UNIQUE(species_id, language_code)
);
COMMENT ON TABLE public.species_translations IS 'Traductions des espèces de personnages (nom localisé par langue)';
COMMENT ON COLUMN public.species_translations.species_id IS 'Référence vers l''espèce parente (CASCADE à la suppression)';
COMMENT ON COLUMN public.species_translations.language_code IS 'Code langue ISO 639-1 (ex: fr, en)';
COMMENT ON COLUMN public.species_translations.name IS 'Nom traduit de l''espèce';
-- ============================================================================
-- Modifications à la table characters: ajout gender_id et species_id
-- ============================================================================

ALTER TABLE public.characters
  ADD COLUMN IF NOT EXISTS gender_id UUID REFERENCES public.genders(id) ON DELETE SET NULL;
ALTER TABLE public.characters
  ADD COLUMN IF NOT EXISTS species_id UUID REFERENCES public.species(id) ON DELETE SET NULL;
COMMENT ON COLUMN public.characters.gender_id IS 'Genre du personnage (nullable, SET NULL à la suppression du genre)';
COMMENT ON COLUMN public.characters.species_id IS 'Espèce du personnage (nullable, SET NULL à la suppression de l''espèce)';
-- ============================================================================
-- Index
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_genders_slug ON public.genders(slug);
CREATE INDEX IF NOT EXISTS idx_gender_translations_gender_id ON public.gender_translations(gender_id);
CREATE INDEX IF NOT EXISTS idx_gender_translations_language ON public.gender_translations(language_code);
CREATE INDEX IF NOT EXISTS idx_species_slug ON public.species(slug);
CREATE INDEX IF NOT EXISTS idx_species_translations_species_id ON public.species_translations(species_id);
CREATE INDEX IF NOT EXISTS idx_species_translations_language ON public.species_translations(language_code);
CREATE INDEX IF NOT EXISTS idx_characters_gender_id ON public.characters(gender_id);
CREATE INDEX IF NOT EXISTS idx_characters_species_id ON public.characters(species_id);
-- ============================================================================
-- Triggers updated_at
-- ============================================================================

CREATE TRIGGER update_genders_updated_at BEFORE UPDATE ON public.genders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_species_updated_at BEFORE UPDATE ON public.species
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================

ALTER TABLE public.genders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gender_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.species ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.species_translations ENABLE ROW LEVEL SECURITY;
-- Lecture publique
CREATE POLICY "Genders are viewable by everyone" ON public.genders
  FOR SELECT USING (true);
CREATE POLICY "Gender translations are viewable by everyone" ON public.gender_translations
  FOR SELECT USING (true);
CREATE POLICY "Species are viewable by everyone" ON public.species
  FOR SELECT USING (true);
CREATE POLICY "Species translations are viewable by everyone" ON public.species_translations
  FOR SELECT USING (true);
-- Administration
CREATE POLICY "Admins can manage genders" ON public.genders
  FOR ALL USING (public.is_admin());
CREATE POLICY "Admins can manage gender translations" ON public.gender_translations
  FOR ALL USING (public.is_admin());
CREATE POLICY "Admins can manage species" ON public.species
  FOR ALL USING (public.is_admin());
CREATE POLICY "Admins can manage species translations" ON public.species_translations
  FOR ALL USING (public.is_admin());
