-- Migration: Create player_posts table for the Posts tab on player profiles.
-- Each player can publish short text posts (max 2000 chars) visible on their profile.

CREATE TABLE IF NOT EXISTS player_posts (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id  UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content    TEXT        NOT NULL CHECK (char_length(content) <= 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for the main feed query: posts by player sorted by newest first
CREATE INDEX IF NOT EXISTS idx_player_posts_player_created
  ON player_posts (player_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE player_posts ENABLE ROW LEVEL SECURITY;

-- Anyone can read posts
CREATE POLICY player_posts_select_all ON player_posts
  FOR SELECT USING (true);

-- Only the author can insert their own posts
CREATE POLICY player_posts_insert_own ON player_posts
  FOR INSERT WITH CHECK (auth.uid() = player_id);

-- Only the author can delete their own posts
CREATE POLICY player_posts_delete_own ON player_posts
  FOR DELETE USING (auth.uid() = player_id);

-- Documentation
COMMENT ON TABLE player_posts IS 'Posts published by players on their profile feed';
COMMENT ON COLUMN player_posts.id IS 'Unique identifier for the post';
COMMENT ON COLUMN player_posts.player_id IS 'Author of the post (FK to profiles)';
COMMENT ON COLUMN player_posts.content IS 'Text content of the post (max 2000 characters)';
COMMENT ON COLUMN player_posts.created_at IS 'Timestamp when the post was created';
COMMENT ON COLUMN player_posts.updated_at IS 'Timestamp when the post was last updated';
