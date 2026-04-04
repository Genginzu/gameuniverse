-- Migration: Optimize get_missing_translations to avoid statement timeout.
-- Problem: The CTE-based approach recalculated COUNT(*) for every returned row
-- and scanned the full entity+translation join without early termination.
-- Solution: Use a window function for total_count and avoid redundant scans.

CREATE OR REPLACE FUNCTION get_missing_translations(
  p_entity_type TEXT,
  p_languages TEXT[],
  p_required_fields TEXT[],
  p_page INT DEFAULT 1,
  p_limit INT DEFAULT 20,
  p_search TEXT DEFAULT NULL
)
RETURNS TABLE (
  entity_id UUID,
  identifier TEXT,
  total_count BIGINT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
SET statement_timeout = '15s'
AS $func$
DECLARE
  v_entity_table TEXT;
  v_translation_table TEXT;
  v_fk_column TEXT;
  v_identifier_field TEXT;
  v_field_check TEXT;
  v_offset INT;
  v_sql TEXT;
  v_search_clause TEXT := '';
BEGIN
  CASE p_entity_type
    WHEN 'games' THEN
      v_entity_table := 'games';
      v_translation_table := 'game_translations';
      v_fk_column := 'game_id';
      v_identifier_field := 'slug';
    WHEN 'characters' THEN
      v_entity_table := 'characters';
      v_translation_table := 'character_translations';
      v_fk_column := 'character_id';
      v_identifier_field := 'slug';
    WHEN 'genres' THEN
      v_entity_table := 'genres';
      v_translation_table := 'genre_translations';
      v_fk_column := 'genre_id';
      v_identifier_field := 'slug';
    WHEN 'companies' THEN
      v_entity_table := 'companies';
      v_translation_table := 'company_translations';
      v_fk_column := 'company_id';
      v_identifier_field := 'slug';
    WHEN 'platforms' THEN
      v_entity_table := 'platforms';
      v_translation_table := 'platform_translations';
      v_fk_column := 'platform_id';
      v_identifier_field := 'slug';
    WHEN 'character_roles' THEN
      v_entity_table := 'character_roles';
      v_translation_table := 'character_role_translations';
      v_fk_column := 'role_id';
      v_identifier_field := 'slug';
    WHEN 'genders' THEN
      v_entity_table := 'genders';
      v_translation_table := 'gender_translations';
      v_fk_column := 'gender_id';
      v_identifier_field := 'slug';
    WHEN 'species' THEN
      v_entity_table := 'species';
      v_translation_table := 'species_translations';
      v_fk_column := 'species_id';
      v_identifier_field := 'slug';
    WHEN 'content_descriptors' THEN
      v_entity_table := 'content_descriptors';
      v_translation_table := 'content_descriptor_translations';
      v_fk_column := 'content_descriptor_id';
      v_identifier_field := 'code';
    WHEN 'ratings' THEN
      v_entity_table := 'ratings';
      v_translation_table := 'rating_translations';
      v_fk_column := 'rating_id';
      v_identifier_field := 'code';
    ELSE
      RAISE EXCEPTION 'Unknown entity type: %', p_entity_type;
  END CASE;

  v_offset := (p_page - 1) * p_limit;

  -- Build the per-field completeness check
  SELECT string_agg(
    format('(%I IS NOT NULL AND %I <> '''')', f, f),
    ' AND '
  ) INTO v_field_check
  FROM unnest(p_required_fields) AS f;

  IF p_search IS NOT NULL AND p_search <> '' THEN
    v_search_clause := format(
      'AND e.%I ILIKE ''%%'' || %L || ''%%''',
      v_identifier_field, p_search
    );
  END IF;

  -- Strategy: count complete languages per entity, keep only those
  -- that don't have all languages complete, then use COUNT(*) OVER()
  -- as a window function so total_count is computed once, not per-row.
  v_sql := format(
    'SELECT entity_id, identifier, total_count FROM ('
    '  SELECT'
    '    sub.id AS entity_id,'
    '    sub.identifier,'
    '    COUNT(*) OVER() AS total_count,'
    '    ROW_NUMBER() OVER(ORDER BY sub.identifier) AS rn'
    '  FROM ('
    '    SELECT e.id, e.%I::TEXT AS identifier'
    '    FROM %I e'
    '    WHERE EXISTS (SELECT 1 FROM %I t WHERE t.%I = e.id)'
    '    %s'
    '    AND NOT EXISTS ('
    '      SELECT 1 FROM ('
    '        SELECT %I'
    '        FROM %I'
    '        WHERE %I = e.id AND language_code = ANY($1) AND %s'
    '        GROUP BY %I'
    '        HAVING COUNT(DISTINCT language_code) = array_length($1, 1)'
    '      ) complete'
    '    )'
    '  ) sub'
    ') ranked'
    ' WHERE rn > %s AND rn <= %s',
    v_identifier_field,
    v_entity_table,
    v_translation_table, v_fk_column,
    v_search_clause,
    v_fk_column,
    v_translation_table,
    v_fk_column, v_field_check,
    v_fk_column,
    v_offset,
    v_offset + p_limit
  );

  RETURN QUERY EXECUTE v_sql USING p_languages;
END;
$func$;
