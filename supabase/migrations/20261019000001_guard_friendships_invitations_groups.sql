-- Close three social-graph forgeries reachable through PostgREST.
--
-- Context:
--   1. friendships INSERT (20240307000001) only checks sender_id = auth.uid():
--      a user could insert {"receiver_id": <anyone>, "status": "accepted"} and
--      become "friends" without consent, which also defeats the friends-only
--      conversations rule (20261018000019). The receiver UPDATE policy lets the
--      receiver rewrite sender_id while accepting.
--   2. group_invitations UPDATE (20260919000005) only checks
--      invited_player_id = auth.uid(): the invitee could revive an expired or
--      declined invitation (status/expires_at) or point it at another group_id,
--      then join a private group through has_pending_group_invitation()
--      (20261018000009).
--   3. groups / communities UPDATE lets owners AND moderators change any column,
--      including owner_id: a moderator could take ownership, then delete the
--      group (owner-only DELETE) or flip a private group to public.
--
-- Fix (interactive callers only; service_role and admins are unaffected):
--   1. friendships: INSERT must be a pending request to someone else; UPDATE
--      can only change status / updated_at.
--   2. group_invitations: UPDATE can only move a pending, unexpired invitation
--      to accepted / declined; self-invitations are rejected.
--   3. groups / communities: owner_id is immutable, visibility is owner-only.

-- =============================================================================
-- 1. friendships
-- =============================================================================

DROP POLICY IF EXISTS "Authenticated users can send friend requests" ON public.friendships;
CREATE POLICY "Authenticated users can send friend requests"
  ON public.friendships FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND receiver_id <> auth.uid()
    AND status = 'pending'
  );

CREATE OR REPLACE FUNCTION public.enforce_friendship_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF auth.role() NOT IN ('authenticated', 'anon') THEN
    RETURN NEW;
  END IF;

  IF NEW.id IS DISTINCT FROM OLD.id
     OR NEW.sender_id IS DISTINCT FROM OLD.sender_id
     OR NEW.receiver_id IS DISTINCT FROM OLD.receiver_id
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'friendships: only status can change' USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.enforce_friendship_update() IS
  'Interactive callers can only change the status of a friendship, never its parties.';

REVOKE EXECUTE ON FUNCTION public.enforce_friendship_update() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_enforce_friendship_update ON public.friendships;
CREATE TRIGGER trg_enforce_friendship_update
  BEFORE UPDATE ON public.friendships
  FOR EACH ROW EXECUTE FUNCTION public.enforce_friendship_update();

-- =============================================================================
-- 2. group_invitations
-- =============================================================================

DROP POLICY IF EXISTS "Owners and moderators can create group invitations" ON public.group_invitations;
CREATE POLICY "Owners and moderators can create group invitations"
  ON public.group_invitations FOR INSERT
  TO authenticated
  WITH CHECK (
    invited_by = auth.uid()
    AND invited_player_id IS DISTINCT FROM auth.uid()
    AND public.is_group_owner_or_moderator(group_id, auth.uid())
  );

CREATE OR REPLACE FUNCTION public.enforce_group_invitation_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF auth.role() NOT IN ('authenticated', 'anon') THEN
    RETURN NEW;
  END IF;

  IF (to_jsonb(NEW) - 'status') IS DISTINCT FROM (to_jsonb(OLD) - 'status') THEN
    RAISE EXCEPTION 'group_invitations: only status can change' USING ERRCODE = '42501';
  END IF;

  IF OLD.status <> 'pending'
     OR OLD.expires_at <= now()
     OR NEW.status NOT IN ('accepted', 'declined') THEN
    RAISE EXCEPTION 'group_invitations: invitation is not pending' USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.enforce_group_invitation_update() IS
  'The invitee can only accept or decline a pending, unexpired invitation.';

REVOKE EXECUTE ON FUNCTION public.enforce_group_invitation_update() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_enforce_group_invitation_update ON public.group_invitations;
CREATE TRIGGER trg_enforce_group_invitation_update
  BEFORE UPDATE ON public.group_invitations
  FOR EACH ROW EXECUTE FUNCTION public.enforce_group_invitation_update();

-- =============================================================================
-- 3. groups / communities
-- =============================================================================

CREATE OR REPLACE FUNCTION public.enforce_group_parent_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF auth.role() NOT IN ('authenticated', 'anon') OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF NEW.id IS DISTINCT FROM OLD.id OR NEW.owner_id IS DISTINCT FROM OLD.owner_id THEN
    RAISE EXCEPTION '%: owner_id is immutable', TG_TABLE_NAME USING ERRCODE = '42501';
  END IF;

  IF NEW.visibility IS DISTINCT FROM OLD.visibility AND OLD.owner_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION '%: only the owner can change visibility', TG_TABLE_NAME
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.enforce_group_parent_update() IS
  'Moderators cannot take ownership of a group/community or change its visibility.';

REVOKE EXECUTE ON FUNCTION public.enforce_group_parent_update() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_enforce_group_update ON public.groups;
CREATE TRIGGER trg_enforce_group_update
  BEFORE UPDATE ON public.groups
  FOR EACH ROW EXECUTE FUNCTION public.enforce_group_parent_update();

DROP TRIGGER IF EXISTS trg_enforce_community_update ON public.communities;
CREATE TRIGGER trg_enforce_community_update
  BEFORE UPDATE ON public.communities
  FOR EACH ROW EXECUTE FUNCTION public.enforce_group_parent_update();

ALTER POLICY "Owners and moderators can update their group" ON public.groups
  WITH CHECK (public.is_group_owner_or_moderator(id, auth.uid()));

ALTER POLICY "Owners and moderators can update their community" ON public.communities
  WITH CHECK (public.is_community_owner_or_moderator(id, auth.uid()));
