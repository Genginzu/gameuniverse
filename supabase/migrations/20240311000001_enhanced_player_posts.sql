-- Enhanced Player Posts: image_url, post_tags, post_mentions, GIN index
-- Adds support for images, hashtags, player mentions, and full-text search on posts.

-- 1. Ajout colonne image_url sur player_posts
ALTER TABLE player_posts
  ADD COLUMN IF NOT EXISTS image_url TEXT;

COMMENT ON COLUMN player_posts.image_url IS 'Optional HTTPS URL to an image displayed with the post';

-- 2. Table post_tags
CREATE TABLE IF NOT EXISTS post_tags (
  id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES player_posts(id) ON DELETE CASCADE,
  tag     TEXT NOT NULL CHECK (tag ~ '^[a-z0-9_-]+$'),
  UNIQUE (post_id, tag)
);

COMMENT ON TABLE post_tags IS 'Stores normalised hashtags extracted from player post content';
COMMENT ON COLUMN post_tags.id IS 'Primary key (UUID)';
COMMENT ON COLUMN post_tags.post_id IS 'FK to the parent player_posts row, cascades on delete';
COMMENT ON COLUMN post_tags.tag IS 'Normalised lowercase tag without the # prefix, must match ^[a-z0-9_-]+$';

ALTER TABLE post_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY post_tags_select_all ON post_tags
  FOR SELECT USING (true);

CREATE POLICY post_tags_insert_own ON post_tags
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM player_posts WHERE id = post_id AND player_id = auth.uid())
  );

CREATE POLICY post_tags_delete_own ON post_tags
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM player_posts WHERE id = post_id AND player_id = auth.uid())
  );

-- 3. Table post_mentions
CREATE TABLE IF NOT EXISTS post_mentions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id             UUID NOT NULL REFERENCES player_posts(id) ON DELETE CASCADE,
  mentioned_player_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  UNIQUE (post_id, mentioned_player_id)
);

COMMENT ON TABLE post_mentions IS 'Stores resolved @mentions linking a post to mentioned player profiles';
COMMENT ON COLUMN post_mentions.id IS 'Primary key (UUID)';
COMMENT ON COLUMN post_mentions.post_id IS 'FK to the parent player_posts row, cascades on delete';
COMMENT ON COLUMN post_mentions.mentioned_player_id IS 'FK to the mentioned player profile, cascades on delete';

ALTER TABLE post_mentions ENABLE ROW LEVEL SECURITY;

CREATE POLICY post_mentions_select_all ON post_mentions
  FOR SELECT USING (true);

CREATE POLICY post_mentions_insert_own ON post_mentions
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM player_posts WHERE id = post_id AND player_id = auth.uid())
  );

CREATE POLICY post_mentions_delete_own ON post_mentions
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM player_posts WHERE id = post_id AND player_id = auth.uid())
  );

-- 4. Index GIN pour la recherche textuelle (trigram)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_player_posts_content_trgm
  ON player_posts USING GIN (content gin_trgm_ops);
