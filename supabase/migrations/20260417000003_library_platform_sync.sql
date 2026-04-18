-- Migration: extend user_library + games for external platform library sync.

-- Origin columns on user_library: track which platform imported the entry
ALTER TABLE user_library
  ADD COLUMN IF NOT EXISTS source_platform TEXT,
  ADD COLUMN IF NOT EXISTS source_id TEXT,
  ADD COLUMN IF NOT EXISTS external_playtime_seconds BIGINT,
  ADD COLUMN IF NOT EXISTS synced_at TIMESTAMPTZ;

COMMENT ON COLUMN user_library.source_platform IS
  'Origin of the entry: steam, playstation, xbox, epic, manual, ...';
COMMENT ON COLUMN user_library.source_id IS
  'Platform-specific id (Steam appid, PSN titleId, Xbox productId).';
COMMENT ON COLUMN user_library.external_playtime_seconds IS
  'Raw playtime reported by the provider, in seconds (Steam: playtime_forever * 60).';
COMMENT ON COLUMN user_library.synced_at IS
  'Last successful sync with the external platform.';

CREATE INDEX IF NOT EXISTS idx_user_library_source
  ON user_library(user_id, source_platform);

-- Games: cache Steam appid to avoid re-querying IGDB external_games
ALTER TABLE games
  ADD COLUMN IF NOT EXISTS steam_appid INTEGER;

COMMENT ON COLUMN games.steam_appid IS
  'Cached Steam application id (IGDB external_games category=1). Used for library sync lookups.';

CREATE UNIQUE INDEX IF NOT EXISTS idx_games_steam_appid
  ON games(steam_appid) WHERE steam_appid IS NOT NULL;
