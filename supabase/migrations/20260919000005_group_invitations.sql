-- Migration: Group invitations (invite-only groups, max 50 members)
-- Groups are no longer discoverable/joinable publicly. Only the owner/admin
-- can invite a player, either by email (not yet registered) or by username
-- (already registered). The invited player must accept before becoming a
-- member. Groups are hard-capped at 50 members, enforced at acceptance time.

-- =============================================================================
-- 1. Table
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.group_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  invited_email TEXT,
  invited_player_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  token UUID NOT NULL DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '14 days'),
  CONSTRAINT group_invitations_target_xor CHECK (
    (invited_email IS NOT NULL AND invited_player_id IS NULL)
    OR (invited_email IS NULL AND invited_player_id IS NOT NULL)
  ),
  CONSTRAINT group_invitations_token_unique UNIQUE (token)
);
COMMENT ON TABLE public.group_invitations IS 'Invitations to join a group, by email (unregistered player) or player_id (registered player)';
COMMENT ON COLUMN public.group_invitations.invited_email IS 'Target email when inviting a player not yet registered on the platform';
COMMENT ON COLUMN public.group_invitations.invited_player_id IS 'Target profile when inviting a player already registered on the platform';
COMMENT ON COLUMN public.group_invitations.token IS 'Opaque token used in the acceptance link, distinct from the row id';
COMMENT ON COLUMN public.group_invitations.expires_at IS 'Invitations expire after 14 days and can no longer be accepted';

-- Prevent duplicate pending invitations to the same email/player for the same group
CREATE UNIQUE INDEX IF NOT EXISTS idx_group_invitations_unique_pending_email
  ON public.group_invitations (group_id, invited_email)
  WHERE status = 'pending' AND invited_email IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_group_invitations_unique_pending_player
  ON public.group_invitations (group_id, invited_player_id)
  WHERE status = 'pending' AND invited_player_id IS NOT NULL;

-- =============================================================================
-- 2. Indexes
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_group_invitations_group_id ON public.group_invitations(group_id);
CREATE INDEX IF NOT EXISTS idx_group_invitations_invited_player_id ON public.group_invitations(invited_player_id);
CREATE INDEX IF NOT EXISTS idx_group_invitations_invited_email ON public.group_invitations(invited_email);
CREATE INDEX IF NOT EXISTS idx_group_invitations_token ON public.group_invitations(token);
CREATE INDEX IF NOT EXISTS idx_group_invitations_status ON public.group_invitations(status);

-- =============================================================================
-- 3. Row Level Security
-- =============================================================================

ALTER TABLE public.group_invitations ENABLE ROW LEVEL SECURITY;

-- Owners/admins of the group can view all its invitations
CREATE POLICY "Owners and admins can view group invitations"
  ON public.group_invitations FOR SELECT
  USING (public.is_group_owner_or_admin(group_id, auth.uid()));

-- The invited registered player can view invitations addressed to them
CREATE POLICY "Invited players can view their own invitations"
  ON public.group_invitations FOR SELECT
  USING (invited_player_id = auth.uid());

-- Admins (platform) can view any invitation, for moderation
CREATE POLICY "Admins can view any group invitation"
  ON public.group_invitations FOR SELECT
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- Owners/admins of the group can create invitations
CREATE POLICY "Owners and admins can create group invitations"
  ON public.group_invitations FOR INSERT
  WITH CHECK (
    invited_by = auth.uid()
    AND public.is_group_owner_or_admin(group_id, auth.uid())
  );

-- The invited registered player can accept/decline (update status) their own invitation
CREATE POLICY "Invited players can update their own invitation status"
  ON public.group_invitations FOR UPDATE
  USING (invited_player_id = auth.uid())
  WITH CHECK (invited_player_id = auth.uid());

-- Owners/admins can cancel (delete) a pending invitation
CREATE POLICY "Owners and admins can delete group invitations"
  ON public.group_invitations FOR DELETE
  USING (public.is_group_owner_or_admin(group_id, auth.uid()));

-- =============================================================================
-- 4. Membership cap (50) — enforced via trigger on group_members insert
-- =============================================================================

CREATE OR REPLACE FUNCTION public.enforce_group_member_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_count INT;
BEGIN
  SELECT COUNT(*) INTO current_count FROM public.group_members WHERE group_id = NEW.group_id;

  IF current_count >= 50 THEN
    RAISE EXCEPTION 'Group has reached the maximum of 50 members' USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_group_member_limit_trigger
  BEFORE INSERT ON public.group_members
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_group_member_limit();
