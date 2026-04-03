-- Function: get entities with missing translations for a given entity type.
-- Performs filtering at the SQL level instead of in-memory for correctness.
-- Returns entities that do NOT have all required fields filled for every language.

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
AS $func$
DECLARE
  v_entity_table TEXT;
  v_translation_table TEXT;
  v_fk_column TEXT;
  v_identifier_field TEXT;
  v_field_check TEXT;
  v_offset INT;
  v_sql TEXT;
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

  SELECT string_agg(
    format('(%I IS NOT NULL AND %I <> '''')', f, f),
    ' AND '
  ) INTO v_field_check
  FROM unnest(p_required_fields) AS f;

  v_sql := format(
    'WITH entity_base AS ('
    '  SELECT e.id, e.%I::TEXT AS identifier'
    '  FROM %I e'
    '  WHERE EXISTS ('
    '    SELECT 1 FROM %I t WHERE t.%I = e.id'
    '  )'
    '  %s'
    '), '
    'complete_counts AS ('
    '  SELECT eb.id, eb.identifier,'
    '    COUNT(DISTINCT t.language_code) FILTER ('
    '      WHERE t.language_code = ANY($1) AND %s'
    '    ) AS complete_lang_count'
    '  FROM entity_base eb'
    '  LEFT JOIN %I t ON t.%I = eb.id'
    '  GROUP BY eb.id, eb.identifier'
    '), '
    'missing AS ('
    '  SELECT id, identifier'
    '  FROM complete_counts'
    '  WHERE complete_lang_count < array_length($1, 1)'
    '  ORDER BY identifier'
    ') '
    'SELECT m.id AS entity_id,'
    '       m.identifier,'
    '       (SELECT COUNT(*) FROM missing)::BIGINT AS total_count'
    ' FROM missing m'
    ' ORDER BY m.identifier'
    ' OFFSET %s LIMIT %s',
    v_identifier_field,
    v_entity_table,
    v_translation_table,
    v_fk_column,
    CASE
      WHEN p_search IS NOT NULL AND p_search <> ''
      THEN format('AND e.%I ILIKE ''%%'' || %L || ''%%''', v_identifier_field, p_search)
      ELSE ''
    END,
    v_field_check,
    v_translation_table,
    v_fk_column,
    v_offset,
    p_limit
  );

  RETURN QUERY EXECUTE v_sql USING p_languages;
END;
$func$;
