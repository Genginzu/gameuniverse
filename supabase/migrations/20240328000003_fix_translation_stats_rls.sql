-- Fix RLS policy on translation_stats_cache to use public.is_admin()
-- instead of querying auth.users directly (which causes permission denied)

DROP POLICY IF EXISTS "Admin can read translation stats cache" ON translation_stats_cache;
CREATE POLICY "Admin can read translation stats cache"
  ON translation_stats_cache FOR SELECT
  USING (public.is_admin());
