-- Fix character roles RLS policies to use public.is_admin() instead of raw JWT check.
-- The original migration used auth.jwt() -> 'user_metadata' ->> 'is_admin' which doesn't
-- match how admin status is determined in this project.
-- All other admin tables use public.is_admin() — align character roles tables with that pattern.

-- 1. Drop the broken admin write policies
DROP POLICY IF EXISTS "character_roles_admin_all" ON public.character_roles;
DROP POLICY IF EXISTS "character_role_translations_admin_all" ON public.character_role_translations;
DROP POLICY IF EXISTS "character_character_roles_admin_all" ON public.character_character_roles;

-- 2. Recreate with public.is_admin() (consistent with genres, companies, etc.)
CREATE POLICY "Admins can manage character_roles" ON public.character_roles
  FOR ALL USING (public.is_admin());

CREATE POLICY "Admins can manage character_role_translations" ON public.character_role_translations
  FOR ALL USING (public.is_admin());

CREATE POLICY "Admins can manage character_character_roles" ON public.character_character_roles
  FOR ALL USING (public.is_admin());

-- 3. Add development INSERT policies (consistent with other character tables)
CREATE POLICY "Allow insert character_roles for development" ON public.character_roles
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow insert character_role_translations for development" ON public.character_role_translations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow insert character_character_roles for development" ON public.character_character_roles
  FOR INSERT WITH CHECK (true);
