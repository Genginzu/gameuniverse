-- Track the item currently being processed by a library-sync job (e.g. the
-- game being imported from IGDB) so the UI can display "Importing <game>…".

ALTER TABLE public.player_library_sync_jobs
  ADD COLUMN IF NOT EXISTS current_item TEXT;

COMMENT ON COLUMN public.player_library_sync_jobs.current_item IS
  'Human-readable label of the item currently being processed (e.g. the game name imported from IGDB during the importing phase).';
