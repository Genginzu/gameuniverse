-- Seeds pour les médias des personnages
-- Screenshots, artworks et vidéos pour enrichir les pages de détails

INSERT INTO character_media (id, character_id, type, url, thumbnail_url, title, description, alt_text, is_featured, display_order) VALUES
-- Geralt - Screenshots et Artworks
('880e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', 'screenshot', 'https://images.igdb.com/igdb/image/upload/t_1080p/sc5l1.jpg', 'https://images.igdb.com/igdb/image/upload/t_thumb/sc5l1.jpg', 'Geralt en combat', 'Geralt affrontant un griffon', 'Geralt de Riv combattant un griffon', true, 1),
('880e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440001', 'artwork', 'https://images.igdb.com/igdb/image/upload/t_1080p/ar5l8.jpg', 'https://images.igdb.com/igdb/image/upload/t_thumb/ar5l8.jpg', 'Portrait officiel', 'Artwork officiel de Geralt', 'Portrait artistique de Geralt', true, 2),
('880e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440001', 'screenshot', 'https://images.igdb.com/igdb/image/upload/t_1080p/sc5l2.jpg', 'https://images.igdb.com/igdb/image/upload/t_thumb/sc5l2.jpg', 'Geralt à Kaer Morhen', 'Geralt méditant à Kaer Morhen', 'Geralt méditant dans la forteresse', false, 3),

-- Kratos - Screenshots et Artworks
('880e8400-e29b-41d4-a716-446655440004', '770e8400-e29b-41d4-a716-446655440006', 'screenshot', 'https://images.igdb.com/igdb/image/upload/t_1080p/sc6f6m.jpg', 'https://images.igdb.com/igdb/image/upload/t_thumb/sc6f6m.jpg', 'Kratos et Atreus', 'Kratos guidant son fils', 'Kratos et Atreus dans la forêt', true, 1),
('880e8400-e29b-41d4-a716-446655440005', '770e8400-e29b-41d4-a716-446655440006', 'artwork', 'https://images.igdb.com/igdb/image/upload/t_1080p/ar4qx.jpg', 'https://images.igdb.com/igdb/image/upload/t_thumb/ar4qx.jpg', 'Kratos - Art officiel', 'Artwork promotionnel de Kratos', 'Portrait de Kratos avec sa hache', true, 2),

-- Aloy - Screenshots et Artworks
('880e8400-e29b-41d4-a716-446655440006', '770e8400-e29b-41d4-a716-446655440008', 'screenshot', 'https://images.igdb.com/igdb/image/upload/t_1080p/sc6f7n.jpg', 'https://images.igdb.com/igdb/image/upload/t_thumb/sc6f7n.jpg', 'Aloy chassant', 'Aloy traquant une machine', 'Aloy avec son arc face à une machine', true, 1),
('880e8400-e29b-41d4-a716-446655440007', '770e8400-e29b-41d4-a716-446655440008', 'artwork', 'https://images.igdb.com/igdb/image/upload/t_1080p/ar5m1.jpg', 'https://images.igdb.com/igdb/image/upload/t_thumb/ar5m1.jpg', 'Aloy - Portrait', 'Portrait officiel d''Aloy', 'Aloy regardant l''horizon', true, 2),

-- Arthur Morgan - Screenshots
('880e8400-e29b-41d4-a716-446655440008', '770e8400-e29b-41d4-a716-446655440009', 'screenshot', 'https://images.igdb.com/igdb/image/upload/t_1080p/sc6f4k.jpg', 'https://images.igdb.com/igdb/image/upload/t_thumb/sc6f4k.jpg', 'Arthur à cheval', 'Arthur chevauchant au coucher du soleil', 'Arthur Morgan à cheval dans les plaines', true, 1),
('880e8400-e29b-41d4-a716-446655440009', '770e8400-e29b-41d4-a716-446655440009', 'artwork', 'https://images.igdb.com/igdb/image/upload/t_1080p/ar6n2.jpg', 'https://images.igdb.com/igdb/image/upload/t_thumb/ar6n2.jpg', 'Arthur - Wanted', 'Affiche de recherche d''Arthur', 'Portrait style western d''Arthur', false, 2),

-- Zagreus - Screenshots et Artworks
('880e8400-e29b-41d4-a716-446655440010', '770e8400-e29b-41d4-a716-446655440013', 'screenshot', 'https://images.igdb.com/igdb/image/upload/t_1080p/sc6g2s.jpg', 'https://images.igdb.com/igdb/image/upload/t_thumb/sc6g2s.jpg', 'Zagreus en action', 'Zagreus combattant dans le Tartare', 'Zagreus utilisant ses pouvoirs', true, 1),
('880e8400-e29b-41d4-a716-446655440011', '770e8400-e29b-41d4-a716-446655440013', 'artwork', 'https://images.igdb.com/igdb/image/upload/t_1080p/ar7s1.jpg', 'https://images.igdb.com/igdb/image/upload/t_thumb/ar7s1.jpg', 'Zagreus - Art', 'Illustration de Zagreus', 'Portrait stylisé de Zagreus', true, 2),

-- Jin Sakai - Screenshots
('880e8400-e29b-41d4-a716-446655440012', '770e8400-e29b-41d4-a716-446655440015', 'screenshot', 'https://images.igdb.com/igdb/image/upload/t_1080p/sc6f8o.jpg', 'https://images.igdb.com/igdb/image/upload/t_thumb/sc6f8o.jpg', 'Jin le Fantôme', 'Jin dans son armure de Fantôme', 'Jin Sakai en mode furtif', true, 1),
('880e8400-e29b-41d4-a716-446655440013', '770e8400-e29b-41d4-a716-446655440015', 'artwork', 'https://images.igdb.com/igdb/image/upload/t_1080p/ar7t3.jpg', 'https://images.igdb.com/igdb/image/upload/t_thumb/ar7t3.jpg', 'Jin - Samouraï', 'Jin en armure de samouraï', 'Portrait de Jin Sakai', false, 2),

-- Ellie - Screenshots
('880e8400-e29b-41d4-a716-446655440014', '770e8400-e29b-41d4-a716-446655440016', 'screenshot', 'https://images.igdb.com/igdb/image/upload/t_1080p/sc6g4u.jpg', 'https://images.igdb.com/igdb/image/upload/t_thumb/sc6g4u.jpg', 'Ellie en exploration', 'Ellie explorant Seattle', 'Ellie dans un bâtiment abandonné', true, 1),
('880e8400-e29b-41d4-a716-446655440015', '770e8400-e29b-41d4-a716-446655440016', 'artwork', 'https://images.igdb.com/igdb/image/upload/t_1080p/ar6o4.jpg', 'https://images.igdb.com/igdb/image/upload/t_thumb/ar6o4.jpg', 'Ellie - Portrait', 'Portrait officiel d''Ellie', 'Ellie avec sa guitare', true, 2),

-- Johnny Silverhand - Artworks
('880e8400-e29b-41d4-a716-446655440016', '770e8400-e29b-41d4-a716-446655440005', 'artwork', 'https://images.igdb.com/igdb/image/upload/t_1080p/ar7r0.jpg', 'https://images.igdb.com/igdb/image/upload/t_thumb/ar7r0.jpg', 'Johnny Silverhand', 'Le rockerboy légendaire', 'Johnny Silverhand avec sa guitare', true, 1),
('880e8400-e29b-41d4-a716-446655440017', '770e8400-e29b-41d4-a716-446655440005', 'screenshot', 'https://images.igdb.com/igdb/image/upload/t_1080p/sc6f1h.jpg', 'https://images.igdb.com/igdb/image/upload/t_thumb/sc6f1h.jpg', 'Johnny en concert', 'Johnny sur scène avec Samurai', 'Johnny Silverhand performant', false, 2)
ON CONFLICT (id) DO NOTHING;
