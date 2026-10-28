-- Migration: admin translations search matches the translated text.
--
-- The search box of /admin/translations/<type> ("Search by title/name") only
-- matched the identifier (slug or code). It now also matches the required
-- fields of every language (game title, character name...), so an admin can
-- search "zelda" or "Légende", select the results and translate them.
-- Same signature and grants as 20261027000001.

CREATE OR REPLACE FUNCTION public.get_translation_entities(
  p_entity_type TEXT,
  p_languages TEXT[],
  p_required_fields TEXT[],
  p_status TEXT DEFAULT 'missing',
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
SECURITY INVOKER
SET search_path = ''
SET statement_timeout = '15s'
AS $func$
DECLARE
  v_entity_table TEXT;
  v_translation_table TEXT;
  v_fk_column TEXT;
  v_identifier_field TEXT;
  v_field_check TEXT;
  v_offset INT;
  v_limit INT;
  v_status_operator TEXT;
  v_search_clause TEXT := '';
  v_pattern TEXT;
  v_text_match TEXT;
BEGIN
  CASE p_entity_type
    WHEN 'games' THEN
      v_entity_table := 'games'; v_translation_table := 'game_translations';
      v_fk_column := 'game_id'; v_identifier_field := 'slug';
    WHEN 'characters' THEN
      v_entity_table := 'characters'; v_translation_table := 'character_translations';
      v_fk_column := 'character_id'; v_identifier_field := 'slug';
    WHEN 'genres' THEN
      v_entity_table := 'genres'; v_translation_table := 'genre_translations';
      v_fk_column := 'genre_id'; v_identifier_field := 'slug';
    WHEN 'companies' THEN
      v_entity_table := 'companies'; v_translation_table := 'company_translations';
      v_fk_column := 'company_id'; v_identifier_field := 'slug';
    WHEN 'platforms' THEN
      v_entity_table := 'platforms'; v_translation_table := 'platform_translations';
      v_fk_column := 'platform_id'; v_identifier_field := 'slug';
    WHEN 'character_roles' THEN
      v_entity_table := 'character_roles'; v_translation_table := 'character_role_translations';
      v_fk_column := 'role_id'; v_identifier_field := 'slug';
    WHEN 'genders' THEN
      v_entity_table := 'genders'; v_translation_table := 'gender_translations';
      v_fk_column := 'gender_id'; v_identifier_field := 'slug';
    WHEN 'species' THEN
      v_entity_table := 'species'; v_translation_table := 'species_translations';
      v_fk_column := 'species_id'; v_identifier_field := 'slug';
    WHEN 'content_descriptors' THEN
      v_entity_table := 'content_descriptors'; v_translation_table := 'content_descriptor_translations';
      v_fk_column := 'content_descriptor_id'; v_identifier_field := 'code';
    WHEN 'ratings' THEN
      v_entity_table := 'ratings'; v_translation_table := 'rating_translations';
      v_fk_column := 'rating_id'; v_identifier_field := 'code';
    ELSE
      RAISE EXCEPTION 'Unknown entity type: %', p_entity_type USING ERRCODE = '22023';
  END CASE;

  CASE p_status
    WHEN 'missing' THEN v_status_operator := 'NOT EXISTS';
    WHEN 'complete' THEN v_status_operator := 'EXISTS';
    ELSE RAISE EXCEPTION 'Unknown translation status: %', p_status USING ERRCODE = '22023';
  END CASE;

  IF p_required_fields IS NULL OR array_length(p_required_fields, 1) IS NULL THEN
    RAISE EXCEPTION 'p_required_fields must not be empty' USING ERRCODE = '22023';
  END IF;

  v_limit := LEAST(GREATEST(COALESCE(p_limit, 20), 1), 100);
  v_offset := (GREATEST(COALESCE(p_page, 1), 1) - 1) * v_limit;

  SELECT string_agg(format('(t2.%1$I IS NOT NULL AND t2.%1$I <> '''')', f), ' AND ')
  INTO v_field_check
  FROM unnest(p_required_fields) AS f;

  IF p_search IS NOT NULL AND p_search <> '' THEN
    -- Match the identifier (slug, code) or the text of any language (title, name...).
    v_pattern := '%' || p_search || '%';
    SELECT string_agg(format('t3.%I ILIKE %L', f, v_pattern), ' OR ')
    INTO v_text_match
    FROM unnest(p_required_fields) AS f;
    v_search_clause := format(
      'AND (e.%I ILIKE %L OR EXISTS (SELECT 1 FROM public.%I t3 WHERE t3.%I = e.id AND (%s)))',
      v_identifier_field, v_pattern, v_translation_table, v_fk_column, v_text_match
    );
  END IF;

  -- An entity is complete when every requested language has a row with all
  -- required fields filled. COUNT(*) OVER() computes the total once.
  RETURN QUERY EXECUTE format(
    'SELECT ranked.entity_id, ranked.identifier, ranked.total_count FROM ('
    '  SELECT e.id AS entity_id, e.%1$I::TEXT AS identifier,'
    '         COUNT(*) OVER() AS total_count,'
    '         ROW_NUMBER() OVER (ORDER BY e.%1$I) AS rn'
    '  FROM public.%2$I e'
    '  WHERE EXISTS (SELECT 1 FROM public.%3$I t WHERE t.%4$I = e.id)'
    '  %5$s'
    '  AND %6$s ('
    '    SELECT 1 FROM public.%3$I t2'
    '    WHERE t2.%4$I = e.id AND t2.language_code = ANY($1) AND %7$s'
    '    GROUP BY t2.%4$I'
    '    HAVING COUNT(DISTINCT t2.language_code) = array_length($1, 1)'
    '  )'
    ') ranked'
    ' WHERE ranked.rn > $2 AND ranked.rn <= $2 + $3',
    v_identifier_field,
    v_entity_table,
    v_translation_table,
    v_fk_column,
    v_search_clause,
    v_status_operator,
    v_field_check
  ) USING p_languages, v_offset, v_limit;
END;
$func$;

COMMENT ON FUNCTION public.get_translation_entities(TEXT, TEXT[], TEXT[], TEXT, INT, INT, TEXT) IS
  'Admin translations: paginated entities of one type, either missing a required field in a language (p_status = missing) or complete in every language (p_status = complete). p_search matches the identifier or any required field of any language. Service role only.';

REVOKE EXECUTE ON FUNCTION public.get_translation_entities(TEXT, TEXT[], TEXT[], TEXT, INT, INT, TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_translation_entities(TEXT, TEXT[], TEXT[], TEXT, INT, INT, TEXT)
  TO service_role;