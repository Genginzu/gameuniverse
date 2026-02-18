-- Migration: Backfill play_time_hours from the 3-field playtime columns
-- When players submit playtime via the 3-field form (hastily/normally/completely),
-- play_time_hours was not being updated. This migration syncs existing data.
-- Uses the highest value among the 3 fields (represents actual time spent).

UPDATE public.user_library
SET play_time_hours = GREATEST(
  COALESCE(play_time_completely, 0),
  COALESCE(play_time_normally, 0),
  COALESCE(play_time_hastily, 0)
)
WHERE (play_time_hours IS NULL OR play_time_hours = 0)
  AND (play_time_hastily IS NOT NULL OR play_time_normally IS NOT NULL OR play_time_completely IS NOT NULL);
