-- =============================================================================
-- Account purge keeps refund_pending coaching sessions
-- =============================================================================
-- 20261023000001 added payment_status 'refund_pending' (paid session cancelled,
-- refund owed, not yet confirmed by Stripe). The session moved money, so it is
-- an accounting record like paid / released / refunded: purge_account_data must
-- keep it (party columns cleared) instead of letting it cascade away with the
-- profile. Only the payment_status list changes; grants are re-stated.
-- =============================================================================
CREATE OR REPLACE FUNCTION public.purge_account_data(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_kept_images text[] := '{}';
  v_content integer := 0;
  v_rows integer;
  v_sessions integer := 0;
  v_groups integer := 0;
  v_communities integer := 0;
  v_coach_ids uuid[];
  v_parent record;
  v_new_owner uuid;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = p_user_id AND p.deletion_requested_at IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'purge_account_data: no pending deletion for %', p_user_id
      USING ERRCODE = 'P0002';
  END IF;

  -- Public content: kept, author removed ("Deleted user").
  SELECT COALESCE(array_agg(pp.image_url) FILTER (WHERE pp.image_url IS NOT NULL), '{}')
    INTO v_kept_images
    FROM public.player_posts pp WHERE pp.player_id = p_user_id;

  UPDATE public.player_posts SET player_id = NULL WHERE player_id = p_user_id;
  GET DIAGNOSTICS v_rows = ROW_COUNT; v_content := v_content + v_rows;
  UPDATE public.post_comments SET player_id = NULL WHERE player_id = p_user_id;
  GET DIAGNOSTICS v_rows = ROW_COUNT; v_content := v_content + v_rows;
  UPDATE public.game_reviews SET user_id = NULL WHERE user_id = p_user_id;
  GET DIAGNOSTICS v_rows = ROW_COUNT; v_content := v_content + v_rows;
  UPDATE public.review_votes SET user_id = NULL WHERE user_id = p_user_id;
  UPDATE public.character_comments SET user_id = NULL WHERE user_id = p_user_id;
  GET DIAGNOSTICS v_rows = ROW_COUNT; v_content := v_content + v_rows;
  UPDATE public.group_posts SET author_id = NULL WHERE author_id = p_user_id;
  GET DIAGNOSTICS v_rows = ROW_COUNT; v_content := v_content + v_rows;
  UPDATE public.community_posts SET author_id = NULL WHERE author_id = p_user_id;
  GET DIAGNOSTICS v_rows = ROW_COUNT; v_content := v_content + v_rows;
  UPDATE public.match_comments SET player_id = NULL WHERE player_id = p_user_id;
  GET DIAGNOSTICS v_rows = ROW_COUNT; v_content := v_content + v_rows;
  UPDATE public.coaching_reviews SET student_id = NULL WHERE student_id = p_user_id;
  GET DIAGNOSTICS v_rows = ROW_COUNT; v_content := v_content + v_rows;

  -- Private conversations: kept read-only for the other participant. When the
  -- other side is already deleted, nobody can read it any more: drop it.
  DELETE FROM public.conversations
   WHERE (participant_1 = p_user_id AND participant_2 IS NULL)
      OR (participant_2 = p_user_id AND participant_1 IS NULL);
  -- Unread messages from a deleted account would never be markable as read.
  UPDATE public.messages
     SET sender_id = NULL, read_at = COALESCE(read_at, now())
   WHERE sender_id = p_user_id;
  UPDATE public.conversations SET participant_1 = NULL WHERE participant_1 = p_user_id;
  UPDATE public.conversations SET participant_2 = NULL WHERE participant_2 = p_user_id;

  -- Reactions are a JSONB map {emoji: [userId, ...]} with no FK.
  UPDATE public.match_comments mc
     SET reactions = (
       SELECT COALESCE(jsonb_object_agg(r.key, r.value - p_user_id::text), '{}'::jsonb)
         FROM jsonb_each(mc.reactions) r
        WHERE r.value <> jsonb_build_array(p_user_id::text)
     )
   WHERE EXISTS (
     SELECT 1 FROM jsonb_each(mc.reactions) r
      WHERE jsonb_typeof(r.value) = 'array' AND r.value ? p_user_id::text
   );

  -- Accounting records (sessions that moved money): kept without the party.
  SELECT COALESCE(array_agg(cp.id), '{}') INTO v_coach_ids
    FROM public.coach_profiles cp WHERE cp.player_id = p_user_id;

  UPDATE public.coaching_sessions cs
     SET student_id = CASE WHEN cs.student_id = p_user_id THEN NULL ELSE cs.student_id END,
         coach_id = CASE WHEN cs.coach_id = ANY (v_coach_ids) THEN NULL ELSE cs.coach_id END,
         cancelled_by = CASE WHEN cs.cancelled_by = p_user_id THEN NULL ELSE cs.cancelled_by END,
         cancellation_reason = NULL
   WHERE cs.payment_status IN ('paid', 'refund_pending', 'released', 'refunded')
     AND (cs.student_id = p_user_id OR cs.coach_id = ANY (v_coach_ids));
  GET DIAGNOSTICS v_sessions = ROW_COUNT;

  UPDATE public.coaching_sessions SET cancelled_by = NULL WHERE cancelled_by = p_user_id;
  UPDATE public.coaching_disputes SET resolved_by = NULL WHERE resolved_by = p_user_id;

  -- Groups the user owns: handed to the oldest moderator, else the oldest member.
  FOR v_parent IN SELECT g.id, g.image_url FROM public.groups g WHERE g.owner_id = p_user_id LOOP
    SELECT gm.player_id INTO v_new_owner
      FROM public.group_members gm
     WHERE gm.group_id = v_parent.id AND gm.player_id <> p_user_id
     ORDER BY (gm.role IN ('moderator', 'admin')) DESC, gm.joined_at, gm.id
     LIMIT 1;

    IF v_new_owner IS NOT NULL THEN
      DELETE FROM public.group_members WHERE group_id = v_parent.id AND player_id = p_user_id;
      UPDATE public.groups SET owner_id = v_new_owner WHERE id = v_parent.id;
      UPDATE public.group_members SET role = 'owner'
       WHERE group_id = v_parent.id AND player_id = v_new_owner;
      v_groups := v_groups + 1;
      IF v_parent.image_url IS NOT NULL THEN
        v_kept_images := v_kept_images || v_parent.image_url;
      END IF;
    END IF;
  END LOOP;

  FOR v_parent IN SELECT c.id, c.image_url FROM public.communities c WHERE c.owner_id = p_user_id LOOP
    SELECT cm.player_id INTO v_new_owner
      FROM public.community_members cm
     WHERE cm.community_id = v_parent.id AND cm.player_id <> p_user_id
     ORDER BY (cm.role = 'moderator') DESC, cm.joined_at, cm.id
     LIMIT 1;

    IF v_new_owner IS NOT NULL THEN
      DELETE FROM public.community_members WHERE community_id = v_parent.id AND player_id = p_user_id;
      UPDATE public.communities SET owner_id = v_new_owner WHERE id = v_parent.id;
      UPDATE public.community_members SET role = 'owner'
       WHERE community_id = v_parent.id AND player_id = v_new_owner;
      v_communities := v_communities + 1;
      IF v_parent.image_url IS NOT NULL THEN
        v_kept_images := v_kept_images || v_parent.image_url;
      END IF;
    END IF;
  END LOOP;

  -- Cascades the profile and every personal row (library, sessions, wishlist,
  -- notifications, linked platforms, follows, friendships, wallet...).
  DELETE FROM public.profiles WHERE id = p_user_id;
  DELETE FROM auth.users WHERE id = p_user_id;

  RETURN jsonb_build_object(
    'anonymisedContent', v_content,
    'retainedCoachingSessions', v_sessions,
    'transferredGroups', v_groups,
    'transferredCommunities', v_communities,
    'keptImageUrls', to_jsonb(v_kept_images)
  );
END;
$$;

COMMENT ON FUNCTION public.purge_account_data(uuid) IS
  'Server-only GDPR purge of an account with a pending deletion: anonymises all user-generated content, keeps accounting records, transfers owned groups/communities, then deletes auth.users.';

REVOKE ALL ON FUNCTION public.purge_account_data(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.purge_account_data(uuid) TO service_role;
