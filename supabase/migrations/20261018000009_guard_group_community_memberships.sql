-- Guard group / community memberships (join, role changes, removals).
--
-- Context:
--   The INSERT policies on group_members and community_members only checked
--   player_id = auth.uid(). Through PostgREST any signed-in user could insert
--   { group_id: <private group>, player_id: <self>, role: 'owner' } and then
--   read private content and moderate the group. The UPDATE / DELETE policies
--   let any moderator demote, promote or remove other moderators.
--
-- Fix:
--   1. INSERT: role must be 'member', and the target must be public or (groups)
--      the caller must hold a pending, non-expired invitation. The owner row is
--      still created by the SECURITY DEFINER handle_new_group / handle_new_community
--      triggers, which bypass RLS.
--   2. UPDATE policies get a WITH CHECK mirroring USING.
--   3. A BEFORE UPDATE OR DELETE trigger, for interactive callers only:
--        - identity columns are immutable, 'owner' can neither be granted nor
--          changed;
--        - only the owner may promote to / demote from 'moderator' and remove a
--          moderator; the owner row cannot be removed by someone else;
--        - members may always leave; rows deleted by cascade (parent gone) pass.

-- =============================================================================
-- 1. Helper: pending invitation for the caller
-- =============================================================================

CREATE OR REPLACE FUNCTION public.has_pending_group_invitation(p_group_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.group_invitations i
    WHERE i.group_id = p_group_id
      AND i.invited_player_id = auth.uid()
      AND i.status = 'pending'
      AND i.expires_at > now()
  );
$$;

COMMENT ON FUNCTION public.has_pending_group_invitation(uuid) IS
  'True when the caller (auth.uid()) holds a pending, non-expired invitation to the group.';

REVOKE EXECUTE ON FUNCTION public.has_pending_group_invitation(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_pending_group_invitation(uuid) TO authenticated, service_role;

-- =============================================================================
-- 2. INSERT policies
-- =============================================================================

DROP POLICY IF EXISTS "Authenticated users can join a group as themselves" ON public.group_members;
CREATE POLICY "Authenticated users can join a group as themselves"
  ON public.group_members FOR INSERT
  WITH CHECK (
    player_id = auth.uid()
    AND role = 'member'
    AND (
      public.is_group_public(group_id)
      OR public.has_pending_group_invitation(group_id)
    )
  );

DROP POLICY IF EXISTS "Authenticated users can join a community as themselves" ON public.community_members;
CREATE POLICY "Authenticated users can join a community as themselves"
  ON public.community_members FOR INSERT
  WITH CHECK (
    player_id = auth.uid()
    AND role = 'member'
    AND public.is_community_public(community_id)
  );

-- =============================================================================
-- 3. UPDATE policies with WITH CHECK
-- =============================================================================

DROP POLICY IF EXISTS "Owners and moderators can update member roles" ON public.group_members;
CREATE POLICY "Owners and moderators can update member roles"
  ON public.group_members FOR UPDATE
  USING (public.is_group_owner_or_moderator(group_id, auth.uid()))
  WITH CHECK (public.is_group_owner_or_moderator(group_id, auth.uid()));

DROP POLICY IF EXISTS "Owners and moderators can update member roles" ON public.community_members;
CREATE POLICY "Owners and moderators can update member roles"
  ON public.community_members FOR UPDATE
  USING (public.is_community_owner_or_moderator(community_id, auth.uid()))
  WITH CHECK (public.is_community_owner_or_moderator(community_id, auth.uid()));

-- =============================================================================
-- 4. Role hierarchy guard
-- =============================================================================

CREATE OR REPLACE FUNCTION public.enforce_membership_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_old jsonb := to_jsonb(OLD);
  v_parent_id uuid;
  v_owner_id uuid;
  v_caller_is_owner boolean;
BEGIN
  IF auth.role() NOT IN ('authenticated', 'anon') THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF TG_TABLE_NAME = 'group_members' THEN
    v_parent_id := (v_old ->> 'group_id')::uuid;
    SELECT g.owner_id INTO v_owner_id FROM public.groups g WHERE g.id = v_parent_id;
  ELSE
    v_parent_id := (v_old ->> 'community_id')::uuid;
    SELECT c.owner_id INTO v_owner_id FROM public.communities c WHERE c.id = v_parent_id;
  END IF;

  v_caller_is_owner := v_uid IS NOT NULL AND v_owner_id = v_uid;

  IF TG_OP = 'DELETE' THEN
    -- Cascade from the parent row, or a member leaving on their own.
    IF v_owner_id IS NULL OR OLD.player_id = v_uid THEN
      RETURN OLD;
    END IF;
    IF OLD.role = 'owner' OR (OLD.role = 'moderator' AND NOT v_caller_is_owner) THEN
      RAISE EXCEPTION '%: only the owner can remove a moderator; the owner cannot be removed',
        TG_TABLE_NAME USING ERRCODE = '42501';
    END IF;
    RETURN OLD;
  END IF;

  IF to_jsonb(NEW) - 'role' IS DISTINCT FROM v_old - 'role' THEN
    RAISE EXCEPTION '%: only the role can be updated', TG_TABLE_NAME USING ERRCODE = '42501';
  END IF;

  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF NEW.role = 'owner' OR OLD.role = 'owner' THEN
      RAISE EXCEPTION '%: the owner role cannot be granted or changed', TG_TABLE_NAME
        USING ERRCODE = '42501';
    END IF;
    IF NOT v_caller_is_owner THEN
      RAISE EXCEPTION '%: only the owner can change moderator roles', TG_TABLE_NAME
        USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.enforce_membership_role_change() IS
  'BEFORE UPDATE/DELETE guard on group_members and community_members: only the owner manages '
  'moderators, the owner role is immutable, identity columns are immutable.';

REVOKE EXECUTE ON FUNCTION public.enforce_membership_role_change() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_enforce_group_member_role_change ON public.group_members;
CREATE TRIGGER trg_enforce_group_member_role_change
  BEFORE UPDATE OR DELETE ON public.group_members
  FOR EACH ROW EXECUTE FUNCTION public.enforce_membership_role_change();

DROP TRIGGER IF EXISTS trg_enforce_community_member_role_change ON public.community_members;
CREATE TRIGGER trg_enforce_community_member_role_change
  BEFORE UPDATE OR DELETE ON public.community_members
  FOR EACH ROW EXECUTE FUNCTION public.enforce_membership_role_change();
