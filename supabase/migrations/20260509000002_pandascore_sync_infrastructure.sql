-- PandaScore sync infrastructure: state singleton + chunked jobs.
--
-- This migration introduces two tables that drive the new Edge Functions
-- pipeline (pandascore-incremental + pandascore-full-sync):
--
--   - pandascore_sync_state : 1-row singleton holding `last_incremental_at`
--     and an applicative lock (`incremental_running_since`) used by the
--     5-minute pg_cron job and the manual "Sync incrémentale" button.
--
--   - pandascore_sync_jobs  : queue of full-sync jobs. The admin "Sync
--     globale" button inserts a row with status='pending'; a Database Webhook
--     UI on this table triggers the pandascore-full-sync Edge Function which
--     processes the job in chunks (≤350s each) and self-reschedules until
--     completion by setting status back to 'pending' with an updated cursor.
--
-- pg_cron itself is configured separately via the Supabase Dashboard UI
-- (Database → Cron) — the same pattern we use for igdb-processor — to avoid
-- the `permission denied to set parameter "app.settings.*"` issue we hit
-- with the IGDB processor trigger migration.

-- ──────────────────────────────────────────────────────────────────────────
-- 1. pandascore_sync_state — singleton row
-- ──────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.pandascore_sync_state (
  id                            INTEGER PRIMARY KEY DEFAULT 1
                                CHECK (id = 1),
  last_incremental_at           TIMESTAMPTZ,
  incremental_running_since     TIMESTAMPTZ,
  updated_at                    TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.pandascore_sync_state IS
  'Singleton row tracking the last successful incremental sync timestamp and an applicative lock to prevent concurrent runs (cron + manual button).';
COMMENT ON COLUMN public.pandascore_sync_state.last_incremental_at IS
  'Cursor passed as `since` to PandaScore Incidents API on the next run.';
COMMENT ON COLUMN public.pandascore_sync_state.incremental_running_since IS
  'NULL when no run is in progress. Set to now() when a run starts; stale entries (> 6 minutes) are auto-released.';

-- Seed the singleton row if missing. last_incremental_at left NULL so the
-- first run does a 24-hour catch-up window (Edge Function default).
INSERT INTO public.pandascore_sync_state (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.pandascore_sync_state ENABLE ROW LEVEL SECURITY;
-- Read-only for the admin UI; writes are service-role only (RLS bypass).
CREATE POLICY "pandascore_sync_state_read"
  ON public.pandascore_sync_state FOR SELECT USING (true);

-- ──────────────────────────────────────────────────────────────────────────
-- 2. pandascore_sync_jobs — full-sync queue
-- ──────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.pandascore_sync_jobs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind            TEXT NOT NULL DEFAULT 'full'
                  CHECK (kind IN ('full', 'entity')),
  entity          TEXT
                  CHECK (entity IS NULL OR entity IN ('teams', 'players', 'tournaments', 'matches')),
  game            TEXT,
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  cursor          JSONB NOT NULL DEFAULT '{}'::jsonb,
  total_synced    INTEGER NOT NULL DEFAULT 0,
  total_errors    INTEGER NOT NULL DEFAULT 0,
  error_details   JSONB NOT NULL DEFAULT '[]'::jsonb,
  error_message   TEXT,
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  last_chunk_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.pandascore_sync_jobs IS
  'Queue of PandaScore full-sync jobs. Each job is processed in chunks (≤350s per Edge Function invocation) until cursor.done is true for every entity.';
COMMENT ON COLUMN public.pandascore_sync_jobs.kind IS
  'full = sync all entities; entity = sync a single entity only.';
COMMENT ON COLUMN public.pandascore_sync_jobs.cursor IS
  'Per-entity progress: { teams: { page, done }, players: { page, done }, tournaments: { page, done }, matches: { page, done } }.';
COMMENT ON COLUMN public.pandascore_sync_jobs.last_chunk_at IS
  'Updated at the end of every chunk; used to detect zombie jobs (running with last_chunk_at older than ~10 minutes).';

CREATE INDEX IF NOT EXISTS idx_pandascore_sync_jobs_status
  ON public.pandascore_sync_jobs (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_pandascore_sync_jobs_pending
  ON public.pandascore_sync_jobs (created_at DESC)
  WHERE status = 'pending';

ALTER TABLE public.pandascore_sync_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pandascore_sync_jobs_read"
  ON public.pandascore_sync_jobs FOR SELECT USING (true);
