-- Fix remaining "for development" policy on character_roles

DROP POLICY IF EXISTS "Allow insert character_roles for development" ON public.character_roles;
CREATE POLICY "Admins can insert character_roles" ON public.character_roles FOR INSERT WITH CHECK (public.is_admin());
