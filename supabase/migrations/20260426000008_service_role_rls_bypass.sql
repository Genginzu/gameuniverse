-- Allow service_role to insert/update/delete on games and related tables.
-- The service_role key is used by webhook handlers and background sync jobs
-- which have no auth.uid() context, causing is_admin() policies to reject.

-- games
CREATE POLICY "Service role full access games"
  ON public.games FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- game_translations
CREATE POLICY "Service role full access game_translations"
  ON public.game_translations FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- game_genres
CREATE POLICY "Service role full access game_genres"
  ON public.game_genres FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- game_companies
CREATE POLICY "Service role full access game_companies"
  ON public.game_companies FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- game_screenshots
CREATE POLICY "Service role full access game_screenshots"
  ON public.game_screenshots FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- game_artwork
CREATE POLICY "Service role full access game_artwork"
  ON public.game_artwork FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- game_videos
CREATE POLICY "Service role full access game_videos"
  ON public.game_videos FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- game_prices
CREATE POLICY "Service role full access game_prices"
  ON public.game_prices FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- game_ratings
CREATE POLICY "Service role full access game_ratings"
  ON public.game_ratings FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- game_versions
CREATE POLICY "Service role full access game_versions"
  ON public.game_versions FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- game_languages
CREATE POLICY "Service role full access game_languages"
  ON public.game_languages FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- game_platforms
CREATE POLICY "Service role full access game_platforms"
  ON public.game_platforms FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- game_similar_games
CREATE POLICY "Service role full access game_similar_games"
  ON public.game_similar_games FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- game_dlc_extensions
CREATE POLICY "Service role full access game_dlc_extensions"
  ON public.game_dlc_extensions FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- characters
CREATE POLICY "Service role full access characters"
  ON public.characters FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- character_translations
CREATE POLICY "Service role full access character_translations"
  ON public.character_translations FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- character_games
CREATE POLICY "Service role full access character_games"
  ON public.character_games FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- character_character_roles
CREATE POLICY "Service role full access character_character_roles"
  ON public.character_character_roles FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- character_media
CREATE POLICY "Service role full access character_media"
  ON public.character_media FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- character_relationships
CREATE POLICY "Service role full access character_relationships"
  ON public.character_relationships FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- companies
CREATE POLICY "Service role full access companies"
  ON public.companies FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- company_translations
CREATE POLICY "Service role full access company_translations"
  ON public.company_translations FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);
