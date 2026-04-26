-- Match discussion comments: per-match threads with emoji reactions
-- Supports both internal matches and PandaScore external matches

CREATE TABLE IF NOT EXISTS match_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id text NOT NULL,
  match_source text NOT NULL DEFAULT 'pandascore' CHECK (match_source IN ('internal', 'pandascore')),
  player_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  reactions jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE match_comments IS 'Discussion comments on esport matches';
COMMENT ON COLUMN match_comments.match_id IS 'Match identifier (PandaScore ID or internal UUID)';
COMMENT ON COLUMN match_comments.match_source IS 'Origin of the match: internal or pandascore';
COMMENT ON COLUMN match_comments.reactions IS 'Emoji reactions as {emoji: [userId, ...]}';

CREATE INDEX IF NOT EXISTS idx_match_comments_match ON match_comments(match_id, match_source);
CREATE INDEX IF NOT EXISTS idx_match_comments_player ON match_comments(player_id);
CREATE INDEX IF NOT EXISTS idx_match_comments_created ON match_comments(created_at DESC);

-- RLS
ALTER TABLE match_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read match comments"
  ON match_comments FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert match comments"
  ON match_comments FOR INSERT
  WITH CHECK (auth.uid() = player_id);

CREATE POLICY "Users can update their own comments"
  ON match_comments FOR UPDATE
  USING (auth.uid() = player_id);

CREATE POLICY "Users can delete their own comments"
  ON match_comments FOR DELETE
  USING (auth.uid() = player_id);
