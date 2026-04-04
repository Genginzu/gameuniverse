-- Migration: Character Roles System
-- Crée une table dédiée pour les rôles de personnages avec traductions,
-- remplaçant le champ texte libre character_translations.role.

-- Table principale des rôles
CREATE TABLE IF NOT EXISTS public.character_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
COMMENT ON TABLE public.character_roles IS 'Rôles assignables aux personnages (protagoniste, antagoniste, etc.)';
COMMENT ON COLUMN public.character_roles.slug IS 'Identifiant unique du rôle (ex: protagonist, antagonist)';
-- Table des traductions de rôles
CREATE TABLE IF NOT EXISTS public.character_role_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID REFERENCES public.character_roles(id) ON DELETE CASCADE NOT NULL,
  language_code VARCHAR(2) REFERENCES public.languages(code) NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  UNIQUE(role_id, language_code)
);
COMMENT ON TABLE public.character_role_translations IS 'Traductions des noms de rôles';
-- Table de liaison personnages-rôles (many-to-many)
CREATE TABLE IF NOT EXISTS public.character_character_roles (
  character_id UUID REFERENCES public.characters(id) ON DELETE CASCADE NOT NULL,
  role_id UUID REFERENCES public.character_roles(id) ON DELETE CASCADE NOT NULL,
  PRIMARY KEY (character_id, role_id)
);
COMMENT ON TABLE public.character_character_roles IS 'Association many-to-many entre personnages et rôles';
-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_character_role_translations_role_id
  ON public.character_role_translations(role_id);
CREATE INDEX IF NOT EXISTS idx_character_role_translations_language_code
  ON public.character_role_translations(language_code);
CREATE INDEX IF NOT EXISTS idx_character_character_roles_character_id
  ON public.character_character_roles(character_id);
CREATE INDEX IF NOT EXISTS idx_character_character_roles_role_id
  ON public.character_character_roles(role_id);
-- RLS policies
ALTER TABLE public.character_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.character_role_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.character_character_roles ENABLE ROW LEVEL SECURITY;
-- Lecture publique
CREATE POLICY "character_roles_public_read" ON public.character_roles
  FOR SELECT USING (true);
CREATE POLICY "character_role_translations_public_read" ON public.character_role_translations
  FOR SELECT USING (true);
CREATE POLICY "character_character_roles_public_read" ON public.character_character_roles
  FOR SELECT USING (true);
-- Écriture admin uniquement
CREATE POLICY "character_roles_admin_all" ON public.character_roles
  FOR ALL USING (
    (SELECT (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean) = true
  );
CREATE POLICY "character_role_translations_admin_all" ON public.character_role_translations
  FOR ALL USING (
    (SELECT (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean) = true
  );
CREATE POLICY "character_character_roles_admin_all" ON public.character_character_roles
  FOR ALL USING (
    (SELECT (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean) = true
  );
-- Seed des rôles par défaut
INSERT INTO public.character_roles (slug) VALUES
  ('protagonist'),
  ('antagonist'),
  ('supporting'),
  ('npc'),
  ('playable')
ON CONFLICT (slug) DO NOTHING;
-- Seed des traductions FR/EN
INSERT INTO public.character_role_translations (role_id, language_code, name)
SELECT cr.id, 'fr', t.name_fr
FROM public.character_roles cr
JOIN (VALUES
  ('protagonist', 'Protagoniste'),
  ('antagonist', 'Antagoniste'),
  ('supporting', 'Secondaire'),
  ('npc', 'PNJ'),
  ('playable', 'Jouable')
) AS t(slug, name_fr) ON cr.slug = t.slug
ON CONFLICT (role_id, language_code) DO NOTHING;
INSERT INTO public.character_role_translations (role_id, language_code, name)
SELECT cr.id, 'en', t.name_en
FROM public.character_roles cr
JOIN (VALUES
  ('protagonist', 'Protagonist'),
  ('antagonist', 'Antagonist'),
  ('supporting', 'Supporting'),
  ('npc', 'NPC'),
  ('playable', 'Playable')
) AS t(slug, name_en) ON cr.slug = t.slug
ON CONFLICT (role_id, language_code) DO NOTHING;
