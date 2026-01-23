-- Seeds pour les personnages d'exemple
-- Personnages iconiques de jeux vidéo pour tester la plateforme

INSERT INTO characters (id, slug, main_image, background_image, background_color) VALUES
-- Personnages The Witcher 3
('770e8400-e29b-41d4-a716-446655440001', 'geralt-of-rivia', 'https://images.igdb.com/igdb/image/upload/t_720p/ar5l8.jpg', 'https://images.igdb.com/igdb/image/upload/t_1080p/sc6f0g.jpg', '#1a1a2e'),
('770e8400-e29b-41d4-a716-446655440002', 'yennefer-of-vengerberg', 'https://images.igdb.com/igdb/image/upload/t_720p/ar5l9.jpg', 'https://images.igdb.com/igdb/image/upload/t_1080p/sc6f0g.jpg', '#2d1f3d'),
('770e8400-e29b-41d4-a716-446655440003', 'ciri', 'https://images.igdb.com/igdb/image/upload/t_720p/ar5la.jpg', 'https://images.igdb.com/igdb/image/upload/t_1080p/sc6f0g.jpg', '#1a2332'),

-- Personnages Cyberpunk 2077
('770e8400-e29b-41d4-a716-446655440004', 'v-cyberpunk', 'https://images.igdb.com/igdb/image/upload/t_720p/ar7qz.jpg', 'https://images.igdb.com/igdb/image/upload/t_1080p/sc6f1h.jpg', '#0f0f23'),
('770e8400-e29b-41d4-a716-446655440005', 'johnny-silverhand', 'https://images.igdb.com/igdb/image/upload/t_720p/ar7r0.jpg', 'https://images.igdb.com/igdb/image/upload/t_1080p/sc6f1h.jpg', '#1a0f0f'),

-- Personnages God of War
('770e8400-e29b-41d4-a716-446655440006', 'kratos', 'https://images.igdb.com/igdb/image/upload/t_720p/ar4qx.jpg', 'https://images.igdb.com/igdb/image/upload/t_1080p/sc6f6m.jpg', '#0f1419'),
('770e8400-e29b-41d4-a716-446655440007', 'atreus', 'https://images.igdb.com/igdb/image/upload/t_720p/ar4qy.jpg', 'https://images.igdb.com/igdb/image/upload/t_1080p/sc6f6m.jpg', '#1a2332'),

-- Personnages Horizon Zero Dawn
('770e8400-e29b-41d4-a716-446655440008', 'aloy', 'https://images.igdb.com/igdb/image/upload/t_720p/ar5m1.jpg', 'https://images.igdb.com/igdb/image/upload/t_1080p/sc6f7n.jpg', '#1a2332'),

-- Personnages Red Dead Redemption 2
('770e8400-e29b-41d4-a716-446655440009', 'arthur-morgan', 'https://images.igdb.com/igdb/image/upload/t_720p/ar6n2.jpg', 'https://images.igdb.com/igdb/image/upload/t_1080p/sc6f4k.jpg', '#2d1810'),
('770e8400-e29b-41d4-a716-446655440010', 'john-marston', 'https://images.igdb.com/igdb/image/upload/t_720p/ar6n3.jpg', 'https://images.igdb.com/igdb/image/upload/t_1080p/sc6f4k.jpg', '#2d1810'),

-- Personnages Elden Ring
('770e8400-e29b-41d4-a716-446655440011', 'melina', 'https://images.igdb.com/igdb/image/upload/t_720p/ar8p4.jpg', 'https://images.igdb.com/igdb/image/upload/t_1080p/sc6f5l.jpg', '#1a1611'),
('770e8400-e29b-41d4-a716-446655440012', 'ranni-the-witch', 'https://images.igdb.com/igdb/image/upload/t_720p/ar8p5.jpg', 'https://images.igdb.com/igdb/image/upload/t_1080p/sc6f5l.jpg', '#0f1932'),

-- Personnages Hades
('770e8400-e29b-41d4-a716-446655440013', 'zagreus', 'https://images.igdb.com/igdb/image/upload/t_720p/ar7s1.jpg', 'https://images.igdb.com/igdb/image/upload/t_1080p/sc6g2s.jpg', '#1a0f19'),
('770e8400-e29b-41d4-a716-446655440014', 'megaera', 'https://images.igdb.com/igdb/image/upload/t_720p/ar7s2.jpg', 'https://images.igdb.com/igdb/image/upload/t_1080p/sc6g2s.jpg', '#2d1f3d'),

-- Personnages Ghost of Tsushima
('770e8400-e29b-41d4-a716-446655440015', 'jin-sakai', 'https://images.igdb.com/igdb/image/upload/t_720p/ar7t3.jpg', 'https://images.igdb.com/igdb/image/upload/t_1080p/sc6f8o.jpg', '#2d1810'),

-- Personnages The Last of Us Part II
('770e8400-e29b-41d4-a716-446655440016', 'ellie', 'https://images.igdb.com/igdb/image/upload/t_720p/ar6o4.jpg', 'https://images.igdb.com/igdb/image/upload/t_1080p/sc6g4u.jpg', '#1a1611'),
('770e8400-e29b-41d4-a716-446655440017', 'joel', 'https://images.igdb.com/igdb/image/upload/t_720p/ar6o5.jpg', 'https://images.igdb.com/igdb/image/upload/t_1080p/sc6g4u.jpg', '#1a1611')
ON CONFLICT (id) DO NOTHING;
