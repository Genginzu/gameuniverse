-- Helper function: refresh stats for a single entity type
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
AS $$
DECLARE
  v_lang TEXT;
  v_langs TEXT[] := ARRAY['fr', 'en'];
  v_total INT;
  v_complete INT;
  v_partial INT;
  v_missing INT;
BEGIN
  EXECUTE format('SELECT COUNT(DISTINCT %I) FROM %I', p_fk_column, p_translation_table)
    INTO v_total;

  IF v_total = 0 THEN
    FOREACH v_lang IN ARRAY v_langs LOOP
      INSERT INTO translation_stats_cache
        (entity_type, language_code, total, complete, partial, missing, percentage, updated_at)
      VALUES (p_entity_type, v_lang, 0, 0, 0, 0, 100, now())
      ON CONFLICT (entity_type, language_code)
      DO UPDATE SET total=0, complete=0, partial=0, missing=0, percentage=100, updated_at=now();
    END LOOP;
    RETURN;
  END IF;

  FOREACH v_lang IN ARRAY v_langs LOOP
    EXECUTE format(
      'WITH entity_ids AS (
        SELECT DISTINCT %I AS eid FROM %I
      ),
      lang_rows AS (
        SELECT %I AS eid, %s AS filled_count
        FROM %I WHERE language_code = %L
      )
      SELECT
        COUNT(*) FILTER (WHERE COALESCE(lr.filled_count, 0) = %s),
        COUNT(*) FILTER (WHERE COALESCE(lr.filled_count, 0) > 0
                           AND COALESCE(lr.filled_count, 0) < %s),
        COUNT(*) FILTER (WHERE COALESCE(lr.filled_count, 0) = 0)
      FROM entity_ids e LEFT JOIN lang_rows lr ON lr.eid = e.eid',
      p_fk_column, p_translation_table,
      p_fk_column,
      (SELECT string_agg(
        format('(CASE WHEN %I IS NOT NULL AND %I <> '''' THEN 1 ELSE 0 END)', f, f), ' + ')
       FROM unnest(p_required_fields) AS f),
      p_translation_table, v_lang,
      array_length(p_required_fields, 1),
      array_length(p_required_fields, 1)
    ) INTO v_complete, v_partial, v_missing;

    INSERT INTO translation_stats_cache
      (entity_type, language_code, total, complete, partial, missing, percentage, updated_at)
    VALUES (
      p_entity_type, v_lang, v_total, v_complete, v_partial, v_missing,
      CASE WHEN v_total > 0 THEN ROUND((v_complete::numeric / v_total) * 100) ELSE 100 END,
      now()
    )
    ON CONFLICT (entity_type, language_code)
    DO UPDATE SET
      total = EXCLUDED.total, complete = EXCLUDED.complete,
      partial = EXCLUDED.partial, missing = EXCLUDED.missing,
      percentage = EXCLUDED.percentage, updated_at = EXCLUDED.updated_at;
  END LOOP;
END;
$$;
-- Main function: refresh stats for all entity types
CREATE OR REPLACE FUNCTION refresh_translation_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM refresh_translation_stats_for_type('games', 'game_translations', 'game_id', ARRAY['title', 'description']);
  PERFORM refresh_translation_stats_for_type('characters', 'character_translations', 'character_id', ARRAY['name', 'description']);
  PERFORM refresh_translation_stats_for_type('genres', 'genre_translations', 'genre_id', ARRAY['name']);
  PERFORM refresh_translation_stats_for_type('companies', 'company_translations', 'company_id', ARRAY['description']);
  PERFORM refresh_translation_stats_for_type('platforms', 'platform_translations', 'platform_id', ARRAY['name']);
  PERFORM refresh_translation_stats_for_type('character_roles', 'character_role_translations', 'role_id', ARRAY['name']);
  PERFORM refresh_translation_stats_for_type('genders', 'gender_translations', 'gender_id', ARRAY['name']);
  PERFORM refresh_translation_stats_for_type('species', 'species_translations', 'species_id', ARRAY['name']);
  PERFORM refresh_translation_stats_for_type('content_descriptors', 'content_descriptor_translations', 'content_descriptor_id', ARRAY['name']);
  PERFORM refresh_translation_stats_for_type('ratings', 'rating_translations', 'rating_id', ARRAY['description']);
END;
$$;
-- Run initial refresh to populate the cache
SELECT refresh_translation_stats();
