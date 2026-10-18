-- Restrict access to user emails exposed through public.profiles (issue #375).
--
-- Problem:
--   public.profiles duplicates auth.users.email in a column that is readable by
--   anyone: the policy "Anyone can view profiles" is SELECT USING (true) and an
--   old migration (20240101000014) ran GRANT ALL ON public.profiles TO anon,
--   authenticated. Any holder of the public anon key could list every user's
--   email via PostgREST (select=email) and could write arbitrary columns.
--
-- Fix (preferred option from the issue):
--   1. Drop the duplicated email column entirely. auth.users.email stays the
--      single source of truth; server code that needs an email reads it with
--      the service-role client (see src/lib/services/userEmailsServerService.ts).
--   2. Replace the broad GRANT ALL with the minimal column/row privileges that
--      Supabase's RLS model expects, so writes only go through the existing
--      own-row RLS policies and protected columns (role lives in auth.users,
--      suspension columns are guarded by trg_protect_profile_suspension).
--
-- Safety:
--   - The latest public.is_admin() (20240210000001) reads auth.users, NOT
--     profiles.email, so dropping the column does not affect admin checks.
--   - The suspension enforcement (20261002000001) does not reference email.
--   - handle_new_user() is updated to stop inserting email.

-- =============================================================================
-- 1. Stop the signup trigger from populating the email column before dropping it
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, preferred_locale)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'username',
      NEW.raw_user_meta_data->>'full_name',
      ''
    ),
    COALESCE(NEW.raw_user_meta_data->>'preferred_locale', 'fr')
  );
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user() IS
  'Creates a public.profiles row on signup. Email is NOT copied here; '
  'auth.users.email is the single source of truth (issue #375).';

-- =============================================================================
-- 2. Drop the duplicated, publicly-readable email column
-- =============================================================================

ALTER TABLE public.profiles DROP COLUMN IF EXISTS email;

-- =============================================================================
-- 3. Replace broad write grants with minimal, RLS-gated privileges
-- =============================================================================
-- GRANT ALL (from 20240101000014) also granted TRUNCATE/REFERENCES/TRIGGER and
-- unrestricted column writes. Revoke everything, then re-grant only what the
-- RLS policies need: SELECT for public profile pages, and INSERT/UPDATE for the
-- own-row policies. anon never writes; neither role may DELETE a profile.

REVOKE ALL ON public.profiles FROM anon, authenticated;

-- Public profile pages (username, avatar, banner, bio, ...) stay readable.
GRANT SELECT ON public.profiles TO anon;

-- Authenticated users read profiles and write their own row (RLS enforces the
-- row scope; the suspension trigger protects the moderation columns).
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;

-- service_role keeps full access (bypasses RLS) for moderation / server flows.
GRANT ALL ON public.profiles TO service_role;
