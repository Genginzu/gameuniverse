-- Migration: Fix game_versions RLS policies
-- Allow authenticated users to insert/update/delete game versions
-- This is needed for the game import API to work properly

-- Drop the restrictive service_role only policy
DROP POLICY IF EXISTS "Allow service role full access to game_versions" ON game_versions;
-- Allow authenticated users to insert game versions
CREATE POLICY "Allow authenticated insert to game_versions"
  ON game_versions FOR INSERT
  TO authenticated
  WITH CHECK (true);
-- Allow authenticated users to update game versions
CREATE POLICY "Allow authenticated update to game_versions"
  ON game_versions FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
-- Allow authenticated users to delete game versions
CREATE POLICY "Allow authenticated delete to game_versions"
  ON game_versions FOR DELETE
  TO authenticated
  USING (true);
-- Also allow anon for API routes that don't require auth
CREATE POLICY "Allow anon insert to game_versions"
  ON game_versions FOR INSERT
  TO anon
  WITH CHECK (true);
CREATE POLICY "Allow anon update to game_versions"
  ON game_versions FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);
CREATE POLICY "Allow anon delete to game_versions"
  ON game_versions FOR DELETE
  TO anon
  USING (true);
