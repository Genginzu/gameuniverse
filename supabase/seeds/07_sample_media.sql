-- Seeds pour les médias des jeux d'exemple
-- Screenshots, artwork et vidéos pour les jeux de démonstration

-- Mise à jour des jeux avec les cover images
UPDATE games SET cover_image_url = '/images/witcher3-cover.jpg' WHERE slug = 'the-witcher-3';
UPDATE games SET cover_image_url = '/images/cyberpunk-cover.jpg' WHERE slug = 'cyberpunk-2077';
UPDATE games SET cover_image_url = '/images/minecraft-cover.jpg' WHERE slug = 'minecraft';
UPDATE games SET cover_image_url = '/images/gtav-cover.jpg' WHERE slug = 'grand-theft-auto-v';
UPDATE games SET cover_image_url = '/images/rdr2-cover.jpg' WHERE slug = 'red-dead-redemption-2';
UPDATE games SET cover_image_url = '/images/eldenring-cover.jpg' WHERE slug = 'elden-ring';
UPDATE games SET cover_image_url = '/images/gow-cover.jpg' WHERE slug = 'god-of-war';
UPDATE games SET cover_image_url = '/images/hzd-cover.jpg' WHERE slug = 'horizon-zero-dawn';

-- Screenshots pour The Witcher 3
INSERT INTO game_screenshots (game_id, url, alt_text, caption, display_order, is_featured) VALUES
('660e8400-e29b-41d4-a716-446655440001', '/images/witcher3-screenshot-1.jpg', 'Geralt dans les marais de Velen', 'Exploration des vastes marais de Velen', 1, true),
('660e8400-e29b-41d4-a716-446655440001', '/images/witcher3-screenshot-2.jpg', 'Combat contre un griffon', 'Combat épique contre un griffon royal', 2, false),
('660e8400-e29b-41d4-a716-446655440001', '/images/witcher3-screenshot-3.jpg', 'Novigrad la nuit', 'Les rues animées de Novigrad sous les étoiles', 3, false);

-- Artwork pour The Witcher 3
INSERT INTO game_artwork (game_id, url, alt_text, caption, artwork_type, display_order, is_featured) VALUES
('660e8400-e29b-41d4-a716-446655440001', '/images/witcher3-artwork-1.jpg', 'Geralt et Ciri', 'Art conceptuel de Geralt et Ciri', 'concept', 1, true),
('660e8400-e29b-41d4-a716-446655440001', '/images/witcher3-artwork-2.jpg', 'Paysage de Skellige', 'Les îles mystiques de Skellige', 'concept', 2, false);

-- Vidéos pour The Witcher 3
INSERT INTO game_videos (game_id, url, thumbnail_url, title, description, video_type, duration_seconds, display_order, is_featured) VALUES
('660e8400-e29b-41d4-a716-446655440001', '/videos/witcher3-trailer.mp4', '/images/witcher3-trailer-thumb.jpg', 'Bande-annonce officielle', 'La bande-annonce de lancement de The Witcher 3', 'trailer', 180, 1, true),
('660e8400-e29b-41d4-a716-446655440001', '/videos/witcher3-gameplay.mp4', '/images/witcher3-gameplay-thumb.jpg', 'Gameplay - Combat', 'Démonstration du système de combat', 'gameplay', 300, 2, false);

-- Screenshots pour Cyberpunk 2077
INSERT INTO game_screenshots (game_id, url, alt_text, caption, display_order, is_featured) VALUES
('660e8400-e29b-41d4-a716-446655440002', '/images/cyberpunk-screenshot-1.jpg', 'Night City vue panoramique', 'Vue panoramique de Night City illuminée', 1, true),
('660e8400-e29b-41d4-a716-446655440002', '/images/cyberpunk-screenshot-2.jpg', 'V dans les rues', 'Le protagoniste V explorant les rues de Night City', 2, false),
('660e8400-e29b-41d4-a716-446655440002', '/images/cyberpunk-screenshot-3.jpg', 'Combat cybernétique', 'Combat avec des améliorations cybernétiques', 3, false);

-- Artwork pour Cyberpunk 2077
INSERT INTO game_artwork (game_id, url, alt_text, caption, artwork_type, display_order, is_featured) VALUES
('660e8400-e29b-41d4-a716-446655440002', '/images/cyberpunk-artwork-1.jpg', 'V et Johnny Silverhand', 'Art promotionnel de V et Johnny Silverhand', 'promotional', 1, true),
('660e8400-e29b-41d4-a716-446655440002', '/images/cyberpunk-artwork-2.jpg', 'Skyline de Night City', 'Vue artistique du skyline futuriste', 'concept', 2, false);

-- Vidéos pour Cyberpunk 2077
INSERT INTO game_videos (game_id, url, thumbnail_url, title, description, video_type, duration_seconds, display_order, is_featured) VALUES
('660e8400-e29b-41d4-a716-446655440002', '/videos/cyberpunk-trailer.mp4', '/images/cyberpunk-trailer-thumb.jpg', 'Trailer de lancement', 'Bande-annonce officielle de lancement', 'trailer', 240, 1, true),
('660e8400-e29b-41d4-a716-446655440002', '/videos/cyberpunk-gameplay.mp4', '/images/cyberpunk-gameplay-thumb.jpg', 'Gameplay - Exploration', 'Exploration de Night City', 'gameplay', 420, 2, false);

-- Screenshots pour Minecraft
INSERT INTO game_screenshots (game_id, url, alt_text, caption, display_order, is_featured) VALUES
('660e8400-e29b-41d4-a716-446655440003', '/images/minecraft-screenshot-1.jpg', 'Construction massive', 'Une construction impressionnante en mode créatif', 1, true),
('660e8400-e29b-41d4-a716-446655440003', '/images/minecraft-screenshot-2.jpg', 'Paysage généré', 'Un magnifique paysage généré procéduralement', 2, false),
('660e8400-e29b-41d4-a716-446655440003', '/images/minecraft-screenshot-3.jpg', 'Mine souterraine', 'Exploration des profondeurs souterraines', 3, false);

-- Artwork pour Minecraft
INSERT INTO game_artwork (game_id, url, alt_text, caption, artwork_type, display_order, is_featured) VALUES
('660e8400-e29b-41d4-a716-446655440003', '/images/minecraft-artwork-1.jpg', 'Steve et les créatures', 'Art officiel de Steve avec les créatures du jeu', 'promotional', 1, true),
('660e8400-e29b-41d4-a716-446655440003', '/images/minecraft-artwork-2.jpg', 'Monde cubique', 'Représentation artistique du monde cubique', 'concept', 2, false);

-- Vidéos pour Minecraft
INSERT INTO game_videos (game_id, url, thumbnail_url, title, description, video_type, duration_seconds, display_order, is_featured) VALUES
('660e8400-e29b-41d4-a716-446655440003', '/videos/minecraft-trailer.mp4', '/images/minecraft-trailer-thumb.jpg', 'Trailer officiel', 'Présentation des possibilités infinies', 'trailer', 120, 1, true),
('660e8400-e29b-41d4-a716-446655440003', '/videos/minecraft-gameplay.mp4', '/images/minecraft-gameplay-thumb.jpg', 'Gameplay - Construction', 'Démonstration de construction créative', 'gameplay', 600, 2, false);

-- Screenshots pour Grand Theft Auto V
INSERT INTO game_screenshots (game_id, url, alt_text, caption, display_order, is_featured) VALUES
('660e8400-e29b-41d4-a716-446655440004', '/images/gtav-screenshot-1.jpg', 'Los Santos vue aérienne', 'Vue aérienne de la ville de Los Santos', 1, true),
('660e8400-e29b-41d4-a716-446655440004', '/images/gtav-screenshot-2.jpg', 'Poursuite en voiture', 'Course-poursuite spectaculaire dans les rues', 2, false),
('660e8400-e29b-41d4-a716-446655440004', '/images/gtav-screenshot-3.jpg', 'Les trois protagonistes', 'Michael, Franklin et Trevor ensemble', 3, false);

-- Artwork pour Grand Theft Auto V
INSERT INTO game_artwork (game_id, url, alt_text, caption, artwork_type, display_order, is_featured) VALUES
('660e8400-e29b-41d4-a716-446655440004', '/images/gtav-artwork-1.jpg', 'Art promotionnel principal', 'L''artwork iconique de GTA V', 'promotional', 1, true),
('660e8400-e29b-41d4-a716-446655440004', '/images/gtav-artwork-2.jpg', 'Skyline de Los Santos', 'Vue artistique de la skyline', 'concept', 2, false);

-- Vidéos pour Grand Theft Auto V
INSERT INTO game_videos (game_id, url, thumbnail_url, title, description, video_type, duration_seconds, display_order, is_featured) VALUES
('660e8400-e29b-41d4-a716-446655440004', '/videos/gtav-trailer.mp4', '/images/gtav-trailer-thumb.jpg', 'Trailer de lancement', 'Bande-annonce officielle de lancement', 'trailer', 210, 1, true),
('660e8400-e29b-41d4-a716-446655440004', '/videos/gtav-gameplay.mp4', '/images/gtav-gameplay-thumb.jpg', 'Gameplay - Action', 'Séquences d''action spectaculaires', 'gameplay', 480, 2, false);