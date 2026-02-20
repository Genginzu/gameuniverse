-- Fix: Cast genre_translations.name to TEXT in get_common_games
-- Corrige l'erreur 42804 "Returned type character varying[] does not match expected type text[]"
-- car ARRAY_AGG(gnt.name) retourne varchar[] alors que la fonction déclare text[].

CREATE OR REPLACE FUNCTION get_common_games(
  current_user_id UUID,
  target_player_id UUID,
  game_locale TEXT DEFAULT 'fr',
  page_number INT DEFAULT 1,
  page_size INT DEFAULT 12
)
RETURNS TABLE (
  game_id UUID,
  slug TEXT,
  cover_image_url TEXT,
  title TEXT,
  genre_names TEXT[],
  total_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $_fn$
DECLARE
  offset_val INT;
BEGIN
  offset_val := (page_number - 1) * page_size;

  RETURN QUERY
  SELECT
    g.id AS game_id,
    g.slug::TEXT AS slug,
    g.cover_image_url::TEXT AS cover_image_url,
    COALESCE(
      gt_locale.title,
      gt_fallback.title,
      'Untitled'
    )::TEXT AS title,
    COALESCE(
      ARRAY_AGG(gnt.name::TEXT ORDER BY gnt.name) FILTER (WHERE gnt.name IS NOT NULL),
      ARRAY[]::TEXT[]
    ) AS genre_names,
    COUNT(*) OVER() AS total_count
  FROM public.user_library ul1
  INNER JOIN public.user_library ul2
    ON ul1.game_id = ul2.game_id
  INNER JOIN public.games g
    ON g.id = ul1.game_id
  LEFT JOIN public.game_translations gt_locale
    ON gt_locale.game_id = g.id
    AND gt_locale.language_code = game_locale
  LEFT JOIN LATERAL (
    SELECT gt_fb.title
    FROM public.game_translations gt_fb
    WHERE gt_fb.game_id = g.id
    ORDER BY gt_fb.language_code
    LIMIT 1
  ) gt_fallback ON gt_locale.title IS NULL
  LEFT JOIN public.game_genres gg
    ON gg.game_id = g.id
  LEFT JOIN public.genre_translations gnt
    ON gnt.genre_id = gg.genre_id
    AND gnt.language_code = game_locale
  WHERE ul1.user_id = current_user_id
    AND ul2.user_id = target_player_id
  GROUP BY g.id, g.slug, g.cover_image_url, gt_locale.title, gt_fallback.title
  ORDER BY title
  LIMIT page_size
  OFFSET offset_val;
END;
$_fn$;
