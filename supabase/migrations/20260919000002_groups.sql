-- Migration: Thematic groups (issue #88, phase 1 — groups only, communities later)
-- Players can create groups around a game or genre, join them, and post within them.
-- Tables: groups, group_members, group_posts. RLS: public read for public groups,
-- member-only read for private groups, write reserved to members per role.

-- =============================================================================
-- 1. Tables
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(120) NOT NULL UNIQUE,
  description TEXT CHECK (char_length(description) <= 1000),
  image_url TEXT,
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private')),
  game_id UUID REFERENCES public.games(id) ON DELETE SET NULL,
  genre_id UUID REFERENCES public.genres(id) ON DELETE SET NULL,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.groups IS 'Thematic groups created by players (fans of a genre, franchise, or game)';
COMMENT ON COLUMN public.groups.slug IS 'Globally unique slug generated from the name';
COMMENT ON COLUMN public.groups.visibility IS 'public: readable by anyone; private: readable by members only';
COMMENT ON COLUMN public.groups.game_id IS 'Optional game this group is themed around';
COMMENT ON COLUMN public.groups.genre_id IS 'Optional genre this group is themed around';
COMMENT ON COLUMN public.groups.owner_id IS 'Player who created the group';

CREATE TABLE IF NOT EXISTS public.group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (group_id, player_id)
);
COMMENT ON TABLE public.group_members IS 'Membership of players in groups, with role (owner/admin/member)';
COMMENT ON COLUMN public.group_members.role IS 'owner: creator, full control; admin: can moderate; member: regular member';

CREATE TABLE IF NOT EXISTS public.group_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) <= 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.group_posts IS 'Posts published by members within a group feed';

-- =============================================================================
-- 2. Indexes
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_groups_owner_id ON public.groups(owner_id);
CREATE INDEX IF NOT EXISTS idx_groups_visibility ON public.groups(visibility);
CREATE INDEX IF NOT EXISTS idx_groups_game_id ON public.groups(game_id);
CREATE INDEX IF NOT EXISTS idx_groups_genre_id ON public.groups(genre_id);
CREATE INDEX IF NOT EXISTS idx_groups_name_trgm ON public.groups USING gin (name extensions.gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON public.group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_player_id ON public.group_members(player_id);

CREATE INDEX IF NOT EXISTS idx_group_posts_group_created ON public.group_posts(group_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_group_posts_author_id ON public.group_posts(author_id);

-- =============================================================================
-- 3. Row Level Security
-- =============================================================================
-- Helper functions run as SECURITY DEFINER to bypass RLS internally, avoiding
-- the circular evaluation that occurs when groups policies query group_members
-- and group_members policies query groups (infinite recursion).

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

ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_posts ENABLE ROW LEVEL SECURITY;

-- ---- groups ----

CREATE POLICY "Public groups are viewable by anyone"
  ON public.groups FOR SELECT
  USING (visibility = 'public');

CREATE POLICY "Members can view their private groups"
  ON public.groups FOR SELECT
  USING (
    visibility = 'private'
    AND public.is_group_member(id, auth.uid())
  );

CREATE POLICY "Admins can view any group"
  ON public.groups FOR SELECT
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY "Authenticated users can create groups"
  ON public.groups FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners and admins can update their group"
  ON public.groups FOR UPDATE
  USING (public.is_group_owner_or_admin(id, auth.uid()));

CREATE POLICY "Owners can delete their group"
  ON public.groups FOR DELETE
  USING (owner_id = auth.uid());

CREATE POLICY "Admins can update any group"
  ON public.groups FOR UPDATE
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can delete any group"
  ON public.groups FOR DELETE
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- ---- group_members ----

CREATE POLICY "Members of public groups are viewable by anyone"
  ON public.group_members FOR SELECT
  USING (public.is_group_public(group_id));

CREATE POLICY "Members of private groups are viewable by members"
  ON public.group_members FOR SELECT
  USING (public.is_group_member(group_id, auth.uid()));

CREATE POLICY "Authenticated users can join a group as themselves"
  ON public.group_members FOR INSERT
  WITH CHECK (player_id = auth.uid());

CREATE POLICY "Owners and admins can update member roles"
  ON public.group_members FOR UPDATE
  USING (public.is_group_owner_or_admin(group_id, auth.uid()));

CREATE POLICY "Members can leave, owners and admins can remove members"
  ON public.group_members FOR DELETE
  USING (
    player_id = auth.uid()
    OR public.is_group_owner_or_admin(group_id, auth.uid())
  );

-- ---- group_posts ----

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
-- 4. Triggers
-- =============================================================================
-- Reuses update_updated_at_column() defined in 20240101000001_initial_schema.sql

CREATE TRIGGER update_groups_updated_at
  BEFORE UPDATE ON public.groups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_group_posts_updated_at
  BEFORE UPDATE ON public.group_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Automatically add the creator as owner in group_members when a group is created
CREATE OR REPLACE FUNCTION public.handle_new_group()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.group_members (group_id, player_id, role)
  VALUES (NEW.id, NEW.owner_id, 'owner');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_group_created
  AFTER INSERT ON public.groups
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_group();
