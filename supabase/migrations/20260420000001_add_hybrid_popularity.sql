-- Migration: Hybrid popularity score (IGDB PopScore + local engagement)
--
-- Stores the raw IGDB popularity primitives (Visits, Want-to-Play, Playing)
-- alongside a pre-computed blended score that mixes them with local signals
-- (view_count, popularity_score, last_activity_at). The blended score is kept
-- fresh by a trigger on `games`, so sorting the public listing by
-- hybrid_popularity_score is a single indexed lookup.
--
-- IGDB primitives reference:
--   popularity_type = 1 → Visits
--   popularity_type = 2 → Want to Play
--   popularity_type = 3 → Playing
-- Steam-only primitives (types 5-8) are skipped because coverage is platform-
-- biased.

-- ============================================================================
-- 1. New columns
-- ============================================================================

ALTER TABLE public.games
  ADD COLUMN IF NOT EXISTS igdb_pop_visits DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS igdb_pop_want_to_play DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS igdb_pop_playing DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS igdb_pop_updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS hybrid_popularity_score DOUBLE PRECISION DEFAULT 0;

COMMENT ON COLUMN public.games.igdb_pop_visits IS
  'IGDB popularity primitive: type=1 (Visits). Synced from /popularity_primitives.';
COMMENT ON COLUMN public.games.igdb_pop_want_to_play IS
  'IGDB popularity primitive: type=2 (Want to Play).';
COMMENT ON COLUMN public.games.igdb_pop_playing IS
  'IGDB popularity primitive: type=3 (Playing).';
COMMENT ON COLUMN public.games.igdb_pop_updated_at IS
  'Timestamp of the last successful sync from IGDB /popularity_primitives.';
COMMENT ON COLUMN public.games.hybrid_popularity_score IS
  'Blended 0..1 score combining IGDB PopScore with local engagement. Maintained by trg_games_hybrid_popularity.';

-- ============================================================================
-- 2. Pure scoring function (no trigger context — also callable for debugging)
-- ============================================================================

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
AS $$
  SELECT
    -- IGDB visibility (wide audience on igdb.com)
    0.45 * LEAST(1.0, LN(1 + COALESCE(p_igdb_visits,      0)) / LN(1 + 1e6))
    -- IGDB intent
  + 0.15 * LEAST(1.0, LN(1 + COALESCE(p_igdb_want,        0)) / LN(1 + 1e4))
    -- IGDB current activity
  + 0.10 * LEAST(1.0, LN(1 + COALESCE(p_igdb_playing,     0)) / LN(1 + 1e4))
    -- Local page views
  + 0.15 * LEAST(1.0, LN(1 + COALESCE(p_view_count,       0)) / LN(1 + 1e4))
    -- Local reviews + library entries (maintained by existing triggers)
  + 0.10 * LEAST(1.0, LN(1 + COALESCE(p_popularity_score, 0)) / LN(1 + 1e3))
    -- Recency: 1.0 today, linear decay to 0 at 180 days of silence
  + 0.05 * GREATEST(
      0.0,
      1.0 - EXTRACT(EPOCH FROM (NOW() - COALESCE(p_last_activity_at, NOW()))) / (180.0 * 86400.0)
    );
$$;

COMMENT ON FUNCTION public.compute_hybrid_popularity IS
  'Returns a 0..1 blended popularity score. Weights: 0.45 IGDB Visits, 0.15 Want-to-Play, 0.10 Playing, 0.15 local views, 0.10 local popularity_score (reviews+library), 0.05 recency.';

-- ============================================================================
-- 3. Trigger: recompute when any input changes
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_hybrid_popularity()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.hybrid_popularity_score := public.compute_hybrid_popularity(
    NEW.igdb_pop_visits,
    NEW.igdb_pop_want_to_play,
    NEW.igdb_pop_playing,
    NEW.view_count,
    NEW.popularity_score,
    NEW.last_activity_at
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_games_hybrid_popularity ON public.games;
CREATE TRIGGER trg_games_hybrid_popularity
  BEFORE INSERT OR UPDATE OF
    igdb_pop_visits, igdb_pop_want_to_play, igdb_pop_playing,
    view_count, popularity_score, last_activity_at
  ON public.games
  FOR EACH ROW
  EXECUTE FUNCTION public.update_hybrid_popularity();

-- ============================================================================
-- 4. One-shot backfill: compute from existing local signals only
--    (IGDB columns stay NULL until the sync pipeline fills them)
-- ============================================================================

UPDATE public.games
SET hybrid_popularity_score = public.compute_hybrid_popularity(
  igdb_pop_visits,
  igdb_pop_want_to_play,
  igdb_pop_playing,
  view_count,
  popularity_score,
  last_activity_at
);

-- ============================================================================
-- 5. Index for the new sort key
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_games_hybrid_popularity
  ON public.games (hybrid_popularity_score DESC NULLS LAST);
