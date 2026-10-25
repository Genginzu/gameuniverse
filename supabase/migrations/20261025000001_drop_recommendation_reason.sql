-- Migration: drop the "because of" game from the recommendation RPCs.
--
-- recommend_games returned reason_game_id (the source game closest to each
-- pick). The UI no longer shows it, so the column and the CTEs computing it
-- are removed. Changing the return type of a function needs DROP + CREATE;
-- the two wrappers return the same row type, so they are recreated too.
-- Scoring is unchanged (see 20261024000002_recommendation_engine.sql).

DROP FUNCTION IF EXISTS public.recommend_games_for_me(INTEGER);
DROP FUNCTION IF EXISTS public.recommend_similar_games(UUID, INTEGER);
DROP FUNCTION IF EXISTS public.recommend_games(UUID[], DOUBLE PRECISION[], UUID[], INTEGER);

-- Weighted source games → ranked candidates. Pure read over public catalogue
-- data (library co-occurrence respects user_library RLS / stats_private).
CREATE FUNCTION public.recommend_games(
  p_source_ids UUID[],
  p_source_weights DOUBLE PRECISION[],
  p_exclude_ids UUID[] DEFAULT '{}',
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  game_id UUID,
  score DOUBLE PRECISION,
  content_score DOUBLE PRECISION,
  similar_score DOUBLE PRECISION,
  collaborative_score DOUBLE PRECISION,
  quality_score DOUBLE PRECISION
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
  WITH src AS (
    SELECT s.game_id, MAX(s.w) AS w
    FROM unnest(p_source_ids, p_source_weights) AS s(game_id, w)
    WHERE s.game_id IS NOT NULL AND s.w > 0
    GROUP BY s.game_id
  ),
  excluded AS (
    SELECT game_id FROM src
    UNION SELECT unnest(COALESCE(p_exclude_ids, '{}'::uuid[]))
  ),
  -- Content features with a per-kind weight (franchise and studio are the
  -- strongest taste signals, modes the weakest).
  feat AS (
    SELECT gg.game_id, 'g' || gg.genre_id::text AS feature, 1.0::float8 AS kw FROM public.game_genres gg
    UNION ALL
    SELECT gt.game_id, 't' || gt.theme_id::text, 1.0 FROM public.game_themes gt
    UNION ALL
    SELECT gp.game_id, 'p' || gp.player_perspective_id::text, 0.6 FROM public.game_player_perspectives gp
    UNION ALL
    SELECT gm.game_id, 'm' || gm.game_mode_id::text, 0.4 FROM public.game_game_modes gm
    UNION ALL
    SELECT gf.game_id, 'f' || gf.franchise_id::text, 2.0 FROM public.game_franchises gf
    UNION ALL
    SELECT gc.game_id, 'd' || gc.company_id::text, 1.5 FROM public.game_companies gc WHERE gc.role = 'developer'
  ),
  n AS (SELECT GREATEST(COUNT(*), 1)::float8 AS n FROM public.games),
  src_feat AS (
    SELECT f.game_id, f.feature, f.kw FROM feat f JOIN src USING (game_id)
  ),
  -- Inverse document frequency, only for the features the sources carry.
  idf AS (
    SELECT f.feature, LN((SELECT n FROM n) / COUNT(*)) AS idf
    FROM feat f
    WHERE f.feature IN (SELECT feature FROM src_feat)
    GROUP BY f.feature
  ),
  profile AS (
    SELECT sf.feature, MAX(sf.kw) * i.idf AS fw, SUM(src.w) * MAX(sf.kw) * i.idf AS pw
    FROM src_feat sf JOIN src USING (game_id) JOIN idf i USING (feature)
    WHERE i.idf > 0
    GROUP BY sf.feature, i.idf
  ),
  pnorm AS (SELECT NULLIF(SQRT(SUM(pw * pw)), 0) AS v FROM profile),
  dot AS (
    SELECT f.game_id, SUM(p.pw * p.fw) AS dot
    FROM feat f JOIN profile p USING (feature)
    WHERE f.game_id NOT IN (SELECT game_id FROM excluded)
    GROUP BY f.game_id
    ORDER BY dot DESC
    LIMIT 600
  ),
  -- Candidate norms only for the shortlisted games. Features the sources do
  -- not carry get a neutral idf of ln(n / 50) (cheap approximation).
  cnorm AS (
    SELECT f.game_id,
      SQRT(SUM(POWER(f.kw * COALESCE(p.fw / NULLIF(f.kw, 0), LN((SELECT n FROM n) / 50.0)), 2))) AS v,
      COUNT(*) AS nfeat
    FROM feat f
    JOIN dot d USING (game_id)
    LEFT JOIN profile p USING (feature)
    GROUP BY f.game_id
  ),
  -- Cosine favours sparsely tagged games: damp the match below 5 features.
  content AS (
    SELECT d.game_id,
      d.dot / NULLIF(c.v * (SELECT v FROM pnorm), 0) * LEAST(1.0, c.nfeat / 5.0) AS s
    FROM dot d JOIN cnorm c USING (game_id)
  ),
  -- IGDB similar games, both directions, resolved through igdb_id so links to
  -- games imported later still count. sqrt(w): a pick similar to several of
  -- the player's games beats one similar to a single heavily played game.
  sim_raw AS (
    SELECT g.id AS game_id, SQRT(src.w) / (1 + 0.1 * COALESCE(s.display_order, 0)) AS support
    FROM src
    JOIN public.game_similar_games s ON s.game_id = src.game_id
    JOIN public.games g ON g.igdb_id = s.similar_igdb_id
    UNION ALL
    SELECT s.game_id, 0.5 * SQRT(src.w)
    FROM src
    JOIN public.games gs ON gs.id = src.game_id
    JOIN public.game_similar_games s ON s.similar_igdb_id = gs.igdb_id
  ),
  sim AS (
    SELECT game_id, SUM(support) AS support FROM sim_raw
    WHERE game_id NOT IN (SELECT game_id FROM excluded)
    GROUP BY game_id
  ),
  sim_norm AS (
    SELECT game_id, support / NULLIF((SELECT MAX(support) FROM sim), 0) AS s FROM sim
  ),
  -- Collaborative filtering only makes sense with enough players.
  collab_gate AS (
    SELECT COUNT(*) >= 20 AS enabled FROM (
      SELECT ul.user_id FROM public.user_library ul GROUP BY ul.user_id HAVING COUNT(*) >= 5
    ) players
  ),
  owners AS (
    SELECT ul.user_id, SUM(src.w) AS w
    FROM public.user_library ul JOIN src ON src.game_id = ul.game_id
    WHERE (SELECT enabled FROM collab_gate)
      AND ul.user_id IS DISTINCT FROM (SELECT auth.uid())
    GROUP BY ul.user_id
  ),
  collab_raw AS (
    SELECT ul.game_id, SUM(o.w) AS s
    FROM owners o JOIN public.user_library ul ON ul.user_id = o.user_id
    WHERE ul.game_id NOT IN (SELECT game_id FROM excluded)
    GROUP BY ul.game_id
    ORDER BY s DESC
    LIMIT 600
  ),
  collab AS (
    SELECT game_id, s / NULLIF((SELECT MAX(s) FROM collab_raw), 0) AS s FROM collab_raw
  ),
  candidates AS (
    SELECT game_id FROM content
    UNION SELECT game_id FROM sim_norm
    UNION SELECT game_id FROM collab
  ),
  reviews AS (
    SELECT r.game_id, AVG(r.rating) / 20.0 AS avg, COUNT(*) AS cnt
    FROM public.game_reviews r
    WHERE r.game_id IN (SELECT game_id FROM candidates)
    GROUP BY r.game_id
  ),
  scored AS (
    SELECT
      c.game_id,
      COALESCE(ct.s, 0) AS content_s,
      COALESCE(sn.s, 0) AS similar_s,
      COALESCE(cb.s, 0) AS collab_s,
      (
        COALESCE(0.5 * g.metascore / 100.0, 0)
        + COALESCE(0.3 * rv.avg * rv.cnt / (rv.cnt + 3.0), 0)
        + 0.2 * COALESCE(g.hybrid_popularity_score, 0)
      ) / (0.2 + CASE WHEN g.metascore IS NULL THEN 0 ELSE 0.5 END
               + CASE WHEN rv.cnt IS NULL THEN 0 ELSE 0.3 * rv.cnt / (rv.cnt + 3.0) END) AS quality_s,
      (SELECT f.franchise_id FROM public.game_franchises f WHERE f.game_id = c.game_id LIMIT 1) AS franchise_id
    FROM candidates c
    JOIN public.games g ON g.id = c.game_id
    LEFT JOIN content ct ON ct.game_id = c.game_id
    LEFT JOIN sim_norm sn ON sn.game_id = c.game_id
    LEFT JOIN collab cb ON cb.game_id = c.game_id
    LEFT JOIN reviews rv ON rv.game_id = c.game_id
    WHERE NOT g.is_adult AND g.cover_image_url IS NOT NULL
      -- Add-ons imported as standalone games (DLC, bundles, packs…) are not picks.
      AND NOT EXISTS (
        SELECT 1 FROM public.game_dlc_extensions e
        WHERE e.igdb_id = g.igdb_id
          AND e.category IN ('dlc', 'expansion', 'bundle', 'mod', 'episode', 'season', 'pack', 'update', 'fork')
      )
  ),
  -- Quality scales the relevance instead of adding to it: an obscure game with
  -- no metascore, reviews or audience keeps 70 % of its relevance.
  combined AS (
    SELECT s.*,
      (0.50 * content_s + 0.35 * similar_s
        + CASE WHEN (SELECT enabled FROM collab_gate) THEN 0.15 * collab_s ELSE 0 END)
      / CASE WHEN (SELECT enabled FROM collab_gate) THEN 1.0 ELSE 0.85 END
      * (0.7 + 0.3 * LEAST(GREATEST(quality_s, 0), 1)) AS total
    FROM scored s
  ),
  -- Diversity: at most two games per franchise.
  ranked AS (
    SELECT c.*,
      ROW_NUMBER() OVER (PARTITION BY COALESCE(c.franchise_id, c.game_id) ORDER BY c.total DESC) AS rank_in_franchise
    FROM combined c
  )
  SELECT r.game_id, r.total, r.content_s, r.similar_s, r.collab_s, r.quality_s
  FROM ranked r
  WHERE r.rank_in_franchise <= 2
  ORDER BY r.total DESC
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 10), 1), 50);
$$;

COMMENT ON FUNCTION public.recommend_games(UUID[], DOUBLE PRECISION[], UUID[], INTEGER) IS
  'Ranks catalogue games for weighted source games. Relevance: 50 % TF-IDF content cosine (genres, themes, perspectives, modes, franchises, developers), 35 % IGDB similar games, 15 % library co-occurrence (only with ≥ 20 players, else re-normalised); scaled by quality (metascore, reviews, popularity) from ×0.7 to ×1. DLC / bundles, adult and cover-less games excluded, max two per franchise.';

CREATE FUNCTION public.recommend_games_for_me(p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  game_id UUID,
  score DOUBLE PRECISION,
  content_score DOUBLE PRECISION,
  similar_score DOUBLE PRECISION,
  collaborative_score DOUBLE PRECISION,
  quality_score DOUBLE PRECISION
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
  WITH sources AS (
    SELECT ul.game_id,
      public.library_engagement_weight(ul.play_time_hours, ul.status, ul.rating, ul.added_at) AS w
    FROM public.user_library ul
    WHERE ul.user_id = (SELECT auth.uid())
    ORDER BY w DESC, ul.added_at DESC NULLS LAST
    LIMIT 80
  ),
  excluded AS (
    SELECT ul.game_id FROM public.user_library ul WHERE ul.user_id = (SELECT auth.uid())
    UNION
    SELECT d.game_id FROM public.recommendation_dismissals d WHERE d.user_id = (SELECT auth.uid())
  )
  SELECT r.*
  FROM public.recommend_games(
    (SELECT COALESCE(array_agg(game_id), '{}') FROM sources),
    (SELECT COALESCE(array_agg(w), '{}') FROM sources),
    (SELECT COALESCE(array_agg(game_id), '{}') FROM excluded),
    p_limit
  ) r
  WHERE (SELECT auth.uid()) IS NOT NULL;
$$;

COMMENT ON FUNCTION public.recommend_games_for_me(INTEGER) IS
  'Personal recommendations of the caller (auth.uid()): top 80 library games by engagement as sources; library and dismissed games excluded.';

CREATE FUNCTION public.recommend_similar_games(p_game_id UUID, p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  game_id UUID,
  score DOUBLE PRECISION,
  content_score DOUBLE PRECISION,
  similar_score DOUBLE PRECISION,
  collaborative_score DOUBLE PRECISION,
  quality_score DOUBLE PRECISION
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT r.*
  FROM public.recommend_games(
    ARRAY[p_game_id],
    ARRAY[1.0::float8],
    (SELECT COALESCE(array_agg(x.game_id), '{}') FROM (
      SELECT ul.game_id FROM public.user_library ul WHERE ul.user_id = (SELECT auth.uid())
      UNION
      SELECT d.game_id FROM public.recommendation_dismissals d WHERE d.user_id = (SELECT auth.uid())
    ) x),
    p_limit
  ) r;
$$;

COMMENT ON FUNCTION public.recommend_similar_games(UUID, INTEGER) IS
  'Games like p_game_id (game detail page). Signed-in callers do not get games from their library or dismissed ones.';

REVOKE EXECUTE ON FUNCTION public.recommend_games(UUID[], DOUBLE PRECISION[], UUID[], INTEGER) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.recommend_games_for_me(INTEGER) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.recommend_similar_games(UUID, INTEGER) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.recommend_games(UUID[], DOUBLE PRECISION[], UUID[], INTEGER)
  TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.recommend_games_for_me(INTEGER) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.recommend_similar_games(UUID, INTEGER)
  TO anon, authenticated, service_role;
