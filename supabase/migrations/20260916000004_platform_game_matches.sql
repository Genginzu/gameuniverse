-- Global (shared) cache of platform title → local game resolutions.
--
-- Xbox/PSN don't expose IGDB-friendly store ids, so their library sync resolves
-- titles by IGDB name search (rate-limited, so bounded per run). Without a
-- memory of what was already attempted, every run re-attempts the same first
-- batch and never advances through the backlog.
--
-- This table is keyed by (platform, source_id) — NOT per user — so:
--   • work is shared: once any player's sync resolves a title, every other
--     player's sync reuses it instantly;
--   • unmatched titles (game_id NULL) form a backlog an admin can review and
--     manually link to an IGDB game, after which all players pick it up on
--     their next sync.

CREATE TABLE IF NOT EXISTS public.platform_game_matches (
  platform    TEXT NOT NULL,
  source_id   TEXT NOT NULL,
  game_id     UUID REFERENCES public.games (id) ON DELETE SET NULL,
  name        TEXT,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (platform, source_id)
);

COMMENT ON TABLE public.platform_game_matches IS
  'Shared cache of platform title (source_id) -> local game resolution. game_id NULL means "attempted, no confident match" and forms the admin linking backlog. Shared across users so a match (auto or admin) benefits everyone.';

-- Admin backlog lookup: unmatched titles per platform.
CREATE INDEX IF NOT EXISTS idx_platform_game_matches_unmatched
  ON public.platform_game_matches (platform)
  WHERE game_id IS NULL;

ALTER TABLE public.platform_game_matches ENABLE ROW LEVEL SECURITY;

-- Mappings are non-sensitive reference data; readable by anyone. Writes are
-- service-role only (sync engine + admin tooling), which bypass RLS.
CREATE POLICY "platform_game_matches_read"
  ON public.platform_game_matches FOR SELECT
  USING (true);
