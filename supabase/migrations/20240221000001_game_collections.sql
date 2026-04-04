-- Migration: Game Collections
-- Collections thématiques de jeux créées par les joueurs.
-- Tables game_collections et game_collection_items avec contraintes,
-- index, politiques RLS et trigger updated_at.

-- ========================================
-- TABLES
-- ========================================

CREATE TABLE IF NOT EXISTS public.game_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(120) NOT NULL,
  description TEXT CHECK (char_length(description) <= 500),
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, slug)
);
COMMENT ON TABLE public.game_collections IS 'Collections thématiques de jeux créées par les joueurs';
COMMENT ON COLUMN public.game_collections.slug IS 'Slug unique par utilisateur, généré à partir du nom';
COMMENT ON COLUMN public.game_collections.is_public IS 'Visibilité : true = publique, false = privée';
CREATE TABLE IF NOT EXISTS public.game_collection_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES game_collections(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  note TEXT CHECK (char_length(note) <= 250),
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(collection_id, game_id)
);
COMMENT ON TABLE public.game_collection_items IS 'Jeux contenus dans une collection, avec ordre et note optionnelle';
COMMENT ON COLUMN public.game_collection_items.position IS 'Ordre d''affichage du jeu dans la collection';
COMMENT ON COLUMN public.game_collection_items.note IS 'Note textuelle optionnelle du propriétaire sur ce jeu';
-- ========================================
-- INDEX
-- ========================================

CREATE INDEX IF NOT EXISTS idx_game_collections_user_id ON game_collections(user_id);
CREATE INDEX IF NOT EXISTS idx_game_collections_is_public ON game_collections(is_public);
CREATE INDEX IF NOT EXISTS idx_game_collection_items_collection_id ON game_collection_items(collection_id);
CREATE INDEX IF NOT EXISTS idx_game_collection_items_game_id ON game_collection_items(game_id);
CREATE INDEX IF NOT EXISTS idx_game_collection_items_position ON game_collection_items(position);
-- ========================================
-- ROW LEVEL SECURITY
-- ========================================

ALTER TABLE game_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_collection_items ENABLE ROW LEVEL SECURITY;
-- Politiques RLS pour game_collections

CREATE POLICY "Public collections are viewable by anyone"
  ON game_collections FOR SELECT
  USING (is_public = true);
CREATE POLICY "Owners can view all own collections"
  ON game_collections FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Owners can insert own collections"
  ON game_collections FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners can update own collections"
  ON game_collections FOR UPDATE
  USING (auth.uid() = user_id);
CREATE POLICY "Owners can delete own collections"
  ON game_collections FOR DELETE
  USING (auth.uid() = user_id);
-- Politiques RLS pour game_collection_items

CREATE POLICY "Items of public collections are viewable by anyone"
  ON game_collection_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM game_collections
      WHERE game_collections.id = game_collection_items.collection_id
      AND game_collections.is_public = true
    )
  );
CREATE POLICY "Owners can view items of own collections"
  ON game_collection_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM game_collections
      WHERE game_collections.id = game_collection_items.collection_id
      AND game_collections.user_id = auth.uid()
    )
  );
CREATE POLICY "Owners can insert items into own collections"
  ON game_collection_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM game_collections
      WHERE game_collections.id = game_collection_items.collection_id
      AND game_collections.user_id = auth.uid()
    )
  );
CREATE POLICY "Owners can update items in own collections"
  ON game_collection_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM game_collections
      WHERE game_collections.id = game_collection_items.collection_id
      AND game_collections.user_id = auth.uid()
    )
  );
CREATE POLICY "Owners can delete items from own collections"
  ON game_collection_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM game_collections
      WHERE game_collections.id = game_collection_items.collection_id
      AND game_collections.user_id = auth.uid()
    )
  );
-- ========================================
-- TRIGGER updated_at
-- ========================================
-- Réutilise la fonction existante update_updated_at_column()
-- définie dans 20240101000001_initial_schema.sql

CREATE TRIGGER update_game_collections_updated_at
  BEFORE UPDATE ON game_collections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
