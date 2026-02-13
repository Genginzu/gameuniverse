-- Migration: Add three playtime fields to user_library
-- Players can now submit hastily/normally/completely times (matching IGDB structure)

ALTER TABLE public.user_library
ADD COLUMN IF NOT EXISTS play_time_hastily DECIMAL(7,1) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS play_time_normally DECIMAL(7,1) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS play_time_completely DECIMAL(7,1) DEFAULT NULL;

COMMENT ON COLUMN public.user_library.play_time_hastily IS 'Player quick playthrough time in hours';
COMMENT ON COLUMN public.user_library.play_time_normally IS 'Player normal playthrough time in hours';
COMMENT ON COLUMN public.user_library.play_time_completely IS 'Player 100% completion time in hours';

-- Migrate existing play_time_hours data into play_time_normally as a reasonable default
UPDATE public.user_library
SET play_time_normally = play_time_hours
WHERE play_time_hours > 0 AND play_time_normally IS NULL;
