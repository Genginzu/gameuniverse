-- Fix: allow coach profile owner to read their own profile (even when inactive)
-- The existing SELECT policy only allows reading active profiles, which blocks
-- the owner from seeing their own profile after creation (is_active defaults to false).

CREATE POLICY "Users can view their own coach profile"
  ON public.coach_profiles FOR SELECT
  USING (player_id = auth.uid());
