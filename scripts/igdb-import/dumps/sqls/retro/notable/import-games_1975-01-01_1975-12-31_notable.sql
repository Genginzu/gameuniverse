-- IGDB Game Dump Import
-- Generated: 2026-03-28T23:12:58.802Z
-- Games: 2

BEGIN;

-- Genres
INSERT INTO genres (slug) VALUES ('shooter') ON CONFLICT DO NOTHING;
INSERT INTO genre_translations (genre_id, language_code, name) SELECT id, 'en', 'Shooter' FROM genres WHERE slug = 'shooter' ON CONFLICT (genre_id, language_code) DO NOTHING;
INSERT INTO genres (slug) VALUES ('arcade') ON CONFLICT DO NOTHING;
INSERT INTO genre_translations (genre_id, language_code, name) SELECT id, 'en', 'Arcade' FROM genres WHERE slug = 'arcade' ON CONFLICT (genre_id, language_code) DO NOTHING;
INSERT INTO genres (slug) VALUES ('role-playing-rpg') ON CONFLICT DO NOTHING;
INSERT INTO genre_translations (genre_id, language_code, name) SELECT id, 'en', 'Role-playing (RPG)' FROM genres WHERE slug = 'role-playing-rpg' ON CONFLICT (genre_id, language_code) DO NOTHING;

-- Companies
INSERT INTO companies (name, slug, company_type) VALUES ('Midway', 'midway', 'developer') ON CONFLICT DO NOTHING;
INSERT INTO companies (name, slug, company_type) VALUES ('Taito', 'taito', 'developer') ON CONFLICT DO NOTHING;
INSERT INTO companies (name, slug, company_type) VALUES ('Bally Manufacturing', 'bally-manufacturing', 'developer') ON CONFLICT DO NOTHING;
INSERT INTO companies (name, slug, company_type) VALUES ('Paul Resch', 'paul-resch', 'developer') ON CONFLICT DO NOTHING;
INSERT INTO companies (name, slug, company_type) VALUES ('Larry Kemp', 'larry-kemp', 'developer') ON CONFLICT DO NOTHING;
INSERT INTO companies (name, slug, company_type) VALUES ('Eric Hagstrom', 'eric-hagstrom', 'developer') ON CONFLICT DO NOTHING;

-- Platforms
INSERT INTO platforms (slug, igdb_id) VALUES ('arcade', 52) ON CONFLICT DO NOTHING;
INSERT INTO platform_translations (platform_id, language_code, name) SELECT id, 'en', 'Arcade' FROM platforms WHERE igdb_id = 52 ON CONFLICT (platform_id, language_code) DO NOTHING;
INSERT INTO platforms (slug, igdb_id) VALUES ('bally-astrocade', 91) ON CONFLICT DO NOTHING;
INSERT INTO platform_translations (platform_id, language_code, name) SELECT id, 'en', 'Bally Astrocade' FROM platforms WHERE igdb_id = 91 ON CONFLICT (platform_id, language_code) DO NOTHING;
INSERT INTO platforms (slug, igdb_id) VALUES ('plato', 110) ON CONFLICT DO NOTHING;
INSERT INTO platform_translations (platform_id, language_code, name) SELECT id, 'en', 'PLATO' FROM platforms WHERE igdb_id = 110 ON CONFLICT (platform_id, language_code) DO NOTHING;

-- Supported languages
INSERT INTO supported_languages (code, name, native_name) VALUES ('en', 'English', 'English (US)') ON CONFLICT (code) DO NOTHING;

INSERT INTO games (slug, igdb_id, release_date, metascore, cover_image_url, background_image_url, last_synced_at) VALUES ('gun-fight', 85868, '1975-11-01', NULL, 'https://images.igdb.com/igdb/image/upload/t_cover_big/co3tmc.jpg', 'https://images.igdb.com/igdb/image/upload/t_1080p/sc5s1b.jpg', NOW()) ON CONFLICT DO NOTHING;
INSERT INTO game_translations (game_id, language_code, title, description) SELECT id, 'en', 'Gun Fight', 'Old west theme shoot-out. Using simple graphics, two cowboys one on the left and one on the right move up down, left and right trying to get a clear shot avoiding cactus at the other.' FROM games WHERE igdb_id = 85868 ON CONFLICT (game_id, language_code) DO NOTHING;
INSERT INTO game_genres (game_id, genre_id) SELECT g.id, ge.id FROM games g, genres ge WHERE g.igdb_id = 85868 AND ge.slug = 'shooter' ON CONFLICT DO NOTHING;
INSERT INTO game_genres (game_id, genre_id) SELECT g.id, ge.id FROM games g, genres ge WHERE g.igdb_id = 85868 AND ge.slug = 'arcade' ON CONFLICT DO NOTHING;
INSERT INTO game_companies (game_id, company_id, role, is_primary) SELECT g.id, c.id, 'developer', false FROM games g, companies c WHERE g.igdb_id = 85868 AND c.slug = 'midway' ON CONFLICT DO NOTHING;
INSERT INTO game_companies (game_id, company_id, role, is_primary) SELECT g.id, c.id, 'developer', false FROM games g, companies c WHERE g.igdb_id = 85868 AND c.slug = 'taito' ON CONFLICT DO NOTHING;
INSERT INTO game_companies (game_id, company_id, role, is_primary) SELECT g.id, c.id, 'developer', false FROM games g, companies c WHERE g.igdb_id = 85868 AND c.slug = 'bally-manufacturing' ON CONFLICT DO NOTHING;
INSERT INTO game_platforms (game_id, platform_id) SELECT g.id, p.id FROM games g, platforms p WHERE g.igdb_id = 85868 AND p.igdb_id = 52 ON CONFLICT DO NOTHING;
INSERT INTO game_platforms (game_id, platform_id) SELECT g.id, p.id FROM games g, platforms p WHERE g.igdb_id = 85868 AND p.igdb_id = 91 ON CONFLICT DO NOTHING;
INSERT INTO game_screenshots (game_id, url, display_order, is_featured) SELECT id, 'https://images.igdb.com/igdb/image/upload/t_1080p/sc5s1b.jpg', 0, true FROM games WHERE igdb_id = 85868 ON CONFLICT DO NOTHING;
INSERT INTO game_screenshots (game_id, url, display_order, is_featured) SELECT id, 'https://images.igdb.com/igdb/image/upload/t_1080p/sc5s1a.jpg', 1, false FROM games WHERE igdb_id = 85868 ON CONFLICT DO NOTHING;
INSERT INTO game_videos (game_id, url, thumbnail_url, title, video_type, display_order, is_featured) SELECT id, 'https://www.youtube.com/watch?v=gRwwN1N5KSA', 'https://img.youtube.com/vi/gRwwN1N5KSA/maxresdefault.jpg', 'Gameplay video', 'trailer', 0, true FROM games WHERE igdb_id = 85868 ON CONFLICT DO NOTHING;
INSERT INTO game_languages (game_id, language_code, language_name, has_audio, has_subtitles, has_interface) SELECT id, 'en', 'English', false, false, true FROM games WHERE igdb_id = 85868 ON CONFLICT DO NOTHING;
INSERT INTO games (slug, igdb_id, release_date, metascore, cover_image_url, background_image_url, last_synced_at) VALUES ('orthanc', 146634, '1975-12-31', NULL, 'https://images.igdb.com/igdb/image/upload/t_cover_big/co2z7j.jpg', 'https://images.igdb.com/igdb/image/upload/t_1080p/sc9fbq.jpg', NOW()) ON CONFLICT DO NOTHING;
INSERT INTO game_translations (game_id, language_code, title, description) SELECT id, 'en', 'Orthanc', 'Expanded version of the early role-playing-game, pedit5.' FROM games WHERE igdb_id = 146634 ON CONFLICT (game_id, language_code) DO NOTHING;
INSERT INTO game_genres (game_id, genre_id) SELECT g.id, ge.id FROM games g, genres ge WHERE g.igdb_id = 146634 AND ge.slug = 'role-playing-rpg' ON CONFLICT DO NOTHING;
INSERT INTO game_companies (game_id, company_id, role, is_primary) SELECT g.id, c.id, 'developer', false FROM games g, companies c WHERE g.igdb_id = 146634 AND c.slug = 'paul-resch' ON CONFLICT DO NOTHING;
INSERT INTO game_companies (game_id, company_id, role, is_primary) SELECT g.id, c.id, 'developer', false FROM games g, companies c WHERE g.igdb_id = 146634 AND c.slug = 'larry-kemp' ON CONFLICT DO NOTHING;
INSERT INTO game_companies (game_id, company_id, role, is_primary) SELECT g.id, c.id, 'developer', false FROM games g, companies c WHERE g.igdb_id = 146634 AND c.slug = 'eric-hagstrom' ON CONFLICT DO NOTHING;
INSERT INTO game_platforms (game_id, platform_id) SELECT g.id, p.id FROM games g, platforms p WHERE g.igdb_id = 146634 AND p.igdb_id = 110 ON CONFLICT DO NOTHING;
INSERT INTO game_screenshots (game_id, url, display_order, is_featured) SELECT id, 'https://images.igdb.com/igdb/image/upload/t_1080p/sc9fbq.jpg', 0, true FROM games WHERE igdb_id = 146634 ON CONFLICT DO NOTHING;
INSERT INTO game_screenshots (game_id, url, display_order, is_featured) SELECT id, 'https://images.igdb.com/igdb/image/upload/t_1080p/sc9fbs.jpg', 1, false FROM games WHERE igdb_id = 146634 ON CONFLICT DO NOTHING;
INSERT INTO game_screenshots (game_id, url, display_order, is_featured) SELECT id, 'https://images.igdb.com/igdb/image/upload/t_1080p/sc9fbm.jpg', 2, false FROM games WHERE igdb_id = 146634 ON CONFLICT DO NOTHING;
INSERT INTO game_screenshots (game_id, url, display_order, is_featured) SELECT id, 'https://images.igdb.com/igdb/image/upload/t_1080p/sc9fbn.jpg', 3, false FROM games WHERE igdb_id = 146634 ON CONFLICT DO NOTHING;
INSERT INTO game_screenshots (game_id, url, display_order, is_featured) SELECT id, 'https://images.igdb.com/igdb/image/upload/t_1080p/sc9fbp.jpg', 4, false FROM games WHERE igdb_id = 146634 ON CONFLICT DO NOTHING;
INSERT INTO game_screenshots (game_id, url, display_order, is_featured) SELECT id, 'https://images.igdb.com/igdb/image/upload/t_1080p/sc9fbu.jpg', 5, false FROM games WHERE igdb_id = 146634 ON CONFLICT DO NOTHING;
INSERT INTO game_screenshots (game_id, url, display_order, is_featured) SELECT id, 'https://images.igdb.com/igdb/image/upload/t_1080p/sc9fbv.jpg', 6, false FROM games WHERE igdb_id = 146634 ON CONFLICT DO NOTHING;
INSERT INTO game_screenshots (game_id, url, display_order, is_featured) SELECT id, 'https://images.igdb.com/igdb/image/upload/t_1080p/sc9fbo.jpg', 7, false FROM games WHERE igdb_id = 146634 ON CONFLICT DO NOTHING;
INSERT INTO game_screenshots (game_id, url, display_order, is_featured) SELECT id, 'https://images.igdb.com/igdb/image/upload/t_1080p/sc9fbr.jpg', 8, false FROM games WHERE igdb_id = 146634 ON CONFLICT DO NOTHING;
INSERT INTO game_screenshots (game_id, url, display_order, is_featured) SELECT id, 'https://images.igdb.com/igdb/image/upload/t_1080p/sc9fbt.jpg', 9, false FROM games WHERE igdb_id = 146634 ON CONFLICT DO NOTHING;
INSERT INTO game_screenshots (game_id, url, display_order, is_featured) SELECT id, 'https://images.igdb.com/igdb/image/upload/t_1080p/sc9fbw.jpg', 10, false FROM games WHERE igdb_id = 146634 ON CONFLICT DO NOTHING;
INSERT INTO game_screenshots (game_id, url, display_order, is_featured) SELECT id, 'https://images.igdb.com/igdb/image/upload/t_1080p/sc9fbx.jpg', 11, false FROM games WHERE igdb_id = 146634 ON CONFLICT DO NOTHING;

COMMIT;
