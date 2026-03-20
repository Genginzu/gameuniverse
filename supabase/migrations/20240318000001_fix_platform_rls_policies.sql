-- Fix platform RLS policies to use public.is_admin() instead of auth.jwt() ->> 'is_admin'
-- The original migration used auth.jwt() ->> 'is_admin' = 'true' which doesn't match
-- how admin status is determined in this project (email domain or user_metadata.role).
-- All other admin tables use public.is_admin() — align platforms tables with that pattern.

-- 1. Drop the broken admin write policies
DROP POLICY IF EXISTS "Admin write platforms" ON public.platforms;
DROP POLICY IF EXISTS "Admin write platform_translations" ON public.platform_translations;
DROP POLICY IF EXISTS "Admin write game_platforms" ON public.game_platforms;

-- 2. Recreate with public.is_admin() (consistent with genres, companies, etc.)
CREATE POLICY "Admins can manage platforms" ON public.platforms
  FOR ALL USING (public.is_admin());

CREATE POLICY "Admins can manage platform_translations" ON public.platform_translations
  FOR ALL USING (public.is_admin());

CREATE POLICY "Admins can manage game_platforms" ON public.game_platforms
  FOR ALL USING (public.is_admin());
