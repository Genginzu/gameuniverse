-- Seeds pour les médias des jeux d'exemple
-- Screenshots, artwork et vidéos pour les jeux de démonstration
-- Images provenant d'IGDB (Internet Game Database) pour l'authenticité

-- Screenshots pour The Witcher 3
INSERT INTO game_screenshots (game_id, url, alt_text, caption, display_order, is_featured) VALUES
('660e8400-e29b-41d4-a716-446655440001', 'https://images.igdb.com/igdb/image/upload/t_screenshot_big/sc6f0g.jpg', 'Paysage fantastique', 'Exploration des vastes marais de Velen', 1, true),
('660e8400-e29b-41d4-a716-446655440001', 'https://images.igdb.com/igdb/image/upload/t_screenshot_big/sc6f0h.jpg', 'Combat épique', 'Combat épique contre un griffon royal', 2, false),
('660e8400-e29b-41d4-a716-446655440001', 'https://images.igdb.com/igdb/image/upload/t_screenshot_big/sc6f0i.jpg', 'Ville médiévale', 'Les rues animées de Novigrad sous les étoiles', 3, false);

-- Artwork pour The Witcher 3
INSERT INTO game_artwork (game_id, url, alt_text, caption, artwork_type, display_order, is_featured) VALUES
('660e8400-e29b-41d4-a716-446655440001', 'https://images.igdb.com/igdb/image/upload/t_1080p/ar6f0g.jpg', 'Art fantastique', 'Art conceptuel de Geralt et Ciri', 'concept', 1, true),
('660e8400-e29b-41d4-a716-446655440001', 'https://images.igdb.com/igdb/image/upload/t_1080p/ar6f0h.jpg', 'Paysage mystique', 'Les îles mystiques de Skellige', 'concept', 2, false);

-- Vidéos pour The Witcher 3
INSERT INTO game_videos (game_id, url, thumbnail_url, title, description, video_type, duration_seconds, display_order, is_featured) VALUES
('660e8400-e29b-41d4-a716-446655440001', 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4', 'https://images.igdb.com/igdb/image/upload/t_720p/sc6f0g.jpg', 'Bande-annonce officielle', 'La bande-annonce de lancement de The Witcher 3', 'trailer', 180, 1, true),
('660e8400-e29b-41d4-a716-446655440001', 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4', 'https://images.igdb.com/igdb/image/upload/t_720p/sc6f0h.jpg', 'Gameplay - Combat', 'Démonstration du système de combat', 'gameplay', 300, 2, false);

-- Screenshots pour Cyberpunk 2077
INSERT INTO game_screenshots (game_id, url, alt_text, caption, display_order, is_featured) VALUES
('660e8400-e29b-41d4-a716-446655440002', 'https://images.igdb.com/igdb/image/upload/t_screenshot_big/sc6f1g.jpg', 'Ville futuriste', 'Vue panoramique de Night City illuminée', 1, true),
('660e8400-e29b-41d4-a716-446655440002', 'https://images.igdb.com/igdb/image/upload/t_screenshot_big/sc6f1h.jpg', 'Rue cyberpunk', 'Le protagoniste V explorant les rues de Night City', 2, false),
('660e8400-e29b-41d4-a716-446655440002', 'https://images.igdb.com/igdb/image/upload/t_screenshot_big/sc6f1i.jpg', 'Combat futuriste', 'Combat avec des améliorations cybernétiques', 3, false);

-- Artwork pour Cyberpunk 2077
INSERT INTO game_artwork (game_id, url, alt_text, caption, artwork_type, display_order, is_featured) VALUES
('660e8400-e29b-41d4-a716-446655440002', 'https://images.igdb.com/igdb/image/upload/t_1080p/ar6f1g.jpg', 'Art cyberpunk', 'Art promotionnel de V et Johnny Silverhand', 'promotional', 1, true),
('660e8400-e29b-41d4-a716-446655440002', 'https://images.igdb.com/igdb/image/upload/t_1080p/ar6f1h.jpg', 'Skyline futuriste', 'Vue artistique du skyline futuriste', 'concept', 2, false);

-- Vidéos pour Cyberpunk 2077
INSERT INTO game_videos (game_id, url, thumbnail_url, title, description, video_type, duration_seconds, display_order, is_featured) VALUES
('660e8400-e29b-41d4-a716-446655440002', 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4', 'https://images.igdb.com/igdb/image/upload/t_720p/sc6f1g.jpg', 'Trailer de lancement', 'Bande-annonce officielle de lancement', 'trailer', 240, 1, true),
('660e8400-e29b-41d4-a716-446655440002', 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4', 'https://images.igdb.com/igdb/image/upload/t_720p/sc6f1h.jpg', 'Gameplay - Exploration', 'Exploration de Night City', 'gameplay', 420, 2, false);

-- Screenshots pour Minecraft
INSERT INTO game_screenshots (game_id, url, alt_text, caption, display_order, is_featured) VALUES
('660e8400-e29b-41d4-a716-446655440003', 'https://images.igdb.com/igdb/image/upload/t_screenshot_big/sc6f2g.jpg', 'Construction créative', 'Une construction impressionnante en mode créatif', 1, true),
('660e8400-e29b-41d4-a716-446655440003', 'https://images.igdb.com/igdb/image/upload/t_screenshot_big/sc6f2h.jpg', 'Paysage cubique', 'Un magnifique paysage généré procéduralement', 2, false),
('660e8400-e29b-41d4-a716-446655440003', 'https://images.igdb.com/igdb/image/upload/t_screenshot_big/sc6f2i.jpg', 'Exploration souterraine', 'Exploration des profondeurs souterraines', 3, false);

-- Artwork pour Minecraft
INSERT INTO game_artwork (game_id, url, alt_text, caption, artwork_type, display_order, is_featured) VALUES
('660e8400-e29b-41d4-a716-446655440003', 'https://images.igdb.com/igdb/image/upload/t_1080p/ar6f2g.jpg', 'Art pixelisé', 'Art officiel de Steve avec les créatures du jeu', 'promotional', 1, true),
('660e8400-e29b-41d4-a716-446655440003', 'https://images.igdb.com/igdb/image/upload/t_1080p/ar6f2h.jpg', 'Monde cubique', 'Représentation artistique du monde cubique', 'concept', 2, false);

-- Vidéos pour Minecraft
INSERT INTO game_videos (game_id, url, thumbnail_url, title, description, video_type, duration_seconds, display_order, is_featured) VALUES
('660e8400-e29b-41d4-a716-446655440003', 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4', 'https://images.igdb.com/igdb/image/upload/t_720p/sc6f2g.jpg', 'Trailer officiel', 'Présentation des possibilités infinies', 'trailer', 120, 1, true),
('660e8400-e29b-41d4-a716-446655440003', 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4', 'https://images.igdb.com/igdb/image/upload/t_720p/sc6f2h.jpg', 'Gameplay - Construction', 'Démonstration de construction créative', 'gameplay', 600, 2, false);

-- Screenshots pour Grand Theft Auto V
INSERT INTO game_screenshots (game_id, url, alt_text, caption, display_order, is_featured) VALUES
('660e8400-e29b-41d4-a716-446655440004', 'https://images.igdb.com/igdb/image/upload/t_screenshot_big/sc6f3g.jpg', 'Ville moderne', 'Vue aérienne de la ville de Los Santos', 1, true),
('660e8400-e29b-41d4-a716-446655440004', 'https://images.igdb.com/igdb/image/upload/t_screenshot_big/sc6f3h.jpg', 'Action urbaine', 'Course-poursuite spectaculaire dans les rues', 2, false),
('660e8400-e29b-41d4-a716-446655440004', 'https://images.igdb.com/igdb/image/upload/t_screenshot_big/sc6f3i.jpg', 'Personnages', 'Michael, Franklin et Trevor ensemble', 3, false);

-- Artwork pour Grand Theft Auto V
INSERT INTO game_artwork (game_id, url, alt_text, caption, artwork_type, display_order, is_featured) VALUES
('660e8400-e29b-41d4-a716-446655440004', 'https://images.igdb.com/igdb/image/upload/t_1080p/ar6f3g.jpg', 'Art promotionnel', 'L''artwork iconique de GTA V', 'promotional', 1, true),
('660e8400-e29b-41d4-a716-446655440004', 'https://images.igdb.com/igdb/image/upload/t_1080p/ar6f3h.jpg', 'Skyline urbain', 'Vue artistique de la skyline', 'concept', 2, false);

-- Vidéos pour Grand Theft Auto V
INSERT INTO game_videos (game_id, url, thumbnail_url, title, description, video_type, duration_seconds, display_order, is_featured) VALUES
('660e8400-e29b-41d4-a716-446655440004', 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4', 'https://images.igdb.com/igdb/image/upload/t_720p/sc6f3g.jpg', 'Trailer de lancement', 'Bande-annonce officielle de lancement', 'trailer', 210, 1, true),
('660e8400-e29b-41d4-a716-446655440004', 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4', 'https://images.igdb.com/igdb/image/upload/t_720p/sc6f3h.jpg', 'Gameplay - Action', 'Séquences d''action spectaculaires', 'gameplay', 480, 2, false);