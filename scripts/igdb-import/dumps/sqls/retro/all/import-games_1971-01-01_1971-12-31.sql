-- IGDB Game Dump Import
-- Generated: 2026-03-28T22:56:04.027Z
-- Games: 6

BEGIN;

-- Genres
INSERT INTO genres (slug) VALUES ('shooter') ON CONFLICT DO NOTHING;
INSERT INTO genre_translations (genre_id, language_code, name) SELECT id, 'en', 'Shooter' FROM genres WHERE slug = 'shooter' ON CONFLICT (genre_id, language_code) DO NOTHING;
INSERT INTO genres (slug) VALUES ('arcade') ON CONFLICT DO NOTHING;
INSERT INTO genre_translations (genre_id, language_code, name) SELECT id, 'en', 'Arcade' FROM genres WHERE slug = 'arcade' ON CONFLICT (genre_id, language_code) DO NOTHING;
INSERT INTO genres (slug) VALUES ('simulator') ON CONFLICT DO NOTHING;
INSERT INTO genre_translations (genre_id, language_code, name) SELECT id, 'en', 'Simulator' FROM genres WHERE slug = 'simulator' ON CONFLICT (genre_id, language_code) DO NOTHING;
INSERT INTO genres (slug) VALUES ('strategy') ON CONFLICT DO NOTHING;
INSERT INTO genre_translations (genre_id, language_code, name) SELECT id, 'en', 'Strategy' FROM genres WHERE slug = 'strategy' ON CONFLICT (genre_id, language_code) DO NOTHING;
INSERT INTO genres (slug) VALUES ('adventure') ON CONFLICT DO NOTHING;
INSERT INTO genre_translations (genre_id, language_code, name) SELECT id, 'en', 'Adventure' FROM genres WHERE slug = 'adventure' ON CONFLICT (genre_id, language_code) DO NOTHING;
INSERT INTO genres (slug) VALUES ('sport') ON CONFLICT DO NOTHING;
INSERT INTO genre_translations (genre_id, language_code, name) SELECT id, 'en', 'Sport' FROM genres WHERE slug = 'sport' ON CONFLICT (genre_id, language_code) DO NOTHING;
INSERT INTO genres (slug) VALUES ('turn-based-strategy-tbs') ON CONFLICT DO NOTHING;
INSERT INTO genre_translations (genre_id, language_code, name) SELECT id, 'en', 'Turn-based strategy (TBS)' FROM genres WHERE slug = 'turn-based-strategy-tbs' ON CONFLICT (genre_id, language_code) DO NOTHING;

-- Companies
INSERT INTO companies (name, slug, company_type) VALUES ('Nutting Associates', 'nutting-associates', 'developer') ON CONFLICT DO NOTHING;
INSERT INTO companies (name, slug, company_type) VALUES ('Atari', 'atari', 'developer') ON CONFLICT DO NOTHING;
INSERT INTO companies (name, slug, company_type) VALUES ('Michael Irrgang', 'michael-irrgang', 'developer') ON CONFLICT DO NOTHING;
INSERT INTO companies (name, slug, company_type) VALUES ('Computer Recreations, Inc.', 'computer-recreations-inc', 'developer') ON CONFLICT DO NOTHING;
INSERT INTO companies (name, slug, company_type) VALUES ('MECC', 'mecc', 'developer') ON CONFLICT DO NOTHING;
INSERT INTO companies (name, slug, company_type) VALUES ('Mike Mayfield', 'mike-mayfield', 'developer') ON CONFLICT DO NOTHING;

-- Platforms
INSERT INTO platforms (slug, igdb_id) VALUES ('arcade', 52) ON CONFLICT DO NOTHING;
INSERT INTO platform_translations (platform_id, language_code, name) SELECT id, 'en', 'Arcade' FROM platforms WHERE igdb_id = 52 ON CONFLICT (platform_id, language_code) DO NOTHING;
INSERT INTO platforms (slug, igdb_id) VALUES ('imlac-pds-1', 111) ON CONFLICT DO NOTHING;
INSERT INTO platform_translations (platform_id, language_code, name) SELECT id, 'en', 'Imlac PDS-1' FROM platforms WHERE igdb_id = 111 ON CONFLICT (platform_id, language_code) DO NOTHING;
INSERT INTO platforms (slug, igdb_id) VALUES ('pdp-11', 108) ON CONFLICT DO NOTHING;
INSERT INTO platform_translations (platform_id, language_code, name) SELECT id, 'en', 'PDP-11' FROM platforms WHERE igdb_id = 108 ON CONFLICT (platform_id, language_code) DO NOTHING;
INSERT INTO platforms (slug, igdb_id) VALUES ('hp-2100', 104) ON CONFLICT DO NOTHING;
INSERT INTO platform_translations (platform_id, language_code, name) SELECT id, 'en', 'HP 2100' FROM platforms WHERE igdb_id = 104 ON CONFLICT (platform_id, language_code) DO NOTHING;
INSERT INTO platforms (slug, igdb_id) VALUES ('cdc-cyber-70', 109) ON CONFLICT DO NOTHING;
INSERT INTO platform_translations (platform_id, language_code, name) SELECT id, 'en', 'CDC Cyber 70' FROM platforms WHERE igdb_id = 109 ON CONFLICT (platform_id, language_code) DO NOTHING;
INSERT INTO platforms (slug, igdb_id) VALUES ('pdp-10', 96) ON CONFLICT DO NOTHING;
INSERT INTO platform_translations (platform_id, language_code, name) SELECT id, 'en', 'PDP-10' FROM platforms WHERE igdb_id = 96 ON CONFLICT (platform_id, language_code) DO NOTHING;
INSERT INTO platforms (slug, igdb_id) VALUES ('sol-20', 237) ON CONFLICT DO NOTHING;
INSERT INTO platform_translations (platform_id, language_code, name) SELECT id, 'en', 'Sol-20' FROM platforms WHERE igdb_id = 237 ON CONFLICT (platform_id, language_code) DO NOTHING;
INSERT INTO platforms (slug, igdb_id) VALUES ('legacy-computer', 409) ON CONFLICT DO NOTHING;
INSERT INTO platform_translations (platform_id, language_code, name) SELECT id, 'en', 'Legacy Computer' FROM platforms WHERE igdb_id = 409 ON CONFLICT (platform_id, language_code) DO NOTHING;
INSERT INTO platforms (slug, igdb_id) VALUES ('sds-sigma-7', 106) ON CONFLICT DO NOTHING;
INSERT INTO platform_translations (platform_id, language_code, name) SELECT id, 'en', 'SDS Sigma 7' FROM platforms WHERE igdb_id = 106 ON CONFLICT (platform_id, language_code) DO NOTHING;

-- Supported languages
INSERT INTO supported_languages (code, name, native_name) VALUES ('en', 'English', 'English (US)') ON CONFLICT (code) DO NOTHING;

INSERT INTO games (slug, igdb_id, release_date, metascore, cover_image_url, background_image_url, last_synced_at) VALUES ('computer-space', 11245, '1971-11-01', NULL, 'https://images.igdb.com/igdb/image/upload/t_cover_big/co6s4s.jpg', 'https://images.igdb.com/igdb/image/upload/t_1080p/ar46jg.jpg', NOW()) ON CONFLICT DO NOTHING;
INSERT INTO game_translations (game_id, language_code, title, description) SELECT id, 'en', 'Computer Space', 'Computer Space is a video arcade game released in 1971 by Nutting Associates. Created by Nolan Bushnell and Ted Dabney, who would both later found Atari, Inc., it is generally accepted that it was the world''s first commercially sold coin-operated video game of any kind, predating the Magnavox Odyssey''s release by six months, and Atari''s Pong by one year. It was first location tested at The Dutch Goose in August 1971, then debuted at the MOA show on October 15, 1971, and then officially released in November 1971. Though not commercially sold, the coin operated minicomputer-driven Galaxy Game appeared around the same time, located solely at Stanford University.' FROM games WHERE igdb_id = 11245 ON CONFLICT (game_id, language_code) DO NOTHING;
INSERT INTO game_genres (game_id, genre_id) SELECT g.id, ge.id FROM games g, genres ge WHERE g.igdb_id = 11245 AND ge.slug = 'shooter' ON CONFLICT DO NOTHING;
INSERT INTO game_genres (game_id, genre_id) SELECT g.id, ge.id FROM games g, genres ge WHERE g.igdb_id = 11245 AND ge.slug = 'arcade' ON CONFLICT DO NOTHING;
INSERT INTO game_companies (game_id, company_id, role, is_primary) SELECT g.id, c.id, 'developer', false FROM games g, companies c WHERE g.igdb_id = 11245 AND c.slug = 'nutting-associates' ON CONFLICT DO NOTHING;
INSERT INTO game_companies (game_id, company_id, role, is_primary) SELECT g.id, c.id, 'developer', false FROM games g, companies c WHERE g.igdb_id = 11245 AND c.slug = 'atari' ON CONFLICT DO NOTHING;
INSERT INTO game_platforms (game_id, platform_id) SELECT g.id, p.id FROM games g, platforms p WHERE g.igdb_id = 11245 AND p.igdb_id = 52 ON CONFLICT DO NOTHING;
INSERT INTO game_screenshots (game_id, url, display_order, is_featured) SELECT id, 'https://images.igdb.com/igdb/image/upload/t_1080p/ijtjwwpfttqqustksrgx.jpg', 0, true FROM games WHERE igdb_id = 11245 ON CONFLICT DO NOTHING;
INSERT INTO game_artwork (game_id, url, artwork_type, display_order, is_featured) SELECT id, 'https://images.igdb.com/igdb/image/upload/t_1080p/ar46jg.jpg', 'promotional', 0, true FROM games WHERE igdb_id = 11245 ON CONFLICT DO NOTHING;
INSERT INTO game_videos (game_id, url, thumbnail_url, title, video_type, display_order, is_featured) SELECT id, 'https://www.youtube.com/watch?v=j-KRmLy_Ig8', 'https://img.youtube.com/vi/j-KRmLy_Ig8/maxresdefault.jpg', 'Gameplay video', 'trailer', 0, true FROM games WHERE igdb_id = 11245 ON CONFLICT DO NOTHING;
INSERT INTO games (slug, igdb_id, release_date, metascore, cover_image_url, background_image_url, last_synced_at) VALUES ('freeway-crossing-program', 351414, '1971-12-31', NULL, 'https://images.igdb.com/igdb/image/upload/t_cover_big/coa2eb.jpg', 'https://images.igdb.com/igdb/image/upload/t_1080p/scxqld.jpg', NOW()) ON CONFLICT DO NOTHING;
INSERT INTO game_translations (game_id, language_code, title, description) SELECT id, 'en', 'Freeway Crossing Program', 'A simple reaction test game designed by student Michael Irrgang for the IMLAC PDS-1 in 1971. It was made for use in a psychological study at the University of Washington by Dr. Earl Hunt.' FROM games WHERE igdb_id = 351414 ON CONFLICT (game_id, language_code) DO NOTHING;
INSERT INTO game_genres (game_id, genre_id) SELECT g.id, ge.id FROM games g, genres ge WHERE g.igdb_id = 351414 AND ge.slug = 'simulator' ON CONFLICT DO NOTHING;
INSERT INTO game_companies (game_id, company_id, role, is_primary) SELECT g.id, c.id, 'developer', false FROM games g, companies c WHERE g.igdb_id = 351414 AND c.slug = 'michael-irrgang' ON CONFLICT DO NOTHING;
INSERT INTO game_platforms (game_id, platform_id) SELECT g.id, p.id FROM games g, platforms p WHERE g.igdb_id = 351414 AND p.igdb_id = 111 ON CONFLICT DO NOTHING;
INSERT INTO game_screenshots (game_id, url, display_order, is_featured) SELECT id, 'https://images.igdb.com/igdb/image/upload/t_1080p/scxqld.jpg', 0, true FROM games WHERE igdb_id = 351414 ON CONFLICT DO NOTHING;
INSERT INTO game_videos (game_id, url, thumbnail_url, title, video_type, display_order, is_featured) SELECT id, 'https://www.youtube.com/watch?v=fj6-XjxbYOs', 'https://img.youtube.com/vi/fj6-XjxbYOs/maxresdefault.jpg', 'Gameplay Video', 'trailer', 0, true FROM games WHERE igdb_id = 351414 ON CONFLICT DO NOTHING;
INSERT INTO games (slug, igdb_id, release_date, metascore, cover_image_url, background_image_url, last_synced_at) VALUES ('galaxy-game', 11396, '1971-09-01', NULL, 'https://images.igdb.com/igdb/image/upload/t_cover_big/co6shk.jpg', 'https://images.igdb.com/igdb/image/upload/t_1080p/vvjvaguq1fnqrqysxmb7.jpg', NOW()) ON CONFLICT DO NOTHING;
INSERT INTO game_translations (game_id, language_code, title, description) SELECT id, 'en', 'Galaxy Game', 'Galaxy Game is one of the earliest known coin-operated computer/video games. It was installed at the Tresidder Union at Stanford University in September, 1971, two months before the official release of Computer Space, the first mass-produced video game. Only one unit was built initially, although the game later included several consoles allowing users to play against each other.' FROM games WHERE igdb_id = 11396 ON CONFLICT (game_id, language_code) DO NOTHING;
INSERT INTO game_genres (game_id, genre_id) SELECT g.id, ge.id FROM games g, genres ge WHERE g.igdb_id = 11396 AND ge.slug = 'shooter' ON CONFLICT DO NOTHING;
INSERT INTO game_companies (game_id, company_id, role, is_primary) SELECT g.id, c.id, 'developer', false FROM games g, companies c WHERE g.igdb_id = 11396 AND c.slug = 'computer-recreations-inc' ON CONFLICT DO NOTHING;
INSERT INTO game_platforms (game_id, platform_id) SELECT g.id, p.id FROM games g, platforms p WHERE g.igdb_id = 11396 AND p.igdb_id = 52 ON CONFLICT DO NOTHING;
INSERT INTO game_platforms (game_id, platform_id) SELECT g.id, p.id FROM games g, platforms p WHERE g.igdb_id = 11396 AND p.igdb_id = 108 ON CONFLICT DO NOTHING;
INSERT INTO game_screenshots (game_id, url, display_order, is_featured) SELECT id, 'https://images.igdb.com/igdb/image/upload/t_1080p/vvjvaguq1fnqrqysxmb7.jpg', 0, true FROM games WHERE igdb_id = 11396 ON CONFLICT DO NOTHING;
INSERT INTO games (slug, igdb_id, release_date, metascore, cover_image_url, background_image_url, last_synced_at) VALUES ('the-oregon-trail', 11325, '1971-12-03', NULL, 'https://images.igdb.com/igdb/image/upload/t_cover_big/co6k5q.jpg', 'https://images.igdb.com/igdb/image/upload/t_1080p/scv9o4.jpg', NOW()) ON CONFLICT DO NOTHING;
INSERT INTO game_translations (game_id, language_code, title, description) SELECT id, 'en', 'The Oregon Trail', 'The Oregon Trail is a computer game originally developed by Don Rawitsch, Bill Heinemann, and Paul Dillenberger in 1971 and produced by the Minnesota Educational Computing Consortium (MECC) in 1974. The original game was designed to teach school children about the realities of 19th century pioneer life on the Oregon Trail. The player assumes the role of a wagon leader guiding his or her party of settlers from Independence, Missouri, to Oregon''s Willamette Valley on the Oregon Trail via a covered wagon in 1848.' FROM games WHERE igdb_id = 11325 ON CONFLICT (game_id, language_code) DO NOTHING;
INSERT INTO game_genres (game_id, genre_id) SELECT g.id, ge.id FROM games g, genres ge WHERE g.igdb_id = 11325 AND ge.slug = 'simulator' ON CONFLICT DO NOTHING;
INSERT INTO game_genres (game_id, genre_id) SELECT g.id, ge.id FROM games g, genres ge WHERE g.igdb_id = 11325 AND ge.slug = 'strategy' ON CONFLICT DO NOTHING;
INSERT INTO game_genres (game_id, genre_id) SELECT g.id, ge.id FROM games g, genres ge WHERE g.igdb_id = 11325 AND ge.slug = 'adventure' ON CONFLICT DO NOTHING;
INSERT INTO game_companies (game_id, company_id, role, is_primary) SELECT g.id, c.id, 'developer', false FROM games g, companies c WHERE g.igdb_id = 11325 AND c.slug = 'mecc' ON CONFLICT DO NOTHING;
INSERT INTO game_platforms (game_id, platform_id) SELECT g.id, p.id FROM games g, platforms p WHERE g.igdb_id = 11325 AND p.igdb_id = 104 ON CONFLICT DO NOTHING;
INSERT INTO game_platforms (game_id, platform_id) SELECT g.id, p.id FROM games g, platforms p WHERE g.igdb_id = 11325 AND p.igdb_id = 109 ON CONFLICT DO NOTHING;
INSERT INTO game_screenshots (game_id, url, display_order, is_featured) SELECT id, 'https://images.igdb.com/igdb/image/upload/t_1080p/scv9o4.jpg', 0, true FROM games WHERE igdb_id = 11325 ON CONFLICT DO NOTHING;
INSERT INTO game_videos (game_id, url, thumbnail_url, title, video_type, display_order, is_featured) SELECT id, 'https://www.youtube.com/watch?v=g8B-JjzbthI', 'https://img.youtube.com/vi/g8B-JjzbthI/maxresdefault.jpg', 'Teaser', 'trailer', 0, true FROM games WHERE igdb_id = 11325 ON CONFLICT DO NOTHING;
INSERT INTO games (slug, igdb_id, release_date, metascore, cover_image_url, background_image_url, last_synced_at) VALUES ('baseball--3', 11412, '1971-12-31', NULL, NULL, NULL, NOW()) ON CONFLICT DO NOTHING;
INSERT INTO game_translations (game_id, language_code, title, description) SELECT id, 'en', 'Baseball', 'Baseball is a baseball sports game that was created on a PDP-10 mainframe computer at Pomona College in 1971 by student Don Daglow. The game (actually spelled BASBAL due to the 6-character file name length restrictions) continued to be enhanced periodically through 1976. The program is documented at the Baseball Hall of Fame in Cooperstown, New York. It was the first interactive Baseball simulation game, allowing players to manage the game as it unfolded. At the start of each inning the batter''s and pitcher''s names were listed, and the player in the field could enter a number to choose whether to pitch to the batter, walk him intentionally, warm up a reliever or change the pitcher. In a later version the options for a pitchout and for a visit to the mound were added. The player controlling the batter could choose to put in a pinch hitter. If runners were on base the player could direct them to try to steal. Once the players had entered the desired orders, the game would print out the result of the at-bat, update the number of outs, the score and the location of the runners, and print the name of the next batter. If a game was still a tie after nine innings, extra innings would be played in accordance with baseball rules.' FROM games WHERE igdb_id = 11412 ON CONFLICT (game_id, language_code) DO NOTHING;
INSERT INTO game_genres (game_id, genre_id) SELECT g.id, ge.id FROM games g, genres ge WHERE g.igdb_id = 11412 AND ge.slug = 'sport' ON CONFLICT DO NOTHING;
INSERT INTO game_platforms (game_id, platform_id) SELECT g.id, p.id FROM games g, platforms p WHERE g.igdb_id = 11412 AND p.igdb_id = 96 ON CONFLICT DO NOTHING;
INSERT INTO games (slug, igdb_id, release_date, metascore, cover_image_url, background_image_url, last_synced_at) VALUES ('star-trek--1', 11485, '1971-07-01', 50, 'https://images.igdb.com/igdb/image/upload/t_cover_big/co6t8s.jpg', 'https://images.igdb.com/igdb/image/upload/t_1080p/v5mnvubblilwfvt2y1h5.jpg', NOW()) ON CONFLICT DO NOTHING;
INSERT INTO game_translations (game_id, language_code, title, description) SELECT id, 'en', 'Star Trek', 'Star Trek is a text-based strategy video game based on the Star Trek television series (1966–69) and originally released in 1971. In the game, the player commands the USS Enterprise on a mission to hunt down and destroy an invading fleet of Klingon warships. The player travels through the 64 quadrants of the galaxy to attack enemy ships with phasers and photon torpedoes in turn-based battles and refuel at starbases. The goal is to eliminate all enemies within a random time limit.' FROM games WHERE igdb_id = 11485 ON CONFLICT (game_id, language_code) DO NOTHING;
INSERT INTO game_genres (game_id, genre_id) SELECT g.id, ge.id FROM games g, genres ge WHERE g.igdb_id = 11485 AND ge.slug = 'strategy' ON CONFLICT DO NOTHING;
INSERT INTO game_genres (game_id, genre_id) SELECT g.id, ge.id FROM games g, genres ge WHERE g.igdb_id = 11485 AND ge.slug = 'turn-based-strategy-tbs' ON CONFLICT DO NOTHING;
INSERT INTO game_companies (game_id, company_id, role, is_primary) SELECT g.id, c.id, 'developer', false FROM games g, companies c WHERE g.igdb_id = 11485 AND c.slug = 'mike-mayfield' ON CONFLICT DO NOTHING;
INSERT INTO game_platforms (game_id, platform_id) SELECT g.id, p.id FROM games g, platforms p WHERE g.igdb_id = 11485 AND p.igdb_id = 237 ON CONFLICT DO NOTHING;
INSERT INTO game_platforms (game_id, platform_id) SELECT g.id, p.id FROM games g, platforms p WHERE g.igdb_id = 11485 AND p.igdb_id = 409 ON CONFLICT DO NOTHING;
INSERT INTO game_platforms (game_id, platform_id) SELECT g.id, p.id FROM games g, platforms p WHERE g.igdb_id = 11485 AND p.igdb_id = 104 ON CONFLICT DO NOTHING;
INSERT INTO game_platforms (game_id, platform_id) SELECT g.id, p.id FROM games g, platforms p WHERE g.igdb_id = 11485 AND p.igdb_id = 106 ON CONFLICT DO NOTHING;
INSERT INTO game_screenshots (game_id, url, display_order, is_featured) SELECT id, 'https://images.igdb.com/igdb/image/upload/t_1080p/v5mnvubblilwfvt2y1h5.jpg', 0, true FROM games WHERE igdb_id = 11485 ON CONFLICT DO NOTHING;
INSERT INTO game_videos (game_id, url, thumbnail_url, title, video_type, display_order, is_featured) SELECT id, 'https://www.youtube.com/watch?v=e6f9_9kzuzk', 'https://img.youtube.com/vi/e6f9_9kzuzk/maxresdefault.jpg', 'Gameplay video', 'trailer', 0, true FROM games WHERE igdb_id = 11485 ON CONFLICT DO NOTHING;
INSERT INTO game_languages (game_id, language_code, language_name, has_audio, has_subtitles, has_interface) SELECT id, 'en', 'English', false, false, true FROM games WHERE igdb_id = 11485 ON CONFLICT DO NOTHING;

COMMIT;
