-- Migration: game_similar_games
-- Objectif: Créer la table game_similar_games pour stocker les jeux similaires
-- associés à un jeu, importés depuis le champ similar_games de l'API IGDB.
-- Cela évite d'appeler l'API IGDB à chaque affichage d'une fiche de jeu.

-- =============================================================================
-- 1. Création de la table
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.game_similar_games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  similar_igdb_id INTEGER NOT NULL,
  similar_game_id UUID REFERENCES public.games(id) ON DELETE SET NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT uq_game_similar_games_game_igdb UNIQUE (game_id, similar_igdb_id)
);
-- =============================================================================
-- 2. Index
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_game_similar_games_game_id
  ON public.game_similar_games (game_id);
CREATE INDEX IF NOT EXISTS idx_game_similar_games_similar_igdb_id
  ON public.game_similar_games (similar_igdb_id);
CREATE INDEX IF NOT EXISTS idx_game_similar_games_similar_game_id
  ON public.game_similar_games (similar_game_id)
  WHERE similar_game_id IS NOT NULL;
-- =============================================================================
-- 3. Row Level Security
-- =============================================================================
ALTER TABLE public.game_similar_games ENABLE ROW LEVEL SECURITY;
CREATE POLICY "game_similar_games_select_public"
  ON public.game_similar_games
  FOR SELECT
  USING (true);
CREATE POLICY "game_similar_games_insert_service_role"
  ON public.game_similar_games
  FOR INSERT
  TO service_role
  WITH CHECK (true);
CREATE POLICY "game_similar_games_update_service_role"
  ON public.game_similar_games
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);
CREATE POLICY "game_similar_games_delete_service_role"
  ON public.game_similar_games
  FOR DELETE
  TO service_role
  USING (true);
-- =============================================================================
-- 4. Documentation
-- =============================================================================
COMMENT ON TABLE public.game_similar_games IS
  'Jeux similaires associés à un jeu, importés depuis le champ similar_games de l''API IGDB.';
COMMENT ON COLUMN public.game_similar_games.id IS
  'Identifiant unique UUID généré automatiquement.';
COMMENT ON COLUMN public.game_similar_games.game_id IS
  'Référence au jeu source dans la table games.';
COMMENT ON COLUMN public.game_similar_games.similar_igdb_id IS
  'Identifiant IGDB du jeu similaire. Permet de retrouver le jeu même s''il n''est pas encore importé.';
COMMENT ON COLUMN public.game_similar_games.similar_game_id IS
  'Référence au jeu similaire dans la table games (NULL si le jeu n''est pas encore importé localement).';
COMMENT ON COLUMN public.game_similar_games.display_order IS
  'Ordre d''affichage (défaut : 0, basé sur l''ordre retourné par IGDB).';
COMMENT ON COLUMN public.game_similar_games.created_at IS
  'Date de création de l''enregistrement.';
