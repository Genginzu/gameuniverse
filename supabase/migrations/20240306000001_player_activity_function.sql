-- Migration: Player Activity Feed — RPC function + indexes
-- Adds the get_player_activity function that aggregates events from 5 source
-- tables (game_reviews, character_comments, user_library, character_favorites,
-- game_collections) into a unified, paginated activity feed sorted by date
-- descending. Also adds missing indexes on user_id / created_at columns to
-- optimise the UNION ALL query.

-- ========================================
-- INDEXES (idempotent — IF NOT EXISTS)
-- ========================================

-- game_reviews: idx_game_reviews_user_id and idx_game_reviews_created_at
-- already exist (20240214000001). Nothing to add.

-- character_comments: idx_character_comments_user_id and
-- idx_character_comments_created_at already exist (20240219000001). Nothing to add.

-- user_library: idx_user_library_user_id exists. added_at index exists but is
-- not DESC — add a DESC variant for the activity feed sort.
CREATE INDEX IF NOT EXISTS idx_user_library_added_at_desc
  ON public.user_library (added_at DESC);

-- character_favorites: idx_character_favorites_user_id and
-- idx_character_favorites_created_at exist. Add a DESC variant.
CREATE INDEX IF NOT EXISTS idx_character_favorites_created_at_desc
  ON public.character_favorites (created_at DESC);

-- game_collections: idx_game_collections_user_id exists. Add created_at index.
CREATE INDEX IF NOT EXISTS idx_game_collections_created_at
  ON public.game_collections (created_at);

CREATE INDEX IF NOT EXISTS idx_game_collections_created_at_desc
  ON public.game_collections (created_at DESC);

-- ========================================
-- FUNCTION get_player_activity
-- ========================================

CREATE OR REPLACE FUNCTION get_player_activity(
  player_uuid UUID,
  locale_code TEXT DEFAULT 'fr',
  event_type TEXT DEFAULT NULL,
  page_number INT DEFAULT 1,
  page_size INT DEFAULT 20
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $_fn$
DECLARE
  offset_val INT;
  result JSONB;
BEGIN
  offset_val := (page_number - 1) * page_size;

  WITH activity AS (
    -- 1. Reviews
    SELECT
      gr.id,
      'review'::TEXT AS type,
      gr.created_at AS date,
      jsonb_build_object(
        'type', 'review',
        'gameId', gr.game_id,
        'gameSlug', g.slug,
        'gameName', COALESCE(gt_loc.title, gt_fb.title, 'Untitled'),
        'rating', gr.rating,
        'contentExcerpt', LEFT(regexp_replace(gr.content, '<[^>]+>', '', 'g'), 200)
      ) AS data
    FROM public.game_reviews gr
    INNER JOIN public.games g ON g.id = gr.game_id
    LEFT JOIN public.game_translations gt_loc
      ON gt_loc.game_id = g.id AND gt_loc.language_code = locale_code
    LEFT JOIN LATERAL (
      SELECT gt2.title
      FROM public.game_translations gt2
      WHERE gt2.game_id = g.id
      ORDER BY gt2.language_code
      LIMIT 1
    ) gt_fb ON gt_loc.title IS NULL
    WHERE gr.user_id = player_uuid

    UNION ALL

    -- 2. Comments
    SELECT
      cc.id,
      'comment'::TEXT AS type,
      cc.created_at AS date,
      jsonb_build_object(
        'type', 'comment',
        'characterId', cc.character_id,
        'characterSlug', c.slug,
        'characterName', COALESCE(ct_loc.name, ct_fb.name, 'Unknown'),
        'contentExcerpt', LEFT(regexp_replace(cc.content, '<[^>]+>', '', 'g'), 200)
      ) AS data
    FROM public.character_comments cc
    INNER JOIN public.characters c ON c.id = cc.character_id
    LEFT JOIN public.character_translations ct_loc
      ON ct_loc.character_id = c.id AND ct_loc.language_code = locale_code
    LEFT JOIN LATERAL (
      SELECT ct2.name
      FROM public.character_translations ct2
      WHERE ct2.character_id = c.id
      ORDER BY ct2.language_code
      LIMIT 1
    ) ct_fb ON ct_loc.name IS NULL
    WHERE cc.user_id = player_uuid

    UNION ALL

    -- 3. Library additions
    SELECT
      ul.id,
      'library'::TEXT AS type,
      ul.added_at AS date,
      jsonb_build_object(
        'type', 'library',
        'gameId', ul.game_id,
        'gameSlug', g.slug,
        'gameName', COALESCE(gt_loc.title, gt_fb.title, 'Untitled'),
        'coverImage', g.cover_image_url,
        'status', ul.status
      ) AS data
    FROM public.user_library ul
    INNER JOIN public.games g ON g.id = ul.game_id
    LEFT JOIN public.game_translations gt_loc
      ON gt_loc.game_id = g.id AND gt_loc.language_code = locale_code
    LEFT JOIN LATERAL (
      SELECT gt2.title
      FROM public.game_translations gt2
      WHERE gt2.game_id = g.id
      ORDER BY gt2.language_code
      LIMIT 1
    ) gt_fb ON gt_loc.title IS NULL
    WHERE ul.user_id = player_uuid

    UNION ALL

    -- 4. Playtime entries (from user_library rows that have playtime data)
    SELECT
      ul.id,
      'playtime'::TEXT AS type,
      ul.added_at AS date,
      jsonb_build_object(
        'type', 'playtime',
        'gameId', ul.game_id,
        'gameSlug', g.slug,
        'gameName', COALESCE(gt_loc.title, gt_fb.title, 'Untitled'),
        'playTimeHastily', ul.play_time_hastily,
        'playTimeNormally', ul.play_time_normally,
        'playTimeCompletely', ul.play_time_completely
      ) AS data
    FROM public.user_library ul
    INNER JOIN public.games g ON g.id = ul.game_id
    LEFT JOIN public.game_translations gt_loc
      ON gt_loc.game_id = g.id AND gt_loc.language_code = locale_code
    LEFT JOIN LATERAL (
      SELECT gt2.title
      FROM public.game_translations gt2
      WHERE gt2.game_id = g.id
      ORDER BY gt2.language_code
      LIMIT 1
    ) gt_fb ON gt_loc.title IS NULL
    WHERE ul.user_id = player_uuid
      AND (ul.play_time_hastily IS NOT NULL
        OR ul.play_time_normally IS NOT NULL
        OR ul.play_time_completely IS NOT NULL)

    UNION ALL

    -- 5. Character favorites
    SELECT
      cf.id,
      'favorite'::TEXT AS type,
      cf.created_at AS date,
      jsonb_build_object(
        'type', 'favorite',
        'characterId', cf.character_id,
        'characterSlug', c.slug,
        'characterName', COALESCE(ct_loc.name, ct_fb.name, 'Unknown')
      ) AS data
    FROM public.character_favorites cf
    INNER JOIN public.characters c ON c.id = cf.character_id
    LEFT JOIN public.character_translations ct_loc
      ON ct_loc.character_id = c.id AND ct_loc.language_code = locale_code
    LEFT JOIN LATERAL (
      SELECT ct2.name
      FROM public.character_translations ct2
      WHERE ct2.character_id = c.id
      ORDER BY ct2.language_code
      LIMIT 1
    ) ct_fb ON ct_loc.name IS NULL
    WHERE cf.user_id = player_uuid

    UNION ALL

    -- 6. Collections created (only public collections visible to everyone)
    SELECT
      gc.id,
      'collection'::TEXT AS type,
      gc.created_at AS date,
      jsonb_build_object(
        'type', 'collection',
        'collectionId', gc.id,
        'collectionSlug', gc.slug,
        'collectionName', gc.name,
        'gamesCount', (
          SELECT COUNT(*)::INT
          FROM public.game_collection_items gci
          WHERE gci.collection_id = gc.id
        )
      ) AS data
    FROM public.game_collections gc
    WHERE gc.user_id = player_uuid
      AND gc.is_public = true
  ),

  filtered AS (
    SELECT *
    FROM activity
    WHERE (event_type IS NULL OR type = event_type)
  ),

  total AS (
    SELECT COUNT(*) AS cnt FROM filtered
  ),

  page AS (
    SELECT f.*
    FROM filtered f
    ORDER BY f.date DESC NULLS LAST
    LIMIT page_size
    OFFSET offset_val
  )

  SELECT jsonb_build_object(
    'events', COALESCE(
      (SELECT jsonb_agg(
        jsonb_build_object(
          'id', p.id,
          'type', p.type,
          'date', p.date,
          'data', p.data
        )
        ORDER BY p.date DESC NULLS LAST
      ) FROM page p),
      '[]'::JSONB
    ),
    'totalCount', (SELECT cnt FROM total)
  ) INTO result;

  RETURN result;
END;
$_fn$;

COMMENT ON FUNCTION get_player_activity(UUID, TEXT, TEXT, INT, INT)
  IS 'Aggregates player activity from game_reviews, character_comments, user_library, character_favorites and game_collections into a paginated JSONB feed sorted by date descending. Supports optional filtering by event type and locale-aware game/character names.';
