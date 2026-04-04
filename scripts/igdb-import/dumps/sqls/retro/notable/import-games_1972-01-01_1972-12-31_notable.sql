-- IGDB Game Dump Import
-- Generated: 2026-03-28T23:01:09.596Z
-- Games: 3

BEGIN;

-- Genres
INSERT INTO genres (slug) VALUES ('simulator') ON CONFLICT DO NOTHING;
INSERT INTO genre_translations (genre_id, language_code, name) SELECT id, 'en', 'Simulator' FROM genres WHERE slug = 'simulator' ON CONFLICT (genre_id, language_code) DO NOTHING;
INSERT INTO genres (slug) VALUES ('sport') ON CONFLICT DO NOTHING;
INSERT INTO genre_translations (genre_id, language_code, name) SELECT id, 'en', 'Sport' FROM genres WHERE slug = 'sport' ON CONFLICT (genre_id, language_code) DO NOTHING;
INSERT INTO genres (slug) VALUES ('arcade') ON CONFLICT DO NOTHING;
INSERT INTO genre_translations (genre_id, language_code, name) SELECT id, 'en', 'Arcade' FROM genres WHERE slug = 'arcade' ON CONFLICT (genre_id, language_code) DO NOTHING;
INSERT INTO genres (slug) VALUES ('adventure') ON CONFLICT DO NOTHING;
INSERT INTO genre_translations (genre_id, language_code, name) SELECT id, 'en', 'Adventure' FROM genres WHERE slug = 'adventure' ON CONFLICT (genre_id, language_code) DO NOTHING;

-- Companies
INSERT INTO companies (name, slug, company_type) VALUES ('Atari', 'atari', 'developer') ON CONFLICT DO NOTHING;
INSERT INTO companies (name, slug, company_type) VALUES ('Namco', 'namco', 'developer') ON CONFLICT DO NOTHING;
INSERT INTO companies (name, slug, company_type) VALUES ('Atari, Inc.', 'atari-inc', 'developer') ON CONFLICT DO NOTHING;
INSERT INTO companies (name, slug, company_type) VALUES ('Sears', 'sears', 'developer') ON CONFLICT DO NOTHING;
INSERT INTO companies (name, slug, company_type) VALUES ('Hunter Electronics', 'hunter-electronics', 'developer') ON CONFLICT DO NOTHING;
INSERT INTO companies (name, slug, company_type) VALUES ('Azerion casual', 'azerion-casual', 'developer') ON CONFLICT DO NOTHING;
INSERT INTO companies (name, slug, company_type) VALUES ('Eyepax', 'eyepax', 'developer') ON CONFLICT DO NOTHING;
INSERT INTO companies (name, slug, company_type) VALUES ('TOPICS Entertainment', 'topics-entertainment', 'developer') ON CONFLICT DO NOTHING;
INSERT INTO companies (name, slug, company_type) VALUES ('Digital Eclipse Software', 'digital-eclipse-software', 'developer') ON CONFLICT DO NOTHING;
INSERT INTO companies (name, slug, company_type) VALUES ('Magnavox', 'magnavox', 'developer') ON CONFLICT DO NOTHING;

-- Platforms
INSERT INTO platforms (slug, igdb_id) VALUES ('arcade', 52) ON CONFLICT DO NOTHING;
INSERT INTO platform_translations (platform_id, language_code, name) SELECT id, 'en', 'Arcade' FROM platforms WHERE igdb_id = 52 ON CONFLICT (platform_id, language_code) DO NOTHING;
INSERT INTO platforms (slug, igdb_id) VALUES ('pc-microsoft-windows', 6) ON CONFLICT DO NOTHING;
INSERT INTO platform_translations (platform_id, language_code, name) SELECT id, 'en', 'PC (Microsoft Windows)' FROM platforms WHERE igdb_id = 6 ON CONFLICT (platform_id, language_code) DO NOTHING;
INSERT INTO platforms (slug, igdb_id) VALUES ('plug-play', 377) ON CONFLICT DO NOTHING;
INSERT INTO platform_translations (platform_id, language_code, name) SELECT id, 'en', 'Plug & Play' FROM platforms WHERE igdb_id = 377 ON CONFLICT (platform_id, language_code) DO NOTHING;
INSERT INTO platforms (slug, igdb_id) VALUES ('legacy-mobile-device', 55) ON CONFLICT DO NOTHING;
INSERT INTO platform_translations (platform_id, language_code, name) SELECT id, 'en', 'Legacy Mobile Device' FROM platforms WHERE igdb_id = 55 ON CONFLICT (platform_id, language_code) DO NOTHING;
INSERT INTO platforms (slug, igdb_id) VALUES ('odyssey', 88) ON CONFLICT DO NOTHING;
INSERT INTO platform_translations (platform_id, language_code, name) SELECT id, 'en', 'Odyssey' FROM platforms WHERE igdb_id = 88 ON CONFLICT (platform_id, language_code) DO NOTHING;

-- Rating systems & ratings
INSERT INTO rating_systems (code, name) VALUES ('ESRB', 'ESRB') ON CONFLICT (code) DO NOTHING;
INSERT INTO ratings (rating_system_id, code, display_name, minimum_age) SELECT id, 'E', 'Everyone', 6 FROM rating_systems WHERE code = 'ESRB' ON CONFLICT (rating_system_id, code) DO NOTHING;

INSERT INTO games (slug, igdb_id, release_date, metascore, cover_image_url, background_image_url, last_synced_at) VALUES ('pong', 1333, '1972-11-29', NULL, 'https://images.igdb.com/igdb/image/upload/t_cover_big/co2erg.jpg', 'https://images.igdb.com/igdb/image/upload/t_1080p/addqqwix9t6wx9dxipwy.jpg', NOW()) ON CONFLICT DO NOTHING;
INSERT INTO game_translations (game_id, language_code, title, description) SELECT id, 'en', 'Pong', 'Pong is a table tennis-themed twitch arcade video game with simple two-dimensional graphics. It was the first sports arcade video game and one of the earliest arcade video games in history, helping to establish the video game industry along with the Magnavox Odyssey. Soon after its release, several companies began producing games that closely mimicked its gameplay.' FROM games WHERE igdb_id = 1333 ON CONFLICT (game_id, language_code) DO NOTHING;
INSERT INTO game_genres (game_id, genre_id) SELECT g.id, ge.id FROM games g, genres ge WHERE g.igdb_id = 1333 AND ge.slug = 'simulator' ON CONFLICT DO NOTHING;
INSERT INTO game_genres (game_id, genre_id) SELECT g.id, ge.id FROM games g, genres ge WHERE g.igdb_id = 1333 AND ge.slug = 'sport' ON CONFLICT DO NOTHING;
INSERT INTO game_genres (game_id, genre_id) SELECT g.id, ge.id FROM games g, genres ge WHERE g.igdb_id = 1333 AND ge.slug = 'arcade' ON CONFLICT DO NOTHING;
INSERT INTO game_companies (game_id, company_id, role, is_primary) SELECT g.id, c.id, 'developer', false FROM games g, companies c WHERE g.igdb_id = 1333 AND c.slug = 'atari' ON CONFLICT DO NOTHING;
INSERT INTO game_companies (game_id, company_id, role, is_primary) SELECT g.id, c.id, 'developer', false FROM games g, companies c WHERE g.igdb_id = 1333 AND c.slug = 'namco' ON CONFLICT DO NOTHING;
INSERT INTO game_companies (game_id, company_id, role, is_primary) SELECT g.id, c.id, 'developer', false FROM games g, companies c WHERE g.igdb_id = 1333 AND c.slug = 'atari-inc' ON CONFLICT DO NOTHING;
INSERT INTO game_companies (game_id, company_id, role, is_primary) SELECT g.id, c.id, 'developer', false FROM games g, companies c WHERE g.igdb_id = 1333 AND c.slug = 'sears' ON CONFLICT DO NOTHING;
INSERT INTO game_companies (game_id, company_id, role, is_primary) SELECT g.id, c.id, 'developer', false FROM games g, companies c WHERE g.igdb_id = 1333 AND c.slug = 'hunter-electronics' ON CONFLICT DO NOTHING;
INSERT INTO game_companies (game_id, company_id, role, is_primary) SELECT g.id, c.id, 'developer', false FROM games g, companies c WHERE g.igdb_id = 1333 AND c.slug = 'azerion-casual' ON CONFLICT DO NOTHING;
INSERT INTO game_companies (game_id, company_id, role, is_primary) SELECT g.id, c.id, 'developer', false FROM games g, companies c WHERE g.igdb_id = 1333 AND c.slug = 'eyepax' ON CONFLICT DO NOTHING;
INSERT INTO game_companies (game_id, company_id, role, is_primary) SELECT g.id, c.id, 'developer', false FROM games g, companies c WHERE g.igdb_id = 1333 AND c.slug = 'topics-entertainment' ON CONFLICT DO NOTHING;
INSERT INTO game_companies (game_id, company_id, role, is_primary) SELECT g.id, c.id, 'developer', false FROM games g, companies c WHERE g.igdb_id = 1333 AND c.slug = 'digital-eclipse-software' ON CONFLICT DO NOTHING;
INSERT INTO game_platforms (game_id, platform_id) SELECT g.id, p.id FROM games g, platforms p WHERE g.igdb_id = 1333 AND p.igdb_id = 52 ON CONFLICT DO NOTHING;
INSERT INTO game_platforms (game_id, platform_id) SELECT g.id, p.id FROM games g, platforms p WHERE g.igdb_id = 1333 AND p.igdb_id = 6 ON CONFLICT DO NOTHING;
INSERT INTO game_platforms (game_id, platform_id) SELECT g.id, p.id FROM games g, platforms p WHERE g.igdb_id = 1333 AND p.igdb_id = 377 ON CONFLICT DO NOTHING;
INSERT INTO game_platforms (game_id, platform_id) SELECT g.id, p.id FROM games g, platforms p WHERE g.igdb_id = 1333 AND p.igdb_id = 55 ON CONFLICT DO NOTHING;
INSERT INTO game_screenshots (game_id, url, display_order, is_featured) SELECT id, 'https://images.igdb.com/igdb/image/upload/t_1080p/addqqwix9t6wx9dxipwy.jpg', 0, true FROM games WHERE igdb_id = 1333 ON CONFLICT DO NOTHING;
INSERT INTO game_screenshots (game_id, url, display_order, is_featured) SELECT id, 'https://images.igdb.com/igdb/image/upload/t_1080p/scpunv.jpg', 1, false FROM games WHERE igdb_id = 1333 ON CONFLICT DO NOTHING;
INSERT INTO game_screenshots (game_id, url, display_order, is_featured) SELECT id, 'https://images.igdb.com/igdb/image/upload/t_1080p/scpunx.jpg', 2, false FROM games WHERE igdb_id = 1333 ON CONFLICT DO NOTHING;
INSERT INTO game_screenshots (game_id, url, display_order, is_featured) SELECT id, 'https://images.igdb.com/igdb/image/upload/t_1080p/scpunw.jpg', 3, false FROM games WHERE igdb_id = 1333 ON CONFLICT DO NOTHING;
INSERT INTO game_ratings (game_id, rating_id, is_primary) SELECT g.id, r.id, false FROM games g, ratings r JOIN rating_systems rs ON r.rating_system_id = rs.id WHERE g.igdb_id = 1333 AND rs.code = 'ESRB' AND r.code = 'E' ON CONFLICT DO NOTHING;
INSERT INTO games (slug, igdb_id, release_date, metascore, cover_image_url, background_image_url, last_synced_at) VALUES ('baseball--2', 7582, '1972-09-01', NULL, 'https://images.igdb.com/igdb/image/upload/t_cover_big/co843m.jpg', 'https://images.igdb.com/igdb/image/upload/t_1080p/sc7k2r.jpg', NOW()) ON CONFLICT DO NOTHING;
INSERT INTO game_translations (game_id, language_code, title, description) SELECT id, 'en', 'Baseball', 'Baseball is a combined board-video game for the Magnavox Odyssey system that runs with its Cartridge No.3.' FROM games WHERE igdb_id = 7582 ON CONFLICT (game_id, language_code) DO NOTHING;
INSERT INTO game_genres (game_id, genre_id) SELECT g.id, ge.id FROM games g, genres ge WHERE g.igdb_id = 7582 AND ge.slug = 'sport' ON CONFLICT DO NOTHING;
INSERT INTO game_companies (game_id, company_id, role, is_primary) SELECT g.id, c.id, 'developer', false FROM games g, companies c WHERE g.igdb_id = 7582 AND c.slug = 'magnavox' ON CONFLICT DO NOTHING;
INSERT INTO game_platforms (game_id, platform_id) SELECT g.id, p.id FROM games g, platforms p WHERE g.igdb_id = 7582 AND p.igdb_id = 88 ON CONFLICT DO NOTHING;
INSERT INTO game_screenshots (game_id, url, display_order, is_featured) SELECT id, 'https://images.igdb.com/igdb/image/upload/t_1080p/sc7k2r.jpg', 0, true FROM games WHERE igdb_id = 7582 ON CONFLICT DO NOTHING;
INSERT INTO game_screenshots (game_id, url, display_order, is_featured) SELECT id, 'https://images.igdb.com/igdb/image/upload/t_1080p/sc7k2q.jpg', 1, false FROM games WHERE igdb_id = 7582 ON CONFLICT DO NOTHING;
INSERT INTO game_screenshots (game_id, url, display_order, is_featured) SELECT id, 'https://images.igdb.com/igdb/image/upload/t_1080p/sc7k2s.jpg', 2, false FROM games WHERE igdb_id = 7582 ON CONFLICT DO NOTHING;
INSERT INTO games (slug, igdb_id, release_date, metascore, cover_image_url, background_image_url, last_synced_at) VALUES ('haunted-house--1', 11517, '1972-09-01', NULL, 'https://images.igdb.com/igdb/image/upload/t_cover_big/xikl6dvd81wgcy6b4wsg.jpg', 'https://images.igdb.com/igdb/image/upload/t_1080p/scphxj.jpg', NOW()) ON CONFLICT DO NOTHING;
INSERT INTO game_translations (game_id, language_code, title, description) SELECT id, 'en', 'Haunted House', 'Haunted House is one of the 12 original games that were shipped with the Magnavox Odyssey system. It runs on Cartridge No.4 and uses clue cards with an overlay.' FROM games WHERE igdb_id = 11517 ON CONFLICT (game_id, language_code) DO NOTHING;
INSERT INTO game_genres (game_id, genre_id) SELECT g.id, ge.id FROM games g, genres ge WHERE g.igdb_id = 11517 AND ge.slug = 'adventure' ON CONFLICT DO NOTHING;
INSERT INTO game_companies (game_id, company_id, role, is_primary) SELECT g.id, c.id, 'developer', false FROM games g, companies c WHERE g.igdb_id = 11517 AND c.slug = 'magnavox' ON CONFLICT DO NOTHING;
INSERT INTO game_platforms (game_id, platform_id) SELECT g.id, p.id FROM games g, platforms p WHERE g.igdb_id = 11517 AND p.igdb_id = 88 ON CONFLICT DO NOTHING;
INSERT INTO game_screenshots (game_id, url, display_order, is_featured) SELECT id, 'https://images.igdb.com/igdb/image/upload/t_1080p/scphxj.jpg', 0, true FROM games WHERE igdb_id = 11517 ON CONFLICT DO NOTHING;
INSERT INTO game_videos (game_id, url, thumbnail_url, title, video_type, display_order, is_featured) SELECT id, 'https://www.youtube.com/watch?v=7SEeBdhe-bg', 'https://img.youtube.com/vi/7SEeBdhe-bg/maxresdefault.jpg', 'Gameplay Video', 'trailer', 0, true FROM games WHERE igdb_id = 11517 ON CONFLICT DO NOTHING;

COMMIT;
