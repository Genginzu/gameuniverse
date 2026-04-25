-- Replace permissive "for development" RLS policies with admin-only policies.
-- These tables contain admin-managed data; write access should require is_admin().

-- ============================================================================
-- Helper: drop old dev policy + create admin-only replacement
-- Pattern: FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin())
-- ============================================================================

-- characters
DROP POLICY IF EXISTS "Allow insert characters for development" ON public.characters;
CREATE POLICY "Admins can insert characters" ON public.characters FOR INSERT WITH CHECK (public.is_admin());

-- character_translations
DROP POLICY IF EXISTS "Allow insert character translations for development" ON public.character_translations;
CREATE POLICY "Admins can insert character_translations" ON public.character_translations FOR INSERT WITH CHECK (public.is_admin());

-- character_character_roles
DROP POLICY IF EXISTS "Allow insert character_character_roles for development" ON public.character_character_roles;
CREATE POLICY "Admins can insert character_character_roles" ON public.character_character_roles FOR INSERT WITH CHECK (public.is_admin());

-- character_role_translations
DROP POLICY IF EXISTS "Allow insert character_role_translations for development" ON public.character_role_translations;
CREATE POLICY "Admins can insert character_role_translations" ON public.character_role_translations FOR INSERT WITH CHECK (public.is_admin());

-- character_games
DROP POLICY IF EXISTS "Allow insert character games for development" ON public.character_games;
CREATE POLICY "Admins can insert character_games" ON public.character_games FOR INSERT WITH CHECK (public.is_admin());

-- character_media
DROP POLICY IF EXISTS "Allow insert character media for development" ON public.character_media;
CREATE POLICY "Admins can insert character_media" ON public.character_media FOR INSERT WITH CHECK (public.is_admin());

-- character_relationships
DROP POLICY IF EXISTS "Allow insert character relationships for development" ON public.character_relationships;
CREATE POLICY "Admins can insert character_relationships" ON public.character_relationships FOR INSERT WITH CHECK (public.is_admin());

-- companies
DROP POLICY IF EXISTS "Allow insert companies for development" ON public.companies;
CREATE POLICY "Admins can insert companies" ON public.companies FOR INSERT WITH CHECK (public.is_admin());

-- company_translations
DROP POLICY IF EXISTS "Allow insert company translations for development" ON public.company_translations;
CREATE POLICY "Admins can insert company_translations" ON public.company_translations FOR INSERT WITH CHECK (public.is_admin());

-- games
DROP POLICY IF EXISTS "Allow insert for development" ON public.games;
DROP POLICY IF EXISTS "Allow update for development" ON public.games;
CREATE POLICY "Admins can insert games" ON public.games FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update games" ON public.games FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

-- game_translations
DROP POLICY IF EXISTS "Allow insert for development" ON public.game_translations;
DROP POLICY IF EXISTS "Allow update for development" ON public.game_translations;
CREATE POLICY "Admins can insert game_translations" ON public.game_translations FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update game_translations" ON public.game_translations FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

-- game_genres
DROP POLICY IF EXISTS "Allow insert for development" ON public.game_genres;
CREATE POLICY "Admins can insert game_genres" ON public.game_genres FOR INSERT WITH CHECK (public.is_admin());

-- game_companies
DROP POLICY IF EXISTS "Allow insert game companies for development" ON public.game_companies;
CREATE POLICY "Admins can insert game_companies" ON public.game_companies FOR INSERT WITH CHECK (public.is_admin());

-- game_screenshots
DROP POLICY IF EXISTS "Allow insert screenshots for development" ON public.game_screenshots;
CREATE POLICY "Admins can insert game_screenshots" ON public.game_screenshots FOR INSERT WITH CHECK (public.is_admin());

-- game_artwork
DROP POLICY IF EXISTS "Allow insert artwork for development" ON public.game_artwork;
CREATE POLICY "Admins can insert game_artwork" ON public.game_artwork FOR INSERT WITH CHECK (public.is_admin());

-- game_videos
DROP POLICY IF EXISTS "Allow insert videos for development" ON public.game_videos;
CREATE POLICY "Admins can insert game_videos" ON public.game_videos FOR INSERT WITH CHECK (public.is_admin());

-- game_music
DROP POLICY IF EXISTS "Allow insert game_music for development" ON public.game_music;
DROP POLICY IF EXISTS "Allow update game_music for development" ON public.game_music;
CREATE POLICY "Admins can insert game_music" ON public.game_music FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update game_music" ON public.game_music FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

-- game_prices
DROP POLICY IF EXISTS "Allow insert game prices for development" ON public.game_prices;
DROP POLICY IF EXISTS "Allow update game prices for development" ON public.game_prices;
CREATE POLICY "Admins can insert game_prices" ON public.game_prices FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update game_prices" ON public.game_prices FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

-- stores
DROP POLICY IF EXISTS "Allow insert stores for development" ON public.stores;
DROP POLICY IF EXISTS "Allow update stores for development" ON public.stores;
CREATE POLICY "Admins can insert stores" ON public.stores FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update stores" ON public.stores FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

-- genres
DROP POLICY IF EXISTS "Allow insert for development" ON public.genres;
CREATE POLICY "Admins can insert genres" ON public.genres FOR INSERT WITH CHECK (public.is_admin());

-- genre_translations
DROP POLICY IF EXISTS "Allow insert for development" ON public.genre_translations;
CREATE POLICY "Admins can insert genre_translations" ON public.genre_translations FOR INSERT WITH CHECK (public.is_admin());

-- languages
DROP POLICY IF EXISTS "Allow insert for development" ON public.languages;
CREATE POLICY "Admins can insert languages" ON public.languages FOR INSERT WITH CHECK (public.is_admin());

-- content_descriptors
DROP POLICY IF EXISTS "Allow insert for development" ON public.content_descriptors;
DROP POLICY IF EXISTS "Allow update for development" ON public.content_descriptors;
DROP POLICY IF EXISTS "Allow delete for development" ON public.content_descriptors;
CREATE POLICY "Admins can insert content_descriptors" ON public.content_descriptors FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update content_descriptors" ON public.content_descriptors FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins can delete content_descriptors" ON public.content_descriptors FOR DELETE USING (public.is_admin());

-- content_descriptor_translations
DROP POLICY IF EXISTS "Allow insert for development" ON public.content_descriptor_translations;
DROP POLICY IF EXISTS "Allow update for development" ON public.content_descriptor_translations;
DROP POLICY IF EXISTS "Allow delete for development" ON public.content_descriptor_translations;
CREATE POLICY "Admins can insert content_descriptor_translations" ON public.content_descriptor_translations FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update content_descriptor_translations" ON public.content_descriptor_translations FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins can delete content_descriptor_translations" ON public.content_descriptor_translations FOR DELETE USING (public.is_admin());

-- ratings
DROP POLICY IF EXISTS "Allow insert for development" ON public.ratings;
DROP POLICY IF EXISTS "Allow update for development" ON public.ratings;
DROP POLICY IF EXISTS "Allow delete for development" ON public.ratings;
CREATE POLICY "Admins can insert ratings" ON public.ratings FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update ratings" ON public.ratings FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins can delete ratings" ON public.ratings FOR DELETE USING (public.is_admin());

-- rating_translations
DROP POLICY IF EXISTS "Allow insert for development" ON public.rating_translations;
DROP POLICY IF EXISTS "Allow update for development" ON public.rating_translations;
DROP POLICY IF EXISTS "Allow delete for development" ON public.rating_translations;
CREATE POLICY "Admins can insert rating_translations" ON public.rating_translations FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update rating_translations" ON public.rating_translations FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins can delete rating_translations" ON public.rating_translations FOR DELETE USING (public.is_admin());

-- rating_systems
DROP POLICY IF EXISTS "Allow insert for development" ON public.rating_systems;
DROP POLICY IF EXISTS "Allow update for development" ON public.rating_systems;
DROP POLICY IF EXISTS "Allow delete for development" ON public.rating_systems;
CREATE POLICY "Admins can insert rating_systems" ON public.rating_systems FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update rating_systems" ON public.rating_systems FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins can delete rating_systems" ON public.rating_systems FOR DELETE USING (public.is_admin());

-- game_rating_descriptors
DROP POLICY IF EXISTS "Allow insert for development" ON public.game_rating_descriptors;
DROP POLICY IF EXISTS "Allow update for development" ON public.game_rating_descriptors;
DROP POLICY IF EXISTS "Allow delete for development" ON public.game_rating_descriptors;
CREATE POLICY "Admins can insert game_rating_descriptors" ON public.game_rating_descriptors FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update game_rating_descriptors" ON public.game_rating_descriptors FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins can delete game_rating_descriptors" ON public.game_rating_descriptors FOR DELETE USING (public.is_admin());

-- game_ratings
DROP POLICY IF EXISTS "Allow insert for development" ON public.game_ratings;
DROP POLICY IF EXISTS "Allow update for development" ON public.game_ratings;
DROP POLICY IF EXISTS "Allow delete for development" ON public.game_ratings;
CREATE POLICY "Admins can insert game_ratings" ON public.game_ratings FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update game_ratings" ON public.game_ratings FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins can delete game_ratings" ON public.game_ratings FOR DELETE USING (public.is_admin());

-- game_languages (was open to all authenticated)
DROP POLICY IF EXISTS "Authenticated users can insert game languages" ON public.game_languages;
DROP POLICY IF EXISTS "Authenticated users can update game languages" ON public.game_languages;
DROP POLICY IF EXISTS "Authenticated users can delete game languages" ON public.game_languages;
CREATE POLICY "Admins can insert game_languages" ON public.game_languages FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update game_languages" ON public.game_languages FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins can delete game_languages" ON public.game_languages FOR DELETE USING (public.is_admin());

-- game_dlc_extensions (was open to anon + authenticated)
DROP POLICY IF EXISTS "game_dlc_extensions_insert_anon" ON public.game_dlc_extensions;
DROP POLICY IF EXISTS "game_dlc_extensions_insert_authenticated" ON public.game_dlc_extensions;
DROP POLICY IF EXISTS "game_dlc_extensions_update_anon" ON public.game_dlc_extensions;
DROP POLICY IF EXISTS "game_dlc_extensions_update_authenticated" ON public.game_dlc_extensions;
DROP POLICY IF EXISTS "game_dlc_extensions_delete_anon" ON public.game_dlc_extensions;
DROP POLICY IF EXISTS "game_dlc_extensions_delete_authenticated" ON public.game_dlc_extensions;
CREATE POLICY "Admins can insert game_dlc_extensions" ON public.game_dlc_extensions FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update game_dlc_extensions" ON public.game_dlc_extensions FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins can delete game_dlc_extensions" ON public.game_dlc_extensions FOR DELETE USING (public.is_admin());

-- game_similar_games (was open to authenticated)
DROP POLICY IF EXISTS "game_similar_games_insert_authenticated" ON public.game_similar_games;
DROP POLICY IF EXISTS "game_similar_games_update_authenticated" ON public.game_similar_games;
DROP POLICY IF EXISTS "game_similar_games_delete_authenticated" ON public.game_similar_games;
CREATE POLICY "Admins can insert game_similar_games" ON public.game_similar_games FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update game_similar_games" ON public.game_similar_games FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins can delete game_similar_games" ON public.game_similar_games FOR DELETE USING (public.is_admin());

-- game_versions (was open to anon + authenticated)
DROP POLICY IF EXISTS "Allow anon insert to game_versions" ON public.game_versions;
DROP POLICY IF EXISTS "Allow anon update to game_versions" ON public.game_versions;
DROP POLICY IF EXISTS "Allow anon delete to game_versions" ON public.game_versions;
DROP POLICY IF EXISTS "Allow authenticated insert to game_versions" ON public.game_versions;
DROP POLICY IF EXISTS "Allow authenticated update to game_versions" ON public.game_versions;
DROP POLICY IF EXISTS "Allow authenticated delete to game_versions" ON public.game_versions;
CREATE POLICY "Admins can insert game_versions" ON public.game_versions FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update game_versions" ON public.game_versions FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins can delete game_versions" ON public.game_versions FOR DELETE USING (public.is_admin());

-- game_version_translations (was open to anon + authenticated)
DROP POLICY IF EXISTS "Allow anon insert to game_version_translations" ON public.game_version_translations;
DROP POLICY IF EXISTS "Allow anon update to game_version_translations" ON public.game_version_translations;
DROP POLICY IF EXISTS "Allow anon delete to game_version_translations" ON public.game_version_translations;
DROP POLICY IF EXISTS "Allow authenticated insert to game_version_translations" ON public.game_version_translations;
DROP POLICY IF EXISTS "Allow authenticated update to game_version_translations" ON public.game_version_translations;
DROP POLICY IF EXISTS "Allow authenticated delete to game_version_translations" ON public.game_version_translations;
CREATE POLICY "Admins can insert game_version_translations" ON public.game_version_translations FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update game_version_translations" ON public.game_version_translations FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins can delete game_version_translations" ON public.game_version_translations FOR DELETE USING (public.is_admin());

-- igdb_webhook_events (service role full access → admin only)
DROP POLICY IF EXISTS "Service role full access on igdb_webhook_events" ON public.igdb_webhook_events;
CREATE POLICY "Admins can manage igdb_webhook_events" ON public.igdb_webhook_events FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
