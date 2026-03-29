-- IGDB Game Dump Import
-- Generated: 2026-03-28T22:54:31.429Z
-- Games: 3

BEGIN;

-- Genres
INSERT INTO genres (slug) VALUES ('simulator') ON CONFLICT (slug) DO NOTHING;
INSERT INTO genre_translations (genre_id, language_code, name) SELECT id, 'en', 'Simulator' FROM genres WHERE slug = 'simulator' ON CONFLICT (genre_id, language_code) DO NOTHING;
INSERT INTO genres (slug) VALUES ('indie') ON CONFLICT (slug) DO NOTHING;
INSERT INTO genre_translations (genre_id, language_code, name) SELECT id, 'en', 'Indie' FROM genres WHERE slug = 'indie' ON CONFLICT (genre_id, language_code) DO NOTHING;
INSERT INTO genres (slug) VALUES ('shooter') ON CONFLICT (slug) DO NOTHING;
INSERT INTO genre_translations (genre_id, language_code, name) SELECT id, 'en', 'Shooter' FROM genres WHERE slug = 'shooter' ON CONFLICT (genre_id, language_code) DO NOTHING;

-- Companies
INSERT INTO companies (name, slug, company_type) VALUES ('s1axter', 's1axter', 'developer') ON CONFLICT (slug) DO NOTHING;
INSERT INTO companies (name, slug, company_type) VALUES ('Chris Gaylo', 'chris-gaylo', 'developer') ON CONFLICT (slug) DO NOTHING;
INSERT INTO companies (name, slug, company_type) VALUES ('John Horton Conway', 'john-horton-conway', 'developer') ON CONFLICT (slug) DO NOTHING;
INSERT INTO companies (name, slug, company_type) VALUES ('Scientific American', 'scientific-american', 'developer') ON CONFLICT (slug) DO NOTHING;
INSERT INTO companies (name, slug, company_type) VALUES ('Sega Entertainment', 'sega-entertainment', 'developer') ON CONFLICT (slug) DO NOTHING;

-- Platforms
INSERT INTO platforms (slug, igdb_id) VALUES ('web-browser', 82) ON CONFLICT (igdb_id) DO NOTHING;
INSERT INTO platform_translations (platform_id, language_code, name) SELECT id, 'en', 'Web browser' FROM platforms WHERE igdb_id = 82 ON CONFLICT (platform_id, language_code) DO NOTHING;
INSERT INTO platforms (slug, igdb_id) VALUES ('call-a-computer-time-shared-mainframe-computer-system', 107) ON CONFLICT (igdb_id) DO NOTHING;
INSERT INTO platform_translations (platform_id, language_code, name) SELECT id, 'en', 'Call-A-Computer time-shared mainframe computer system' FROM platforms WHERE igdb_id = 107 ON CONFLICT (platform_id, language_code) DO NOTHING;
INSERT INTO platforms (slug, igdb_id) VALUES ('bbc-microcomputer-system', 69) ON CONFLICT (igdb_id) DO NOTHING;
INSERT INTO platform_translations (platform_id, language_code, name) SELECT id, 'en', 'BBC Microcomputer System' FROM platforms WHERE igdb_id = 69 ON CONFLICT (platform_id, language_code) DO NOTHING;
INSERT INTO platforms (slug, igdb_id) VALUES ('pdp-7', 103) ON CONFLICT (igdb_id) DO NOTHING;
INSERT INTO platform_translations (platform_id, language_code, name) SELECT id, 'en', 'PDP-7' FROM platforms WHERE igdb_id = 103 ON CONFLICT (platform_id, language_code) DO NOTHING;
INSERT INTO platforms (slug, igdb_id) VALUES ('bally-astrocade', 91) ON CONFLICT (igdb_id) DO NOTHING;
INSERT INTO platform_translations (platform_id, language_code, name) SELECT id, 'en', 'Bally Astrocade' FROM platforms WHERE igdb_id = 91 ON CONFLICT (platform_id, language_code) DO NOTHING;
INSERT INTO platforms (slug, igdb_id) VALUES ('pc-microsoft-windows', 6) ON CONFLICT (igdb_id) DO NOTHING;
INSERT INTO platform_translations (platform_id, language_code, name) SELECT id, 'en', 'PC (Microsoft Windows)' FROM platforms WHERE igdb_id = 6 ON CONFLICT (platform_id, language_code) DO NOTHING;
INSERT INTO platforms (slug, igdb_id) VALUES ('arcade', 52) ON CONFLICT (igdb_id) DO NOTHING;
INSERT INTO platform_translations (platform_id, language_code, name) SELECT id, 'en', 'Arcade' FROM platforms WHERE igdb_id = 52 ON CONFLICT (platform_id, language_code) DO NOTHING;

INSERT INTO games (slug, igdb_id, release_date, metascore, cover_image_url, background_image_url, last_synced_at) VALUES ('highnoon', 11304, '1970-09-12', NULL, 'https://images.igdb.com/igdb/image/upload/t_cover_big/co4zn0.jpg', 'https://images.igdb.com/igdb/image/upload/t_1080p/sc7kp9.jpg', NOW()) ON CONFLICT (igdb_id) DO NOTHING;
INSERT INTO game_translations (game_id, language_code, title, description) SELECT id, 'en', 'Highnoon', 'Highnoon is a BASIC game developed by Christopher Gaylo from Syosset High School, New York in early 1970 on a timeshared mainframe computer. The game is single-player and set in the Wild West in 1889.

The objective of the game is a showdown between the player and Black Bart. The status of the game, actions available and results of each action are written to the system console as textual descriptions. Turns are taken to either move closer, run, or shoot. Both the player and Bart have four shots and the odds of hitting each other increase as the player closes the 100 paces between each.' FROM games WHERE igdb_id = 11304 ON CONFLICT (game_id, language_code) DO NOTHING;
INSERT INTO game_companies (game_id, company_id, role, is_primary) SELECT g.id, c.id, 'developer', false FROM games g, companies c WHERE g.igdb_id = 11304 AND c.slug = 's1axter' ON CONFLICT DO NOTHING;
INSERT INTO game_companies (game_id, company_id, role, is_primary) SELECT g.id, c.id, 'developer', false FROM games g, companies c WHERE g.igdb_id = 11304 AND c.slug = 'chris-gaylo' ON CONFLICT DO NOTHING;
INSERT INTO game_platforms (game_id, platform_id) SELECT g.id, p.id FROM games g, platforms p WHERE g.igdb_id = 11304 AND p.igdb_id = 82 ON CONFLICT DO NOTHING;
INSERT INTO game_platforms (game_id, platform_id) SELECT g.id, p.id FROM games g, platforms p WHERE g.igdb_id = 11304 AND p.igdb_id = 107 ON CONFLICT DO NOTHING;
INSERT INTO game_screenshots (game_id, url, display_order, is_featured) SELECT id, 'https://images.igdb.com/igdb/image/upload/t_1080p/sc7kp9.jpg', 0, true FROM games WHERE igdb_id = 11304 ON CONFLICT DO NOTHING;
INSERT INTO games (slug, igdb_id, release_date, metascore, cover_image_url, background_image_url, last_synced_at) VALUES ('game-of-life', 76506, '1970-12-31', NULL, 'https://images.igdb.com/igdb/image/upload/t_cover_big/co6xma.jpg', 'https://images.igdb.com/igdb/image/upload/t_1080p/i7xl1z3fl2dnbjww2opy.jpg', NOW()) ON CONFLICT (igdb_id) DO NOTHING;
INSERT INTO game_translations (game_id, language_code, title, description) SELECT id, 'en', 'Game of Life', 'The Game of Life, also known simply as Life, is a cellular automaton devised by the British mathematician John Horton Conway in 1970. It is a zero-player game, meaning that its evolution is determined by its initial state, requiring no further input. One interacts with the Game of Life by creating an initial configuration and observing how it evolves.' FROM games WHERE igdb_id = 76506 ON CONFLICT (game_id, language_code) DO NOTHING;
INSERT INTO game_genres (game_id, genre_id) SELECT g.id, ge.id FROM games g, genres ge WHERE g.igdb_id = 76506 AND ge.slug = 'simulator' ON CONFLICT DO NOTHING;
INSERT INTO game_genres (game_id, genre_id) SELECT g.id, ge.id FROM games g, genres ge WHERE g.igdb_id = 76506 AND ge.slug = 'indie' ON CONFLICT DO NOTHING;
INSERT INTO game_companies (game_id, company_id, role, is_primary) SELECT g.id, c.id, 'developer', false FROM games g, companies c WHERE g.igdb_id = 76506 AND c.slug = 'john-horton-conway' ON CONFLICT DO NOTHING;
INSERT INTO game_companies (game_id, company_id, role, is_primary) SELECT g.id, c.id, 'developer', false FROM games g, companies c WHERE g.igdb_id = 76506 AND c.slug = 'scientific-american' ON CONFLICT DO NOTHING;
INSERT INTO game_platforms (game_id, platform_id) SELECT g.id, p.id FROM games g, platforms p WHERE g.igdb_id = 76506 AND p.igdb_id = 69 ON CONFLICT DO NOTHING;
INSERT INTO game_platforms (game_id, platform_id) SELECT g.id, p.id FROM games g, platforms p WHERE g.igdb_id = 76506 AND p.igdb_id = 103 ON CONFLICT DO NOTHING;
INSERT INTO game_platforms (game_id, platform_id) SELECT g.id, p.id FROM games g, platforms p WHERE g.igdb_id = 76506 AND p.igdb_id = 91 ON CONFLICT DO NOTHING;
INSERT INTO game_platforms (game_id, platform_id) SELECT g.id, p.id FROM games g, platforms p WHERE g.igdb_id = 76506 AND p.igdb_id = 6 ON CONFLICT DO NOTHING;
INSERT INTO game_screenshots (game_id, url, display_order, is_featured) SELECT id, 'https://images.igdb.com/igdb/image/upload/t_1080p/i7xl1z3fl2dnbjww2opy.jpg', 0, true FROM games WHERE igdb_id = 76506 ON CONFLICT DO NOTHING;
INSERT INTO game_screenshots (game_id, url, display_order, is_featured) SELECT id, 'https://images.igdb.com/igdb/image/upload/t_1080p/mgnkxpe5fkccxazn972a.jpg', 1, false FROM games WHERE igdb_id = 76506 ON CONFLICT DO NOTHING;
INSERT INTO game_screenshots (game_id, url, display_order, is_featured) SELECT id, 'https://images.igdb.com/igdb/image/upload/t_1080p/mnbzkqdbiejumbuibzlo.jpg', 2, false FROM games WHERE igdb_id = 76506 ON CONFLICT DO NOTHING;
INSERT INTO game_screenshots (game_id, url, display_order, is_featured) SELECT id, 'https://images.igdb.com/igdb/image/upload/t_1080p/pkyncqz5ph1enu0kjad2.jpg', 3, false FROM games WHERE igdb_id = 76506 ON CONFLICT DO NOTHING;
INSERT INTO game_screenshots (game_id, url, display_order, is_featured) SELECT id, 'https://images.igdb.com/igdb/image/upload/t_1080p/pt3l1rlfqsm16uxf4cu6.jpg', 4, false FROM games WHERE igdb_id = 76506 ON CONFLICT DO NOTHING;
INSERT INTO games (slug, igdb_id, release_date, metascore, cover_image_url, background_image_url, last_synced_at) VALUES ('jet-rocket', 56115, '1970-07-01', NULL, 'https://images.igdb.com/igdb/image/upload/t_cover_big/t4svz18epdjvxayq9xnm.jpg', 'https://images.igdb.com/igdb/image/upload/t_1080p/ar5eyd.jpg', NOW()) ON CONFLICT (igdb_id) DO NOTHING;
INSERT INTO game_translations (game_id, language_code, title, description) SELECT id, 'en', 'Jet Rocket', 'An early 3D flight simulator game, released by Sega in 1970. It was an electro-mechanical arcade game, using video projection to display a 3D game world on screen. It features free-roaming, first-person flight shooting gameplay, making it the first primitive example of a flight simulator game, first-person shooter, and open world.' FROM games WHERE igdb_id = 56115 ON CONFLICT (game_id, language_code) DO NOTHING;
INSERT INTO game_genres (game_id, genre_id) SELECT g.id, ge.id FROM games g, genres ge WHERE g.igdb_id = 56115 AND ge.slug = 'shooter' ON CONFLICT DO NOTHING;
INSERT INTO game_genres (game_id, genre_id) SELECT g.id, ge.id FROM games g, genres ge WHERE g.igdb_id = 56115 AND ge.slug = 'simulator' ON CONFLICT DO NOTHING;
INSERT INTO game_companies (game_id, company_id, role, is_primary) SELECT g.id, c.id, 'developer', false FROM games g, companies c WHERE g.igdb_id = 56115 AND c.slug = 'sega-entertainment' ON CONFLICT DO NOTHING;
INSERT INTO game_platforms (game_id, platform_id) SELECT g.id, p.id FROM games g, platforms p WHERE g.igdb_id = 56115 AND p.igdb_id = 52 ON CONFLICT DO NOTHING;
INSERT INTO game_artwork (game_id, url, artwork_type, display_order, is_featured) SELECT id, 'https://images.igdb.com/igdb/image/upload/t_1080p/ar5eyd.jpg', 'promotional', 0, true FROM games WHERE igdb_id = 56115 ON CONFLICT DO NOTHING;
INSERT INTO game_artwork (game_id, url, artwork_type, display_order, is_featured) SELECT id, 'https://images.igdb.com/igdb/image/upload/t_1080p/ar5eye.jpg', 'promotional', 1, false FROM games WHERE igdb_id = 56115 ON CONFLICT DO NOTHING;
INSERT INTO game_artwork (game_id, url, artwork_type, display_order, is_featured) SELECT id, 'https://images.igdb.com/igdb/image/upload/t_1080p/ar5eyf.jpg', 'promotional', 2, false FROM games WHERE igdb_id = 56115 ON CONFLICT DO NOTHING;
INSERT INTO game_artwork (game_id, url, artwork_type, display_order, is_featured) SELECT id, 'https://images.igdb.com/igdb/image/upload/t_1080p/ar5eyg.jpg', 'promotional', 3, false FROM games WHERE igdb_id = 56115 ON CONFLICT DO NOTHING;
INSERT INTO game_videos (game_id, url, thumbnail_url, title, video_type, display_order, is_featured) SELECT id, 'https://www.youtube.com/watch?v=zIH7PMHYlq4', 'https://img.youtube.com/vi/zIH7PMHYlq4/maxresdefault.jpg', 'Gameplay Video', 'trailer', 0, true FROM games WHERE igdb_id = 56115 ON CONFLICT DO NOTHING;
INSERT INTO game_videos (game_id, url, thumbnail_url, title, video_type, display_order, is_featured) SELECT id, 'https://www.youtube.com/watch?v=dihzPCEf244', 'https://img.youtube.com/vi/dihzPCEf244/maxresdefault.jpg', 'Gameplay Video', 'trailer', 1, false FROM games WHERE igdb_id = 56115 ON CONFLICT DO NOTHING;

COMMIT;
