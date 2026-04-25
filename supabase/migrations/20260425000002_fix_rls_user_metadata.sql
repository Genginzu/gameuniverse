-- Fix RLS policies on game_reviews and character_comments that reference
-- user_metadata (editable by end users) instead of public.is_admin().

-- game_reviews: update policy
DROP POLICY IF EXISTS "Users can update their own reviews or admins can update any" ON public.game_reviews;
CREATE POLICY "Users can update their own reviews or admins can update any"
  ON public.game_reviews FOR UPDATE
  USING (auth.uid() = user_id OR public.is_admin());

-- game_reviews: delete policy
DROP POLICY IF EXISTS "Admins can delete any review" ON public.game_reviews;
CREATE POLICY "Admins can delete any review"
  ON public.game_reviews FOR DELETE
  USING (public.is_admin());

-- character_comments: update policy
DROP POLICY IF EXISTS "Users can update their own comments or admins can update any" ON public.character_comments;
CREATE POLICY "Users can update their own comments or admins can update any"
  ON public.character_comments FOR UPDATE
  USING (auth.uid() = user_id OR public.is_admin());

-- character_comments: delete policy
DROP POLICY IF EXISTS "Admins can delete any comment" ON public.character_comments;
CREATE POLICY "Admins can delete any comment"
  ON public.character_comments FOR DELETE
  USING (public.is_admin());
