-- Migration: Ajout des traductions pour les notes de classification
-- Crée la table rating_translations pour stocker les descriptions traduites
-- des notes (ratings), suivant le même patron que content_descriptor_translations.

CREATE TABLE IF NOT EXISTS public.rating_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rating_id UUID NOT NULL REFERENCES public.ratings(id) ON DELETE CASCADE,
  language_code VARCHAR(2) NOT NULL REFERENCES public.languages(code),
  description TEXT NOT NULL,
  UNIQUE(rating_id, language_code)
);
CREATE INDEX IF NOT EXISTS idx_rating_translations_rating_id
  ON public.rating_translations(rating_id);
-- Documentation
COMMENT ON TABLE public.rating_translations
  IS 'Traductions multilingues des descriptions de notes de classification (ratings).';
COMMENT ON COLUMN public.rating_translations.id
  IS 'Identifiant unique de la traduction (UUID auto-généré).';
COMMENT ON COLUMN public.rating_translations.rating_id
  IS 'Référence vers la note (ratings.id). Suppression en cascade.';
COMMENT ON COLUMN public.rating_translations.language_code
  IS 'Code langue ISO 639-1 (2 caractères), référence vers languages.code.';
COMMENT ON COLUMN public.rating_translations.description
  IS 'Description traduite de la note dans la langue indiquée.';
-- RLS : même politique que content_descriptor_translations
ALTER TABLE public.rating_translations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Rating translations are viewable by everyone"
  ON public.rating_translations FOR SELECT USING (true);
CREATE POLICY "Admins can manage rating translations"
  ON public.rating_translations FOR ALL USING (public.is_admin());
-- Politique de développement (cohérent avec les autres tables)
CREATE POLICY "Allow insert for development" ON public.rating_translations
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update for development" ON public.rating_translations
  FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow delete for development" ON public.rating_translations
  FOR DELETE USING (true);
