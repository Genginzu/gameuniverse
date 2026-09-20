-- Per-user record of every platform title reported by a sync (matched or not).
--
-- The shared `platform_game_matches` cache maps a title to a game but doesn't
-- know which players own which titles. To backfill a match into the libraries
-- of players who already synced (and won't re-sync just for one new match), we
-- need to remember, per user, every title their sync reported — including ones
-- that couldn't be matched yet.
--
-- When a title later gets a game (admin link or auto-match), we look up every
-- user here who owns that (platform, source_id) and add the game to their
-- user_library immediately.

CREATE TABLE IF NOT EXISTS public.user_platform_titles (
  user_id     UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  platform    TEXT NOT NULL,
  source_id   TEXT NOT NULL,
  name        TEXT,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, platform, source_id)
);

COMMENT ON TABLE public.user_platform_titles IS
  'Every platform title reported by a user sync (matched or not). Used to backfill a game into existing owners'' libraries when its match is discovered later.';

-- Backfill lookup: all users owning a given (platform, source_id).
CREATE INDEX IF NOT EXISTS idx_user_platform_titles_source
  ON public.user_platform_titles (platform, source_id);

ALTER TABLE public.user_platform_titles ENABLE ROW LEVEL SECURITY;

-- Users may read their own reported titles; writes are service-role only.
CREATE POLICY "user_platform_titles_select_own"
  ON public.user_platform_titles FOR SELECT
  USING (auth.uid() = user_id);
