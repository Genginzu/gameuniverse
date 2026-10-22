-- Trending score: popularity weighted by how recent the game is (issue #19).
--
-- hybrid_popularity_score measures overall popularity, so evergreen titles
-- (The Witcher 3, Elden Ring) stay on top for years. The "Tendances" blocks
-- now sort by trending_score instead:
--
--   trending = hybrid_popularity_score × release factor (+ anticipation bonus)
--   release factor: upcoming or released < 1 year → 1.0, then linear decay
--                   to 0.3 at 5 years and beyond; unknown date → 0.5
--   anticipation bonus (upcoming games only): + 0.15 × IGDB want-to-play
--                   (log-scaled share, same scale as the hybrid score)
--   adult games → 0
--
-- The score depends on NOW(): the trigger refreshes it whenever an input
-- changes, and refresh_trending_scores() (weekly cron, service role) recomputes
-- every game so the age decay and the recency part of the hybrid score move.
-- apply_igdb_popularity() bulk-writes IGDB primitives for that cron.

ALTER TABLE public.games
  ADD COLUMN IF NOT EXISTS trending_score DOUBLE PRECISION NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.games.trending_score IS
  'Trending 0..1: hybrid_popularity_score × release-age factor + anticipation bonus for upcoming games. 0 for adult games.';

CREATE INDEX IF NOT EXISTS idx_games_trending_score
  ON public.games (trending_score DESC);

CREATE OR REPLACE FUNCTION public.compute_trending_score(
  p_hybrid DOUBLE PRECISION,
  p_igdb_want DOUBLE PRECISION,
  p_release_date DATE,
  p_is_adult BOOLEAN
)
RETURNS DOUBLE PRECISION
LANGUAGE sql
STABLE
SET search_path = ''
AS $$
  SELECT CASE
    WHEN p_is_adult THEN 0.0
    WHEN p_release_date IS NULL THEN 0.5 * COALESCE(p_hybrid, 0)
    WHEN p_release_date > CURRENT_DATE THEN LEAST(
      1.0,
      COALESCE(p_hybrid, 0)
        + 0.15 * LEAST(1.0, LN(1 + COALESCE(p_igdb_want, 0) / 1e-6) / LN(1 + 0.0025 / 1e-6))
    )
    ELSE COALESCE(p_hybrid, 0) * GREATEST(
      0.3,
      LEAST(1.0, 1.0 - 0.7 * ((CURRENT_DATE - p_release_date) - 365) / (4.0 * 365))
    )
  END;
$$;

COMMENT ON FUNCTION public.compute_trending_score IS
  'Trending 0..1 from the hybrid popularity, the release date (age decay 1 → 0.3 over years 1-5) and an anticipation bonus for upcoming games.';

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
  NEW.trending_score := public.compute_trending_score(
    NEW.hybrid_popularity_score, NEW.igdb_pop_want_to_play, NEW.release_date, NEW.is_adult
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_games_hybrid_popularity ON public.games;
CREATE TRIGGER trg_games_hybrid_popularity
  BEFORE INSERT OR UPDATE OF
    igdb_pop_visits, igdb_pop_want_to_play, igdb_pop_playing,
    view_count, popularity_score, last_activity_at, is_adult, release_date
  ON public.games
  FOR EACH ROW
  EXECUTE FUNCTION public.update_hybrid_popularity();

-- Weekly recompute (age decay + hybrid recency). Server-only: no client grant.
CREATE OR REPLACE FUNCTION public.refresh_trending_scores()
RETURNS INTEGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_updated INTEGER;
BEGIN
  WITH scored AS (
    SELECT
      g.id,
      CASE WHEN g.is_adult THEN 0 ELSE public.compute_hybrid_popularity(
        g.igdb_pop_visits, g.igdb_pop_want_to_play, g.igdb_pop_playing,
        g.view_count, g.popularity_score, g.last_activity_at
      ) END AS hybrid,
      g.igdb_pop_want_to_play, g.release_date, g.is_adult
    FROM public.games g
  )
  UPDATE public.games g
  SET
    hybrid_popularity_score = s.hybrid,
    trending_score = public.compute_trending_score(
      s.hybrid, s.igdb_pop_want_to_play, s.release_date, s.is_adult
    )
  FROM scored s
  WHERE g.id = s.id
    AND (
      g.hybrid_popularity_score IS DISTINCT FROM s.hybrid
      OR g.trending_score IS DISTINCT FROM public.compute_trending_score(
        s.hybrid, s.igdb_pop_want_to_play, s.release_date, s.is_adult
      )
    );
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated;
END;
$$;

COMMENT ON FUNCTION public.refresh_trending_scores IS
  'Recomputes hybrid_popularity_score and trending_score for every game. Called weekly by /api/cron/refresh-popularity (service role).';

-- Bulk write of IGDB primitives, keyed by igdb_id (the trigger recomputes the scores).
-- p_rows: [{ "igdb_id": 1942, "visits": 0.0005, "want": 0.001, "playing": 0.002 }, ...]
CREATE OR REPLACE FUNCTION public.apply_igdb_popularity(p_rows JSONB)
RETURNS INTEGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_updated INTEGER;
BEGIN
  UPDATE public.games g
  SET
    igdb_pop_visits = r.visits,
    igdb_pop_want_to_play = r.want,
    igdb_pop_playing = r.playing,
    igdb_pop_updated_at = NOW()
  FROM jsonb_to_recordset(p_rows) AS r(
    igdb_id BIGINT, visits DOUBLE PRECISION, want DOUBLE PRECISION, playing DOUBLE PRECISION
  )
  WHERE g.igdb_id = r.igdb_id;
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated;
END;
$$;

COMMENT ON FUNCTION public.apply_igdb_popularity IS
  'Bulk-updates IGDB popularity primitives by igdb_id. Server-only (service role, weekly cron).';

REVOKE ALL ON FUNCTION public.refresh_trending_scores() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.apply_igdb_popularity(JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_trending_scores() TO service_role;
GRANT EXECUTE ON FUNCTION public.apply_igdb_popularity(JSONB) TO service_role;

SELECT public.refresh_trending_scores();

-- Safety net: the age decay keeps moving even if the Vercel cron is down.
SELECT cron.schedule(
  'refresh-trending-scores',
  '45 5 * * 1',
  $cron$SELECT public.refresh_trending_scores();$cron$
);
