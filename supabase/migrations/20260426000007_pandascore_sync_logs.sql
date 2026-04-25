-- PandaScore sync logs: tracks automatic and manual sync runs.

CREATE TABLE IF NOT EXISTS public.pandascore_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger TEXT NOT NULL DEFAULT 'cron',
  status TEXT NOT NULL DEFAULT 'running',
  teams_synced INTEGER DEFAULT 0,
  teams_errors INTEGER DEFAULT 0,
  players_synced INTEGER DEFAULT 0,
  players_errors INTEGER DEFAULT 0,
  tournaments_synced INTEGER DEFAULT 0,
  tournaments_errors INTEGER DEFAULT 0,
  matches_synced INTEGER DEFAULT 0,
  matches_errors INTEGER DEFAULT 0,
  error_message TEXT,
  duration_ms INTEGER,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

COMMENT ON TABLE public.pandascore_sync_logs IS 'Logs of PandaScore data sync runs (cron or manual)';
COMMENT ON COLUMN public.pandascore_sync_logs.trigger IS 'cron or manual';
COMMENT ON COLUMN public.pandascore_sync_logs.status IS 'running, completed, failed';

CREATE INDEX IF NOT EXISTS idx_pandascore_sync_logs_started_at
  ON public.pandascore_sync_logs (started_at DESC);

ALTER TABLE public.pandascore_sync_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pandascore_sync_logs_read" ON public.pandascore_sync_logs FOR SELECT USING (true);
