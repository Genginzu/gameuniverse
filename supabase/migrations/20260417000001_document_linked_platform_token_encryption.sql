-- Migration: Document application-level encryption for linked platform tokens.
-- Tokens are now encrypted at rest by the application layer (AES-256-GCM) before
-- insertion, so the previous "encrypted" comment finally matches reality.

COMMENT ON COLUMN player_linked_platforms.access_token IS
  'AES-256-GCM ciphertext (format: v1:iv:tag:cipher, base64). Encrypted at the application layer.';
COMMENT ON COLUMN player_linked_platforms.refresh_token IS
  'AES-256-GCM ciphertext (format: v1:iv:tag:cipher, base64). Encrypted at the application layer.';
