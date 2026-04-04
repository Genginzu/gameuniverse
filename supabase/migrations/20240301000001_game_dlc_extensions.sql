-- Migration: game_dlc_extensions
-- Objectif: Créer la table game_dlc_extensions pour stocker les DLC, expansions
-- et bundles associés à un jeu principal, importés depuis l'API IGDB.

-- =============================================================================
-- 1. Création de la table
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.game_dlc_extensions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  igdb_id INTEGER NOT NULL,
  name VARCHAR(500) NOT NULL,
  slug VARCHAR(500),
  summary TEXT,
  category VARCHAR(50) NOT NULL CHECK (category IN ('dlc', 'expansion', 'bundle')),
  cover_image_url TEXT,
  release_date DATE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT uq_game_dlc_extensions_game_igdb UNIQUE (game_id, igdb_id)
);
-- =============================================================================
-- 2. Index
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_game_dlc_extensions_game_id
  ON public.game_dlc_extensions (game_id);
CREATE INDEX IF NOT EXISTS idx_game_dlc_extensions_igdb_id
  ON public.game_dlc_extensions (igdb_id);
-- =============================================================================
-- 3. Row Level Security
-- =============================================================================
ALTER TABLE public.game_dlc_extensions ENABLE ROW LEVEL SECURITY;
-- Lecture publique pour tous les utilisateurs (authentifiés ou anonymes)
CREATE POLICY "game_dlc_extensions_select_public"
  ON public.game_dlc_extensions
  FOR SELECT
  USING (true);
-- Écriture complète réservée au service_role (via INSERT)
CREATE POLICY "game_dlc_extensions_insert_service_role"
  ON public.game_dlc_extensions
  FOR INSERT
  TO service_role
  WITH CHECK (true);
-- Mise à jour réservée au service_role
CREATE POLICY "game_dlc_extensions_update_service_role"
  ON public.game_dlc_extensions
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);
-- Suppression réservée au service_role
CREATE POLICY "game_dlc_extensions_delete_service_role"
  ON public.game_dlc_extensions
  FOR DELETE
  TO service_role
  USING (true);
-- =============================================================================
-- 4. Documentation
-- =============================================================================
COMMENT ON TABLE public.game_dlc_extensions IS
  'Contenus additionnels (DLC, expansions, bundles) associés à un jeu principal, importés depuis IGDB.';
COMMENT ON COLUMN public.game_dlc_extensions.id IS
  'Identifiant unique UUID généré automatiquement.';
COMMENT ON COLUMN public.game_dlc_extensions.game_id IS
  'Référence au jeu principal dans la table games.';
COMMENT ON COLUMN public.game_dlc_extensions.igdb_id IS
  'Identifiant du contenu additionnel dans la base IGDB.';
COMMENT ON COLUMN public.game_dlc_extensions.name IS
  'Nom du contenu additionnel.';
COMMENT ON COLUMN public.game_dlc_extensions.slug IS
  'Slug URL-friendly du contenu additionnel.';
COMMENT ON COLUMN public.game_dlc_extensions.summary IS
  'Résumé ou description du contenu additionnel.';
COMMENT ON COLUMN public.game_dlc_extensions.category IS
  'Type de contenu : dlc, expansion ou bundle.';
COMMENT ON COLUMN public.game_dlc_extensions.cover_image_url IS
  'URL de l''image de couverture (provenant d''IGDB).';
COMMENT ON COLUMN public.game_dlc_extensions.release_date IS
  'Date de sortie du contenu additionnel.';
COMMENT ON COLUMN public.game_dlc_extensions.display_order IS
  'Ordre d''affichage au sein de sa catégorie (défaut : 0).';
COMMENT ON COLUMN public.game_dlc_extensions.created_at IS
  'Date de création de l''enregistrement.';
