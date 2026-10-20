-- Rotate the library-sync cron across linked accounts.
--
-- Context: /api/cron/sync-libraries picked `ORDER BY id LIMIT 50` on
-- player_linked_platforms, so the same 50 accounts were synced on every run and
-- the others never were.
--
-- Fix: `last_library_sync_at` is stamped by the service role when a library
-- sync job finishes (succeeded or failed). The cron orders by it, NULLs first,
-- so never-synced accounts go first and the least recently synced follow.
--
-- Privileges: server-only column. SELECT on this table is column-granted to
-- anon/authenticated (20261018000013) and this column is not added to that
-- grant. Owners keep their row-level UPDATE policy, so a trigger freezes the
-- column for interactive callers.

ALTER TABLE public.player_linked_platforms
  ADD COLUMN IF NOT EXISTS last_library_sync_at timestamptz;

COMMENT ON COLUMN public.player_linked_platforms.last_library_sync_at IS
  'End of the last library sync job (any outcome). Written by the service role only; drives the sync-libraries cron rotation.';

CREATE INDEX IF NOT EXISTS idx_player_linked_platforms_last_library_sync
  ON public.player_linked_platforms (last_library_sync_at ASC NULLS FIRST, id);

CREATE OR REPLACE FUNCTION public.freeze_linked_platform_sync_stamp()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF auth.role() NOT IN ('authenticated', 'anon') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.last_library_sync_at := NULL;
  ELSE
    NEW.last_library_sync_at := OLD.last_library_sync_at;
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.freeze_linked_platform_sync_stamp() IS
  'Keeps player_linked_platforms.last_library_sync_at server-only for authenticated/anon callers.';

REVOKE EXECUTE ON FUNCTION public.freeze_linked_platform_sync_stamp() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_freeze_linked_platform_sync_stamp ON public.player_linked_platforms;
CREATE TRIGGER trg_freeze_linked_platform_sync_stamp
  BEFORE INSERT OR UPDATE ON public.player_linked_platforms
  FOR EACH ROW EXECUTE FUNCTION public.freeze_linked_platform_sync_stamp();
