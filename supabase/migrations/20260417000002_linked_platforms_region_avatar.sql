-- Migration: Extra profile metadata for linked platforms
-- - platform_region: required by Battle.net (us/eu/kr/tw), useful for other region-scoped APIs
-- - platform_avatar_url: avatar URL returned by OAuth providers (Discord, Epic, ...)

ALTER TABLE player_linked_platforms
  ADD COLUMN IF NOT EXISTS platform_region TEXT,
  ADD COLUMN IF NOT EXISTS platform_avatar_url TEXT;

COMMENT ON COLUMN player_linked_platforms.platform_region IS
  'Region code on the provider (e.g. Battle.net: us/eu/kr/tw). NULL when not applicable.';
COMMENT ON COLUMN player_linked_platforms.platform_avatar_url IS
  'Avatar URL returned by the provider at connection time.';
