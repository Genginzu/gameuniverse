-- Migration: Create get_subscribed_feed RPC
-- Objective: Aggregate reviews, posts and playtime events from every player the
-- viewer follows, either via an explicit player_subscriptions row or via an
-- accepted friendship. Each event embeds an `actor` object (id, username,
-- avatar_url) so the UI can render "who did what" without an extra fetch.
--
-- Dedup strategy: a `followed_ids` CTE computes the distinct actor set (UNION
-- of subscriptions + friendships). Because each source event has a single
-- (user_id, event_id, type) row, joining each source to this unique-actor set
-- cannot produce duplicates.

CREATE OR REPLACE FUNCTION get_subscribed_feed(
  viewer_uuid UUID,
  locale_code TEXT DEFAULT 'fr',
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

  WITH followed_ids AS (
    -- Explicit subscriptions
    SELECT target_id AS user_id
    FROM public.player_subscriptions
    WHERE subscriber_id = viewer_uuid

    UNION -- dedupes implicitly

    -- Accepted friendships (bidirectional — viewer is sender OR receiver)
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
          'id', p.id,
          'username', p.username,
          'avatarUrl', p.avatar_url
        )
      ) AS data
    FROM public.game_reviews gr
    INNER JOIN followed_ids fi ON fi.user_id = gr.user_id
    INNER JOIN public.profiles p ON p.id = gr.user_id
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

    UNION ALL

    -- 2. Posts (player_posts)
    SELECT
      pp.id,
      'post'::TEXT AS type,
      pp.created_at AS date,
      jsonb_build_object(
        'type', 'post',
        'postId', pp.id,
        'contentExcerpt', LEFT(regexp_replace(pp.content, '<[^>]+>', '', 'g'), 200),
        'actor', jsonb_build_object(
          'id', p.id,
          'username', p.username,
          'avatarUrl', p.avatar_url
        )
      ) AS data
    FROM public.player_posts pp
    INNER JOIN followed_ids fi ON fi.user_id = pp.player_id
    INNER JOIN public.profiles p ON p.id = pp.player_id

    UNION ALL

    -- 3. Playtime entries (user_library rows with any playtime set)
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
          'id', p.id,
          'username', p.username,
          'avatarUrl', p.avatar_url
        )
      ) AS data
    FROM public.user_library ul
    INNER JOIN followed_ids fi ON fi.user_id = ul.user_id
    INNER JOIN public.profiles p ON p.id = ul.user_id
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
    WHERE ul.play_time_hastily IS NOT NULL
       OR ul.play_time_normally IS NOT NULL
       OR ul.play_time_completely IS NOT NULL
  ),

  total AS (
    SELECT COUNT(*) AS cnt FROM activity
  ),

  page AS (
    SELECT a.*
    FROM activity a
    ORDER BY a.date DESC NULLS LAST
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
COMMENT ON FUNCTION get_subscribed_feed(UUID, TEXT, INT, INT)
  IS 'Aggregates reviews, posts and playtime events from every player the viewer follows (explicit player_subscriptions + accepted friendships) into a paginated JSONB feed sorted by date descending. Each event embeds an actor JSONB (id, username, avatarUrl).';
