-- Trending post tags aggregation
-- Returns the most-used post tags ordered by number of posts, for the
-- "Trending tags" section. Runs as SECURITY INVOKER so it honours the
-- public SELECT RLS policy already defined on post_tags.

CREATE OR REPLACE FUNCTION get_trending_post_tags(tag_limit integer DEFAULT 10)
RETURNS TABLE (tag text, post_count bigint)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT pt.tag, COUNT(*)::bigint AS post_count
  FROM post_tags pt
  GROUP BY pt.tag
  ORDER BY post_count DESC, pt.tag ASC
  LIMIT GREATEST(1, LEAST(COALESCE(tag_limit, 10), 50));
$$;

COMMENT ON FUNCTION get_trending_post_tags(integer) IS
  'Returns trending post tags (tag, post_count) ordered by post count desc, capped at 50.';

GRANT EXECUTE ON FUNCTION get_trending_post_tags(integer) TO anon, authenticated;
