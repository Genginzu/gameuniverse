-- Migration: fix_game_dlc_extensions_rls
-- Objectif: Ouvrir les politiques RLS de game_dlc_extensions aux rôles
-- authenticated et anon, comme pour game_versions (cf. 20240124000001).
-- Le client Supabase côté API utilise la clé anon, pas service_role.

-- =============================================================================
-- 1. Supprimer les anciennes politiques restrictives (service_role uniquement)
-- =============================================================================
DROP POLICY IF EXISTS "game_dlc_extensions_insert_service_role" ON public.game_dlc_extensions;
DROP POLICY IF EXISTS "game_dlc_extensions_update_service_role" ON public.game_dlc_extensions;
DROP POLICY IF EXISTS "game_dlc_extensions_delete_service_role" ON public.game_dlc_extensions;
-- =============================================================================
-- 2. Nouvelles politiques : authenticated
-- =============================================================================
CREATE POLICY "game_dlc_extensions_insert_authenticated"
  ON public.game_dlc_extensions FOR INSERT
  TO authenticated
  WITH CHECK (true);
CREATE POLICY "game_dlc_extensions_update_authenticated"
  ON public.game_dlc_extensions FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
CREATE POLICY "game_dlc_extensions_delete_authenticated"
  ON public.game_dlc_extensions FOR DELETE
  TO authenticated
  USING (true);
-- =============================================================================
-- 3. Nouvelles politiques : anon (nécessaire pour les API routes Next.js)
-- =============================================================================
CREATE POLICY "game_dlc_extensions_insert_anon"
  ON public.game_dlc_extensions FOR INSERT
  TO anon
  WITH CHECK (true);
CREATE POLICY "game_dlc_extensions_update_anon"
  ON public.game_dlc_extensions FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);
CREATE POLICY "game_dlc_extensions_delete_anon"
  ON public.game_dlc_extensions FOR DELETE
  TO anon
  USING (true);
