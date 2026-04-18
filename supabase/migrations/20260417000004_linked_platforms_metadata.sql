-- Migration: free-form metadata snapshot per linked platform.
-- Stores provider-specific details (country, level, trophy counts, Discord connections...)
-- captured at connection or sync time. Schemaless on purpose.

ALTER TABLE player_linked_platforms
  ADD COLUMN IF NOT EXISTS platform_metadata JSONB;

COMMENT ON COLUMN player_linked_platforms.platform_metadata IS
  'Provider-specific snapshot (country code, Steam level, trophy counts, Discord connections, ...).';
