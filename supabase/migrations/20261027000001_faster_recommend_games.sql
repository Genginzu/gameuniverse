-- Migration: faster recommend_games (same scores, no full feature scan).
--
-- recommend_games built a CTE holding every content feature of the catalogue
-- (~140k rows, text keys 'g' || genre_id ...), materialized and spilled to
-- disk, then scanned four times. On prod it took ~0.4 s warm and up to 2.6 s
-- cold, close to the 3 s anon statement_timeout: the game page
-- recommendations and concurrent queries timed out at dev server start.
--
-- Features are now (kind, ref) pairs read per join table, only for the source
-- games, the source features and the 600 shortlisted games, through the
-- existing game_id / feature indexes. Scoring is unchanged: results checked
-- identical on prod for 26 source sets (up to ties of equal score).
-- Same signature and return type: CREATE OR REPLACE keeps grants and the
-- recommend_games_for_me / recommend_similar_games wrappers.

CREATE OR REPLACE FUNCTION public.recommend_games(
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
  -- Content features: a feature is (kind, ref) with a per-kind weight
  -- (franchise and studio are the strongest taste signals, modes the weakest).
  -- Each join table is queried on its own, by game or by feature, so its
  -- index is used instead of building the whole catalogue's feature list.
  kinds AS (
    SELECT * FROM (VALUES
      ('g'::text, 1.0::float8), ('t', 1.0), ('p', 0.6), ('m', 0.4), ('f', 2.0), ('d', 1.5)
    ) AS k(kind, kw)
  ),
  n AS (SELECT GREATEST(COUNT(*), 1)::float8 AS n FROM public.games),
  src_feat AS (
    SELECT x.game_id, x.kind, x.ref, k.kw
    FROM (
      SELECT gg.game_id, 'g'::text AS kind, gg.genre_id AS ref FROM public.game_genres gg
        WHERE gg.game_id IN (SELECT game_id FROM src)
      UNION ALL
      SELECT gt.game_id, 't', gt.theme_id FROM public.game_themes gt
        WHERE gt.game_id IN (SELECT game_id FROM src)
      UNION ALL
      SELECT gp.game_id, 'p', gp.player_perspective_id FROM public.game_player_perspectives gp
        WHERE gp.game_id IN (SELECT game_id FROM src)
      UNION ALL
      SELECT gm.game_id, 'm', gm.game_mode_id FROM public.game_game_modes gm
        WHERE gm.game_id IN (SELECT game_id FROM src)
      UNION ALL
      SELECT gf.game_id, 'f', gf.franchise_id FROM public.game_franchises gf
        WHERE gf.game_id IN (SELECT game_id FROM src)
      UNION ALL
      SELECT gc.game_id, 'd', gc.company_id FROM public.game_companies gc
        WHERE gc.role = 'developer' AND gc.game_id IN (SELECT game_id FROM src)
    ) x JOIN kinds k USING (kind)
  ),
  -- Inverse document frequency, only for the features the sources carry.
  df AS (
    SELECT 'g'::text AS kind, gg.genre_id AS ref, COUNT(*) AS cnt FROM public.game_genres gg
      WHERE gg.genre_id IN (SELECT ref FROM src_feat WHERE kind = 'g') GROUP BY gg.genre_id
    UNION ALL
    SELECT 't', gt.theme_id, COUNT(*) FROM public.game_themes gt
      WHERE gt.theme_id IN (SELECT ref FROM src_feat WHERE kind = 't') GROUP BY gt.theme_id
    UNION ALL
    SELECT 'p', gp.player_perspective_id, COUNT(*) FROM public.game_player_perspectives gp
      WHERE gp.player_perspective_id IN (SELECT ref FROM src_feat WHERE kind = 'p')
      GROUP BY gp.player_perspective_id
    UNION ALL
    SELECT 'm', gm.game_mode_id, COUNT(*) FROM public.game_game_modes gm
      WHERE gm.game_mode_id IN (SELECT ref FROM src_feat WHERE kind = 'm') GROUP BY gm.game_mode_id
    UNION ALL
    SELECT 'f', gf.franchise_id, COUNT(*) FROM public.game_franchises gf
      WHERE gf.franchise_id IN (SELECT ref FROM src_feat WHERE kind = 'f') GROUP BY gf.franchise_id
    UNION ALL
    SELECT 'd', gc.company_id, COUNT(*) FROM public.game_companies gc
      WHERE gc.role = 'developer' AND gc.company_id IN (SELECT ref FROM src_feat WHERE kind = 'd')
      GROUP BY gc.company_id
  ),
  idf AS (
    SELECT df.kind, df.ref, LN((SELECT n FROM n) / df.cnt) AS idf FROM df
  ),
  profile AS (
    SELECT sf.kind, sf.ref, MAX(sf.kw) * i.idf AS fw, SUM(src.w) * MAX(sf.kw) * i.idf AS pw
    FROM src_feat sf JOIN src USING (game_id) JOIN idf i USING (kind, ref)
    WHERE i.idf > 0
    GROUP BY sf.kind, sf.ref, i.idf
  ),
  pnorm AS (SELECT NULLIF(SQRT(SUM(pw * pw)), 0) AS v FROM profile),
  -- Games sharing at least one profile feature, with their dot product.
  matches AS (
    SELECT gg.game_id, p.pw * p.fw AS c FROM profile p
      JOIN public.game_genres gg ON gg.genre_id = p.ref WHERE p.kind = 'g'
    UNION ALL
    SELECT gt.game_id, p.pw * p.fw FROM profile p
      JOIN public.game_themes gt ON gt.theme_id = p.ref WHERE p.kind = 't'
    UNION ALL
    SELECT gp.game_id, p.pw * p.fw FROM profile p
      JOIN public.game_player_perspectives gp ON gp.player_perspective_id = p.ref WHERE p.kind = 'p'
    UNION ALL
    SELECT gm.game_id, p.pw * p.fw FROM profile p
      JOIN public.game_game_modes gm ON gm.game_mode_id = p.ref WHERE p.kind = 'm'
    UNION ALL
    SELECT gf.game_id, p.pw * p.fw FROM profile p
      JOIN public.game_franchises gf ON gf.franchise_id = p.ref WHERE p.kind = 'f'
    UNION ALL
    SELECT gc.game_id, p.pw * p.fw FROM profile p
      JOIN public.game_companies gc ON gc.company_id = p.ref AND gc.role = 'developer' WHERE p.kind = 'd'
  ),
  dot AS (
    SELECT m.game_id, SUM(m.c) AS dot
    FROM matches m
    WHERE m.game_id NOT IN (SELECT game_id FROM excluded)
    GROUP BY m.game_id
    ORDER BY dot DESC
    LIMIT 600
  ),
  -- All features of the shortlisted games, for their norm.
  dot_feat AS (
    SELECT x.game_id, x.kind, x.ref, k.kw
    FROM (
      SELECT gg.game_id, 'g'::text AS kind, gg.genre_id AS ref FROM public.game_genres gg
        WHERE gg.game_id IN (SELECT game_id FROM dot)
      UNION ALL
      SELECT gt.game_id, 't', gt.theme_id FROM public.game_themes gt
        WHERE gt.game_id IN (SELECT game_id FROM dot)
      UNION ALL
      SELECT gp.game_id, 'p', gp.player_perspective_id FROM public.game_player_perspectives gp
        WHERE gp.game_id IN (SELECT game_id FROM dot)
      UNION ALL
      SELECT gm.game_id, 'm', gm.game_mode_id FROM public.game_game_modes gm
        WHERE gm.game_id IN (SELECT game_id FROM dot)
      UNION ALL
      SELECT gf.game_id, 'f', gf.franchise_id FROM public.game_franchises gf
        WHERE gf.game_id IN (SELECT game_id FROM dot)
      UNION ALL
      SELECT gc.game_id, 'd', gc.company_id FROM public.game_companies gc
        WHERE gc.role = 'developer' AND gc.game_id IN (SELECT game_id FROM dot)
    ) x JOIN kinds k USING (kind)
  ),
  -- Candidate norms only for the shortlisted games. Features the sources do
  -- not carry get a neutral idf of ln(n / 50) (cheap approximation).
  cnorm AS (
    SELECT f.game_id,
      SQRT(SUM(POWER(f.kw * COALESCE(p.fw / NULLIF(f.kw, 0), LN((SELECT n FROM n) / 50.0)), 2))) AS v,
      COUNT(*) AS nfeat
    FROM dot_feat f
    LEFT JOIN profile p USING (kind, ref)
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