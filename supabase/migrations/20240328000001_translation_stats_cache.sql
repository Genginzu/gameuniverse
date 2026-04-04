-- Translation stats cache table for admin dashboard
-- Pre-computed stats to avoid scanning all translation tables on every page load

CREATE TABLE IF NOT EXISTS translation_stats_cache (
  entity_type TEXT NOT NULL,
  language_code TEXT NOT NULL,
  total INTEGER NOT NULL DEFAULT 0,
  complete INTEGER NOT NULL DEFAULT 0,
  partial INTEGER NOT NULL DEFAULT 0,
  missing INTEGER NOT NULL DEFAULT 0,
  percentage INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (entity_type, language_code)
);
COMMENT ON TABLE translation_stats_cache IS 'Pre-computed translation statistics for the admin dashboard';
COMMENT ON COLUMN translation_stats_cache.entity_type IS 'Entity type (games, characters, genres, etc.)';
COMMENT ON COLUMN translation_stats_cache.total IS 'Total entities with at least one translation row';
COMMENT ON COLUMN translation_stats_cache.complete IS 'Entities with all required fields translated';
COMMENT ON COLUMN translation_stats_cache.percentage IS 'Completion percentage (complete/total * 100)';
-- RLS: admin read-only
ALTER TABLE translation_stats_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin can read translation stats cache"
  ON translation_stats_cache FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'is_admin')::boolean = true
    )
  );
