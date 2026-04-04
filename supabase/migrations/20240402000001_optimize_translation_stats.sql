-- Migration: Optimize refresh_translation_stats to avoid statement timeout.
-- Problem: The previous implementation ran 20 sequential dynamic queries (2 langs × 10 types + 10 cross-lang).
-- Solution: Single-pass per table computing all languages + cross-lang at once, plus composite indexes.

-- =============================================================================
-- 1. Add composite indexes for the two largest translation tables
-- =============================================================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_game_translations_game_lang
  ON public.game_translations(game_id, language_code);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_character_translations_char_lang
  ON public.character_translations(character_id, language_code);

-- =============================================================================
-- 2. Rewrite the per-type helper to compute all languages in one query
-- =============================================================================
CREATE OR REPLACE FUNCTION refresh_translation_stats_for_type(
  p_entity_type TEXT,
  p_translation_table TEXT,
  p_fk_column TEXT,
  p_required_fields TEXT[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_langs TEXT[] := ARRAY['fr', 'en'];
  v_num_fields INT := array_length(p_required_fields, 1);
  v_field_sum TEXT;
  v_field_check TEXT;
  v_total INT;
BEGIN
  -- Total distinct entities
  EXECUTE format('SELECT COUNT(DISTINCT %I) FROM %I', p_fk_column, p_translation_table)
    INTO v_total;

  IF v_total = 0 THEN
    INSERT INTO translation_stats_cache
      (entity_type, language_code, total, complete, partial, missing, percentage, updated_at)
    SELECT p_entity_type, lang, 0, 0, 0, 0, 100, now()
    FROM unnest(v_langs || ARRAY['_all']) AS lang
    ON CONFLICT (entity_type, language_code)
    DO UPDATE SET total=0, complete=0, partial=0, missing=0, percentage=100, updated_at=now();
    RETURN;
  END IF;

  -- Build field expressions
  SELECT string_agg(
    format('(CASE WHEN %I IS NOT NULL AND %I <> '''' THEN 1 ELSE 0 END)', f, f), ' + '
  ) INTO v_field_sum FROM unnest(p_required_fields) AS f;

  SELECT string_agg(
    format('(%I IS NOT NULL AND %I <> '''')', f, f), ' AND '
  ) INTO v_field_check FROM unnest(p_required_fields) AS f;

  -- Single query: compute per-language stats for all languages at once
  EXECUTE format(
    'INSERT INTO translation_stats_cache
       (entity_type, language_code, total, complete, partial, missing, percentage, updated_at)
     SELECT
       $1,
       t.language_code,
       $2,
       COUNT(*) FILTER (WHERE filled = $3),
       COUNT(*) FILTER (WHERE filled > 0 AND filled < $3),
       $2 - COUNT(*),
       CASE WHEN $2 > 0
         THEN ROUND((COUNT(*) FILTER (WHERE filled = $3))::numeric / $2 * 100)
         ELSE 100
       END,
       now()
     FROM (
       SELECT e.eid, lang.lc AS language_code, COALESCE(lr.filled, 0) AS filled
       FROM (SELECT DISTINCT %I AS eid FROM %I) e
       CROSS JOIN unnest($4::text[]) AS lang(lc)
       LEFT JOIN (
         SELECT %I AS eid, language_code, %s AS filled
         FROM %I
         WHERE language_code = ANY($4)
       ) lr ON lr.eid = e.eid AND lr.language_code = lang.lc
     ) t
     GROUP BY t.language_code
     ON CONFLICT (entity_type, language_code)
     DO UPDATE SET
       total = EXCLUDED.total, complete = EXCLUDED.complete,
       partial = EXCLUDED.partial, missing = EXCLUDED.missing,
       percentage = EXCLUDED.percentage, updated_at = EXCLUDED.updated_at',
    p_fk_column, p_translation_table,
    p_fk_column, v_field_sum, p_translation_table
  ) USING p_entity_type, v_total, v_num_fields, v_langs;

  -- Cross-language (_all): entity is complete only if ALL fields filled in ALL languages
  EXECUTE format(
    'INSERT INTO translation_stats_cache
       (entity_type, language_code, total, complete, partial, missing, percentage, updated_at)
     SELECT
       $1, ''_all'', $2, COUNT(*),
       $2 - COUNT(*), 0,
       CASE WHEN $2 > 0
         THEN ROUND(COUNT(*)::numeric / $2 * 100)
         ELSE 100
       END,
       now()
     FROM (
       SELECT %I
       FROM %I
       WHERE language_code = ANY($3) AND %s
       GROUP BY %I
       HAVING COUNT(DISTINCT language_code) = $4
     ) sub
     ON CONFLICT (entity_type, language_code)
     DO UPDATE SET
       total = EXCLUDED.total, complete = EXCLUDED.complete,
       partial = EXCLUDED.partial, missing = EXCLUDED.missing,
       percentage = EXCLUDED.percentage, updated_at = EXCLUDED.updated_at',
    p_fk_column, p_translation_table, v_field_check, p_fk_column
  ) USING p_entity_type, v_total, v_langs, array_length(v_langs, 1);
END;
$fn$;

-- =============================================================================
-- 3. Simplify the main function (no more separate cross-lang calls)
-- =============================================================================
CREATE OR REPLACE FUNCTION refresh_translation_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET statement_timeout = '30s'
AS $fn$
BEGIN
  -- Each call now computes per-language + cross-language in one pass
  PERFORM refresh_translation_stats_for_type('games',               'game_translations',               'game_id',               ARRAY['title', 'description']);
  PERFORM refresh_translation_stats_for_type('characters',          'character_translations',          'character_id',          ARRAY['name', 'description']);
  PERFORM refresh_translation_stats_for_type('genres',              'genre_translations',              'genre_id',              ARRAY['name']);
  PERFORM refresh_translation_stats_for_type('companies',           'company_translations',            'company_id',            ARRAY['description']);
  PERFORM refresh_translation_stats_for_type('platforms',           'platform_translations',           'platform_id',           ARRAY['name']);
  PERFORM refresh_translation_stats_for_type('character_roles',     'character_role_translations',     'role_id',               ARRAY['name']);
  PERFORM refresh_translation_stats_for_type('genders',             'gender_translations',             'gender_id',             ARRAY['name']);
  PERFORM refresh_translation_stats_for_type('species',             'species_translations',            'species_id',            ARRAY['name']);
  PERFORM refresh_translation_stats_for_type('content_descriptors', 'content_descriptor_translations', 'content_descriptor_id', ARRAY['name']);
  PERFORM refresh_translation_stats_for_type('ratings',             'rating_translations',             'rating_id',             ARRAY['description']);
END;
$fn$;
