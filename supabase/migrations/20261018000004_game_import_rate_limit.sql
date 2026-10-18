-- Migration: Per-user rate limit for IGDB game imports (issue #376)
--
-- Durable, serverless-safe backing store for the POST /api/games/import rate
-- limit. An in-memory counter cannot work on Vercel: each lambda invocation is
-- a fresh process, so the window must live in the database.
--
-- The route writes one row per successful import and counts the rows in the
-- trailing hour to decide whether the caller is over the limit. Admins are
-- exempt in the route (no row written, no count read).

CREATE TABLE IF NOT EXISTS public.game_import_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  igdb_id INTEGER NOT NULL,
  game_id UUID REFERENCES public.games(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.game_import_events IS
  'Audit log of IGDB game imports per user, used to enforce the hourly import rate limit (issue #376).';
COMMENT ON COLUMN public.game_import_events.user_id IS 'User who triggered the import.';
COMMENT ON COLUMN public.game_import_events.igdb_id IS 'IGDB id that was imported.';
COMMENT ON COLUMN public.game_import_events.game_id IS 'Resulting local game id (nullable if the game is later deleted).';

-- Count query targets (user_id, created_at), so index both.
CREATE INDEX IF NOT EXISTS idx_game_import_events_user_created
  ON public.game_import_events (user_id, created_at DESC);

-- RLS: only the service role (used by the import route) reads/writes this
-- table. No client policy is created, so RLS denies all direct client access
-- while the service-role client bypasses it.
ALTER TABLE public.game_import_events ENABLE ROW LEVEL SECURITY;

-- Count a user's imports within the trailing `window_seconds`.
-- SECURITY DEFINER so it can be called with the service-role client and still
-- read the RLS-protected table deterministically.
CREATE OR REPLACE FUNCTION public.count_recent_game_imports(
  target_user_id UUID,
  window_seconds INTEGER
)
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.game_import_events
  WHERE user_id = target_user_id
    AND created_at >= NOW() - MAKE_INTERVAL(secs => window_seconds);
$$;

COMMENT ON FUNCTION public.count_recent_game_imports(UUID, INTEGER) IS
  'Returns how many games the user imported within the trailing window_seconds (issue #376 rate limit).';
