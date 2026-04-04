-- Migration: Allow UPDATE on games table for development/API operations
-- This allows the API to update game data (playtime, sync, etc.)

-- Allow update for development/API operations
CREATE POLICY "Allow update for development" ON games 
  FOR UPDATE USING (true) WITH CHECK (true);
-- Also allow update on related tables that might need it
CREATE POLICY "Allow update for development" ON game_translations 
  FOR UPDATE USING (true) WITH CHECK (true);
