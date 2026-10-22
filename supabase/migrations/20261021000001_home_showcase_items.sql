-- Home landing showcase (issue #19): games and characters picked by admins
-- for the "library" and "characters" preview blocks of the logged-out home.
-- Public read (anon + authenticated) through PostgREST; writes go through
-- the admin API with the service role only (no client write grant).

CREATE TABLE IF NOT EXISTS public.home_showcase_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('game', 'character')),
  game_id uuid REFERENCES public.games(id) ON DELETE CASCADE,
  character_id uuid REFERENCES public.characters(id) ON DELETE CASCADE,
  library_status text CHECK (library_status IN ('playing', 'completed', 'wishlist', 'owned')),
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT home_showcase_items_target_check CHECK (
    (kind = 'game' AND game_id IS NOT NULL AND character_id IS NULL)
    OR (kind = 'character' AND character_id IS NOT NULL AND game_id IS NULL AND library_status IS NULL)
  ),
  CONSTRAINT home_showcase_items_game_unique UNIQUE (game_id),
  CONSTRAINT home_showcase_items_character_unique UNIQUE (character_id)
);

CREATE INDEX IF NOT EXISTS home_showcase_items_kind_order_idx
  ON public.home_showcase_items (kind, display_order);

COMMENT ON TABLE public.home_showcase_items IS
  'Games and characters featured in the logged-out home preview blocks, ordered by display_order.';
COMMENT ON COLUMN public.home_showcase_items.kind IS 'game (library preview) or character (characters preview).';
COMMENT ON COLUMN public.home_showcase_items.library_status IS
  'Demo library status shown on the game card (games only).';
COMMENT ON COLUMN public.home_showcase_items.display_order IS 'Ascending display order within a kind.';

ALTER TABLE public.home_showcase_items ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS update_home_showcase_items_updated_at ON public.home_showcase_items;
CREATE TRIGGER update_home_showcase_items_updated_at
  BEFORE UPDATE ON public.home_showcase_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP POLICY IF EXISTS "home_showcase_items_public_read" ON public.home_showcase_items;
CREATE POLICY "home_showcase_items_public_read"
  ON public.home_showcase_items
  FOR SELECT
  TO anon, authenticated
  USING (true);

GRANT SELECT ON public.home_showcase_items TO anon, authenticated;
