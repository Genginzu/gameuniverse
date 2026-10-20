-- Close personal-data leaks and lock down internal RPCs exposed through PostgREST.
--
-- Context (anon key + user JWT give direct /rest/v1 and /rest/v1/rpc access, and
-- 20260911000001 grants EXECUTE on every public function to anon/authenticated):
--   1. player_wallets had "Anyone can view wallet balance" USING (true): every
--      player's balance / earned / spent was readable by anonymous callers.
--   2. player_linked_platforms SELECT (is_public OR owner) exposed the encrypted
--      OAuth access_token / refresh_token columns to anyone.
--   3. notifications INSERT only checked sender_id = auth.uid(): any user could
--      send arbitrary notifications (type, preview, reference) to anyone.
--      All legitimate inserts use the service role.
--   4. get_friends_feed(viewer_uuid) / get_subscribed_feed(viewer_uuid) are
--      SECURITY DEFINER and trusted the caller-chosen viewer id, leaking any
--      user's friends' activity. reorder_backlog(user_uuid) let any user reorder
--      someone else's backlog.
--   5. Maintenance / admin functions were callable by anon: PandaScore sync lock
--      (blocks or skips the esport sync), translation stats refresh (heavy scans,
--      row counts of arbitrary tables), webhook-event cleanup, admin games
--      listing, pg_class count estimate.
--
-- Fix: drop / restrict the policies and grants above; wrap the feed RPCs with an
-- auth.uid() check; make internal functions service_role only (the admin routes
-- call them with the service-role client after their admin check).

-- =============================================================================
-- 1. Wallets: owner + admin only
-- =============================================================================

DROP POLICY IF EXISTS "Anyone can view wallet balance" ON public.player_wallets;

-- =============================================================================
-- 2. Linked platforms: tokens are server-only
-- =============================================================================

REVOKE SELECT ON public.player_linked_platforms FROM anon, authenticated;
GRANT SELECT (
  id, player_id, platform, platform_username, platform_avatar_url, platform_region,
  platform_metadata, auth_type, external_id, token_expires_at, is_public,
  created_at, updated_at
) ON public.player_linked_platforms TO anon, authenticated;

COMMENT ON COLUMN public.player_linked_platforms.access_token IS
  'Encrypted OAuth access token. Not selectable by anon/authenticated; read by the service role only.';
COMMENT ON COLUMN public.player_linked_platforms.refresh_token IS
  'Encrypted OAuth refresh token. Not selectable by anon/authenticated; read by the service role only.';

-- =============================================================================
-- 3. Notifications: server-only inserts
-- =============================================================================

DROP POLICY IF EXISTS "notifications_insert" ON public.notifications;

-- =============================================================================
-- 4. Caller-scoped RPCs
-- =============================================================================

ALTER FUNCTION public.get_friends_feed(uuid, text, text, integer, integer)
  RENAME TO get_friends_feed_unchecked;
REVOKE EXECUTE ON FUNCTION public.get_friends_feed_unchecked(uuid, text, text, integer, integer)
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_friends_feed(
  viewer_uuid uuid,
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
  IF auth.role() <> 'service_role' AND viewer_uuid IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'get_friends_feed: viewer must be the caller' USING ERRCODE = '42501';
  END IF;
  RETURN public.get_friends_feed_unchecked(
    viewer_uuid, locale_code, event_type, page_number, LEAST(GREATEST(page_size, 1), 50)
  );
END;
$$;

COMMENT ON FUNCTION public.get_friends_feed(uuid, text, text, integer, integer) IS
  'Friends-only activity feed of the caller (viewer_uuid must equal auth.uid()). Delegates to get_friends_feed_unchecked.';
REVOKE EXECUTE ON FUNCTION public.get_friends_feed(uuid, text, text, integer, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_friends_feed(uuid, text, text, integer, integer)
  TO authenticated, service_role;

ALTER FUNCTION public.get_subscribed_feed(uuid, text, integer, integer)
  RENAME TO get_subscribed_feed_unchecked;
REVOKE EXECUTE ON FUNCTION public.get_subscribed_feed_unchecked(uuid, text, integer, integer)
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_subscribed_feed(
  viewer_uuid uuid,
  locale_code text DEFAULT 'fr',
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
  IF auth.role() <> 'service_role' AND viewer_uuid IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'get_subscribed_feed: viewer must be the caller' USING ERRCODE = '42501';
  END IF;
  RETURN public.get_subscribed_feed_unchecked(
    viewer_uuid, locale_code, page_number, LEAST(GREATEST(page_size, 1), 50)
  );
END;
$$;

COMMENT ON FUNCTION public.get_subscribed_feed(uuid, text, integer, integer) IS
  'Subscriptions + friends feed of the caller (viewer_uuid must equal auth.uid()). Delegates to get_subscribed_feed_unchecked.';
REVOKE EXECUTE ON FUNCTION public.get_subscribed_feed(uuid, text, integer, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_subscribed_feed(uuid, text, integer, integer)
  TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.reorder_backlog(user_uuid uuid, ordered_game_ids uuid[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  game_uuid uuid;
  idx integer := 0;
BEGIN
  IF auth.role() <> 'service_role' AND user_uuid IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'reorder_backlog: can only reorder your own backlog' USING ERRCODE = '42501';
  END IF;

  FOREACH game_uuid IN ARRAY ordered_game_ids
  LOOP
    UPDATE user_library
      SET backlog_position = idx
      WHERE user_id = user_uuid AND game_id = game_uuid;
    idx := idx + 1;
  END LOOP;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.reorder_backlog(uuid, uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reorder_backlog(uuid, uuid[]) TO authenticated, service_role;

-- =============================================================================
-- 5. Internal / admin functions: service_role only
-- =============================================================================

REVOKE EXECUTE ON FUNCTION public.pandascore_acquire_lock(interval) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.pandascore_release_lock(timestamptz) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.refresh_translation_stats() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.refresh_translation_stats_for_type(text, text, text, text[])
  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_igdb_webhook_events() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_admin_games_listing(text, integer, integer, text, text, text)
  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.fast_count_estimate(text) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.pandascore_acquire_lock(interval) TO service_role;
GRANT EXECUTE ON FUNCTION public.pandascore_release_lock(timestamptz) TO service_role;
GRANT EXECUTE ON FUNCTION public.refresh_translation_stats() TO service_role;
GRANT EXECUTE ON FUNCTION public.refresh_translation_stats_for_type(text, text, text, text[]) TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_old_igdb_webhook_events() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_admin_games_listing(text, integer, integer, text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.fast_count_estimate(text) TO service_role;
