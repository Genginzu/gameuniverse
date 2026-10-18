-- Replace the last user_metadata-based admin policies with public.is_admin()
-- (follow-up of issue #390).
--
-- Context:
--   20261018000006 made public.is_admin() read app_metadata only, but seven
--   policies on groups, communities and group_invitations still compared
--   auth.jwt() -> 'user_metadata' ->> 'role' to 'admin' directly. Any signed-in
--   user can set that value on their own account through
--   supabase.auth.updateUser({ data: { role: 'admin' } }), which let them read,
--   update or delete every group / community (private ones included) and read
--   every group invitation.
--
-- Fix:
--   Drop the seven policies and recreate them with the same names and commands,
--   delegating the admin check to public.is_admin() (app_metadata only).

-- =============================================================================
-- 1. groups
-- =============================================================================

DROP POLICY IF EXISTS "Admins can view any group" ON public.groups;
CREATE POLICY "Admins can view any group"
  ON public.groups FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update any group" ON public.groups;
CREATE POLICY "Admins can update any group"
  ON public.groups FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete any group" ON public.groups;
CREATE POLICY "Admins can delete any group"
  ON public.groups FOR DELETE
  USING (public.is_admin());

-- =============================================================================
-- 2. communities
-- =============================================================================

DROP POLICY IF EXISTS "Admins can view any community" ON public.communities;
CREATE POLICY "Admins can view any community"
  ON public.communities FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update any community" ON public.communities;
CREATE POLICY "Admins can update any community"
  ON public.communities FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete any community" ON public.communities;
CREATE POLICY "Admins can delete any community"
  ON public.communities FOR DELETE
  USING (public.is_admin());

-- =============================================================================
-- 3. group_invitations
-- =============================================================================

DROP POLICY IF EXISTS "Admins can view any group invitation" ON public.group_invitations;
CREATE POLICY "Admins can view any group invitation"
  ON public.group_invitations FOR SELECT
  USING (public.is_admin());
