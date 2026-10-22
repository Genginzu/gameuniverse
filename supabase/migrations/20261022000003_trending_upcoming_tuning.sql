-- Tune trending_score for upcoming games (issue #19).
--
-- After the first refresh, upcoming games crowded the trending blocks: IGDB
-- often stores "release in year N, no exact date" as N-12-31, and every
-- upcoming game got the anticipation bonus. New rules for future dates:
--   - 31 December → approximate date: factor 0.7, no bonus
--   - within the next 6 months → factor 1 + anticipation bonus (0.15 × want-to-play)
--   - later → factor 1, no bonus
-- Released games and unknown dates are unchanged.

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
    WHEN p_release_date > CURRENT_DATE THEN CASE
      WHEN EXTRACT(MONTH FROM p_release_date) = 12 AND EXTRACT(DAY FROM p_release_date) = 31
        THEN 0.7 * COALESCE(p_hybrid, 0)
      WHEN p_release_date <= CURRENT_DATE + INTERVAL '6 months' THEN LEAST(
        1.0,
        COALESCE(p_hybrid, 0)
          + 0.15 * LEAST(1.0, LN(1 + COALESCE(p_igdb_want, 0) / 1e-6) / LN(1 + 0.0025 / 1e-6))
      )
      ELSE COALESCE(p_hybrid, 0)
    END
    ELSE COALESCE(p_hybrid, 0) * GREATEST(
      0.3,
      LEAST(1.0, 1.0 - 0.7 * ((CURRENT_DATE - p_release_date) - 365) / (4.0 * 365))
    )
  END;
$$;

COMMENT ON FUNCTION public.compute_trending_score IS
  'Trending 0..1: hybrid popularity × release factor (age decay 1 → 0.3 over years 1-5; 31 Dec future dates 0.7) + anticipation bonus for games out within 6 months.';

SELECT public.refresh_trending_scores();
