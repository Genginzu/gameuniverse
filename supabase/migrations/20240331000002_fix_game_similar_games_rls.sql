-- Migration: Fix game_similar_games RLS policies
-- Allow authenticated users to insert/update/delete game similar games
-- This is needed for the admin game form to work properly

-- Add authenticated user policies (admin routes use authenticated client, not service_role)
CREATE POLICY "game_similar_games_insert_authenticated"
  ON public.game_similar_games
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "game_similar_games_update_authenticated"
  ON public.game_similar_games
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "game_similar_games_delete_authenticated"
  ON public.game_similar_games
  FOR DELETE
  TO authenticated
  USING (true);
