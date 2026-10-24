-- Recommendation engine v2: SQL scoring over the whole catalogue.
--
-- Replaces the JS engine, which loaded catalogue-wide tables through PostgREST
-- (capped at 1000 rows: only ~1.7 % of games could ever be recommended) and ran
-- one full pass per library game (minutes for large libraries, issue #447).
--
--  1. IGDB taxonomies used as content features: themes, game modes, player
--     perspectives, franchises (+ set_games_taxonomies() writer).
--  2. recommendation_dismissals: "not interested" feedback per user.
--  3. recommend_games(): one-pass scoring for weighted source games
--     - content: TF-IDF cosine over genres, themes, modes, perspectives,
--       franchises and developers (rare features weigh more);
--     - similar: IGDB similar_games, resolved through igdb_id (both directions);
--     - collaborative: library co-occurrence, only once enough players exist;
--     - quality: metascore, site reviews, popularity.
--  4. recommend_games_for_me(): sources = the caller's library weighted by
--     engagement (playtime, status, rating, recency).
--  5. recommend_similar_games(): sources = one game (game detail page).

-- ============================================================================
-- 1. IGDB taxonomies
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  igdb_id INTEGER NOT NULL UNIQUE,
  slug TEXT,
  name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.game_modes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  igdb_id INTEGER NOT NULL UNIQUE,
  slug TEXT,
  name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.player_perspectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  igdb_id INTEGER NOT NULL UNIQUE,
  slug TEXT,
  name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.franchises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  igdb_id INTEGER NOT NULL UNIQUE,
  slug TEXT,
  name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.game_themes (
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  theme_id UUID NOT NULL REFERENCES public.themes(id) ON DELETE CASCADE,
  PRIMARY KEY (game_id, theme_id)
);
CREATE TABLE IF NOT EXISTS public.game_game_modes (
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  game_mode_id UUID NOT NULL REFERENCES public.game_modes(id) ON DELETE CASCADE,
  PRIMARY KEY (game_id, game_mode_id)
);
CREATE TABLE IF NOT EXISTS public.game_player_perspectives (
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  player_perspective_id UUID NOT NULL REFERENCES public.player_perspectives(id) ON DELETE CASCADE,
  PRIMARY KEY (game_id, player_perspective_id)
);
CREATE TABLE IF NOT EXISTS public.game_franchises (
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  franchise_id UUID NOT NULL REFERENCES public.franchises(id) ON DELETE CASCADE,
  PRIMARY KEY (game_id, franchise_id)
);

CREATE INDEX IF NOT EXISTS idx_game_themes_theme ON public.game_themes (theme_id);
CREATE INDEX IF NOT EXISTS idx_game_game_modes_mode ON public.game_game_modes (game_mode_id);
CREATE INDEX IF NOT EXISTS idx_game_player_perspectives_perspective
  ON public.game_player_perspectives (player_perspective_id);
CREATE INDEX IF NOT EXISTS idx_game_franchises_franchise ON public.game_franchises (franchise_id);
CREATE INDEX IF NOT EXISTS idx_game_companies_developer
  ON public.game_companies (company_id, game_id) WHERE role = 'developer';
CREATE INDEX IF NOT EXISTS idx_games_igdb_id ON public.games (igdb_id);

ALTER TABLE public.games ADD COLUMN IF NOT EXISTS igdb_taxonomies_synced_at TIMESTAMPTZ;
COMMENT ON COLUMN public.games.igdb_taxonomies_synced_at IS
  'Last write of IGDB themes / game modes / perspectives / franchises (set_games_taxonomies). NULL = never synced (backfill target).';

COMMENT ON TABLE public.themes IS 'IGDB themes (/themes), matched by igdb_id. Recommendation content feature.';
COMMENT ON TABLE public.game_modes IS 'IGDB game modes (/game_modes), matched by igdb_id. Recommendation content feature.';
COMMENT ON TABLE public.player_perspectives IS 'IGDB player perspectives (/player_perspectives), matched by igdb_id.';
COMMENT ON TABLE public.franchises IS 'IGDB franchises (/franchises), matched by igdb_id. Strong recommendation feature.';
COMMENT ON TABLE public.game_themes IS 'Game ↔ IGDB theme links (written by set_games_taxonomies).';
COMMENT ON TABLE public.game_game_modes IS 'Game ↔ IGDB game mode links (written by set_games_taxonomies).';
COMMENT ON TABLE public.game_player_perspectives IS 'Game ↔ IGDB player perspective links (written by set_games_taxonomies).';
COMMENT ON TABLE public.game_franchises IS 'Game ↔ IGDB franchise links (written by set_games_taxonomies).';

-- Public catalogue data: readable by everyone, written by admins / service role
-- (same model as genres / game_genres).
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'themes', 'game_modes', 'player_perspectives', 'franchises',
    'game_themes', 'game_game_modes', 'game_player_perspectives', 'game_franchises'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS "%s are viewable by everyone" ON public.%I', t, t);
    EXECUTE format('CREATE POLICY "%s are viewable by everyone" ON public.%I FOR SELECT USING (true)', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "Admins can manage %s" ON public.%I', t, t);
    EXECUTE format(
      'CREATE POLICY "Admins can manage %s" ON public.%I FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin())',
      t, t
    );
    EXECUTE format('GRANT SELECT ON public.%I TO anon, authenticated', t);
    EXECUTE format('GRANT INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
  END LOOP;
END $$;

-- Writes the taxonomies of many games in one call.
-- p_items: [{ "game_id": uuid, "taxonomies": { "themes": [...], "game_modes": [...],
--            "player_perspectives": [...], "franchises": [...] } }]
-- Each list holds IGDB ids or { id, name, slug } objects. Only the keys present
-- are replaced, so partial webhook payloads leave the other kinds untouched.
CREATE OR REPLACE FUNCTION public.set_games_taxonomies(p_items JSONB)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_item JSONB;
  v_game_id UUID;
  v_tax JSONB;
  v_count INTEGER := 0;
BEGIN
  FOR v_item IN SELECT * FROM jsonb_array_elements(COALESCE(p_items, '[]'::jsonb)) LOOP
    v_game_id := (v_item->>'game_id')::uuid;
    v_tax := COALESCE(v_item->'taxonomies', '{}'::jsonb);
    CONTINUE WHEN v_game_id IS NULL;

    IF v_tax ? 'themes' THEN
      -- Separate statement: in one CTE the re-inserted links would collide with
      -- the rows being deleted (same snapshot) and be dropped.
      DELETE FROM public.game_themes WHERE game_id = v_game_id;
      WITH src AS (
        SELECT DISTINCT ON (igdb_id) igdb_id, name, slug FROM (
          SELECT CASE jsonb_typeof(e) WHEN 'number' THEN e::text::int ELSE (e->>'id')::int END AS igdb_id,
                 e->>'name' AS name, e->>'slug' AS slug
          FROM jsonb_array_elements(v_tax->'themes') e
        ) x WHERE igdb_id IS NOT NULL
      ), up AS (
        INSERT INTO public.themes (igdb_id, name, slug) SELECT igdb_id, name, slug FROM src
        ON CONFLICT (igdb_id) DO UPDATE
          SET name = COALESCE(EXCLUDED.name, public.themes.name),
              slug = COALESCE(EXCLUDED.slug, public.themes.slug)
        RETURNING id
      )
      INSERT INTO public.game_themes (game_id, theme_id) SELECT v_game_id, id FROM up
      ON CONFLICT DO NOTHING;

      UPDATE public.games
        SET is_adult = EXISTS (
          SELECT 1 FROM jsonb_array_elements(v_tax->'themes') e
          WHERE (CASE jsonb_typeof(e) WHEN 'number' THEN e::text::int ELSE (e->>'id')::int END) = 42
        )
        WHERE id = v_game_id;
    END IF;

    IF v_tax ? 'game_modes' THEN
      -- Separate statement: in one CTE the re-inserted links would collide with
      -- the rows being deleted (same snapshot) and be dropped.
      DELETE FROM public.game_game_modes WHERE game_id = v_game_id;
      WITH src AS (
        SELECT DISTINCT ON (igdb_id) igdb_id, name, slug FROM (
          SELECT CASE jsonb_typeof(e) WHEN 'number' THEN e::text::int ELSE (e->>'id')::int END AS igdb_id,
                 e->>'name' AS name, e->>'slug' AS slug
          FROM jsonb_array_elements(v_tax->'game_modes') e
        ) x WHERE igdb_id IS NOT NULL
      ), up AS (
        INSERT INTO public.game_modes (igdb_id, name, slug) SELECT igdb_id, name, slug FROM src
        ON CONFLICT (igdb_id) DO UPDATE
          SET name = COALESCE(EXCLUDED.name, public.game_modes.name),
              slug = COALESCE(EXCLUDED.slug, public.game_modes.slug)
        RETURNING id
      )
      INSERT INTO public.game_game_modes (game_id, game_mode_id) SELECT v_game_id, id FROM up
      ON CONFLICT DO NOTHING;
    END IF;

    IF v_tax ? 'player_perspectives' THEN
      -- Separate statement: in one CTE the re-inserted links would collide with
      -- the rows being deleted (same snapshot) and be dropped.
      DELETE FROM public.game_player_perspectives WHERE game_id = v_game_id;
      WITH src AS (
        SELECT DISTINCT ON (igdb_id) igdb_id, name, slug FROM (
          SELECT CASE jsonb_typeof(e) WHEN 'number' THEN e::text::int ELSE (e->>'id')::int END AS igdb_id,
                 e->>'name' AS name, e->>'slug' AS slug
          FROM jsonb_array_elements(v_tax->'player_perspectives') e
        ) x WHERE igdb_id IS NOT NULL
      ), up AS (
        INSERT INTO public.player_perspectives (igdb_id, name, slug) SELECT igdb_id, name, slug FROM src
        ON CONFLICT (igdb_id) DO UPDATE
          SET name = COALESCE(EXCLUDED.name, public.player_perspectives.name),
              slug = COALESCE(EXCLUDED.slug, public.player_perspectives.slug)
        RETURNING id
      )
      INSERT INTO public.game_player_perspectives (game_id, player_perspective_id)
        SELECT v_game_id, id FROM up
      ON CONFLICT DO NOTHING;
    END IF;

    IF v_tax ? 'franchises' THEN
      -- Separate statement: in one CTE the re-inserted links would collide with
      -- the rows being deleted (same snapshot) and be dropped.
      DELETE FROM public.game_franchises WHERE game_id = v_game_id;
      WITH src AS (
        SELECT DISTINCT ON (igdb_id) igdb_id, name, slug FROM (
          SELECT CASE jsonb_typeof(e) WHEN 'number' THEN e::text::int ELSE (e->>'id')::int END AS igdb_id,
                 e->>'name' AS name, e->>'slug' AS slug
          FROM jsonb_array_elements(v_tax->'franchises') e
        ) x WHERE igdb_id IS NOT NULL
      ), up AS (
        INSERT INTO public.franchises (igdb_id, name, slug) SELECT igdb_id, name, slug FROM src
        ON CONFLICT (igdb_id) DO UPDATE
          SET name = COALESCE(EXCLUDED.name, public.franchises.name),
              slug = COALESCE(EXCLUDED.slug, public.franchises.slug)
        RETURNING id
      )
      INSERT INTO public.game_franchises (game_id, franchise_id) SELECT v_game_id, id FROM up
      ON CONFLICT DO NOTHING;
    END IF;

    UPDATE public.games SET igdb_taxonomies_synced_at = NOW() WHERE id = v_game_id;
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END;
$$;

COMMENT ON FUNCTION public.set_games_taxonomies(JSONB) IS
  'Replaces the IGDB themes / game modes / perspectives / franchises of many games ([{game_id, taxonomies}]). Upserts the reference rows by igdb_id, keeps is_adult in sync with theme 42. Writes go through RLS (admins) or the service role.';

REVOKE EXECUTE ON FUNCTION public.set_games_taxonomies(JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_games_taxonomies(JSONB) TO authenticated, service_role;

-- ============================================================================
-- 2. "Not interested" feedback
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.recommendation_dismissals (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, game_id)
);

COMMENT ON TABLE public.recommendation_dismissals IS
  'Games a player marked "not interested": never recommended to them again.';

ALTER TABLE public.recommendation_dismissals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own dismissals" ON public.recommendation_dismissals;
CREATE POLICY "Users read own dismissals" ON public.recommendation_dismissals
  FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
DROP POLICY IF EXISTS "Users add own dismissals" ON public.recommendation_dismissals;
CREATE POLICY "Users add own dismissals" ON public.recommendation_dismissals
  FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);
DROP POLICY IF EXISTS "Users remove own dismissals" ON public.recommendation_dismissals;
CREATE POLICY "Users remove own dismissals" ON public.recommendation_dismissals
  FOR DELETE TO authenticated USING ((SELECT auth.uid()) = user_id);

GRANT SELECT, INSERT, DELETE ON public.recommendation_dismissals TO authenticated;
-- anon only needs SELECT so recommend_similar_games() can be planned for
-- visitors; no policy targets anon, so it reads zero rows.
GRANT SELECT ON public.recommendation_dismissals TO anon;
GRANT ALL ON public.recommendation_dismissals TO service_role;

-- ============================================================================
-- 3. Scoring
-- ============================================================================

-- Weighted source games → ranked candidates. Pure read over public catalogue
-- data (library co-occurrence respects user_library RLS / stats_private).
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
  quality_score DOUBLE PRECISION,
  reason_game_id UUID
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
    SELECT g.id AS game_id, SQRT(src.w) / (1 + 0.1 * COALESCE(s.display_order, 0)) AS support, src.game_id AS via
    FROM src
    JOIN public.game_similar_games s ON s.game_id = src.game_id
    JOIN public.games g ON g.igdb_id = s.similar_igdb_id
    UNION ALL
    SELECT s.game_id, 0.5 * SQRT(src.w), src.game_id
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
  ),
  top AS (
    SELECT * FROM ranked WHERE rank_in_franchise <= 2
    ORDER BY total DESC
    LIMIT LEAST(GREATEST(COALESCE(p_limit, 10), 1), 50)
  ),
  -- "Because of": the source sharing the most weighted features with the pick;
  -- a direct IGDB similar link wins. Engagement only breaks ties (sqrt), so a
  -- heavily played game does not explain every pick.
  top_feat AS (
    SELECT f.game_id, f.feature FROM feat f WHERE f.game_id IN (SELECT game_id FROM top)
  ),
  reason_raw AS (
    SELECT tf.game_id, sf.game_id AS via, SUM(p.fw) * SQRT(MAX(src.w)) AS strength
    FROM top_feat tf
    JOIN src_feat sf ON sf.feature = tf.feature
    JOIN profile p ON p.feature = tf.feature
    JOIN src ON src.game_id = sf.game_id
    GROUP BY tf.game_id, sf.game_id
    UNION ALL
    SELECT sr.game_id, sr.via, 1000 + sr.support
    FROM sim_raw sr WHERE sr.game_id IN (SELECT game_id FROM top)
  ),
  reason AS (
    SELECT DISTINCT ON (game_id) game_id, via AS reason_game_id
    FROM reason_raw
    ORDER BY game_id, strength DESC
  )
  SELECT t.game_id, t.total, t.content_s, t.similar_s, t.collab_s, t.quality_s, r.reason_game_id
  FROM top t LEFT JOIN reason r USING (game_id)
  ORDER BY t.total DESC;
$$;

COMMENT ON FUNCTION public.recommend_games(UUID[], DOUBLE PRECISION[], UUID[], INTEGER) IS
  'Ranks catalogue games for weighted source games. Relevance: 50 % TF-IDF content cosine (genres, themes, perspectives, modes, franchises, developers), 35 % IGDB similar games, 15 % library co-occurrence (only with ≥ 20 players, else re-normalised); scaled by quality (metascore, reviews, popularity) from ×0.7 to ×1. DLC / bundles, adult and cover-less games excluded, max two per franchise; returns the source that explains each pick.';

-- Engagement weight of a library entry.
CREATE OR REPLACE FUNCTION public.library_engagement_weight(
  p_play_time_hours NUMERIC,
  p_status TEXT,
  p_rating INTEGER,
  p_added_at TIMESTAMPTZ
)
RETURNS DOUBLE PRECISION
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$
  SELECT GREATEST(0,
    0.15
    + 1.5 * LN(1 + GREATEST(COALESCE(p_play_time_hours, 0), 0))
    + CASE p_status WHEN 'playing' THEN 2 WHEN 'completed' THEN 1.5 WHEN 'wishlist' THEN 0.6 ELSE 0 END
    + CASE p_rating WHEN 5 THEN 2 WHEN 4 THEN 1 WHEN 2 THEN -0.5 WHEN 1 THEN -1.5 ELSE 0 END
  )::float8 * CASE WHEN p_added_at > NOW() - INTERVAL '60 days' THEN 1.25 ELSE 1 END;
$$;

COMMENT ON FUNCTION public.library_engagement_weight(NUMERIC, TEXT, INTEGER, TIMESTAMPTZ) IS
  'Weight of a library game as a taste source: log playtime, status, personal rating, recency. Unplayed owned games weigh 0.15.';

CREATE OR REPLACE FUNCTION public.recommend_games_for_me(p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  game_id UUID,
  score DOUBLE PRECISION,
  content_score DOUBLE PRECISION,
  similar_score DOUBLE PRECISION,
  collaborative_score DOUBLE PRECISION,
  quality_score DOUBLE PRECISION,
  reason_game_id UUID
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

CREATE OR REPLACE FUNCTION public.recommend_similar_games(p_game_id UUID, p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  game_id UUID,
  score DOUBLE PRECISION,
  content_score DOUBLE PRECISION,
  similar_score DOUBLE PRECISION,
  collaborative_score DOUBLE PRECISION,
  quality_score DOUBLE PRECISION,
  reason_game_id UUID
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
REVOKE EXECUTE ON FUNCTION public.library_engagement_weight(NUMERIC, TEXT, INTEGER, TIMESTAMPTZ) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.recommend_games_for_me(INTEGER) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.recommend_similar_games(UUID, INTEGER) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.recommend_games(UUID[], DOUBLE PRECISION[], UUID[], INTEGER)
  TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.library_engagement_weight(NUMERIC, TEXT, INTEGER, TIMESTAMPTZ)
  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.recommend_games_for_me(INTEGER) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.recommend_similar_games(UUID, INTEGER)
  TO anon, authenticated, service_role;
