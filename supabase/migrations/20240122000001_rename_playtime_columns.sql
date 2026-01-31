-- Migration: Rename playtime columns to match IGDB terminology
-- IGDB uses: hastily (quick), normally (normal), completely (100%)

-- Rename columns to match IGDB terminology
ALTER TABLE public.games RENAME COLUMN playtime_main TO playtime_hastily;
ALTER TABLE public.games RENAME COLUMN playtime_main_extra TO playtime_normally;
-- playtime_completionist already matches IGDB's "completely" concept, but rename for consistency
ALTER TABLE public.games RENAME COLUMN playtime_completionist TO playtime_completely;
-- Remove all_styles as it's a calculated average that doesn't come from IGDB
ALTER TABLE public.games DROP COLUMN IF EXISTS playtime_all_styles;

-- Update comments to clarify the source
COMMENT ON COLUMN public.games.playtime_hastily IS 'Quick playthrough time in hours (from IGDB hastily - rushed/speedrun style)';
COMMENT ON COLUMN public.games.playtime_normally IS 'Normal playthrough time in hours (from IGDB normally - standard pace)';
COMMENT ON COLUMN public.games.playtime_completely IS '100% completion time in hours (from IGDB completely - all content)';
COMMENT ON COLUMN public.games.playtime_updated_at IS 'Last time playtime data was fetched from IGDB';
