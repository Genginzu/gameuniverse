-- Migration: Thematic communities (issue #88, phase 2 — communities, distinct from groups)
-- A community is a broader, permanent space around a game or genre, moderated by
-- multiple moderators. Structurally similar to groups but with a "moderator" role
-- instead of "admin" to avoid confusion with the platform admin role.
-- Tables: communities, community_members, community_posts. RLS mirrors the groups pattern.

-- =============================================================================
-- 1. Tables
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.communities (
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
COMMENT ON TABLE public.communities IS 'Thematic communities: broader, permanent spaces around a game or genre';
COMMENT ON COLUMN public.communities.slug IS 'Globally unique slug generated from the name';
COMMENT ON COLUMN public.communities.visibility IS 'public: readable by anyone; private: readable by members only';
COMMENT ON COLUMN public.communities.game_id IS 'Optional game this community is themed around';
COMMENT ON COLUMN public.communities.genre_id IS 'Optional genre this community is themed around';
COMMENT ON COLUMN public.communities.owner_id IS 'Player who created the community';

CREATE TABLE IF NOT EXISTS public.community_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'moderator', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (community_id, player_id)
);
COMMENT ON TABLE public.community_members IS 'Membership of players in communities, with role (owner/moderator/member)';
COMMENT ON COLUMN public.community_members.role IS 'owner: creator, full control; moderator: can moderate; member: regular member';

CREATE TABLE IF NOT EXISTS public.community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) <= 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.community_posts IS 'Posts published by members within a community feed';

-- =============================================================================
-- 2. Indexes
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_communities_owner_id ON public.communities(owner_id);
CREATE INDEX IF NOT EXISTS idx_communities_visibility ON public.communities(visibility);
CREATE INDEX IF NOT EXISTS idx_communities_game_id ON public.communities(game_id);
CREATE INDEX IF NOT EXISTS idx_communities_genre_id ON public.communities(genre_id);
CREATE INDEX IF NOT EXISTS idx_communities_name_trgm ON public.communities USING gin (name extensions.gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_community_members_community_id ON public.community_members(community_id);
CREATE INDEX IF NOT EXISTS idx_community_members_player_id ON public.community_members(player_id);

CREATE INDEX IF NOT EXISTS idx_community_posts_community_created ON public.community_posts(community_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_author_id ON public.community_posts(author_id);

-- =============================================================================
-- 3. Row Level Security
-- =============================================================================
-- Helper functions run as SECURITY DEFINER to bypass RLS internally, avoiding
-- the circular evaluation that occurs when communities policies query
-- community_members and community_members policies query communities
-- (infinite recursion).

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

ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

-- ---- communities ----

CREATE POLICY "Public communities are viewable by anyone"
  ON public.communities FOR SELECT
  USING (visibility = 'public');

CREATE POLICY "Members can view their private communities"
  ON public.communities FOR SELECT
  USING (
    visibility = 'private'
    AND public.is_community_member(id, auth.uid())
  );

CREATE POLICY "Admins can view any community"
  ON public.communities FOR SELECT
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY "Authenticated users can create communities"
  ON public.communities FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners and moderators can update their community"
  ON public.communities FOR UPDATE
  USING (public.is_community_owner_or_moderator(id, auth.uid()));

CREATE POLICY "Admins can update any community"
  ON public.communities FOR UPDATE
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY "Owners can delete their community"
  ON public.communities FOR DELETE
  USING (owner_id = auth.uid());

CREATE POLICY "Admins can delete any community"
  ON public.communities FOR DELETE
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- ---- community_members ----

CREATE POLICY "Members of public communities are viewable by anyone"
  ON public.community_members FOR SELECT
  USING (public.is_community_public(community_id));

CREATE POLICY "Members of private communities are viewable by members"
  ON public.community_members FOR SELECT
  USING (public.is_community_member(community_id, auth.uid()));

CREATE POLICY "Authenticated users can join a community as themselves"
  ON public.community_members FOR INSERT
  WITH CHECK (player_id = auth.uid());

CREATE POLICY "Owners and moderators can update member roles"
  ON public.community_members FOR UPDATE
  USING (public.is_community_owner_or_moderator(community_id, auth.uid()));

CREATE POLICY "Members can leave, owners and moderators can remove members"
  ON public.community_members FOR DELETE
  USING (
    player_id = auth.uid()
    OR public.is_community_owner_or_moderator(community_id, auth.uid())
  );

-- ---- community_posts ----

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

-- =============================================================================
-- 4. Triggers
-- =============================================================================
-- Reuses update_updated_at_column() defined in 20240101000001_initial_schema.sql

CREATE TRIGGER update_communities_updated_at
  BEFORE UPDATE ON public.communities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_community_posts_updated_at
  BEFORE UPDATE ON public.community_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Automatically add the creator as owner in community_members when a community is created
CREATE OR REPLACE FUNCTION public.handle_new_community()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.community_members (community_id, player_id, role)
  VALUES (NEW.id, NEW.owner_id, 'owner');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_community_created
  AFTER INSERT ON public.communities
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_community();
