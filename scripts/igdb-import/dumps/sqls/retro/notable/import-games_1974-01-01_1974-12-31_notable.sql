-- IGDB Game Dump Import
-- Generated: 2026-03-28T23:08:58.491Z
-- Games: 2

BEGIN;

-- Genres
INSERT INTO genres (slug) VALUES ('simulator') ON CONFLICT DO NOTHING;
INSERT INTO genre_translations (genre_id, language_code, name) SELECT id, 'en', 'Simulator' FROM genres WHERE slug = 'simulator' ON CONFLICT (genre_id, language_code) DO NOTHING;
INSERT INTO genres (slug) VALUES ('arcade') ON CONFLICT DO NOTHING;
INSERT INTO genre_translations (genre_id, language_code, name) SELECT id, 'en', 'Arcade' FROM genres WHERE slug = 'arcade' ON CONFLICT (genre_id, language_code) DO NOTHING;

-- Companies
INSERT INTO companies (name, slug, company_type) VALUES ('Atari', 'atari', 'developer') ON CONFLICT DO NOTHING;
INSERT INTO companies (name, slug, company_type) VALUES ('Kee Games', 'kee-games', 'developer') ON CONFLICT DO NOTHING;

-- Platforms
INSERT INTO platforms (slug, igdb_id) VALUES ('plato', 110) ON CONFLICT DO NOTHING;
INSERT INTO platform_translations (platform_id, language_code, name) SELECT id, 'en', 'PLATO' FROM platforms WHERE igdb_id = 110 ON CONFLICT (platform_id, language_code) DO NOTHING;
INSERT INTO platforms (slug, igdb_id) VALUES ('arcade', 52) ON CONFLICT DO NOTHING;
INSERT INTO platform_translations (platform_id, language_code, name) SELECT id, 'en', 'Arcade' FROM platforms WHERE igdb_id = 52 ON CONFLICT (platform_id, language_code) DO NOTHING;

-- Supported languages
INSERT INTO supported_languages (code, name, native_name) VALUES ('en', 'English', 'English (US)') ON CONFLICT (code) DO NOTHING;

INSERT INTO games (slug, igdb_id, release_date, metascore, cover_image_url, background_image_url, last_synced_at) VALUES ('airfight', 67637, '1974-09-30', NULL, 'https://images.igdb.com/igdb/image/upload/t_cover_big/co7w05.jpg', 'https://images.igdb.com/igdb/image/upload/t_1080p/scr4ay.jpg', NOW()) ON CONFLICT DO NOTHING;
INSERT INTO game_translations (game_id, language_code, title, description) SELECT id, 'en', 'Airfight', 'Airfight is an early 3D graphics-based multi-user flight simulator, created on the University of Illinois Urbana-Champaign (UIUC) Control Data Corporation (CDC) PLATO system. The software was the first ever 3D flight simulator and the first multi-player flight simulator. The first version was developed by Brand Fortner with Kevin Gorey in the summer of 1974. After its release, it became the most popular game on PLATO until Empire became more popular. This software probably inspired the UIUC student Bruce Artwick to start the company Sublogic, which was acquired and later became Microsoft Flight Simulator.' FROM games WHERE igdb_id = 67637 ON CONFLICT (game_id, language_code) DO NOTHING;
INSERT INTO game_genres (game_id, genre_id) SELECT g.id, ge.id FROM games g, genres ge WHERE g.igdb_id = 67637 AND ge.slug = 'simulator' ON CONFLICT DO NOTHING;
INSERT INTO game_platforms (game_id, platform_id) SELECT g.id, p.id FROM games g, platforms p WHERE g.igdb_id = 67637 AND p.igdb_id = 110 ON CONFLICT DO NOTHING;
INSERT INTO game_screenshots (game_id, url, display_order, is_featured) SELECT id, 'https://images.igdb.com/igdb/image/upload/t_1080p/scr4ay.jpg', 0, true FROM games WHERE igdb_id = 67637 ON CONFLICT DO NOTHING;
INSERT INTO game_videos (game_id, url, thumbnail_url, title, video_type, display_order, is_featured) SELECT id, 'https://www.youtube.com/watch?v=jDkQFYWcSIg', 'https://img.youtube.com/vi/jDkQFYWcSIg/maxresdefault.jpg', 'Gameplay Video', 'trailer', 0, true FROM games WHERE igdb_id = 67637 ON CONFLICT DO NOTHING;
INSERT INTO games (slug, igdb_id, release_date, metascore, cover_image_url, background_image_url, last_synced_at) VALUES ('tank', 7428, '1974-11-05', NULL, 'https://images.igdb.com/igdb/image/upload/t_cover_big/co6wr7.jpg', 'https://images.igdb.com/igdb/image/upload/t_1080p/ogwxn1c0ag7nfruk28by.jpg', NOW()) ON CONFLICT DO NOTHING;
INSERT INTO game_translations (game_id, language_code, title, description) SELECT id, 'en', 'Tank', 'Players move their tanks through a maze on screen, avoiding mines and shooting each other. The tanks are controlled by two joysticks in a dual configuration. Pushing both joysticks will move the player''s tank forward, and pulling them both back causes the tank to stop. Moving the right joystick forward while pulling the left joystick back will cause the tank to turn right, while reversing the motion will cause the tank to turn left. The players are represented by one black and one white tank sprite, and mines are denoted by an "X". Points are scored by shooting the opponent or when a player runs over a mine; the player with the highest score at the end of the time limit wins the game. Tank was also one of very few games to be ported onto 1st generation consoles, usually under the title "Tank Battle".' FROM games WHERE igdb_id = 7428 ON CONFLICT (game_id, language_code) DO NOTHING;
INSERT INTO game_genres (game_id, genre_id) SELECT g.id, ge.id FROM games g, genres ge WHERE g.igdb_id = 7428 AND ge.slug = 'arcade' ON CONFLICT DO NOTHING;
INSERT INTO game_companies (game_id, company_id, role, is_primary) SELECT g.id, c.id, 'developer', false FROM games g, companies c WHERE g.igdb_id = 7428 AND c.slug = 'atari' ON CONFLICT DO NOTHING;
INSERT INTO game_companies (game_id, company_id, role, is_primary) SELECT g.id, c.id, 'developer', false FROM games g, companies c WHERE g.igdb_id = 7428 AND c.slug = 'kee-games' ON CONFLICT DO NOTHING;
INSERT INTO game_platforms (game_id, platform_id) SELECT g.id, p.id FROM games g, platforms p WHERE g.igdb_id = 7428 AND p.igdb_id = 52 ON CONFLICT DO NOTHING;
INSERT INTO game_screenshots (game_id, url, display_order, is_featured) SELECT id, 'https://images.igdb.com/igdb/image/upload/t_1080p/ogwxn1c0ag7nfruk28by.jpg', 0, true FROM games WHERE igdb_id = 7428 ON CONFLICT DO NOTHING;
INSERT INTO game_videos (game_id, url, thumbnail_url, title, video_type, display_order, is_featured) SELECT id, 'https://www.youtube.com/watch?v=3OsBUzYBJgU', 'https://img.youtube.com/vi/3OsBUzYBJgU/maxresdefault.jpg', 'Gameplay video', 'trailer', 0, true FROM games WHERE igdb_id = 7428 ON CONFLICT DO NOTHING;
INSERT INTO game_languages (game_id, language_code, language_name, has_audio, has_subtitles, has_interface) SELECT id, 'en', 'English', false, false, true FROM games WHERE igdb_id = 7428 ON CONFLICT DO NOTHING;

COMMIT;
