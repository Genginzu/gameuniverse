-- Rebalance the trending score (hybrid_popularity_score) and exclude adult games.
--
-- Context: IGDB /popularity_primitives returns normalised shares (e.g. Elden Ring
-- visits = 0.00058), not raw counts. The previous formula scaled them against
-- 1e6 / 1e4, so the IGDB part was ~0 for every game and the ranking only
-- reflected a handful of local page views.
--
-- New formula (0..1), 50 % IGDB / 50 % Gamers Universe:
--   IGDB (max 0.50): visits 0.32, want to play 0.11, playing 0.07.
--     Each share is put on a log scale between 1e-6 (no signal) and a reference
--     just above the current catalogue maximum, capped at 1.
--   Site (max 0.50): page views 0.25, reviews + library adds 0.17,
--     recent activity (last 180 days) 0.08.
--
-- Adult games (IGDB theme "Erotic", id 42) get a score of 0 so they never
-- appear in trending blocks. `games.is_adult` is written by the IGDB import /
-- sync (service role) and backfilled by scripts/igdb-import/games/backfill-adult.ts.

ALTER TABLE public.games
  ADD COLUMN IF NOT EXISTS is_adult boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.games.is_adult IS
  'True when IGDB tags the game with the Erotic theme (id 42). Excluded from trending (score forced to 0).';

CREATE OR REPLACE FUNCTION public.compute_hybrid_popularity(
  p_igdb_visits DOUBLE PRECISION,
  p_igdb_want DOUBLE PRECISION,
  p_igdb_playing DOUBLE PRECISION,
  p_view_count INTEGER,
  p_popularity_score INTEGER,
  p_last_activity_at TIMESTAMPTZ
)
RETURNS DOUBLE PRECISION
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$
  SELECT
    -- IGDB: 50 % maximum
      0.32 * LEAST(1.0, LN(1 + COALESCE(p_igdb_visits, 0) / 1e-6) / LN(1 + 0.0025 / 1e-6))
    + 0.11 * LEAST(1.0, LN(1 + COALESCE(p_igdb_want, 0) / 1e-6) / LN(1 + 0.0025 / 1e-6))
    + 0.07 * LEAST(1.0, LN(1 + COALESCE(p_igdb_playing, 0) / 1e-6) / LN(1 + 0.0065 / 1e-6))
    -- Gamers Universe: 50 % maximum
    + 0.25 * LEAST(1.0, LN(1 + COALESCE(p_view_count, 0)) / LN(1 + 1e4))
    + 0.17 * LEAST(1.0, LN(1 + COALESCE(p_popularity_score, 0)) / LN(1 + 1e3))
    + 0.08 * GREATEST(0.0, 1.0 - EXTRACT(EPOCH FROM (NOW() - COALESCE(p_last_activity_at, NOW() - INTERVAL '180 days'))) / (180.0 * 86400.0));
$$;

COMMENT ON FUNCTION public.compute_hybrid_popularity IS
  'Returns a 0..1 trending score: 50 % IGDB PopScore (visits 0.32, want-to-play 0.11, playing 0.07, log-scaled shares) + 50 % local engagement (views 0.25, reviews+library 0.17, recency 0.08).';

CREATE OR REPLACE FUNCTION public.update_hybrid_popularity()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.is_adult THEN
    NEW.hybrid_popularity_score := 0;
  ELSE
    NEW.hybrid_popularity_score := public.compute_hybrid_popularity(
      NEW.igdb_pop_visits, NEW.igdb_pop_want_to_play, NEW.igdb_pop_playing,
      NEW.view_count, NEW.popularity_score, NEW.last_activity_at
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_games_hybrid_popularity ON public.games;
CREATE TRIGGER trg_games_hybrid_popularity
  BEFORE INSERT OR UPDATE OF
    igdb_pop_visits, igdb_pop_want_to_play, igdb_pop_playing,
    view_count, popularity_score, last_activity_at, is_adult
  ON public.games
  FOR EACH ROW
  EXECUTE FUNCTION public.update_hybrid_popularity();

-- Recompute every game with the new formula.
UPDATE public.games
SET hybrid_popularity_score = CASE
  WHEN is_adult THEN 0
  ELSE public.compute_hybrid_popularity(
    igdb_pop_visits, igdb_pop_want_to_play, igdb_pop_playing,
    view_count, popularity_score, last_activity_at
  )
END;
