-- Index on post_tags.tag for efficient tag-based post lookups
CREATE INDEX IF NOT EXISTS idx_post_tags_tag ON post_tags(tag);
