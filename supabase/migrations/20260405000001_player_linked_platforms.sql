-- Migration: Create player_linked_platforms table
-- Stores gaming platform identifiers (Steam, Epic, Xbox, PlayStation, GOG, etc.) for player profiles

CREATE TABLE IF NOT EXISTS player_linked_platforms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  platform_username TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(player_id, platform)
);

COMMENT ON TABLE player_linked_platforms IS 'Gaming platform identifiers linked to player profiles';
COMMENT ON COLUMN player_linked_platforms.platform IS 'Platform key: steam, epic, xbox, playstation, gog, nintendo, battlenet, ea, ubisoft, itch';
COMMENT ON COLUMN player_linked_platforms.platform_username IS 'Username or gamertag on the platform';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_linked_platforms_player ON player_linked_platforms(player_id);

-- RLS
ALTER TABLE player_linked_platforms ENABLE ROW LEVEL SECURITY;

-- Anyone can read linked platforms
CREATE POLICY "linked_platforms_select" ON player_linked_platforms
  FOR SELECT USING (true);

-- Only the owner can insert/update/delete their own platforms
CREATE POLICY "linked_platforms_insert" ON player_linked_platforms
  FOR INSERT WITH CHECK (auth.uid() = player_id);

CREATE POLICY "linked_platforms_update" ON player_linked_platforms
  FOR UPDATE USING (auth.uid() = player_id);

CREATE POLICY "linked_platforms_delete" ON player_linked_platforms
  FOR DELETE USING (auth.uid() = player_id);
