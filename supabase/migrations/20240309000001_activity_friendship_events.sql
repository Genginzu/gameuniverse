-- Migration: Add friendship events to player activity feed
-- Objective: Extend the get_player_activity RPC function to include friendship
-- events (request sent, request accepted, friend removed) from the friendships
-- table. This adds a 7th UNION ALL branch for friendship activity.

-- ========================================
-- INDEXES (idempotent — IF NOT EXISTS)
-- ========================================

-- friendships: Add indexes for activity feed queries
CREATE INDEX IF NOT EXISTS idx_friendships_sender_created_desc
  ON public.friendships (sender_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_friendships_receiver_updated_desc
  ON public.friendships (receiver_id, updated_at DESC);

-- ========================================
-- FUNCTION get_player_activity (replace)
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

    UNION ALL

    -- 7. Friendship events (sent requests + accepted friendships)
    -- 7a. Requests sent by the player
    SELECT
      f.id,
      'friendship'::TEXT AS type,
      f.created_at AS date,
      jsonb_build_object(
        'type', 'friendship',
        'friendId', f.receiver_id,
        'friendName', COALESCE(p.username, 'Unknown'),
        'friendAvatarUrl', p.avatar_url,
        'action', 'request_sent'
      ) AS data
    FROM public.friendships f
    INNER JOIN public.profiles p ON p.id = f.receiver_id
    WHERE f.sender_id = player_uuid

    UNION ALL

    -- 7b. Requests accepted (visible for the receiver who accepted)
    SELECT
      f.id,
      'friendship'::TEXT AS type,
      f.updated_at AS date,
      jsonb_build_object(
        'type', 'friendship',
        'friendId', f.sender_id,
        'friendName', COALESCE(p.username, 'Unknown'),
        'friendAvatarUrl', p.avatar_url,
        'action', 'request_accepted'
      ) AS data
    FROM public.friendships f
    INNER JOIN public.profiles p ON p.id = f.sender_id
    WHERE f.receiver_id = player_uuid
      AND f.status = 'accepted'
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
  IS 'Aggregates player activity from game_reviews, character_comments, user_library, character_favorites, game_collections and friendships into a paginated JSONB feed sorted by date descending. Supports optional filtering by event type and locale-aware game/character names.';
