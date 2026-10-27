-- Migration: index for the "best rated" rail (games ordered by metascore).
--
-- /api/games/trending orders games by metascore DESC with embedded
-- translations, genres and companies. Without an index matching the order,
-- PostgREST's generic plan evaluates every embed for all ~1 500 rated games
-- before sorting (~40k buffers, up to 2.7 s on prod) instead of stopping at
-- the first rows. The route orders with NULLS LAST to match this index.

CREATE INDEX IF NOT EXISTS idx_games_metascore_desc
  ON public.games (metascore DESC NULLS LAST);

COMMENT ON INDEX public.idx_games_metascore_desc IS
  'Streams games by metascore (trending "best rated" rail) so embeds are only computed for the returned rows.';
