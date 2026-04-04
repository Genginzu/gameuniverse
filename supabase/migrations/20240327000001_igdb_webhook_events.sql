-- IGDB Webhook Events table
-- Stores all incoming webhook events from IGDB for audit trail and processing.

CREATE TABLE IF NOT EXISTS igdb_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL CHECK (event_type IN ('create', 'update', 'delete')),
  entity_type text NOT NULL,
  igdb_id bigint NOT NULL,
  game_id uuid REFERENCES games(id) ON DELETE SET NULL,
  character_id uuid REFERENCES characters(id) ON DELETE SET NULL,
  payload jsonb NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'processing', 'processed', 'failed', 'ignored')),
  error_message text,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE igdb_webhook_events IS 'Audit log of all IGDB webhook events received';
COMMENT ON COLUMN igdb_webhook_events.event_type IS 'Type of IGDB event: create, update, or delete';
COMMENT ON COLUMN igdb_webhook_events.entity_type IS 'IGDB endpoint that triggered the event (games, characters, etc.)';
COMMENT ON COLUMN igdb_webhook_events.igdb_id IS 'IGDB entity ID from the webhook payload';
COMMENT ON COLUMN igdb_webhook_events.game_id IS 'FK to local games table if the entity is a game';
COMMENT ON COLUMN igdb_webhook_events.character_id IS 'FK to local characters table if the entity is a character';
COMMENT ON COLUMN igdb_webhook_events.payload IS 'Raw JSON payload received from IGDB';
COMMENT ON COLUMN igdb_webhook_events.status IS 'Processing status: received, processing, processed, failed, ignored';
COMMENT ON COLUMN igdb_webhook_events.error_message IS 'Error details if processing failed';
COMMENT ON COLUMN igdb_webhook_events.processed_at IS 'Timestamp when the event was processed';
-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_webhook_events_entity_type ON igdb_webhook_events(entity_type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_status ON igdb_webhook_events(status);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at ON igdb_webhook_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_events_game_id ON igdb_webhook_events(game_id) WHERE game_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_webhook_events_character_id ON igdb_webhook_events(character_id) WHERE character_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_webhook_events_igdb_id ON igdb_webhook_events(igdb_id);
-- RLS: only service role can insert (webhook endpoint), admins can read
ALTER TABLE igdb_webhook_events ENABLE ROW LEVEL SECURITY;
-- Allow service role full access (used by webhook API route)
CREATE POLICY "Service role full access on igdb_webhook_events"
  ON igdb_webhook_events
  FOR ALL
  USING (true)
  WITH CHECK (true);
