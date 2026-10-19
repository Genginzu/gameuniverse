-- Make profiles.stats_private hide the player's library, play sessions,
-- activity, friends and subscriptions from everyone but the owner.
--
-- Context:
--   stats_private (20240227000001) was only checked by the enriched stats,
--   dashboard and year-in-review routes. user_library, game_sessions,
--   accepted friendships and player_subscriptions were SELECT USING (true), and
--   get_player_activity / the feed RPCs are SECURITY DEFINER, so a "private"
--   player's library, sessions, activity and social graph stayed readable by
--   anyone (directly through PostgREST or through /api/players/[id]/*).
--
-- Fix:
--   1. public.is_stats_private(uuid) helper (SECURITY DEFINER, profiles is public).
--   2. SELECT policies: rows of a private player are visible to that player
--      (and admins) only. Friendship / subscription rows are hidden from third
--      parties as soon as one side is private; the two parties still see them.
--   3. get_player_activity returns an empty page for a private player unless the
--      caller is the player, an admin or the service role.
--   4. The friends / subscribed feed functions run as SECURITY INVOKER, so the
--      policies above apply: private friends' library, playtime, sessions and
--      friendships no longer appear in other players' feeds. Every other table
--      they read is publicly readable, so nothing else changes.

-- =============================================================================
-- 1. Helper
-- =============================================================================

CREATE OR REPLACE FUNCTION public.is_stats_private(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE(
    (SELECT p.stats_private FROM public.profiles p WHERE p.id = p_user_id),
    false
  );
$$;

COMMENT ON FUNCTION public.is_stats_private(uuid) IS
  'True when the player chose to hide their library, sessions, activity and social graph (profiles.stats_private).';

GRANT EXECUTE ON FUNCTION public.is_stats_private(uuid) TO anon, authenticated, service_role;

-- =============================================================================
-- 2. SELECT policies
-- =============================================================================

DROP POLICY IF EXISTS "Anyone can view user libraries" ON public.user_library;
CREATE POLICY "Libraries are viewable unless private"
  ON public.user_library FOR SELECT
  USING (
    auth.uid() = user_id
    OR NOT public.is_stats_private(user_id)
    OR (SELECT public.is_admin())
  );

DROP POLICY IF EXISTS "game_sessions_select_all" ON public.game_sessions;
CREATE POLICY "Game sessions are viewable unless private"
  ON public.game_sessions FOR SELECT
  USING (
    auth.uid() = user_id
    OR NOT public.is_stats_private(user_id)
    OR (SELECT public.is_admin())
  );

DROP POLICY IF EXISTS "Accepted friendships are viewable by everyone" ON public.friendships;
CREATE POLICY "Accepted friendships are viewable unless a side is private"
  ON public.friendships FOR SELECT
  USING (
    status = 'accepted'
    AND (
      auth.uid() IN (sender_id, receiver_id)
      OR (NOT public.is_stats_private(sender_id) AND NOT public.is_stats_private(receiver_id))
      OR (SELECT public.is_admin())
    )
  );

DROP POLICY IF EXISTS "Subscriptions are viewable by everyone" ON public.player_subscriptions;
CREATE POLICY "Subscriptions are viewable unless a side is private"
  ON public.player_subscriptions FOR SELECT
  USING (
    auth.uid() IN (subscriber_id, target_id)
    OR (NOT public.is_stats_private(subscriber_id) AND NOT public.is_stats_private(target_id))
    OR (SELECT public.is_admin())
  );

-- =============================================================================
-- 3. Activity of a private player
-- =============================================================================

ALTER FUNCTION public.get_player_activity(uuid, text, text, integer, integer)
  RENAME TO get_player_activity_unchecked;
REVOKE EXECUTE ON FUNCTION public.get_player_activity_unchecked(uuid, text, text, integer, integer)
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_player_activity(
  player_uuid uuid,
  locale_code text DEFAULT 'fr',
  event_type text DEFAULT NULL,
  page_number integer DEFAULT 1,
  page_size integer DEFAULT 20
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF public.is_stats_private(player_uuid)
     AND auth.role() <> 'service_role'
     AND player_uuid IS DISTINCT FROM auth.uid()
     AND NOT public.is_admin() THEN
    RETURN jsonb_build_object('events', '[]'::jsonb, 'totalCount', 0);
  END IF;

  RETURN public.get_player_activity_unchecked(
    player_uuid, locale_code, event_type, page_number, LEAST(GREATEST(page_size, 1), 50)
  );
END;
$$;

COMMENT ON FUNCTION public.get_player_activity(uuid, text, text, integer, integer) IS
  'Public activity feed of a player; empty for a private player (stats_private) unless the caller is that player or an admin.';
GRANT EXECUTE ON FUNCTION public.get_player_activity(uuid, text, text, integer, integer)
  TO anon, authenticated, service_role;

-- =============================================================================
-- 4. Feeds honour RLS
-- =============================================================================

ALTER FUNCTION public.get_friends_feed_unchecked(uuid, text, text, integer, integer) SECURITY INVOKER;
ALTER FUNCTION public.get_subscribed_feed_unchecked(uuid, text, integer, integer) SECURITY INVOKER;
ALTER FUNCTION public.get_friends_feed(uuid, text, text, integer, integer) SECURITY INVOKER;
ALTER FUNCTION public.get_subscribed_feed(uuid, text, integer, integer) SECURITY INVOKER;

-- The invoker wrappers call the unchecked functions with the caller's rights.
-- Calling them directly only returns rows the caller can already read via RLS.
GRANT EXECUTE ON FUNCTION public.get_friends_feed_unchecked(uuid, text, text, integer, integer)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_subscribed_feed_unchecked(uuid, text, integer, integer)
  TO authenticated;
