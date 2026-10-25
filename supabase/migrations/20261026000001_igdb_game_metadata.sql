-- Migration: IGDB game metadata (issues #77 to #82).
--
-- Completes the IGDB data stored for each game, next to the taxonomies added by
-- 20261024000002_recommendation_engine.sql (themes, game modes, perspectives,
-- franchises):
--   - keywords, game engines and series (IGDB "collections", stored in series:
--     game_collections is the user collections feature): reference +
--     link tables, same model as themes;
--   - official websites and multiplayer modes: per-game rows;
--   - IGDB total rating (stored only, not displayed yet);
--   - one "synced at" column per synchronisable field, used by the admin bulk
--     import to list games whose field was never synced;
--   - franchise descriptions (FR/EN) editable in the admin, admin-created
--     franchises (no IGDB id);
--   - set_games_metadata RPC replacing set_games_taxonomies;
--   - list_franchises RPC for the /franchises page.

-- ============================================================================
-- 1. Reference + link tables (keywords, game engines, collections)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  igdb_id INTEGER NOT NULL UNIQUE,
  slug TEXT,
  name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.game_engines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  igdb_id INTEGER NOT NULL UNIQUE,
  slug TEXT,
  name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  igdb_id INTEGER NOT NULL UNIQUE,
  slug TEXT,
  name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.game_keywords (
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  keyword_id UUID NOT NULL REFERENCES public.keywords(id) ON DELETE CASCADE,
  PRIMARY KEY (game_id, keyword_id)
);
CREATE TABLE IF NOT EXISTS public.game_game_engines (
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  game_engine_id UUID NOT NULL REFERENCES public.game_engines(id) ON DELETE CASCADE,
  PRIMARY KEY (game_id, game_engine_id)
);
CREATE TABLE IF NOT EXISTS public.game_series (
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  series_id UUID NOT NULL REFERENCES public.series(id) ON DELETE CASCADE,
  PRIMARY KEY (game_id, series_id)
);

CREATE INDEX IF NOT EXISTS idx_game_keywords_keyword ON public.game_keywords (keyword_id);
CREATE INDEX IF NOT EXISTS idx_game_game_engines_engine ON public.game_game_engines (game_engine_id);
CREATE INDEX IF NOT EXISTS idx_game_series_series ON public.game_series (series_id);
-- Trigram index: the games search matches keyword names with ILIKE (no wildcard).
CREATE INDEX IF NOT EXISTS idx_keywords_name_trgm ON public.keywords USING gin (name extensions.gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_franchises_slug ON public.franchises (slug);
CREATE INDEX IF NOT EXISTS idx_series_slug ON public.series (slug);
CREATE INDEX IF NOT EXISTS idx_game_engines_slug ON public.game_engines (slug);

COMMENT ON TABLE public.keywords IS 'IGDB keywords (/keywords), matched by igdb_id. Used by the game search, not displayed.';
COMMENT ON TABLE public.game_engines IS 'IGDB game engines (/game_engines), matched by igdb_id.';
COMMENT ON TABLE public.series IS 'IGDB collections (/collections, game series), matched by igdb_id. Shown with franchises. Not to be confused with the user collections (game_collections).';
COMMENT ON TABLE public.game_keywords IS 'Game ↔ IGDB keyword links (written by set_games_metadata).';
COMMENT ON TABLE public.game_game_engines IS 'Game ↔ IGDB game engine links (written by set_games_metadata).';
COMMENT ON TABLE public.game_series IS 'Game ↔ IGDB collection (series) links (written by set_games_metadata).';

-- ============================================================================
-- 2. Per-game rows: websites and multiplayer modes
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.game_websites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  type_id INTEGER,
  trusted BOOLEAN NOT NULL DEFAULT FALSE,
  position INTEGER NOT NULL DEFAULT 0,
  UNIQUE (game_id, url)
);
CREATE INDEX IF NOT EXISTS idx_game_websites_game ON public.game_websites (game_id, position);

COMMENT ON TABLE public.game_websites IS 'Official links of a game (IGDB /websites): official site, stores, wikis, social networks.';
COMMENT ON COLUMN public.game_websites.type_id IS 'IGDB website type id (/website_types): 1 official, 3 wikipedia, 13 steam, 16 epic, 17 gog… NULL = other.';
COMMENT ON COLUMN public.game_websites.trusted IS 'Link verified by IGDB.';

CREATE TABLE IF NOT EXISTS public.game_multiplayer_modes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  igdb_platform_id INTEGER,
  campaign_coop BOOLEAN NOT NULL DEFAULT FALSE,
  drop_in BOOLEAN NOT NULL DEFAULT FALSE,
  lan_coop BOOLEAN NOT NULL DEFAULT FALSE,
  offline_coop BOOLEAN NOT NULL DEFAULT FALSE,
  offline_coop_max INTEGER,
  offline_max INTEGER,
  online_coop BOOLEAN NOT NULL DEFAULT FALSE,
  online_coop_max INTEGER,
  online_max INTEGER,
  splitscreen BOOLEAN NOT NULL DEFAULT FALSE,
  splitscreen_online BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS idx_game_multiplayer_modes_game ON public.game_multiplayer_modes (game_id);

COMMENT ON TABLE public.game_multiplayer_modes IS 'Multiplayer capabilities of a game (IGDB /multiplayer_modes), one row per platform or a single row for all platforms.';
COMMENT ON COLUMN public.game_multiplayer_modes.igdb_platform_id IS 'IGDB platform id (platforms.igdb_id); NULL = all platforms.';

-- ============================================================================
-- 3. Franchises: admin descriptions and admin-created franchises
-- ============================================================================

ALTER TABLE public.franchises ALTER COLUMN igdb_id DROP NOT NULL;
ALTER TABLE public.franchises ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE TABLE IF NOT EXISTS public.franchise_translations (
  franchise_id UUID NOT NULL REFERENCES public.franchises(id) ON DELETE CASCADE,
  language_code TEXT NOT NULL,
  description TEXT,
  PRIMARY KEY (franchise_id, language_code)
);
COMMENT ON TABLE public.franchise_translations IS 'Admin-written description of a franchise per language (IGDB has none).';
COMMENT ON COLUMN public.franchises.igdb_id IS 'IGDB franchise id; NULL for franchises created in the admin.';

-- ============================================================================
-- 4. Games: IGDB rating and per-field sync timestamps
-- ============================================================================

ALTER TABLE public.games
  ADD COLUMN IF NOT EXISTS igdb_total_rating NUMERIC(5, 2),
  ADD COLUMN IF NOT EXISTS igdb_total_rating_count INTEGER,
  ADD COLUMN IF NOT EXISTS igdb_themes_synced_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS igdb_game_modes_synced_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS igdb_player_perspectives_synced_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS igdb_multiplayer_modes_synced_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS igdb_franchises_synced_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS igdb_keywords_synced_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS igdb_game_engines_synced_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS igdb_websites_synced_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS igdb_rating_synced_at TIMESTAMPTZ;

COMMENT ON COLUMN public.games.igdb_total_rating IS 'IGDB total_rating (users + critics, 0-100). Stored only, not displayed yet.';
COMMENT ON COLUMN public.games.igdb_total_rating_count IS 'IGDB total_rating_count (number of ratings behind igdb_total_rating).';
COMMENT ON COLUMN public.games.igdb_keywords_synced_at IS
  'Last IGDB sync of the field (set_games_metadata). NULL = never synced: admin bulk import and backfill target. Same meaning for the other igdb_*_synced_at columns.';

-- The four taxonomies were synced together until now.
UPDATE public.games
SET igdb_themes_synced_at = igdb_taxonomies_synced_at,
    igdb_game_modes_synced_at = igdb_taxonomies_synced_at,
    igdb_player_perspectives_synced_at = igdb_taxonomies_synced_at
WHERE igdb_taxonomies_synced_at IS NOT NULL;

-- Franchises now also cover collections: the franchise column stays NULL so
-- the backfill fetches the collections of every game.
ALTER TABLE public.games DROP COLUMN IF EXISTS igdb_taxonomies_synced_at;

-- Manual edits were tracked under one "taxonomies" field; they become one
-- override per field.
INSERT INTO public.game_field_overrides (game_id, field_name, modified_by, modified_at)
SELECT o.game_id, f.field_name, o.modified_by, o.modified_at
FROM public.game_field_overrides o
CROSS JOIN (VALUES ('themes'), ('game_modes'), ('player_perspectives'), ('franchises')) AS f(field_name)
WHERE o.field_name = 'taxonomies'
ON CONFLICT (game_id, field_name) DO NOTHING;
DELETE FROM public.game_field_overrides WHERE field_name = 'taxonomies';

-- ============================================================================
-- 5. RLS: public catalogue data, written by admins / service role
-- ============================================================================

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'keywords', 'game_engines', 'series',
    'game_keywords', 'game_game_engines', 'game_series',
    'game_websites', 'game_multiplayer_modes', 'franchise_translations'
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

-- ============================================================================
-- 6. set_games_metadata: one write path for imports, syncs and webhooks
-- ============================================================================

-- Replaces the links of one game for one named IGDB entity kind. p_entries
-- holds IGDB ids or { id, name, slug } objects; id-only entries never wipe
-- names already known.
CREATE OR REPLACE FUNCTION public.set_game_named_links(
  p_game_id UUID,
  p_entries JSONB,
  p_ref_table TEXT,
  p_link_table TEXT,
  p_link_column TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  -- Callable through PostgREST: only the metadata tables are accepted.
  IF (p_ref_table, p_link_table, p_link_column) NOT IN (
    ('themes', 'game_themes', 'theme_id'),
    ('game_modes', 'game_game_modes', 'game_mode_id'),
    ('player_perspectives', 'game_player_perspectives', 'player_perspective_id'),
    ('franchises', 'game_franchises', 'franchise_id'),
    ('series', 'game_series', 'series_id'),
    ('keywords', 'game_keywords', 'keyword_id'),
    ('game_engines', 'game_game_engines', 'game_engine_id')
  ) THEN
    RAISE EXCEPTION 'set_game_named_links: unsupported table %', p_link_table USING ERRCODE = '22023';
  END IF;

  -- Separate statement: in one CTE the re-inserted links would collide with
  -- the rows being deleted (same snapshot) and be dropped.
  EXECUTE format('DELETE FROM public.%I WHERE game_id = $1', p_link_table) USING p_game_id;
  EXECUTE format($sql$
    WITH src AS (
      SELECT DISTINCT ON (igdb_id) igdb_id, name, slug FROM (
        SELECT CASE jsonb_typeof(e) WHEN 'number' THEN e::text::int ELSE (e->>'id')::int END AS igdb_id,
               e->>'name' AS name, e->>'slug' AS slug
        FROM jsonb_array_elements(COALESCE($2, '[]'::jsonb)) e
      ) x WHERE igdb_id IS NOT NULL
    ), up AS (
      INSERT INTO public.%1$I (igdb_id, name, slug) SELECT igdb_id, name, slug FROM src
      ON CONFLICT (igdb_id) DO UPDATE
        SET name = COALESCE(EXCLUDED.name, public.%1$I.name),
            slug = COALESCE(EXCLUDED.slug, public.%1$I.slug)
      RETURNING id
    )
    INSERT INTO public.%2$I (game_id, %3$I) SELECT $1, id FROM up
    ON CONFLICT DO NOTHING
  $sql$, p_ref_table, p_link_table, p_link_column) USING p_game_id, p_entries;
END;
$$;

COMMENT ON FUNCTION public.set_game_named_links(UUID, JSONB, TEXT, TEXT, TEXT) IS
  'Helper of set_games_metadata: replaces the links of a game to one IGDB entity kind (themes, keywords…), upserting the reference rows by igdb_id. Invoker rights: RLS limits writes to admins / service role.';

REVOKE EXECUTE ON FUNCTION public.set_game_named_links(UUID, JSONB, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_game_named_links(UUID, JSONB, TEXT, TEXT, TEXT) TO authenticated, service_role;

-- Writes the IGDB metadata of many games in one call.
-- p_items: [{ "game_id": uuid, "metadata": {
--   "themes" | "game_modes" | "player_perspectives" | "franchises" | "collections"
--   | "keywords" | "game_engines": [igdb id | {id, name, slug}],
--   "websites": [{url, type, trusted}],
--   "multiplayer_modes": [{platform, campaigncoop, dropin, lancoop, offlinecoop,
--      offlinecoopmax, offlinemax, onlinecoop, onlinecoopmax, onlinemax,
--      splitscreen, splitscreenonline}],
--   "rating": {total_rating, total_rating_count} } }]
-- Only the keys present are replaced (partial webhook payloads leave the other
-- fields untouched); each key stamps its igdb_*_synced_at column.
CREATE OR REPLACE FUNCTION public.set_games_metadata(p_items JSONB)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_item JSONB;
  v_game_id UUID;
  v_meta JSONB;
  v_count INTEGER := 0;
  v_kind RECORD;
BEGIN
  -- Invoker rights: writes go through RLS (admins) or the service role.
  FOR v_item IN SELECT * FROM jsonb_array_elements(COALESCE(p_items, '[]'::jsonb)) LOOP
    v_game_id := (v_item->>'game_id')::uuid;
    v_meta := COALESCE(v_item->'metadata', '{}'::jsonb);
    CONTINUE WHEN v_game_id IS NULL;

    FOR v_kind IN
      SELECT * FROM (VALUES
        ('themes', 'themes', 'game_themes', 'theme_id', 'igdb_themes_synced_at'),
        ('game_modes', 'game_modes', 'game_game_modes', 'game_mode_id', 'igdb_game_modes_synced_at'),
        ('player_perspectives', 'player_perspectives', 'game_player_perspectives', 'player_perspective_id', 'igdb_player_perspectives_synced_at'),
        ('franchises', 'franchises', 'game_franchises', 'franchise_id', 'igdb_franchises_synced_at'),
        ('collections', 'series', 'game_series', 'series_id', 'igdb_franchises_synced_at'),
        ('keywords', 'keywords', 'game_keywords', 'keyword_id', 'igdb_keywords_synced_at'),
        ('game_engines', 'game_engines', 'game_game_engines', 'game_engine_id', 'igdb_game_engines_synced_at')
      ) AS k(meta_key, ref_table, link_table, link_column, synced_column)
    LOOP
      CONTINUE WHEN NOT v_meta ? v_kind.meta_key;
      PERFORM public.set_game_named_links(
        v_game_id, v_meta->v_kind.meta_key, v_kind.ref_table, v_kind.link_table, v_kind.link_column
      );
      EXECUTE format('UPDATE public.games SET %I = NOW() WHERE id = $1', v_kind.synced_column)
        USING v_game_id;
    END LOOP;

    IF v_meta ? 'themes' THEN
      UPDATE public.games
        SET is_adult = EXISTS (
          SELECT 1 FROM jsonb_array_elements(v_meta->'themes') e
          WHERE (CASE jsonb_typeof(e) WHEN 'number' THEN e::text::int ELSE (e->>'id')::int END) = 42
        )
        WHERE id = v_game_id;
    END IF;

    IF v_meta ? 'websites' THEN
      DELETE FROM public.game_websites WHERE game_id = v_game_id;
      INSERT INTO public.game_websites (game_id, url, type_id, trusted, position)
      SELECT DISTINCT ON (url) v_game_id, url, type_id, trusted, position FROM (
        SELECT NULLIF(TRIM(w.value->>'url'), '') AS url,
               (w.value->>'type')::int AS type_id,
               COALESCE((w.value->>'trusted')::boolean, FALSE) AS trusted,
               (w.ordinality - 1)::int AS position
        FROM jsonb_array_elements(v_meta->'websites') WITH ORDINALITY AS w(value, ordinality)
      ) x
      WHERE url IS NOT NULL
      ORDER BY url, position
      ON CONFLICT (game_id, url) DO NOTHING;
      UPDATE public.games SET igdb_websites_synced_at = NOW() WHERE id = v_game_id;
    END IF;

    IF v_meta ? 'multiplayer_modes' THEN
      DELETE FROM public.game_multiplayer_modes WHERE game_id = v_game_id;
      INSERT INTO public.game_multiplayer_modes (
        game_id, igdb_platform_id, campaign_coop, drop_in, lan_coop, offline_coop,
        offline_coop_max, offline_max, online_coop, online_coop_max, online_max,
        splitscreen, splitscreen_online
      )
      SELECT v_game_id,
        CASE jsonb_typeof(m->'platform') WHEN 'number' THEN (m->>'platform')::int
          WHEN 'object' THEN (m->'platform'->>'id')::int END,
        COALESCE((m->>'campaigncoop')::boolean, FALSE),
        COALESCE((m->>'dropin')::boolean, FALSE),
        COALESCE((m->>'lancoop')::boolean, FALSE),
        COALESCE((m->>'offlinecoop')::boolean, FALSE),
        NULLIF((m->>'offlinecoopmax')::int, 0),
        NULLIF((m->>'offlinemax')::int, 0),
        COALESCE((m->>'onlinecoop')::boolean, FALSE),
        NULLIF((m->>'onlinecoopmax')::int, 0),
        NULLIF((m->>'onlinemax')::int, 0),
        COALESCE((m->>'splitscreen')::boolean, FALSE),
        COALESCE((m->>'splitscreenonline')::boolean, FALSE)
      FROM jsonb_array_elements(v_meta->'multiplayer_modes') m
      WHERE jsonb_typeof(m) = 'object';
      UPDATE public.games SET igdb_multiplayer_modes_synced_at = NOW() WHERE id = v_game_id;
    END IF;

    IF v_meta ? 'rating' THEN
      UPDATE public.games
        SET igdb_total_rating = ROUND(((v_meta->'rating'->>'total_rating')::numeric), 2),
            igdb_total_rating_count = (v_meta->'rating'->>'total_rating_count')::int,
            igdb_rating_synced_at = NOW()
        WHERE id = v_game_id;
    END IF;

    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END;
$$;

COMMENT ON FUNCTION public.set_games_metadata(JSONB) IS
  'Replaces the IGDB metadata of many games ([{game_id, metadata}]): themes, game modes, perspectives, franchises, collections, keywords, engines, websites, multiplayer modes, total rating. Only the keys present are written; each stamps its igdb_*_synced_at column. Writes go through RLS (admins) or the service role.';

REVOKE EXECUTE ON FUNCTION public.set_games_metadata(JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_games_metadata(JSONB) TO authenticated, service_role;

DROP FUNCTION IF EXISTS public.set_games_taxonomies(JSONB);

-- ============================================================================
-- 7. Franchise listing (franchises + collections, one page type)
-- ============================================================================

-- Franchises and IGDB collections are listed together; a collection sharing
-- its slug with a franchise is the same series and is not listed twice.
-- Only entries with at least one non-adult game; visual = cover of the most
-- popular game.
CREATE OR REPLACE FUNCTION public.list_franchises(
  p_search TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 24,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  kind TEXT,
  id UUID,
  slug TEXT,
  name TEXT,
  game_count BIGINT,
  cover_image_url TEXT,
  total_count BIGINT
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
  WITH entries AS (
    SELECT 'franchise'::text AS kind, f.id, f.slug, f.name, gf.game_id
    FROM public.franchises f JOIN public.game_franchises gf ON gf.franchise_id = f.id
    UNION ALL
    SELECT 'series', c.id, c.slug, c.name, gc.game_id
    FROM public.series c JOIN public.game_series gc ON gc.series_id = c.id
    WHERE NOT EXISTS (SELECT 1 FROM public.franchises f2 WHERE f2.slug = c.slug)
  ),
  visible AS (
    SELECT e.*, g.cover_image_url, g.hybrid_popularity_score
    FROM entries e JOIN public.games g ON g.id = e.game_id
    WHERE NOT g.is_adult AND e.slug IS NOT NULL AND e.name IS NOT NULL
      AND (p_search IS NULL OR e.name ILIKE '%' || p_search || '%')
  ),
  grouped AS (
    SELECT v.kind, v.id, v.slug, v.name, COUNT(*) AS game_count,
      (ARRAY_AGG(v.cover_image_url ORDER BY v.hybrid_popularity_score DESC NULLS LAST)
        FILTER (WHERE v.cover_image_url IS NOT NULL))[1] AS cover_image_url,
      MAX(v.hybrid_popularity_score) AS popularity
    FROM visible v
    GROUP BY v.kind, v.id, v.slug, v.name
  )
  SELECT g.kind, g.id, g.slug, g.name, g.game_count, g.cover_image_url, COUNT(*) OVER () AS total_count
  FROM grouped g
  ORDER BY g.popularity DESC NULLS LAST, g.game_count DESC, g.name
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 24), 1), 100)
  OFFSET GREATEST(COALESCE(p_offset, 0), 0);
$$;

COMMENT ON FUNCTION public.list_franchises(TEXT, INTEGER, INTEGER) IS
  'Franchises and IGDB collections (series) with at least one non-adult game, most popular first, optionally filtered by name.';

REVOKE EXECUTE ON FUNCTION public.list_franchises(TEXT, INTEGER, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_franchises(TEXT, INTEGER, INTEGER) TO anon, authenticated, service_role;
