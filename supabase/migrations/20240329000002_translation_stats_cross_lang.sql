-- Migration: Add cross-language ("all languages complete") stats to translation_stats_cache.
-- An entity counts as "translated" only when it is complete in EVERY supported language.
-- Stored with language_code = '_all' so the dashboard can show a single progress number
-- that matches what the missing-items list displays.

CREATE OR REPLACE FUNCTION refresh_translation_stats_cross_lang(
  p_entity_type        TEXT,
  p_translation_table  TEXT,
  p_fk_column          TEXT,
  p_required_fields    TEXT[],
  p_languages          TEXT[] DEFAULT ARRAY['fr','en']
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_total          INT;
  v_complete_all   INT;
  v_num_langs      INT := array_length(p_languages, 1);
  v_field_check    TEXT;
BEGIN
  -- Total distinct entities that have at least one translation row
  EXECUTE format(
    'SELECT COUNT(DISTINCT %I) FROM %I',
    p_fk_column, p_translation_table
  ) INTO v_total;

  IF v_total = 0 OR v_num_langs IS NULL THEN
    INSERT INTO translation_stats_cache
      (entity_type, language_code, total, complete, partial, missing, percentage, updated_at)
    VALUES (p_entity_type, '_all', 0, 0, 0, 0, 100, now())
    ON CONFLICT (entity_type, language_code)
    DO UPDATE SET total=0, complete=0, partial=0, missing=0, percentage=100, updated_at=now();
    RETURN;
  END IF;

  -- Build the per-field non-empty check: (title IS NOT NULL AND title <> '') AND ...
  SELECT string_agg(
    format('(%I IS NOT NULL AND %I <> '''')', f, f), ' AND '
  ) INTO v_field_check
  FROM unnest(p_required_fields) AS f;

  -- Count entities that are complete in ALL languages
  EXECUTE format(
    'SELECT COUNT(*) FROM (
       SELECT %I
       FROM %I
       WHERE language_code = ANY($1) AND %s
       GROUP BY %I
       HAVING COUNT(DISTINCT language_code) = $2
     ) sub',
    p_fk_column, p_translation_table, v_field_check, p_fk_column
  ) INTO v_complete_all
  USING p_languages, v_num_langs;

  INSERT INTO translation_stats_cache
    (entity_type, language_code, total, complete, partial, missing, percentage, updated_at)
  VALUES (
    p_entity_type, '_all', v_total, v_complete_all,
    v_total - v_complete_all, 0,
    CASE WHEN v_total > 0
      THEN ROUND((v_complete_all::numeric / v_total) * 100)
      ELSE 100
    END,
    now()
  )
  ON CONFLICT (entity_type, language_code)
  DO UPDATE SET
    total      = EXCLUDED.total,
    complete   = EXCLUDED.complete,
    partial    = EXCLUDED.partial,
    missing    = EXCLUDED.missing,
    percentage = EXCLUDED.percentage,
    updated_at = EXCLUDED.updated_at;
END;
$fn$;
-- Update the main refresh function to also compute cross-language stats
CREATE OR REPLACE FUNCTION refresh_translation_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
BEGIN
  -- Per-language stats (existing)
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

  -- Cross-language stats (_all)
  PERFORM refresh_translation_stats_cross_lang('games',               'game_translations',               'game_id',               ARRAY['title', 'description']);
  PERFORM refresh_translation_stats_cross_lang('characters',          'character_translations',          'character_id',          ARRAY['name', 'description']);
  PERFORM refresh_translation_stats_cross_lang('genres',              'genre_translations',              'genre_id',              ARRAY['name']);
  PERFORM refresh_translation_stats_cross_lang('companies',           'company_translations',            'company_id',            ARRAY['description']);
  PERFORM refresh_translation_stats_cross_lang('platforms',           'platform_translations',           'platform_id',           ARRAY['name']);
  PERFORM refresh_translation_stats_cross_lang('character_roles',     'character_role_translations',     'role_id',               ARRAY['name']);
  PERFORM refresh_translation_stats_cross_lang('genders',             'gender_translations',             'gender_id',             ARRAY['name']);
  PERFORM refresh_translation_stats_cross_lang('species',             'species_translations',            'species_id',            ARRAY['name']);
  PERFORM refresh_translation_stats_cross_lang('content_descriptors', 'content_descriptor_translations', 'content_descriptor_id', ARRAY['name']);
  PERFORM refresh_translation_stats_cross_lang('ratings',             'rating_translations',             'rating_id',             ARRAY['description']);
END;
$fn$;
COMMENT ON FUNCTION refresh_translation_stats_cross_lang IS
  'Computes cross-language translation stats: an entity is complete only when ALL required fields are filled in EVERY supported language.';
-- Populate the new _all rows
SELECT refresh_translation_stats();
