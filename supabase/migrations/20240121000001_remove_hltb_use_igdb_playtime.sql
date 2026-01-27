-- Migration: Remove HLTB references and use IGDB for playtime
-- Playtime data now comes from IGDB's game_time_to_beats endpoint

-- Drop the HLTB ID column and index (no longer needed)
DROP INDEX IF EXISTS idx_games_hltb_id;
ALTER TABLE public.games DROP COLUMN IF EXISTS hltb_id;

-- Add comment to clarify playtime source
COMMENT ON COLUMN public.games.playtime_main IS 'Main story completion time in hours (from IGDB hastily)';
COMMENT ON COLUMN public.games.playtime_main_extra IS 'Main story + extras completion time in hours (from IGDB normally)';
COMMENT ON COLUMN public.games.playtime_completionist IS '100% completion time in hours (from IGDB completely)';
COMMENT ON COLUMN public.games.playtime_all_styles IS 'Average of all playtime styles in hours';
COMMENT ON COLUMN public.games.playtime_updated_at IS 'Last time playtime data was fetched from IGDB';
