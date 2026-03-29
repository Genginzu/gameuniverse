-- IGDB Game Dump Import
-- Generated: 2026-03-28T23:04:57.478Z
-- Games: 4

BEGIN;

-- Genres
INSERT INTO genres (slug) VALUES ('puzzle') ON CONFLICT (slug) DO NOTHING;
INSERT INTO genre_translations (genre_id, language_code, name) SELECT id, 'en', 'Puzzle' FROM genres WHERE slug = 'puzzle' ON CONFLICT (genre_id, language_code) DO NOTHING;
INSERT INTO genres (slug) VALUES ('adventure') ON CONFLICT (slug) DO NOTHING;
INSERT INTO genre_translations (genre_id, language_code, name) SELECT id, 'en', 'Adventure' FROM genres WHERE slug = 'adventure' ON CONFLICT (genre_id, language_code) DO NOTHING;
INSERT INTO genres (slug) VALUES ('shooter') ON CONFLICT (slug) DO NOTHING;
INSERT INTO genre_translations (genre_id, language_code, name) SELECT id, 'en', 'Shooter' FROM genres WHERE slug = 'shooter' ON CONFLICT (genre_id, language_code) DO NOTHING;
INSERT INTO genres (slug) VALUES ('real-time-strategy-rts') ON CONFLICT (slug) DO NOTHING;
INSERT INTO genre_translations (genre_id, language_code, name) SELECT id, 'en', 'Real Time Strategy (RTS)' FROM genres WHERE slug = 'real-time-strategy-rts' ON CONFLICT (genre_id, language_code) DO NOTHING;
INSERT INTO genres (slug) VALUES ('strategy') ON CONFLICT (slug) DO NOTHING;
INSERT INTO genre_translations (genre_id, language_code, name) SELECT id, 'en', 'Strategy' FROM genres WHERE slug = 'strategy' ON CONFLICT (genre_id, language_code) DO NOTHING;
INSERT INTO genres (slug) VALUES ('racing') ON CONFLICT (slug) DO NOTHING;
INSERT INTO genre_translations (genre_id, language_code, name) SELECT id, 'en', 'Racing' FROM genres WHERE slug = 'racing' ON CONFLICT (genre_id, language_code) DO NOTHING;
INSERT INTO genres (slug) VALUES ('arcade') ON CONFLICT (slug) DO NOTHING;
INSERT INTO genre_translations (genre_id, language_code, name) SELECT id, 'en', 'Arcade' FROM genres WHERE slug = 'arcade' ON CONFLICT (genre_id, language_code) DO NOTHING;
INSERT INTO genres (slug) VALUES ('simulator') ON CONFLICT (slug) DO NOTHING;
INSERT INTO genre_translations (genre_id, language_code, name) SELECT id, 'en', 'Simulator' FROM genres WHERE slug = 'simulator' ON CONFLICT (genre_id, language_code) DO NOTHING;

-- Companies
INSERT INTO companies (name, slug, company_type) VALUES ('Gregory Yob', 'gregory-yob', 'developer') ON CONFLICT (slug) DO NOTHING;
INSERT INTO companies (name, slug, company_type) VALUES ('Kevin Kenney', 'kevin-kenney', 'developer') ON CONFLICT (slug) DO NOTHING;
INSERT INTO companies (name, slug, company_type) VALUES ('Namco', 'namco', 'developer') ON CONFLICT (slug) DO NOTHING;
INSERT INTO companies (name, slug, company_type) VALUES ('Atari', 'atari', 'developer') ON CONFLICT (slug) DO NOTHING;
INSERT INTO companies (name, slug, company_type) VALUES ('Jack Burness', 'jack-burness', 'developer') ON CONFLICT (slug) DO NOTHING;
INSERT INTO companies (name, slug, company_type) VALUES ('Digital Equipment Corporation', 'digital-equipment-corporation', 'developer') ON CONFLICT (slug) DO NOTHING;

-- Platforms
INSERT INTO platforms (slug, igdb_id) VALUES ('microcomputer', 112) ON CONFLICT (igdb_id) DO NOTHING;
INSERT INTO platform_translations (platform_id, language_code, name) SELECT id, 'en', 'Microcomputer' FROM platforms WHERE igdb_id = 112 ON CONFLICT (platform_id, language_code) DO NOTHING;
INSERT INTO platforms (slug, igdb_id) VALUES ('plato', 110) ON CONFLICT (igdb_id) DO NOTHING;
INSERT INTO platform_translations (platform_id, language_code, name) SELECT id, 'en', 'PLATO' FROM platforms WHERE igdb_id = 110 ON CONFLICT (platform_id, language_code) DO NOTHING;
INSERT INTO platforms (slug, igdb_id) VALUES ('arcade', 52) ON CONFLICT (igdb_id) DO NOTHING;
INSERT INTO platform_translations (platform_id, language_code, name) SELECT id, 'en', 'Arcade' FROM platforms WHERE igdb_id = 52 ON CONFLICT (platform_id, language_code) DO NOTHING;
INSERT INTO platforms (slug, igdb_id) VALUES ('pdp-11', 108) ON CONFLICT (igdb_id) DO NOTHING;
INSERT INTO platform_translations (platform_id, language_code, name) SELECT id, 'en', 'PDP-11' FROM platforms WHERE igdb_id = 108 ON CONFLICT (platform_id, language_code) DO NOTHING;
INSERT INTO platforms (slug, igdb_id) VALUES ('dec-gt40', 98) ON CONFLICT (igdb_id) DO NOTHING;
INSERT INTO platform_translations (platform_id, language_code, name) SELECT id, 'en', 'DEC GT40' FROM platforms WHERE igdb_id = 98 ON CONFLICT (platform_id, language_code) DO NOTHING;
INSERT INTO platforms (slug, igdb_id) VALUES ('pdp-10', 96) ON CONFLICT (igdb_id) DO NOTHING;
INSERT INTO platform_translations (platform_id, language_code, name) SELECT id, 'en', 'PDP-10' FROM platforms WHERE igdb_id = 96 ON CONFLICT (platform_id, language_code) DO NOTHING;

-- Supported languages
INSERT INTO supported_languages (code, name, native_name) VALUES ('en', 'English', 'English (US)') ON CONFLICT (code) DO NOTHING;

INSERT INTO games (slug, igdb_id, release_date, metascore, cover_image_url, background_image_url, last_synced_at) VALUES ('hunt-the-wumpus', 11498, '1973-03-31', NULL, 'https://images.igdb.com/igdb/image/upload/t_cover_big/co8c7p.jpg', 'https://images.igdb.com/igdb/image/upload/t_1080p/ar2zm0.jpg', NOW()) ON CONFLICT (igdb_id) DO NOTHING;
INSERT INTO game_translations (game_id, language_code, title, description) SELECT id, 'en', 'Hunt the Wumpus', 'Hunt the Wumpus is an early computer game, based on a simple hide and seek format featuring a mysterious monster (the Wumpus) that lurks deep inside a network of rooms. It was originally a text-based game written in BASIC and has since been ported to various programming languages and platforms including graphical versions.

The original text-based version of Hunt the Wumpus uses a command line text interface. A player of the game enters commands to move through the rooms or to shoot "crooked arrows" along a tunnel into one of the adjoining rooms. There are twenty rooms, each connecting to three others, arranged like the vertices of a dodecahedron or the faces of an icosahedron (which are identical in layout). Hazards include bottomless pits, super bats (which drop the player in a random location, a feature duplicated in later, commercially published adventure games, such as Zork I, Valley of the Minotaur, and Adventure), and the Wumpus itself. The Wumpus is described as having sucker feet (to escape the bottomless pits) and being too heavy for a super bat to lift. When the player has deduced from hints which chamber the Wumpus is in without entering the chamber, he fires an arrow into the Wumpus''s chamber to kill it. The player wins the game if he kills the Wumpus. However, firing the arrow into the wrong chamber startles the Wumpus, which may cause it to move to an adjacent room. The player loses if he or she is in the same room as the Wumpus (which then eats him or her) or a bottomless pit.' FROM games WHERE igdb_id = 11498 ON CONFLICT (game_id, language_code) DO NOTHING;
INSERT INTO game_genres (game_id, genre_id) SELECT g.id, ge.id FROM games g, genres ge WHERE g.igdb_id = 11498 AND ge.slug = 'puzzle' ON CONFLICT DO NOTHING;
INSERT INTO game_genres (game_id, genre_id) SELECT g.id, ge.id FROM games g, genres ge WHERE g.igdb_id = 11498 AND ge.slug = 'adventure' ON CONFLICT DO NOTHING;
INSERT INTO game_companies (game_id, company_id, role, is_primary) SELECT g.id, c.id, 'developer', false FROM games g, companies c WHERE g.igdb_id = 11498 AND c.slug = 'gregory-yob' ON CONFLICT DO NOTHING;
INSERT INTO game_companies (game_id, company_id, role, is_primary) SELECT g.id, c.id, 'developer', false FROM games g, companies c WHERE g.igdb_id = 11498 AND c.slug = 'kevin-kenney' ON CONFLICT DO NOTHING;
INSERT INTO game_platforms (game_id, platform_id) SELECT g.id, p.id FROM games g, platforms p WHERE g.igdb_id = 11498 AND p.igdb_id = 112 ON CONFLICT DO NOTHING;
INSERT INTO game_artwork (game_id, url, artwork_type, display_order, is_featured) SELECT id, 'https://images.igdb.com/igdb/image/upload/t_1080p/ar2zm0.jpg', 'promotional', 0, true FROM games WHERE igdb_id = 11498 ON CONFLICT DO NOTHING;
INSERT INTO game_artwork (game_id, url, artwork_type, display_order, is_featured) SELECT id, 'https://images.igdb.com/igdb/image/upload/t_1080p/ar2zlz.jpg', 'promotional', 1, false FROM games WHERE igdb_id = 11498 ON CONFLICT DO NOTHING;
INSERT INTO games (slug, igdb_id, release_date, metascore, cover_image_url, background_image_url, last_synced_at) VALUES ('empire--1', 11518, '1973-03-31', NULL, 'https://images.igdb.com/igdb/image/upload/t_cover_big/co6tci.jpg', NULL, NOW()) ON CONFLICT (igdb_id) DO NOTHING;
INSERT INTO game_translations (game_id, language_code, title, description) SELECT id, 'en', 'Empire', 'Empire is the name of a computer game written for the PLATO system in 1973. It''s significant for being quite probably the first networked multiplayer arena shooter-style game. It may also be the first networked multiplayer action game (although Maze War is another possibility for this distinction).' FROM games WHERE igdb_id = 11518 ON CONFLICT (game_id, language_code) DO NOTHING;
INSERT INTO game_genres (game_id, genre_id) SELECT g.id, ge.id FROM games g, genres ge WHERE g.igdb_id = 11518 AND ge.slug = 'shooter' ON CONFLICT DO NOTHING;
INSERT INTO game_genres (game_id, genre_id) SELECT g.id, ge.id FROM games g, genres ge WHERE g.igdb_id = 11518 AND ge.slug = 'real-time-strategy-rts' ON CONFLICT DO NOTHING;
INSERT INTO game_genres (game_id, genre_id) SELECT g.id, ge.id FROM games g, genres ge WHERE g.igdb_id = 11518 AND ge.slug = 'strategy' ON CONFLICT DO NOTHING;
INSERT INTO game_platforms (game_id, platform_id) SELECT g.id, p.id FROM games g, platforms p WHERE g.igdb_id = 11518 AND p.igdb_id = 110 ON CONFLICT DO NOTHING;
INSERT INTO games (slug, igdb_id, release_date, metascore, cover_image_url, background_image_url, last_synced_at) VALUES ('space-race', 11552, '1973-07-16', NULL, 'https://images.igdb.com/igdb/image/upload/t_cover_big/ei27ffod8ppuyhvlz5vr.jpg', 'https://images.igdb.com/igdb/image/upload/t_1080p/scp3ql.jpg', NOW()) ON CONFLICT (igdb_id) DO NOTHING;
INSERT INTO game_translations (game_id, language_code, title, description) SELECT id, 'en', 'Space Race', 'Space Race is the second arcade game created by Atari and was released in July, 1973. The two players each control a rocket ship; the object of the game is to make it from the bottom of the screen to the top, while avoiding obstacles such as asteroids. Score is kept electronically and the background consists of a simple starfield.' FROM games WHERE igdb_id = 11552 ON CONFLICT (game_id, language_code) DO NOTHING;
INSERT INTO game_genres (game_id, genre_id) SELECT g.id, ge.id FROM games g, genres ge WHERE g.igdb_id = 11552 AND ge.slug = 'racing' ON CONFLICT DO NOTHING;
INSERT INTO game_genres (game_id, genre_id) SELECT g.id, ge.id FROM games g, genres ge WHERE g.igdb_id = 11552 AND ge.slug = 'arcade' ON CONFLICT DO NOTHING;
INSERT INTO game_companies (game_id, company_id, role, is_primary) SELECT g.id, c.id, 'developer', false FROM games g, companies c WHERE g.igdb_id = 11552 AND c.slug = 'namco' ON CONFLICT DO NOTHING;
INSERT INTO game_companies (game_id, company_id, role, is_primary) SELECT g.id, c.id, 'developer', false FROM games g, companies c WHERE g.igdb_id = 11552 AND c.slug = 'atari' ON CONFLICT DO NOTHING;
INSERT INTO game_platforms (game_id, platform_id) SELECT g.id, p.id FROM games g, platforms p WHERE g.igdb_id = 11552 AND p.igdb_id = 52 ON CONFLICT DO NOTHING;
INSERT INTO game_screenshots (game_id, url, display_order, is_featured) SELECT id, 'https://images.igdb.com/igdb/image/upload/t_1080p/scp3ql.jpg', 0, true FROM games WHERE igdb_id = 11552 ON CONFLICT DO NOTHING;
INSERT INTO game_videos (game_id, url, thumbnail_url, title, video_type, display_order, is_featured) SELECT id, 'https://www.youtube.com/watch?v=0eBUoY6W8BY', 'https://img.youtube.com/vi/0eBUoY6W8BY/maxresdefault.jpg', 'Gameplay Video', 'trailer', 0, true FROM games WHERE igdb_id = 11552 ON CONFLICT DO NOTHING;
INSERT INTO game_languages (game_id, language_code, language_name, has_audio, has_subtitles, has_interface) SELECT id, 'en', 'English', false, false, true FROM games WHERE igdb_id = 11552 ON CONFLICT DO NOTHING;
INSERT INTO games (slug, igdb_id, release_date, metascore, cover_image_url, background_image_url, last_synced_at) VALUES ('moonlander', 9129, '1973-02-25', NULL, 'https://images.igdb.com/igdb/image/upload/t_cover_big/co6tcd.jpg', 'https://images.igdb.com/igdb/image/upload/t_1080p/scnfua.jpg', NOW()) ON CONFLICT (igdb_id) DO NOTHING;
INSERT INTO game_translations (game_id, language_code, title, description) SELECT id, 'en', 'Moonlander', 'Moonlander (also known as Lunar Lander) is an early computer game made for the DEC GT40 computer and is the first graphical game in the lunar landing simulator subgenre, as well as the first one in real-time.

It is notable for being the first video game with an Easter egg, a lone McDonalds on the moon''s surface that can be interacted with or destroyed.' FROM games WHERE igdb_id = 9129 ON CONFLICT (game_id, language_code) DO NOTHING;
INSERT INTO game_genres (game_id, genre_id) SELECT g.id, ge.id FROM games g, genres ge WHERE g.igdb_id = 9129 AND ge.slug = 'simulator' ON CONFLICT DO NOTHING;
INSERT INTO game_companies (game_id, company_id, role, is_primary) SELECT g.id, c.id, 'developer', false FROM games g, companies c WHERE g.igdb_id = 9129 AND c.slug = 'jack-burness' ON CONFLICT DO NOTHING;
INSERT INTO game_companies (game_id, company_id, role, is_primary) SELECT g.id, c.id, 'developer', false FROM games g, companies c WHERE g.igdb_id = 9129 AND c.slug = 'digital-equipment-corporation' ON CONFLICT DO NOTHING;
INSERT INTO game_platforms (game_id, platform_id) SELECT g.id, p.id FROM games g, platforms p WHERE g.igdb_id = 9129 AND p.igdb_id = 108 ON CONFLICT DO NOTHING;
INSERT INTO game_platforms (game_id, platform_id) SELECT g.id, p.id FROM games g, platforms p WHERE g.igdb_id = 9129 AND p.igdb_id = 98 ON CONFLICT DO NOTHING;
INSERT INTO game_platforms (game_id, platform_id) SELECT g.id, p.id FROM games g, platforms p WHERE g.igdb_id = 9129 AND p.igdb_id = 96 ON CONFLICT DO NOTHING;
INSERT INTO game_screenshots (game_id, url, display_order, is_featured) SELECT id, 'https://images.igdb.com/igdb/image/upload/t_1080p/scnfua.jpg', 0, true FROM games WHERE igdb_id = 9129 ON CONFLICT DO NOTHING;
INSERT INTO game_screenshots (game_id, url, display_order, is_featured) SELECT id, 'https://images.igdb.com/igdb/image/upload/t_1080p/scnfub.jpg', 1, false FROM games WHERE igdb_id = 9129 ON CONFLICT DO NOTHING;
INSERT INTO game_screenshots (game_id, url, display_order, is_featured) SELECT id, 'https://images.igdb.com/igdb/image/upload/t_1080p/scnfuc.jpg', 2, false FROM games WHERE igdb_id = 9129 ON CONFLICT DO NOTHING;
INSERT INTO game_languages (game_id, language_code, language_name, has_audio, has_subtitles, has_interface) SELECT id, 'en', 'English', false, false, true FROM games WHERE igdb_id = 9129 ON CONFLICT DO NOTHING;

COMMIT;
