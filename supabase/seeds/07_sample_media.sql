-- Seeds pour les médias des jeux
-- Ajout de screenshots, artwork et vidéos pour enrichir l'expérience utilisateur
-- Images et vidéos provenant d'IGDB et sources officielles

-- Screenshots pour The Witcher 3
INSERT INTO game_screenshots (game_id, url, alt_text, caption, display_order, is_featured) VALUES
('660e8400-e29b-41d4-a716-446655440001', 'https://images.igdb.com/igdb/image/upload/t_1080p/sc6f0g.jpg', 'Geralt dans un paysage de Velen', 'Exploration des vastes terres de Velen', 1, true),
('660e8400-e29b-41d4-a716-446655440001', 'https://images.igdb.com/igdb/image/upload/t_1080p/sc6f1h.jpg', 'Combat contre un griffon', 'Combat épique contre une créature légendaire', 2, false),
('660e8400-e29b-41d4-a716-446655440001', 'https://images.igdb.com/igdb/image/upload/t_1080p/sc6f2i.jpg', 'Novigrad la nuit', 'La grande cité de Novigrad illuminée', 3, false),
('660e8400-e29b-41d4-a716-446655440001', 'https://images.igdb.com/igdb/image/upload/t_1080p/sc6f3j.jpg', 'Ciri utilisant ses pouvoirs', 'Ciri maîtrisant ses capacités Elder Blood', 4, false);

-- Artwork pour The Witcher 3
INSERT INTO game_artwork (game_id, url, alt_text, caption, artwork_type, display_order, is_featured) VALUES
('660e8400-e29b-41d4-a716-446655440001', 'https://images.igdb.com/igdb/image/upload/t_1080p/ar1abc.jpg', 'Artwork officiel de Geralt', 'Portrait officiel de Geralt de Riv', 'promotional', 1, true),
('660e8400-e29b-41d4-a716-446655440001', 'https://images.igdb.com/igdb/image/upload/t_1080p/ar1def.jpg', 'Concept art de Kaer Morhen', 'Art conceptuel de la forteresse des sorceleurs', 'concept', 2, false),
('660e8400-e29b-41d4-a716-446655440001', 'https://images.igdb.com/igdb/image/upload/t_1080p/ar1ghi.jpg', 'Wallpaper Triss et Yennefer', 'Fond d''écran des deux sorcières', 'wallpaper', 3, false);

-- Vidéos pour The Witcher 3
INSERT INTO game_videos (game_id, url, thumbnail_url, title, description, video_type, duration_seconds, display_order, is_featured) VALUES
('660e8400-e29b-41d4-a716-446655440001', 'https://www.youtube.com/watch?v=c0i88t0Kacs', 'https://img.youtube.com/vi/c0i88t0Kacs/maxresdefault.jpg', 'The Witcher 3: Wild Hunt - Launch Trailer', 'Bande-annonce de lancement officielle', 'trailer', 180, 1, true),
('660e8400-e29b-41d4-a716-446655440001', 'https://www.youtube.com/watch?v=ehjJ614QfeM', 'https://img.youtube.com/vi/ehjJ614QfeM/maxresdefault.jpg', 'The Witcher 3 - Gameplay Walkthrough', 'Démonstration de gameplay commentée', 'gameplay', 900, 2, false);

-- Screenshots pour Cyberpunk 2077
INSERT INTO game_screenshots (game_id, url, alt_text, caption, display_order, is_featured) VALUES
('660e8400-e29b-41d4-a716-446655440002', 'https://images.igdb.com/igdb/image/upload/t_1080p/sc6g4u.jpg', 'Night City vue panoramique', 'Vue spectaculaire de Night City la nuit', 1, true),
('660e8400-e29b-41d4-a716-446655440002', 'https://images.igdb.com/igdb/image/upload/t_1080p/sc6g5v.jpg', 'V dans les rues de Night City', 'Le protagoniste explorant les rues cyberpunk', 2, false),
('660e8400-e29b-41d4-a716-446655440002', 'https://images.igdb.com/igdb/image/upload/t_1080p/sc6g6w.jpg', 'Combat avec implants cybernétiques', 'Action intense avec les améliorations cybernétiques', 3, false),
('660e8400-e29b-41d4-a716-446655440002', 'https://images.igdb.com/igdb/image/upload/t_1080p/sc6g7x.jpg', 'Keanu Reeves en Johnny Silverhand', 'L''iconique Johnny Silverhand', 4, false);

-- Artwork pour Cyberpunk 2077
INSERT INTO game_artwork (game_id, url, alt_text, caption, artwork_type, display_order, is_featured) VALUES
('660e8400-e29b-41d4-a716-446655440002', 'https://images.igdb.com/igdb/image/upload/t_1080p/ar2abc.jpg', 'Artwork officiel V', 'Portrait officiel du protagoniste V', 'promotional', 1, true),
('660e8400-e29b-41d4-a716-446655440002', 'https://images.igdb.com/igdb/image/upload/t_1080p/ar2def.jpg', 'Concept art Night City', 'Art conceptuel de la mégalopole futuriste', 'concept', 2, false),
('660e8400-e29b-41d4-a716-446655440002', 'https://images.igdb.com/igdb/image/upload/t_1080p/ar2ghi.jpg', 'Wallpaper Johnny Silverhand', 'Fond d''écran de Johnny Silverhand', 'wallpaper', 3, false);

-- Vidéos pour Cyberpunk 2077
INSERT INTO game_videos (game_id, url, thumbnail_url, title, description, video_type, duration_seconds, display_order, is_featured) VALUES
('660e8400-e29b-41d4-a716-446655440002', 'https://www.youtube.com/watch?v=8X2kIfS6fb8', 'https://img.youtube.com/vi/8X2kIfS6fb8/maxresdefault.jpg', 'Cyberpunk 2077 — Official Launch Trailer', 'Bande-annonce de lancement officielle', 'trailer', 120, 1, true),
('660e8400-e29b-41d4-a716-446655440002', 'https://www.youtube.com/watch?v=vjF9GgrY9c0', 'https://img.youtube.com/vi/vjF9GgrY9c0/maxresdefault.jpg', 'Cyberpunk 2077 - Deep Dive Video', 'Présentation approfondie du gameplay', 'gameplay', 2700, 2, false);

-- Screenshots pour Minecraft
INSERT INTO game_screenshots (game_id, url, alt_text, caption, display_order, is_featured) VALUES
('660e8400-e29b-41d4-a716-446655440003', 'https://images.igdb.com/igdb/image/upload/t_1080p/sc6g8y.jpg', 'Construction massive en survie', 'Château médiéval construit en mode survie', 1, true),
('660e8400-e29b-41d4-a716-446655440003', 'https://images.igdb.com/igdb/image/upload/t_1080p/sc6g9z.jpg', 'Exploration de grottes', 'Découverte des profondeurs souterraines', 2, false),
('660e8400-e29b-41d4-a716-446655440003', 'https://images.igdb.com/igdb/image/upload/t_1080p/sc6h0a.jpg', 'Village avec des villageois', 'Interaction avec les PNJ du village', 3, false),
('660e8400-e29b-41d4-a716-446655440003', 'https://images.igdb.com/igdb/image/upload/t_1080p/sc6h1b.jpg', 'Redstone et mécanismes', 'Créations complexes avec la redstone', 4, false);

-- Artwork pour Minecraft
INSERT INTO game_artwork (game_id, url, alt_text, caption, artwork_type, display_order, is_featured) VALUES
('660e8400-e29b-41d4-a716-446655440003', 'https://images.igdb.com/igdb/image/upload/t_1080p/ar3abc.jpg', 'Artwork officiel Steve', 'Le personnage iconique Steve', 'promotional', 1, true),
('660e8400-e29b-41d4-a716-446655440003', 'https://images.igdb.com/igdb/image/upload/t_1080p/ar3def.jpg', 'Concept art biomes', 'Art conceptuel des différents biomes', 'concept', 2, false),
('660e8400-e29b-41d4-a716-446655440003', 'https://images.igdb.com/igdb/image/upload/t_1080p/ar3ghi.jpg', 'Wallpaper monde infini', 'Fond d''écran du monde procédural', 'wallpaper', 3, false);

-- Vidéos pour Minecraft
INSERT INTO game_videos (game_id, url, thumbnail_url, title, description, video_type, duration_seconds, display_order, is_featured) VALUES
('660e8400-e29b-41d4-a716-446655440003', 'https://www.youtube.com/watch?v=MmB9b5njVbA', 'https://img.youtube.com/vi/MmB9b5njVbA/maxresdefault.jpg', 'Official Minecraft Trailer', 'Bande-annonce officielle du jeu', 'trailer', 90, 1, true),
('660e8400-e29b-41d4-a716-446655440003', 'https://www.youtube.com/watch?v=4UdEFmxRmNE', 'https://img.youtube.com/vi/4UdEFmxRmNE/maxresdefault.jpg', 'Minecraft Survival Guide', 'Guide de survie pour débutants', 'gameplay', 1200, 2, false);

-- Screenshots pour Grand Theft Auto V
INSERT INTO game_screenshots (game_id, url, alt_text, caption, display_order, is_featured) VALUES
('660e8400-e29b-41d4-a716-446655440004', 'https://images.igdb.com/igdb/image/upload/t_1080p/sc6h2c.jpg', 'Los Santos vue aérienne', 'Vue panoramique de la ville de Los Santos', 1, true),
('660e8400-e29b-41d4-a716-446655440004', 'https://images.igdb.com/igdb/image/upload/t_1080p/sc6h3d.jpg', 'Course-poursuite épique', 'Action intense dans les rues de la ville', 2, false),
('660e8400-e29b-41d4-a716-446655440004', 'https://images.igdb.com/igdb/image/upload/t_1080p/sc6h4e.jpg', 'Les trois protagonistes', 'Michael, Franklin et Trevor ensemble', 3, false);

-- Artwork pour Grand Theft Auto V
INSERT INTO game_artwork (game_id, url, alt_text, caption, artwork_type, display_order, is_featured) VALUES
('660e8400-e29b-41d4-a716-446655440004', 'https://images.igdb.com/igdb/image/upload/t_1080p/ar4abc.jpg', 'Artwork officiel GTA V', 'Illustration promotionnelle officielle', 'promotional', 1, true),
('660e8400-e29b-41d4-a716-446655440004', 'https://images.igdb.com/igdb/image/upload/t_1080p/ar4def.jpg', 'Concept art Los Santos', 'Art conceptuel de la ville', 'concept', 2, false);

-- Vidéos pour Grand Theft Auto V
INSERT INTO game_videos (game_id, url, thumbnail_url, title, description, video_type, duration_seconds, display_order, is_featured) VALUES
('660e8400-e29b-41d4-a716-446655440004', 'https://www.youtube.com/watch?v=QkkoHAzjnUs', 'https://img.youtube.com/vi/QkkoHAzjnUs/maxresdefault.jpg', 'Grand Theft Auto V: Official Trailer', 'Bande-annonce officielle', 'trailer', 150, 1, true),
('660e8400-e29b-41d4-a716-446655440004', 'https://www.youtube.com/watch?v=N-xHcvug3WI', 'https://img.youtube.com/vi/N-xHcvug3WI/maxresdefault.jpg', 'GTA V Gameplay Walkthrough', 'Démonstration de gameplay', 'gameplay', 1800, 2, false);

-- Screenshots pour Red Dead Redemption 2
INSERT INTO game_screenshots (game_id, url, alt_text, caption, display_order, is_featured) VALUES
('660e8400-e29b-41d4-a716-446655440005', 'https://images.igdb.com/igdb/image/upload/t_1080p/sc6h5f.jpg', 'Arthur Morgan à cheval', 'Le protagoniste chevauchant dans l''Ouest sauvage', 1, true),
('660e8400-e29b-41d4-a716-446655440005', 'https://images.igdb.com/igdb/image/upload/t_1080p/sc6h6g.jpg', 'Campement de la bande', 'La vie au camp avec la bande de Dutch', 2, false),
('660e8400-e29b-41d4-a716-446655440005', 'https://images.igdb.com/igdb/image/upload/t_1080p/sc6h7h.jpg', 'Duel au coucher du soleil', 'Duel western classique', 3, false);

-- Artwork pour Red Dead Redemption 2
INSERT INTO game_artwork (game_id, url, alt_text, caption, artwork_type, display_order, is_featured) VALUES
('660e8400-e29b-41d4-a716-446655440005', 'https://images.igdb.com/igdb/image/upload/t_1080p/ar5abc.jpg', 'Artwork Arthur Morgan', 'Portrait officiel d''Arthur Morgan', 'promotional', 1, true),
('660e8400-e29b-41d4-a716-446655440005', 'https://images.igdb.com/igdb/image/upload/t_1080p/ar5def.jpg', 'Concept art paysages', 'Art conceptuel des paysages de l''Ouest', 'concept', 2, false);

-- Vidéos pour Red Dead Redemption 2
INSERT INTO game_videos (game_id, url, thumbnail_url, title, description, video_type, duration_seconds, display_order, is_featured) VALUES
('660e8400-e29b-41d4-a716-446655440005', 'https://www.youtube.com/watch?v=gmA6MrX81z4', 'https://img.youtube.com/vi/gmA6MrX81z4/maxresdefault.jpg', 'Red Dead Redemption 2: Official Trailer', 'Bande-annonce officielle', 'trailer', 180, 1, true),
('660e8400-e29b-41d4-a716-446655440005', 'https://www.youtube.com/watch?v=Dw_oH5oiUSE', 'https://img.youtube.com/vi/Dw_oH5oiUSE/maxresdefault.jpg', 'RDR2 Gameplay Reveal', 'Révélation du gameplay', 'gameplay', 360, 2, false);

-- Screenshots pour Elden Ring
INSERT INTO game_screenshots (game_id, url, alt_text, caption, display_order, is_featured) VALUES
('660e8400-e29b-41d4-a716-446655440006', 'https://images.igdb.com/igdb/image/upload/t_1080p/sc6h8i.jpg', 'L''Arbre-Monde Erdtree', 'Le majestueux Arbre-Monde au centre des Terres-Entre', 1, true),
('660e8400-e29b-41d4-a716-446655440006', 'https://images.igdb.com/igdb/image/upload/t_1080p/sc6h9j.jpg', 'Combat contre un boss', 'Affrontement épique contre un demi-dieu', 2, false),
('660e8400-e29b-41d4-a716-446655440006', 'https://images.igdb.com/igdb/image/upload/t_1080p/sc6i0k.jpg', 'Exploration à cheval', 'Découverte du monde ouvert sur Torrent', 3, false);

-- Artwork pour Elden Ring
INSERT INTO game_artwork (game_id, url, alt_text, caption, artwork_type, display_order, is_featured) VALUES
('660e8400-e29b-41d4-a716-446655440006', 'https://images.igdb.com/igdb/image/upload/t_1080p/ar6abc.jpg', 'Artwork officiel Elden Ring', 'Illustration promotionnelle officielle', 'promotional', 1, true),
('660e8400-e29b-41d4-a716-446655440006', 'https://images.igdb.com/igdb/image/upload/t_1080p/ar6def.jpg', 'Concept art Erdtree', 'Art conceptuel de l''Arbre-Monde', 'concept', 2, false);

-- Vidéos pour Elden Ring
INSERT INTO game_videos (game_id, url, thumbnail_url, title, description, video_type, duration_seconds, display_order, is_featured) VALUES
('660e8400-e29b-41d4-a716-446655440006', 'https://www.youtube.com/watch?v=E3Huy2cdih0', 'https://img.youtube.com/vi/E3Huy2cdih0/maxresdefault.jpg', 'ELDEN RING - Official Gameplay Reveal Trailer', 'Bande-annonce de révélation du gameplay', 'trailer', 180, 1, true),
('660e8400-e29b-41d4-a716-446655440006', 'https://www.youtube.com/watch?v=K_03kFqWfqs', 'https://img.youtube.com/vi/K_03kFqWfqs/maxresdefault.jpg', 'Elden Ring - Story Trailer', 'Bande-annonce narrative', 'trailer', 120, 2, false);

-- Ajout de médias pour quelques autres jeux populaires

-- Screenshots pour God of War
INSERT INTO game_screenshots (game_id, url, alt_text, caption, display_order, is_featured) VALUES
('660e8400-e29b-41d4-a716-446655440007', 'https://images.igdb.com/igdb/image/upload/t_1080p/sc6i1l.jpg', 'Kratos et Atreus', 'Le père et le fils dans leur voyage', 1, true),
('660e8400-e29b-41d4-a716-446655440007', 'https://images.igdb.com/igdb/image/upload/t_1080p/sc6i2m.jpg', 'Combat contre les draugrs', 'Action intense contre les morts-vivants nordiques', 2, false);

-- Artwork pour God of War
INSERT INTO game_artwork (game_id, url, alt_text, caption, artwork_type, display_order, is_featured) VALUES
('660e8400-e29b-41d4-a716-446655440007', 'https://images.igdb.com/igdb/image/upload/t_1080p/ar7abc.jpg', 'Artwork Kratos et Atreus', 'Portrait officiel du duo père-fils', 'promotional', 1, true);

-- Vidéos pour God of War
INSERT INTO game_videos (game_id, url, thumbnail_url, title, description, video_type, duration_seconds, display_order, is_featured) VALUES
('660e8400-e29b-41d4-a716-446655440007', 'https://www.youtube.com/watch?v=K0u_kAWLJOA', 'https://img.youtube.com/vi/K0u_kAWLJOA/maxresdefault.jpg', 'God of War - Launch Trailer', 'Bande-annonce de lancement', 'trailer', 120, 1, true);

-- Screenshots pour Horizon Zero Dawn
INSERT INTO game_screenshots (game_id, url, alt_text, caption, display_order, is_featured) VALUES
('660e8400-e29b-41d4-a716-446655440008', 'https://images.igdb.com/igdb/image/upload/t_1080p/sc6i3n.jpg', 'Aloy face aux machines', 'La chasseuse affrontant les robots-dinosaures', 1, true),
('660e8400-e29b-41d4-a716-446655440008', 'https://images.igdb.com/igdb/image/upload/t_1080p/sc6i4o.jpg', 'Paysages post-apocalyptiques', 'La beauté de la nature reconquise', 2, false);

-- Artwork pour Horizon Zero Dawn
INSERT INTO game_artwork (game_id, url, alt_text, caption, artwork_type, display_order, is_featured) VALUES
('660e8400-e29b-41d4-a716-446655440008', 'https://images.igdb.com/igdb/image/upload/t_1080p/ar8abc.jpg', 'Artwork Aloy', 'Portrait officiel de la protagoniste', 'promotional', 1, true);

-- Vidéos pour Horizon Zero Dawn
INSERT INTO game_videos (game_id, url, thumbnail_url, title, description, video_type, duration_seconds, display_order, is_featured) VALUES
('660e8400-e29b-41d4-a716-446655440008', 'https://www.youtube.com/watch?v=wzx96gYA8ek', 'https://img.youtube.com/vi/wzx96gYA8ek/maxresdefault.jpg', 'Horizon Zero Dawn - Launch Trailer', 'Bande-annonce de lancement', 'trailer', 150, 1, true);

-- Note: Les URLs d'images et vidéos utilisées sont des exemples
-- En production, il faudrait utiliser des URLs réelles d'images hébergées
-- ou utiliser Supabase Storage pour héberger les médias