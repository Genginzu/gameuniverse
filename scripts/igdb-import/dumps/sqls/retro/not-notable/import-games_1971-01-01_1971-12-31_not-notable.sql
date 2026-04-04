-- IGDB Game Dump Import
-- Generated: 2026-03-28T22:58:37.549Z
-- Games: 2

BEGIN;

-- Genres
INSERT INTO genres (slug) VALUES ('simulator') ON CONFLICT DO NOTHING;
INSERT INTO genre_translations (genre_id, language_code, name) SELECT id, 'en', 'Simulator' FROM genres WHERE slug = 'simulator' ON CONFLICT (genre_id, language_code) DO NOTHING;
INSERT INTO genres (slug) VALUES ('sport') ON CONFLICT DO NOTHING;
INSERT INTO genre_translations (genre_id, language_code, name) SELECT id, 'en', 'Sport' FROM genres WHERE slug = 'sport' ON CONFLICT (genre_id, language_code) DO NOTHING;

-- Companies
INSERT INTO companies (name, slug, company_type) VALUES ('Michael Irrgang', 'michael-irrgang', 'developer') ON CONFLICT DO NOTHING;

-- Platforms
INSERT INTO platforms (slug, igdb_id) VALUES ('imlac-pds-1', 111) ON CONFLICT DO NOTHING;
INSERT INTO platform_translations (platform_id, language_code, name) SELECT id, 'en', 'Imlac PDS-1' FROM platforms WHERE igdb_id = 111 ON CONFLICT (platform_id, language_code) DO NOTHING;
INSERT INTO platforms (slug, igdb_id) VALUES ('pdp-10', 96) ON CONFLICT DO NOTHING;
INSERT INTO platform_translations (platform_id, language_code, name) SELECT id, 'en', 'PDP-10' FROM platforms WHERE igdb_id = 96 ON CONFLICT (platform_id, language_code) DO NOTHING;

INSERT INTO games (slug, igdb_id, release_date, metascore, cover_image_url, background_image_url, last_synced_at) VALUES ('freeway-crossing-program', 351414, '1971-12-31', NULL, 'https://images.igdb.com/igdb/image/upload/t_cover_big/coa2eb.jpg', 'https://images.igdb.com/igdb/image/upload/t_1080p/scxqld.jpg', NOW()) ON CONFLICT DO NOTHING;
INSERT INTO game_translations (game_id, language_code, title, description) SELECT id, 'en', 'Freeway Crossing Program', 'A simple reaction test game designed by student Michael Irrgang for the IMLAC PDS-1 in 1971. It was made for use in a psychological study at the University of Washington by Dr. Earl Hunt.' FROM games WHERE igdb_id = 351414 ON CONFLICT (game_id, language_code) DO NOTHING;
INSERT INTO game_genres (game_id, genre_id) SELECT g.id, ge.id FROM games g, genres ge WHERE g.igdb_id = 351414 AND ge.slug = 'simulator' ON CONFLICT DO NOTHING;
INSERT INTO game_companies (game_id, company_id, role, is_primary) SELECT g.id, c.id, 'developer', false FROM games g, companies c WHERE g.igdb_id = 351414 AND c.slug = 'michael-irrgang' ON CONFLICT DO NOTHING;
INSERT INTO game_platforms (game_id, platform_id) SELECT g.id, p.id FROM games g, platforms p WHERE g.igdb_id = 351414 AND p.igdb_id = 111 ON CONFLICT DO NOTHING;
INSERT INTO game_screenshots (game_id, url, display_order, is_featured) SELECT id, 'https://images.igdb.com/igdb/image/upload/t_1080p/scxqld.jpg', 0, true FROM games WHERE igdb_id = 351414 ON CONFLICT DO NOTHING;
INSERT INTO game_videos (game_id, url, thumbnail_url, title, video_type, display_order, is_featured) SELECT id, 'https://www.youtube.com/watch?v=fj6-XjxbYOs', 'https://img.youtube.com/vi/fj6-XjxbYOs/maxresdefault.jpg', 'Gameplay Video', 'trailer', 0, true FROM games WHERE igdb_id = 351414 ON CONFLICT DO NOTHING;
INSERT INTO games (slug, igdb_id, release_date, metascore, cover_image_url, background_image_url, last_synced_at) VALUES ('baseball--3', 11412, '1971-12-31', NULL, NULL, NULL, NOW()) ON CONFLICT DO NOTHING;
INSERT INTO game_translations (game_id, language_code, title, description) SELECT id, 'en', 'Baseball', 'Baseball is a baseball sports game that was created on a PDP-10 mainframe computer at Pomona College in 1971 by student Don Daglow. The game (actually spelled BASBAL due to the 6-character file name length restrictions) continued to be enhanced periodically through 1976. The program is documented at the Baseball Hall of Fame in Cooperstown, New York. It was the first interactive Baseball simulation game, allowing players to manage the game as it unfolded. At the start of each inning the batter''s and pitcher''s names were listed, and the player in the field could enter a number to choose whether to pitch to the batter, walk him intentionally, warm up a reliever or change the pitcher. In a later version the options for a pitchout and for a visit to the mound were added. The player controlling the batter could choose to put in a pinch hitter. If runners were on base the player could direct them to try to steal. Once the players had entered the desired orders, the game would print out the result of the at-bat, update the number of outs, the score and the location of the runners, and print the name of the next batter. If a game was still a tie after nine innings, extra innings would be played in accordance with baseball rules.' FROM games WHERE igdb_id = 11412 ON CONFLICT (game_id, language_code) DO NOTHING;
INSERT INTO game_genres (game_id, genre_id) SELECT g.id, ge.id FROM games g, genres ge WHERE g.igdb_id = 11412 AND ge.slug = 'sport' ON CONFLICT DO NOTHING;
INSERT INTO game_platforms (game_id, platform_id) SELECT g.id, p.id FROM games g, platforms p WHERE g.igdb_id = 11412 AND p.igdb_id = 96 ON CONFLICT DO NOTHING;

COMMIT;
