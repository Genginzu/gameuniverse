-- IGDB Game Dump Import
-- Generated: 2026-03-28T23:17:24.508Z
-- Games: 6

BEGIN;

-- Genres
INSERT INTO genres (slug) VALUES ('racing') ON CONFLICT DO NOTHING;
INSERT INTO genre_translations (genre_id, language_code, name) SELECT id, 'en', 'Racing' FROM genres WHERE slug = 'racing' ON CONFLICT (genre_id, language_code) DO NOTHING;
INSERT INTO genres (slug) VALUES ('arcade') ON CONFLICT DO NOTHING;
INSERT INTO genre_translations (genre_id, language_code, name) SELECT id, 'en', 'Arcade' FROM genres WHERE slug = 'arcade' ON CONFLICT (genre_id, language_code) DO NOTHING;
INSERT INTO genres (slug) VALUES ('puzzle') ON CONFLICT DO NOTHING;
INSERT INTO genre_translations (genre_id, language_code, name) SELECT id, 'en', 'Puzzle' FROM genres WHERE slug = 'puzzle' ON CONFLICT (genre_id, language_code) DO NOTHING;
INSERT INTO genres (slug) VALUES ('strategy') ON CONFLICT DO NOTHING;
INSERT INTO genre_translations (genre_id, language_code, name) SELECT id, 'en', 'Strategy' FROM genres WHERE slug = 'strategy' ON CONFLICT (genre_id, language_code) DO NOTHING;
INSERT INTO genres (slug) VALUES ('role-playing-rpg') ON CONFLICT DO NOTHING;
INSERT INTO genre_translations (genre_id, language_code, name) SELECT id, 'en', 'Role-playing (RPG)' FROM genres WHERE slug = 'role-playing-rpg' ON CONFLICT (genre_id, language_code) DO NOTHING;
INSERT INTO genres (slug) VALUES ('adventure') ON CONFLICT DO NOTHING;
INSERT INTO genre_translations (genre_id, language_code, name) SELECT id, 'en', 'Adventure' FROM genres WHERE slug = 'adventure' ON CONFLICT (genre_id, language_code) DO NOTHING;

-- Companies
INSERT INTO companies (name, slug, company_type) VALUES ('Exidy', 'exidy', 'developer') ON CONFLICT DO NOTHING;
INSERT INTO companies (name, slug, company_type) VALUES ('Namco', 'namco', 'developer') ON CONFLICT DO NOTHING;
INSERT INTO companies (name, slug, company_type) VALUES ('Atari', 'atari', 'developer') ON CONFLICT DO NOTHING;
INSERT INTO companies (name, slug, company_type) VALUES ('Sears', 'sears', 'developer') ON CONFLICT DO NOTHING;
INSERT INTO companies (name, slug, company_type) VALUES ('Commodore Business Machines, Inc.', 'commodore-business-machines-inc', 'developer') ON CONFLICT DO NOTHING;
INSERT INTO companies (name, slug, company_type) VALUES ('HAL Laboratory', 'hal-laboratory', 'developer') ON CONFLICT DO NOTHING;
INSERT INTO companies (name, slug, company_type) VALUES ('General Instrument Microelectronic', 'general-instrument-microelectronic', 'developer') ON CONFLICT DO NOTHING;
INSERT INTO companies (name, slug, company_type) VALUES ('ASCII Corporation', 'ascii-corporation', 'developer') ON CONFLICT DO NOTHING;
INSERT INTO companies (name, slug, company_type) VALUES ('Gremlin Industries', 'gremlin-industries', 'developer') ON CONFLICT DO NOTHING;
INSERT INTO companies (name, slug, company_type) VALUES ('Taito', 'taito', 'developer') ON CONFLICT DO NOTHING;
INSERT INTO companies (name, slug, company_type) VALUES ('Jim Battin', 'jim-battin', 'developer') ON CONFLICT DO NOTHING;
INSERT INTO companies (name, slug, company_type) VALUES ('Kevet Duncombe', 'kevet-duncombe', 'developer') ON CONFLICT DO NOTHING;
INSERT INTO companies (name, slug, company_type) VALUES ('Will Crowther', 'will-crowther', 'developer') ON CONFLICT DO NOTHING;
INSERT INTO companies (name, slug, company_type) VALUES ('Digital Equipment Corporation', 'digital-equipment-corporation', 'developer') ON CONFLICT DO NOTHING;

-- Platforms
INSERT INTO platforms (slug, igdb_id) VALUES ('arcade', 52) ON CONFLICT DO NOTHING;
INSERT INTO platform_translations (platform_id, language_code, name) SELECT id, 'en', 'Arcade' FROM platforms WHERE igdb_id = 52 ON CONFLICT (platform_id, language_code) DO NOTHING;
INSERT INTO platforms (slug, igdb_id) VALUES ('atari-2600', 59) ON CONFLICT DO NOTHING;
INSERT INTO platform_translations (platform_id, language_code, name) SELECT id, 'en', 'Atari 2600' FROM platforms WHERE igdb_id = 59 ON CONFLICT (platform_id, language_code) DO NOTHING;
INSERT INTO platforms (slug, igdb_id) VALUES ('commodore-c64128max', 15) ON CONFLICT DO NOTHING;
INSERT INTO platform_translations (platform_id, language_code, name) SELECT id, 'en', 'Commodore C64/128/MAX' FROM platforms WHERE igdb_id = 15 ON CONFLICT (platform_id, language_code) DO NOTHING;
INSERT INTO platforms (slug, igdb_id) VALUES ('ay-3-8606', 147) ON CONFLICT DO NOTHING;
INSERT INTO platform_translations (platform_id, language_code, name) SELECT id, 'en', 'AY-3-8606' FROM platforms WHERE igdb_id = 147 ON CONFLICT (platform_id, language_code) DO NOTHING;
INSERT INTO platforms (slug, igdb_id) VALUES ('msx', 27) ON CONFLICT DO NOTHING;
INSERT INTO platform_translations (platform_id, language_code, name) SELECT id, 'en', 'MSX' FROM platforms WHERE igdb_id = 27 ON CONFLICT (platform_id, language_code) DO NOTHING;
INSERT INTO platforms (slug, igdb_id) VALUES ('plato', 110) ON CONFLICT DO NOTHING;
INSERT INTO platform_translations (platform_id, language_code, name) SELECT id, 'en', 'PLATO' FROM platforms WHERE igdb_id = 110 ON CONFLICT (platform_id, language_code) DO NOTHING;
INSERT INTO platforms (slug, igdb_id) VALUES ('pdp-11', 108) ON CONFLICT DO NOTHING;
INSERT INTO platform_translations (platform_id, language_code, name) SELECT id, 'en', 'PDP-11' FROM platforms WHERE igdb_id = 108 ON CONFLICT (platform_id, language_code) DO NOTHING;
INSERT INTO platforms (slug, igdb_id) VALUES ('pdp-10', 96) ON CONFLICT DO NOTHING;
INSERT INTO platform_translations (platform_id, language_code, name) SELECT id, 'en', 'PDP-10' FROM platforms WHERE igdb_id = 96 ON CONFLICT (platform_id, language_code) DO NOTHING;

-- Rating systems & ratings
INSERT INTO rating_systems (code, name) VALUES ('ESRB', 'ESRB') ON CONFLICT (code) DO NOTHING;
INSERT INTO ratings (rating_system_id, code, display_name, minimum_age) SELECT id, 'E', 'Everyone', 6 FROM rating_systems WHERE code = 'ESRB' ON CONFLICT (rating_system_id, code) DO NOTHING;

-- Supported languages
INSERT INTO supported_languages (code, name, native_name) VALUES ('en', 'English', 'English (US)') ON CONFLICT (code) DO NOTHING;

INSERT INTO games (slug, igdb_id, release_date, metascore, cover_image_url, background_image_url, last_synced_at) VALUES ('death-race', 8561, '1976-04-01', NULL, 'https://images.igdb.com/igdb/image/upload/t_cover_big/co2kvz.jpg', 'https://images.igdb.com/igdb/image/upload/t_1080p/sc8rv7.jpg', NOW()) ON CONFLICT DO NOTHING;
INSERT INTO game_translations (game_id, language_code, title, description) SELECT id, 'en', 'Death Race', 'Death Race is a vehicular combat game that puts your car in an open space with gremlins. Your goal is the crash into the gremlins so you can brutally and cruelly kill them. Upon dying, they scream. In the spot where the gremlin once was, a cross-shaped gravestone will be left. This clutters the playing field, making it harder to move around. There are dotted lines on the sides, representing two narrow "safe" zones on the left and right sides of the screen for the gremlins, as your car will crash on contact with the dotted lines.' FROM games WHERE igdb_id = 8561 ON CONFLICT (game_id, language_code) DO NOTHING;
INSERT INTO game_genres (game_id, genre_id) SELECT g.id, ge.id FROM games g, genres ge WHERE g.igdb_id = 8561 AND ge.slug = 'racing' ON CONFLICT DO NOTHING;
INSERT INTO game_genres (game_id, genre_id) SELECT g.id, ge.id FROM games g, genres ge WHERE g.igdb_id = 8561 AND ge.slug = 'arcade' ON CONFLICT DO NOTHING;
INSERT INTO game_companies (game_id, company_id, role, is_primary) SELECT g.id, c.id, 'developer', false FROM games g, companies c WHERE g.igdb_id = 8561 AND c.slug = 'exidy' ON CONFLICT DO NOTHING;
INSERT INTO game_platforms (game_id, platform_id) SELECT g.id, p.id FROM games g, platforms p WHERE g.igdb_id = 8561 AND p.igdb_id = 52 ON CONFLICT DO NOTHING;
INSERT INTO game_screenshots (game_id, url, display_order, is_featured) SELECT id, 'https://images.igdb.com/igdb/image/upload/t_1080p/sc8rv7.jpg', 0, true FROM games WHERE igdb_id = 8561 ON CONFLICT DO NOTHING;
INSERT INTO game_screenshots (game_id, url, display_order, is_featured) SELECT id, 'https://images.igdb.com/igdb/image/upload/t_1080p/sc8rv8.jpg', 1, false FROM games WHERE igdb_id = 8561 ON CONFLICT DO NOTHING;
INSERT INTO game_screenshots (game_id, url, display_order, is_featured) SELECT id, 'https://images.igdb.com/igdb/image/upload/t_1080p/sc8rv9.jpg', 2, false FROM games WHERE igdb_id = 8561 ON CONFLICT DO NOTHING;
INSERT INTO game_videos (game_id, url, thumbnail_url, title, video_type, display_order, is_featured) SELECT id, 'https://www.youtube.com/watch?v=48r1wJh8z20', 'https://img.youtube.com/vi/48r1wJh8z20/maxresdefault.jpg', 'Gameplay video', 'trailer', 0, true FROM games WHERE igdb_id = 8561 ON CONFLICT DO NOTHING;
INSERT INTO game_languages (game_id, language_code, language_name, has_audio, has_subtitles, has_interface) SELECT id, 'en', 'English', false, false, true FROM games WHERE igdb_id = 8561 ON CONFLICT DO NOTHING;
INSERT INTO games (slug, igdb_id, release_date, metascore, cover_image_url, background_image_url, last_synced_at) VALUES ('night-driver', 18649, '1976-10-01', NULL, 'https://images.igdb.com/igdb/image/upload/t_cover_big/co6wof.jpg', 'https://images.igdb.com/igdb/image/upload/t_1080p/ar8v3.jpg', NOW()) ON CONFLICT DO NOTHING;
INSERT INTO game_translations (game_id, language_code, title, description) SELECT id, 'en', 'Night Driver', 'The player controls a car which must be driven along a road at nighttime without crashing into the sides of the road as indicated by road side reflectors. The game is controlled with a single pedal for gas, a wheel for steering and a four-selection lever for gear shifting. The coin operated game had a choice of three difficulties, novice, pro, and expert, from which the player could choose at game start. The turns were sharper and more frequent on the more difficult tracks. As play progresses, the road gets narrower and more winding.' FROM games WHERE igdb_id = 18649 ON CONFLICT (game_id, language_code) DO NOTHING;
INSERT INTO game_genres (game_id, genre_id) SELECT g.id, ge.id FROM games g, genres ge WHERE g.igdb_id = 18649 AND ge.slug = 'racing' ON CONFLICT DO NOTHING;
INSERT INTO game_genres (game_id, genre_id) SELECT g.id, ge.id FROM games g, genres ge WHERE g.igdb_id = 18649 AND ge.slug = 'arcade' ON CONFLICT DO NOTHING;
INSERT INTO game_companies (game_id, company_id, role, is_primary) SELECT g.id, c.id, 'developer', false FROM games g, companies c WHERE g.igdb_id = 18649 AND c.slug = 'namco' ON CONFLICT DO NOTHING;
INSERT INTO game_companies (game_id, company_id, role, is_primary) SELECT g.id, c.id, 'developer', false FROM games g, companies c WHERE g.igdb_id = 18649 AND c.slug = 'atari' ON CONFLICT DO NOTHING;
INSERT INTO game_companies (game_id, company_id, role, is_primary) SELECT g.id, c.id, 'developer', false FROM games g, companies c WHERE g.igdb_id = 18649 AND c.slug = 'sears' ON CONFLICT DO NOTHING;
INSERT INTO game_companies (game_id, company_id, role, is_primary) SELECT g.id, c.id, 'developer', false FROM games g, companies c WHERE g.igdb_id = 18649 AND c.slug = 'commodore-business-machines-inc' ON CONFLICT DO NOTHING;
INSERT INTO game_companies (game_id, company_id, role, is_primary) SELECT g.id, c.id, 'developer', false FROM games g, companies c WHERE g.igdb_id = 18649 AND c.slug = 'hal-laboratory' ON CONFLICT DO NOTHING;
INSERT INTO game_platforms (game_id, platform_id) SELECT g.id, p.id FROM games g, platforms p WHERE g.igdb_id = 18649 AND p.igdb_id = 52 ON CONFLICT DO NOTHING;
INSERT INTO game_platforms (game_id, platform_id) SELECT g.id, p.id FROM games g, platforms p WHERE g.igdb_id = 18649 AND p.igdb_id = 59 ON CONFLICT DO NOTHING;
INSERT INTO game_platforms (game_id, platform_id) SELECT g.id, p.id FROM games g, platforms p WHERE g.igdb_id = 18649 AND p.igdb_id = 15 ON CONFLICT DO NOTHING;
INSERT INTO game_screenshots (game_id, url, display_order, is_featured) SELECT id, 'https://images.igdb.com/igdb/image/upload/t_1080p/scaer3.jpg', 0, true FROM games WHERE igdb_id = 18649 ON CONFLICT DO NOTHING;
INSERT INTO game_screenshots (game_id, url, display_order, is_featured) SELECT id, 'https://images.igdb.com/igdb/image/upload/t_1080p/scnuee.jpg', 1, false FROM games WHERE igdb_id = 18649 ON CONFLICT DO NOTHING;
INSERT INTO game_artwork (game_id, url, artwork_type, display_order, is_featured) SELECT id, 'https://images.igdb.com/igdb/image/upload/t_1080p/ar8v3.jpg', 'promotional', 0, true FROM games WHERE igdb_id = 18649 ON CONFLICT DO NOTHING;
INSERT INTO game_artwork (game_id, url, artwork_type, display_order, is_featured) SELECT id, 'https://images.igdb.com/igdb/image/upload/t_1080p/ar8v1.jpg', 'promotional', 1, false FROM games WHERE igdb_id = 18649 ON CONFLICT DO NOTHING;
INSERT INTO game_artwork (game_id, url, artwork_type, display_order, is_featured) SELECT id, 'https://images.igdb.com/igdb/image/upload/t_1080p/ar8v0.jpg', 'promotional', 2, false FROM games WHERE igdb_id = 18649 ON CONFLICT DO NOTHING;
INSERT INTO game_artwork (game_id, url, artwork_type, display_order, is_featured) SELECT id, 'https://images.igdb.com/igdb/image/upload/t_1080p/ar8v2.jpg', 'promotional', 3, false FROM games WHERE igdb_id = 18649 ON CONFLICT DO NOTHING;
INSERT INTO game_artwork (game_id, url, artwork_type, display_order, is_featured) SELECT id, 'https://images.igdb.com/igdb/image/upload/t_1080p/ar8uy.jpg', 'promotional', 4, false FROM games WHERE igdb_id = 18649 ON CONFLICT DO NOTHING;
INSERT INTO game_artwork (game_id, url, artwork_type, display_order, is_featured) SELECT id, 'https://images.igdb.com/igdb/image/upload/t_1080p/ar8uz.jpg', 'promotional', 5, false FROM games WHERE igdb_id = 18649 ON CONFLICT DO NOTHING;
INSERT INTO game_videos (game_id, url, thumbnail_url, title, video_type, display_order, is_featured) SELECT id, 'https://www.youtube.com/watch?v=Wk-7BR9Dl9c', 'https://img.youtube.com/vi/Wk-7BR9Dl9c/maxresdefault.jpg', 'Gameplay Video', 'trailer', 0, true FROM games WHERE igdb_id = 18649 ON CONFLICT DO NOTHING;
INSERT INTO game_languages (game_id, language_code, language_name, has_audio, has_subtitles, has_interface) SELECT id, 'en', 'English', false, false, true FROM games WHERE igdb_id = 18649 ON CONFLICT DO NOTHING;
INSERT INTO games (slug, igdb_id, release_date, metascore, cover_image_url, background_image_url, last_synced_at) VALUES ('breakout', 2754, '1976-05-13', NULL, 'https://images.igdb.com/igdb/image/upload/t_cover_big/co94iu.jpg', 'https://images.igdb.com/igdb/image/upload/t_1080p/ar3nqb.jpg', NOW()) ON CONFLICT DO NOTHING;
INSERT INTO game_translations (game_id, language_code, title, description) SELECT id, 'en', 'Breakout', 'The objective of the game is to destroy a multilayered wall of bricks at the top the screen. Upon hitting the bricks with a ball which bounces off of a paddle at the bottom of the screen the bricks are destroyed. If the player misses the ball with his horizontally moveable paddle the ball is lost. After loosing five balls the game is over.' FROM games WHERE igdb_id = 2754 ON CONFLICT (game_id, language_code) DO NOTHING;
INSERT INTO game_genres (game_id, genre_id) SELECT g.id, ge.id FROM games g, genres ge WHERE g.igdb_id = 2754 AND ge.slug = 'arcade' ON CONFLICT DO NOTHING;
INSERT INTO game_companies (game_id, company_id, role, is_primary) SELECT g.id, c.id, 'developer', false FROM games g, companies c WHERE g.igdb_id = 2754 AND c.slug = 'general-instrument-microelectronic' ON CONFLICT DO NOTHING;
INSERT INTO game_companies (game_id, company_id, role, is_primary) SELECT g.id, c.id, 'developer', false FROM games g, companies c WHERE g.igdb_id = 2754 AND c.slug = 'atari' ON CONFLICT DO NOTHING;
INSERT INTO game_companies (game_id, company_id, role, is_primary) SELECT g.id, c.id, 'developer', false FROM games g, companies c WHERE g.igdb_id = 2754 AND c.slug = 'ascii-corporation' ON CONFLICT DO NOTHING;
INSERT INTO game_companies (game_id, company_id, role, is_primary) SELECT g.id, c.id, 'developer', false FROM games g, companies c WHERE g.igdb_id = 2754 AND c.slug = 'atari' ON CONFLICT DO NOTHING;
INSERT INTO game_companies (game_id, company_id, role, is_primary) SELECT g.id, c.id, 'developer', false FROM games g, companies c WHERE g.igdb_id = 2754 AND c.slug = 'namco' ON CONFLICT DO NOTHING;
INSERT INTO game_platforms (game_id, platform_id) SELECT g.id, p.id FROM games g, platforms p WHERE g.igdb_id = 2754 AND p.igdb_id = 52 ON CONFLICT DO NOTHING;
INSERT INTO game_platforms (game_id, platform_id) SELECT g.id, p.id FROM games g, platforms p WHERE g.igdb_id = 2754 AND p.igdb_id = 59 ON CONFLICT DO NOTHING;
INSERT INTO game_platforms (game_id, platform_id) SELECT g.id, p.id FROM games g, platforms p WHERE g.igdb_id = 2754 AND p.igdb_id = 147 ON CONFLICT DO NOTHING;
INSERT INTO game_platforms (game_id, platform_id) SELECT g.id, p.id FROM games g, platforms p WHERE g.igdb_id = 2754 AND p.igdb_id = 27 ON CONFLICT DO NOTHING;
INSERT INTO game_screenshots (game_id, url, display_order, is_featured) SELECT id, 'https://images.igdb.com/igdb/image/upload/t_1080p/temgxhzlutkwta8vdmeu.jpg', 0, true FROM games WHERE igdb_id = 2754 ON CONFLICT DO NOTHING;
INSERT INTO game_screenshots (game_id, url, display_order, is_featured) SELECT id, 'https://images.igdb.com/igdb/image/upload/t_1080p/scz2sy.jpg', 1, false FROM games WHERE igdb_id = 2754 ON CONFLICT DO NOTHING;
INSERT INTO game_screenshots (game_id, url, display_order, is_featured) SELECT id, 'https://images.igdb.com/igdb/image/upload/t_1080p/scz2sz.jpg', 2, false FROM games WHERE igdb_id = 2754 ON CONFLICT DO NOTHING;
INSERT INTO game_screenshots (game_id, url, display_order, is_featured) SELECT id, 'https://images.igdb.com/igdb/image/upload/t_1080p/scz2t0.jpg', 3, false FROM games WHERE igdb_id = 2754 ON CONFLICT DO NOTHING;
INSERT INTO game_artwork (game_id, url, artwork_type, display_order, is_featured) SELECT id, 'https://images.igdb.com/igdb/image/upload/t_1080p/ar3nqb.jpg', 'promotional', 0, true FROM games WHERE igdb_id = 2754 ON CONFLICT DO NOTHING;
INSERT INTO game_videos (game_id, url, thumbnail_url, title, video_type, display_order, is_featured) SELECT id, 'https://www.youtube.com/watch?v=tT70Tv6D41o', 'https://img.youtube.com/vi/tT70Tv6D41o/maxresdefault.jpg', 'Gameplay Video', 'trailer', 0, true FROM games WHERE igdb_id = 2754 ON CONFLICT DO NOTHING;
INSERT INTO game_ratings (game_id, rating_id, is_primary) SELECT g.id, r.id, false FROM games g, ratings r JOIN rating_systems rs ON r.rating_system_id = rs.id WHERE g.igdb_id = 2754 AND rs.code = 'ESRB' AND r.code = 'E' ON CONFLICT DO NOTHING;
INSERT INTO game_languages (game_id, language_code, language_name, has_audio, has_subtitles, has_interface) SELECT id, 'en', 'English', false, false, true FROM games WHERE igdb_id = 2754 ON CONFLICT DO NOTHING;
INSERT INTO games (slug, igdb_id, release_date, metascore, cover_image_url, background_image_url, last_synced_at) VALUES ('blockade', 18118, '1976-10-01', NULL, 'https://images.igdb.com/igdb/image/upload/t_cover_big/qerr6aledcvu6ilnzpkr.jpg', 'https://images.igdb.com/igdb/image/upload/t_1080p/scp3qk.jpg', NOW()) ON CONFLICT DO NOTHING;
INSERT INTO game_translations (game_id, language_code, title, description) SELECT id, 'en', 'Blockade', 'Blockade is a black and white arcade game developed and published by Gremlin in October 1976. Using four directional buttons, each player moves their character around leaving a solid line behind them, turning at 90 degree angles. To win, a player must last longer than the opponent before hitting something, with the first person to hit something losing. The game ends after one player gains six wins. Blockade is the first of what have become known as snake games.' FROM games WHERE igdb_id = 18118 ON CONFLICT (game_id, language_code) DO NOTHING;
INSERT INTO game_genres (game_id, genre_id) SELECT g.id, ge.id FROM games g, genres ge WHERE g.igdb_id = 18118 AND ge.slug = 'puzzle' ON CONFLICT DO NOTHING;
INSERT INTO game_genres (game_id, genre_id) SELECT g.id, ge.id FROM games g, genres ge WHERE g.igdb_id = 18118 AND ge.slug = 'strategy' ON CONFLICT DO NOTHING;
INSERT INTO game_genres (game_id, genre_id) SELECT g.id, ge.id FROM games g, genres ge WHERE g.igdb_id = 18118 AND ge.slug = 'arcade' ON CONFLICT DO NOTHING;
INSERT INTO game_companies (game_id, company_id, role, is_primary) SELECT g.id, c.id, 'developer', false FROM games g, companies c WHERE g.igdb_id = 18118 AND c.slug = 'gremlin-industries' ON CONFLICT DO NOTHING;
INSERT INTO game_companies (game_id, company_id, role, is_primary) SELECT g.id, c.id, 'developer', false FROM games g, companies c WHERE g.igdb_id = 18118 AND c.slug = 'taito' ON CONFLICT DO NOTHING;
INSERT INTO game_platforms (game_id, platform_id) SELECT g.id, p.id FROM games g, platforms p WHERE g.igdb_id = 18118 AND p.igdb_id = 52 ON CONFLICT DO NOTHING;
INSERT INTO game_screenshots (game_id, url, display_order, is_featured) SELECT id, 'https://images.igdb.com/igdb/image/upload/t_1080p/scp3qk.jpg', 0, true FROM games WHERE igdb_id = 18118 ON CONFLICT DO NOTHING;
INSERT INTO game_videos (game_id, url, thumbnail_url, title, video_type, display_order, is_featured) SELECT id, 'https://www.youtube.com/watch?v=95xz1UmGjfE', 'https://img.youtube.com/vi/95xz1UmGjfE/maxresdefault.jpg', 'Gameplay Video', 'trailer', 0, true FROM games WHERE igdb_id = 18118 ON CONFLICT DO NOTHING;
INSERT INTO game_videos (game_id, url, thumbnail_url, title, video_type, display_order, is_featured) SELECT id, 'https://www.youtube.com/watch?v=5v-0CwiabZA', 'https://img.youtube.com/vi/5v-0CwiabZA/maxresdefault.jpg', 'Gameplay Video', 'trailer', 1, false FROM games WHERE igdb_id = 18118 ON CONFLICT DO NOTHING;
INSERT INTO game_languages (game_id, language_code, language_name, has_audio, has_subtitles, has_interface) SELECT id, 'en', 'English', false, false, true FROM games WHERE igdb_id = 18118 ON CONFLICT DO NOTHING;
INSERT INTO games (slug, igdb_id, release_date, metascore, cover_image_url, background_image_url, last_synced_at) VALUES ('moria', 77304, '1976-03-31', NULL, 'https://images.igdb.com/igdb/image/upload/t_cover_big/co2z9t.jpg', 'https://images.igdb.com/igdb/image/upload/t_1080p/sc9fwn.jpg', NOW()) ON CONFLICT DO NOTHING;
INSERT INTO game_translations (game_id, language_code, title, description) SELECT id, 'en', 'Moria', 'Moria is a dungeon crawl style role-playing video game first developed for the PLATO system around 1975, with copyright dates listed as 1978 and 1984. It was a pioneering game, allowing parties of up to ten players to travel as a group and message each other, dynamically generating dungeons (instead of pre-computing them), and featuring a wireframe first-person perspective display. One of its authors, Kevet Duncombe, claims not to have read the works of J. R. R. Tolkien or heard of Dungeons & Dragons at the time development started, but he was aware of the PLATO game, dnd.' FROM games WHERE igdb_id = 77304 ON CONFLICT (game_id, language_code) DO NOTHING;
INSERT INTO game_genres (game_id, genre_id) SELECT g.id, ge.id FROM games g, genres ge WHERE g.igdb_id = 77304 AND ge.slug = 'role-playing-rpg' ON CONFLICT DO NOTHING;
INSERT INTO game_companies (game_id, company_id, role, is_primary) SELECT g.id, c.id, 'developer', false FROM games g, companies c WHERE g.igdb_id = 77304 AND c.slug = 'jim-battin' ON CONFLICT DO NOTHING;
INSERT INTO game_companies (game_id, company_id, role, is_primary) SELECT g.id, c.id, 'developer', false FROM games g, companies c WHERE g.igdb_id = 77304 AND c.slug = 'kevet-duncombe' ON CONFLICT DO NOTHING;
INSERT INTO game_platforms (game_id, platform_id) SELECT g.id, p.id FROM games g, platforms p WHERE g.igdb_id = 77304 AND p.igdb_id = 110 ON CONFLICT DO NOTHING;
INSERT INTO game_screenshots (game_id, url, display_order, is_featured) SELECT id, 'https://images.igdb.com/igdb/image/upload/t_1080p/sc9fwn.jpg', 0, true FROM games WHERE igdb_id = 77304 ON CONFLICT DO NOTHING;
INSERT INTO game_screenshots (game_id, url, display_order, is_featured) SELECT id, 'https://images.igdb.com/igdb/image/upload/t_1080p/sc9fwo.jpg', 1, false FROM games WHERE igdb_id = 77304 ON CONFLICT DO NOTHING;
INSERT INTO game_screenshots (game_id, url, display_order, is_featured) SELECT id, 'https://images.igdb.com/igdb/image/upload/t_1080p/sc9fwp.jpg', 2, false FROM games WHERE igdb_id = 77304 ON CONFLICT DO NOTHING;
INSERT INTO game_screenshots (game_id, url, display_order, is_featured) SELECT id, 'https://images.igdb.com/igdb/image/upload/t_1080p/sc9fwq.jpg', 3, false FROM games WHERE igdb_id = 77304 ON CONFLICT DO NOTHING;
INSERT INTO game_screenshots (game_id, url, display_order, is_featured) SELECT id, 'https://images.igdb.com/igdb/image/upload/t_1080p/sc9fwr.jpg', 4, false FROM games WHERE igdb_id = 77304 ON CONFLICT DO NOTHING;
INSERT INTO game_screenshots (game_id, url, display_order, is_featured) SELECT id, 'https://images.igdb.com/igdb/image/upload/t_1080p/sc9fws.jpg', 5, false FROM games WHERE igdb_id = 77304 ON CONFLICT DO NOTHING;
INSERT INTO game_screenshots (game_id, url, display_order, is_featured) SELECT id, 'https://images.igdb.com/igdb/image/upload/t_1080p/sc9fwt.jpg', 6, false FROM games WHERE igdb_id = 77304 ON CONFLICT DO NOTHING;
INSERT INTO game_screenshots (game_id, url, display_order, is_featured) SELECT id, 'https://images.igdb.com/igdb/image/upload/t_1080p/sc9fwu.jpg', 7, false FROM games WHERE igdb_id = 77304 ON CONFLICT DO NOTHING;
INSERT INTO game_screenshots (game_id, url, display_order, is_featured) SELECT id, 'https://images.igdb.com/igdb/image/upload/t_1080p/sc9fwv.jpg', 8, false FROM games WHERE igdb_id = 77304 ON CONFLICT DO NOTHING;
INSERT INTO game_screenshots (game_id, url, display_order, is_featured) SELECT id, 'https://images.igdb.com/igdb/image/upload/t_1080p/sc9fww.jpg', 9, false FROM games WHERE igdb_id = 77304 ON CONFLICT DO NOTHING;
INSERT INTO game_screenshots (game_id, url, display_order, is_featured) SELECT id, 'https://images.igdb.com/igdb/image/upload/t_1080p/sc9fwx.jpg', 10, false FROM games WHERE igdb_id = 77304 ON CONFLICT DO NOTHING;
INSERT INTO game_screenshots (game_id, url, display_order, is_featured) SELECT id, 'https://images.igdb.com/igdb/image/upload/t_1080p/sc9fwy.jpg', 11, false FROM games WHERE igdb_id = 77304 ON CONFLICT DO NOTHING;
INSERT INTO games (slug, igdb_id, release_date, metascore, cover_image_url, background_image_url, last_synced_at) VALUES ('colossal-cave-adventure', 25115, '1976-03-31', NULL, 'https://images.igdb.com/igdb/image/upload/t_cover_big/co6zm7.jpg', 'https://images.igdb.com/igdb/image/upload/t_1080p/sco86s.jpg', NOW()) ON CONFLICT DO NOTHING;
INSERT INTO game_translations (game_id, language_code, title, description) SELECT id, 'en', 'Colossal Cave Adventure', 'Colossal Cave Adventure is a text adventure game, developed originally in 1976, by Will Crowther for the PDP-10 mainframe. The game was expanded upon in 1977, with help from Don Woods, and other programmers created variations on the game and ports to other systems in the following years. In the game, the player controls a character through simple text commands to explore a cave rumored to be filled with wealth. Players earn predetermined points for acquiring treasure and escaping the cave alive, with the goal to earn the maximum amount of points offered. The concept bore out from Crowther''s background as a caving enthusiast, with the game''s cave structured loosely around the Mammoth Cave system in Kentucky.' FROM games WHERE igdb_id = 25115 ON CONFLICT (game_id, language_code) DO NOTHING;
INSERT INTO game_genres (game_id, genre_id) SELECT g.id, ge.id FROM games g, genres ge WHERE g.igdb_id = 25115 AND ge.slug = 'adventure' ON CONFLICT DO NOTHING;
INSERT INTO game_companies (game_id, company_id, role, is_primary) SELECT g.id, c.id, 'developer', false FROM games g, companies c WHERE g.igdb_id = 25115 AND c.slug = 'will-crowther' ON CONFLICT DO NOTHING;
INSERT INTO game_companies (game_id, company_id, role, is_primary) SELECT g.id, c.id, 'developer', false FROM games g, companies c WHERE g.igdb_id = 25115 AND c.slug = 'digital-equipment-corporation' ON CONFLICT DO NOTHING;
INSERT INTO game_platforms (game_id, platform_id) SELECT g.id, p.id FROM games g, platforms p WHERE g.igdb_id = 25115 AND p.igdb_id = 108 ON CONFLICT DO NOTHING;
INSERT INTO game_platforms (game_id, platform_id) SELECT g.id, p.id FROM games g, platforms p WHERE g.igdb_id = 25115 AND p.igdb_id = 96 ON CONFLICT DO NOTHING;
INSERT INTO game_screenshots (game_id, url, display_order, is_featured) SELECT id, 'https://images.igdb.com/igdb/image/upload/t_1080p/sco86s.jpg', 0, true FROM games WHERE igdb_id = 25115 ON CONFLICT DO NOTHING;
INSERT INTO game_screenshots (game_id, url, display_order, is_featured) SELECT id, 'https://images.igdb.com/igdb/image/upload/t_1080p/sco86t.jpg', 1, false FROM games WHERE igdb_id = 25115 ON CONFLICT DO NOTHING;
INSERT INTO game_screenshots (game_id, url, display_order, is_featured) SELECT id, 'https://images.igdb.com/igdb/image/upload/t_1080p/sco86u.jpg', 2, false FROM games WHERE igdb_id = 25115 ON CONFLICT DO NOTHING;
INSERT INTO game_screenshots (game_id, url, display_order, is_featured) SELECT id, 'https://images.igdb.com/igdb/image/upload/t_1080p/sco86v.jpg', 3, false FROM games WHERE igdb_id = 25115 ON CONFLICT DO NOTHING;
INSERT INTO game_screenshots (game_id, url, display_order, is_featured) SELECT id, 'https://images.igdb.com/igdb/image/upload/t_1080p/sco86w.jpg', 4, false FROM games WHERE igdb_id = 25115 ON CONFLICT DO NOTHING;
INSERT INTO game_screenshots (game_id, url, display_order, is_featured) SELECT id, 'https://images.igdb.com/igdb/image/upload/t_1080p/sco86x.jpg', 5, false FROM games WHERE igdb_id = 25115 ON CONFLICT DO NOTHING;
INSERT INTO game_screenshots (game_id, url, display_order, is_featured) SELECT id, 'https://images.igdb.com/igdb/image/upload/t_1080p/sco86y.jpg', 6, false FROM games WHERE igdb_id = 25115 ON CONFLICT DO NOTHING;
INSERT INTO game_videos (game_id, url, thumbnail_url, title, video_type, display_order, is_featured) SELECT id, 'https://www.youtube.com/watch?v=bhFrWH0na0A', 'https://img.youtube.com/vi/bhFrWH0na0A/maxresdefault.jpg', 'Gameplay video', 'trailer', 0, true FROM games WHERE igdb_id = 25115 ON CONFLICT DO NOTHING;

COMMIT;
