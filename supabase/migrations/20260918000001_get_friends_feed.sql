-- Migration: Create get_friends_feed RPC
-- Objective: Aggregate activity events from the viewer's accepted friends only
-- (not subscriptions). Covers reviews, posts, comments, library additions, playtime,
-- favorites, collections, friendship acceptances, game sessions, and achievement
-- unlocks. Each event embeds an `actor` JSONB (id, username, avatarUrl) so the UI
-- renders "who did what" without extra fetches. Supports optional type filtering.
--
-- This is distinct from get_subscribed_feed which unions subscriptions + friends.
-- Issue #87 asks for a dedicated friends-only feed page at /feed.

CREATE OR REPLACE FUNCTION get_friends_feed(
  viewer_uuid UUID,
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

  WITH friend_ids AS (
    SELECT
      CASE
        WHEN f.sender_id = viewer_uuid THEN f.receiver_id
        ELSE f.sender_id
      END AS user_id
    FROM public.friendships f
    WHERE f.status = 'accepted'
      AND (f.sender_id = viewer_uuid OR f.receiver_id = viewer_uuid)
  ),

  activity AS (
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
        'contentExcerpt', LEFT(regexp_replace(gr.content, '<[^>]+>', '', 'g'), 200),
        'actor', jsonb_build_object(
          'id', p.id, 'username', p.username, 'avatarUrl', p.avatar_url
        )
      ) AS data
    FROM public.game_reviews gr
    INNER JOIN friend_ids fi ON fi.user_id = gr.user_id
    INNER JOIN public.profiles p ON p.id = gr.user_id
    INNER JOIN public.games g ON g.id = gr.game_id
    LEFT JOIN public.game_translations gt_loc
      ON gt_loc.game_id = g.id AND gt_loc.language_code = locale_code
    LEFT JOIN LATERAL (
      SELECT gt2.title FROM public.game_translations gt2
      WHERE gt2.game_id = g.id ORDER BY gt2.language_code LIMIT 1
    ) gt_fb ON gt_loc.title IS NULL

    UNION ALL

    -- 2. Posts
    SELECT
      pp.id,
      'post'::TEXT AS type,
      pp.created_at AS date,
      jsonb_build_object(
        'type', 'post',
        'postId', pp.id,
        'contentExcerpt', LEFT(regexp_replace(pp.content, '<[^>]+>', '', 'g'), 200),
        'actor', jsonb_build_object(
          'id', p.id, 'username', p.username, 'avatarUrl', p.avatar_url
        )
      ) AS data
    FROM public.player_posts pp
    INNER JOIN friend_ids fi ON fi.user_id = pp.player_id
    INNER JOIN public.profiles p ON p.id = pp.player_id

    UNION ALL

    -- 3. Comments
    SELECT
      cc.id,
      'comment'::TEXT AS type,
      cc.created_at AS date,
      jsonb_build_object(
        'type', 'comment',
        'characterId', cc.character_id,
        'characterSlug', c.slug,
        'characterName', COALESCE(ct_loc.name, ct_fb.name, 'Unknown'),
        'contentExcerpt', LEFT(regexp_replace(cc.content, '<[^>]+>', '', 'g'), 200),
        'actor', jsonb_build_object(
          'id', p.id, 'username', p.username, 'avatarUrl', p.avatar_url
        )
      ) AS data
    FROM public.character_comments cc
    INNER JOIN friend_ids fi ON fi.user_id = cc.user_id
    INNER JOIN public.profiles p ON p.id = cc.user_id
    INNER JOIN public.characters c ON c.id = cc.character_id
    LEFT JOIN public.character_translations ct_loc
      ON ct_loc.character_id = c.id AND ct_loc.language_code = locale_code
    LEFT JOIN LATERAL (
      SELECT ct2.name FROM public.character_translations ct2
      WHERE ct2.character_id = c.id ORDER BY ct2.language_code LIMIT 1
    ) ct_fb ON ct_loc.name IS NULL

    UNION ALL

    -- 4. Library additions
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
        'status', ul.status,
        'actor', jsonb_build_object(
          'id', p.id, 'username', p.username, 'avatarUrl', p.avatar_url
        )
      ) AS data
    FROM public.user_library ul
    INNER JOIN friend_ids fi ON fi.user_id = ul.user_id
    INNER JOIN public.profiles p ON p.id = ul.user_id
    INNER JOIN public.games g ON g.id = ul.game_id
    LEFT JOIN public.game_translations gt_loc
      ON gt_loc.game_id = g.id AND gt_loc.language_code = locale_code
    LEFT JOIN LATERAL (
      SELECT gt2.title FROM public.game_translations gt2
      WHERE gt2.game_id = g.id ORDER BY gt2.language_code LIMIT 1
    ) gt_fb ON gt_loc.title IS NULL

    UNION ALL

    -- 5. Playtime entries
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
        'playTimeCompletely', ul.play_time_completely,
        'actor', jsonb_build_object(
          'id', p.id, 'username', p.username, 'avatarUrl', p.avatar_url
        )
      ) AS data
    FROM public.user_library ul
    INNER JOIN friend_ids fi ON fi.user_id = ul.user_id
    INNER JOIN public.profiles p ON p.id = ul.user_id
    INNER JOIN public.games g ON g.id = ul.game_id
    LEFT JOIN public.game_translations gt_loc
      ON gt_loc.game_id = g.id AND gt_loc.language_code = locale_code
    LEFT JOIN LATERAL (
      SELECT gt2.title FROM public.game_translations gt2
      WHERE gt2.game_id = g.id ORDER BY gt2.language_code LIMIT 1
    ) gt_fb ON gt_loc.title IS NULL
    WHERE ul.play_time_hastily IS NOT NULL
       OR ul.play_time_normally IS NOT NULL
       OR ul.play_time_completely IS NOT NULL

    UNION ALL

    -- 6. Character favorites
    SELECT
      cf.id,
      'favorite'::TEXT AS type,
      cf.created_at AS date,
      jsonb_build_object(
        'type', 'favorite',
        'characterId', cf.character_id,
        'characterSlug', c.slug,
        'characterName', COALESCE(ct_loc.name, ct_fb.name, 'Unknown'),
        'actor', jsonb_build_object(
          'id', p.id, 'username', p.username, 'avatarUrl', p.avatar_url
        )
      ) AS data
    FROM public.character_favorites cf
    INNER JOIN friend_ids fi ON fi.user_id = cf.user_id
    INNER JOIN public.profiles p ON p.id = cf.user_id
    INNER JOIN public.characters c ON c.id = cf.character_id
    LEFT JOIN public.character_translations ct_loc
      ON ct_loc.character_id = c.id AND ct_loc.language_code = locale_code
    LEFT JOIN LATERAL (
      SELECT ct2.name FROM public.character_translations ct2
      WHERE ct2.character_id = c.id ORDER BY ct2.language_code LIMIT 1
    ) ct_fb ON ct_loc.name IS NULL

    UNION ALL

    -- 7. Collections (public only)
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
        ),
        'actor', jsonb_build_object(
          'id', p.id, 'username', p.username, 'avatarUrl', p.avatar_url
        )
      ) AS data
    FROM public.game_collections gc
    INNER JOIN friend_ids fi ON fi.user_id = gc.user_id
    INNER JOIN public.profiles p ON p.id = gc.user_id
    WHERE gc.is_public = true

    UNION ALL

    -- 8. Friendship acceptances (both sides see it)
    SELECT
      f.id,
      'friendship'::TEXT AS type,
      f.updated_at AS date,
      jsonb_build_object(
        'type', 'friendship',
        'friendId',
          CASE WHEN f.sender_id = fi.user_id THEN f.receiver_id ELSE f.sender_id END,
        'friendName', COALESCE(p2.username, 'Unknown'),
        'friendAvatarUrl', p2.avatar_url,
        'action', 'request_accepted',
        'actor', jsonb_build_object(
          'id', p.id, 'username', p.username, 'avatarUrl', p.avatar_url
        )
      ) AS data
    FROM public.friendships f
    INNER JOIN friend_ids fi ON fi.user_id = f.sender_id OR fi.user_id = f.receiver_id
    INNER JOIN public.profiles p
      ON p.id = (CASE WHEN f.sender_id = fi.user_id THEN f.sender_id ELSE f.receiver_id END)
    LEFT JOIN public.profiles p2
      ON p2.id = (CASE WHEN f.sender_id = fi.user_id THEN f.receiver_id ELSE f.sender_id END)
    WHERE f.status = 'accepted'
      AND f.sender_id <> viewer_uuid
      AND f.receiver_id <> viewer_uuid

    UNION ALL

    -- 9. Game sessions
    SELECT
      gs.id,
      'session'::TEXT AS type,
      gs.created_at AS date,
      jsonb_build_object(
        'type', 'session',
        'gameId', gs.game_id,
        'gameSlug', g.slug,
        'gameName', COALESCE(gt_loc.title, gt_fb.title, 'Untitled'),
        'coverImage', g.cover_image_url,
        'durationMinutes', gs.duration_minutes,
        'startedAt', gs.started_at,
        'actor', jsonb_build_object(
          'id', p.id, 'username', p.username, 'avatarUrl', p.avatar_url
        )
      ) AS data
    FROM public.game_sessions gs
    INNER JOIN friend_ids fi ON fi.user_id = gs.user_id
    INNER JOIN public.profiles p ON p.id = gs.user_id
    INNER JOIN public.games g ON g.id = gs.game_id
    LEFT JOIN public.game_translations gt_loc
      ON gt_loc.game_id = g.id AND gt_loc.language_code = locale_code
    LEFT JOIN LATERAL (
      SELECT gt2.title FROM public.game_translations gt2
      WHERE gt2.game_id = g.id ORDER BY gt2.language_code LIMIT 1
    ) gt_fb ON gt_loc.title IS NULL

    UNION ALL

    -- 10. Achievement unlocks
    SELECT
      pa.id,
      'achievement'::TEXT AS type,
      pa.unlocked_at AS date,
      jsonb_build_object(
        'type', 'achievement',
        'achievementKey', pa.achievement_key,
        'achievementName', COALESCE(
          CASE WHEN locale_code = 'fr' THEN ac.name_fr ELSE ac.name_en END,
          ac.name_en
        ),
        'achievementIcon', ac.icon,
        'achievementDescription', COALESCE(
          CASE WHEN locale_code = 'fr' THEN ac.description_fr ELSE ac.description_en END,
          ac.description_en
        ),
        'actor', jsonb_build_object(
          'id', p.id, 'username', p.username, 'avatarUrl', p.avatar_url
        )
      ) AS data
    FROM public.player_achievements pa
    INNER JOIN friend_ids fi ON fi.user_id = pa.user_id
    INNER JOIN public.profiles p ON p.id = pa.user_id
    LEFT JOIN public.achievement_catalog ac ON ac.key = pa.achievement_key
  ),

  filtered AS (
    SELECT * FROM activity
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
          'id', p.id, 'type', p.type, 'date', p.date, 'data', p.data
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

COMMENT ON FUNCTION get_friends_feed(UUID, TEXT, TEXT, INT, INT)
  IS 'Aggregates activity events from the viewer''s accepted friends only (reviews, posts, comments, library, playtime, favorites, collections, friendship acceptances, sessions, achievements) into a paginated JSONB feed sorted by date descending. Each event embeds an actor JSONB (id, username, avatarUrl). Supports optional filtering by event type.';
