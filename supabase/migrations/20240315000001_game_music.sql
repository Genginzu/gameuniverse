-- Migration: Add game_music table for soundtrack information
-- Stores composer name, Spotify embed URL, and YouTube video URL per game

CREATE TABLE IF NOT EXISTS public.game_music (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  composer TEXT,
  spotify_embed_url TEXT,
  youtube_video_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT game_music_game_id_unique UNIQUE (game_id)
);

COMMENT ON TABLE public.game_music IS 'Soundtrack information for a game: composer, Spotify embed, YouTube video';
COMMENT ON COLUMN public.game_music.composer IS 'Name of the game soundtrack composer(s)';
COMMENT ON COLUMN public.game_music.spotify_embed_url IS 'Spotify embed URL for the game soundtrack';
COMMENT ON COLUMN public.game_music.youtube_video_url IS 'YouTube video URL for the game soundtrack';

-- RLS policies
ALTER TABLE public.game_music ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "game_music_public_read"
  ON public.game_music
  FOR SELECT
  USING (true);

-- Admin full access (uses SECURITY DEFINER function, consistent with other tables)
CREATE POLICY "Admins can manage game_music"
  ON public.game_music
  FOR ALL
  USING (public.is_admin());

-- Development insert/update policies (consistent with other game tables)
CREATE POLICY "Allow insert game_music for development"
  ON public.game_music
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow update game_music for development"
  ON public.game_music
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Index for fast lookup by game_id
CREATE INDEX IF NOT EXISTS idx_game_music_game_id ON public.game_music(game_id);
