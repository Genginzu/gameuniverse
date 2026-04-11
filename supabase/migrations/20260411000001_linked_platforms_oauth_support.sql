-- Migration: Add OAuth support to player_linked_platforms
-- Adds external_id, tokens, and auth_type for Steam/Xbox/PSN OAuth connections

ALTER TABLE player_linked_platforms
  ADD COLUMN IF NOT EXISTS auth_type TEXT NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS external_id TEXT,
  ADD COLUMN IF NOT EXISTS access_token TEXT,
  ADD COLUMN IF NOT EXISTS refresh_token TEXT,
  ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMPTZ,
  ALTER COLUMN platform_username DROP NOT NULL;

COMMENT ON COLUMN player_linked_platforms.auth_type IS 'Authentication type: oauth (Steam/Xbox), npsso (PSN), or manual (username only)';
COMMENT ON COLUMN player_linked_platforms.external_id IS 'External platform user ID (steamid64, XUID, PSN accountId)';
COMMENT ON COLUMN player_linked_platforms.access_token IS 'Encrypted OAuth access token for API calls';
COMMENT ON COLUMN player_linked_platforms.refresh_token IS 'Encrypted OAuth refresh token';
COMMENT ON COLUMN player_linked_platforms.token_expires_at IS 'When the access token expires';
