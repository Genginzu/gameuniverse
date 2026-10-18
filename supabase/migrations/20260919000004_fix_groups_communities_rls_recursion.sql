-- Migration: Fix infinite recursion in groups/communities RLS policies
-- The original policies on groups (resp. communities) queried group_members
-- (resp. community_members) directly via EXISTS, and group_members queried
-- groups back, causing "infinite recursion detected in policy" errors on any
-- SELECT/INSERT touching either table. Fixed by routing membership checks
-- through SECURITY DEFINER helper functions that bypass RLS internally.

-- =============================================================================
-- 1. Helper functions (idempotent — CREATE OR REPLACE)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.is_group_member(p_group_id UUID, p_player_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = p_group_id AND player_id = p_player_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_group_owner_or_admin(p_group_id UUID, p_player_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = p_group_id AND player_id = p_player_id AND role IN ('owner', 'admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_group_public(p_group_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.groups
    WHERE id = p_group_id AND visibility = 'public'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_community_member(p_community_id UUID, p_player_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.community_members
    WHERE community_id = p_community_id AND player_id = p_player_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_community_owner_or_moderator(p_community_id UUID, p_player_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.community_members
    WHERE community_id = p_community_id AND player_id = p_player_id AND role IN ('owner', 'moderator')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_community_public(p_community_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.communities
    WHERE id = p_community_id AND visibility = 'public'
  );
$$;

-- =============================================================================
-- 2. Drop the old recursive policies on groups / group_members / group_posts
-- =============================================================================

DROP POLICY IF EXISTS "Members can view their private groups" ON public.groups;
DROP POLICY IF EXISTS "Owners and admins can update their group" ON public.groups;

DROP POLICY IF EXISTS "Members of public groups are viewable by anyone" ON public.group_members;
DROP POLICY IF EXISTS "Members of private groups are viewable by members" ON public.group_members;
DROP POLICY IF EXISTS "Owners and admins can update member roles" ON public.group_members;
DROP POLICY IF EXISTS "Members can leave, owners and admins can remove members" ON public.group_members;

DROP POLICY IF EXISTS "Posts of public groups are viewable by anyone" ON public.group_posts;
DROP POLICY IF EXISTS "Posts of private groups are viewable by members" ON public.group_posts;
DROP POLICY IF EXISTS "Members can post in their group" ON public.group_posts;
DROP POLICY IF EXISTS "Authors can delete own posts, owners and admins can moderate" ON public.group_posts;

-- =============================================================================
-- 3. Recreate them using the SECURITY DEFINER helpers (no cross-table EXISTS)
-- =============================================================================

CREATE POLICY "Members can view their private groups"
  ON public.groups FOR SELECT
  USING (
    visibility = 'private'
    AND public.is_group_member(id, auth.uid())
  );

CREATE POLICY "Owners and admins can update their group"
  ON public.groups FOR UPDATE
  USING (public.is_group_owner_or_admin(id, auth.uid()));

CREATE POLICY "Members of public groups are viewable by anyone"
  ON public.group_members FOR SELECT
  USING (public.is_group_public(group_id));

CREATE POLICY "Members of private groups are viewable by members"
  ON public.group_members FOR SELECT
  USING (public.is_group_member(group_id, auth.uid()));

CREATE POLICY "Owners and admins can update member roles"
  ON public.group_members FOR UPDATE
  USING (public.is_group_owner_or_admin(group_id, auth.uid()));

CREATE POLICY "Members can leave, owners and admins can remove members"
  ON public.group_members FOR DELETE
  USING (
    player_id = auth.uid()
    OR public.is_group_owner_or_admin(group_id, auth.uid())
  );

CREATE POLICY "Posts of public groups are viewable by anyone"
  ON public.group_posts FOR SELECT
  USING (public.is_group_public(group_id));

CREATE POLICY "Posts of private groups are viewable by members"
  ON public.group_posts FOR SELECT
  USING (public.is_group_member(group_id, auth.uid()));

CREATE POLICY "Members can post in their group"
  ON public.group_posts FOR INSERT
  WITH CHECK (
    author_id = auth.uid()
    AND public.is_group_member(group_id, auth.uid())
  );

CREATE POLICY "Authors can delete own posts, owners and admins can moderate"
  ON public.group_posts FOR DELETE
  USING (
    author_id = auth.uid()
    OR public.is_group_owner_or_admin(group_id, auth.uid())
  );

-- =============================================================================
-- 4. Same fix for communities / community_members / community_posts
-- =============================================================================

DROP POLICY IF EXISTS "Members can view their private communities" ON public.communities;
DROP POLICY IF EXISTS "Owners and moderators can update their community" ON public.communities;

DROP POLICY IF EXISTS "Members of public communities are viewable by anyone" ON public.community_members;
DROP POLICY IF EXISTS "Members of private communities are viewable by members" ON public.community_members;
DROP POLICY IF EXISTS "Owners and moderators can update member roles" ON public.community_members;
DROP POLICY IF EXISTS "Members can leave, owners and moderators can remove members" ON public.community_members;

DROP POLICY IF EXISTS "Posts of public communities are viewable by anyone" ON public.community_posts;
DROP POLICY IF EXISTS "Posts of private communities are viewable by members" ON public.community_posts;
DROP POLICY IF EXISTS "Members can post in their community" ON public.community_posts;
DROP POLICY IF EXISTS "Authors can delete own posts, owners and moderators can moderate" ON public.community_posts;

CREATE POLICY "Members can view their private communities"
  ON public.communities FOR SELECT
  USING (
    visibility = 'private'
    AND public.is_community_member(id, auth.uid())
  );

CREATE POLICY "Owners and moderators can update their community"
  ON public.communities FOR UPDATE
  USING (public.is_community_owner_or_moderator(id, auth.uid()));

CREATE POLICY "Members of public communities are viewable by anyone"
  ON public.community_members FOR SELECT
  USING (public.is_community_public(community_id));

CREATE POLICY "Members of private communities are viewable by members"
  ON public.community_members FOR SELECT
  USING (public.is_community_member(community_id, auth.uid()));

CREATE POLICY "Owners and moderators can update member roles"
  ON public.community_members FOR UPDATE
  USING (public.is_community_owner_or_moderator(community_id, auth.uid()));

CREATE POLICY "Members can leave, owners and moderators can remove members"
  ON public.community_members FOR DELETE
  USING (
    player_id = auth.uid()
    OR public.is_community_owner_or_moderator(community_id, auth.uid())
  );

CREATE POLICY "Posts of public communities are viewable by anyone"
  ON public.community_posts FOR SELECT
  USING (public.is_community_public(community_id));

CREATE POLICY "Posts of private communities are viewable by members"
  ON public.community_posts FOR SELECT
  USING (public.is_community_member(community_id, auth.uid()));

CREATE POLICY "Members can post in their community"
  ON public.community_posts FOR INSERT
  WITH CHECK (
    author_id = auth.uid()
    AND public.is_community_member(community_id, auth.uid())
  );

CREATE POLICY "Authors can delete own posts, owners and moderators can moderate"
  ON public.community_posts FOR DELETE
  USING (
    author_id = auth.uid()
    OR public.is_community_owner_or_moderator(community_id, auth.uid())
  );
