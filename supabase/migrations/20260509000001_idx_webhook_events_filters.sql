-- Performance indexes for the admin webhook events listing.
--
-- The admin UI filters igdb_webhook_events by combinations of (entity_type,
-- event_type, status, game_id) and always orders by created_at DESC. The
-- existing single-column indexes (entity_type, status, created_at) are not
-- enough to satisfy these queries efficiently once the table grows: Postgres
-- has to scan and re-sort the matching rows.
--
-- We add composite indexes so the most common admin queries can be served by
-- index-only scans / index range scans returning rows already sorted by
-- created_at DESC. This avoids statement_timeout errors on the
-- /api/admin/webhooks/events route when the table contains hundreds of
-- thousands of rows.

CREATE INDEX IF NOT EXISTS idx_webhook_events_entity_event_created
  ON public.igdb_webhook_events (entity_type, event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_webhook_events_entity_status_created
  ON public.igdb_webhook_events (entity_type, status, created_at DESC);

-- Speeds up the "not imported yet" filter (entity_type = 'games' AND game_id IS NULL).
CREATE INDEX IF NOT EXISTS idx_webhook_events_not_imported
  ON public.igdb_webhook_events (entity_type, created_at DESC)
  WHERE game_id IS NULL;
