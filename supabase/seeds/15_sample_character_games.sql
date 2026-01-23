-- Seeds pour les liaisons personnages-jeux
-- Associe chaque personnage à ses jeux d'apparition

INSERT INTO character_games (character_id, game_id, is_primary) VALUES
-- Geralt - The Witcher 3 (primary), Cyberpunk 2077 (cameo)
('770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', true),

-- Yennefer - The Witcher 3
('770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440001', true),

-- Ciri - The Witcher 3 (primary), Cyberpunk 2077 (référence)
('770e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440001', true),

-- V - Cyberpunk 2077
('770e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440002', true),

-- Johnny Silverhand - Cyberpunk 2077
('770e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440002', true),

-- Kratos - God of War
('770e8400-e29b-41d4-a716-446655440006', '660e8400-e29b-41d4-a716-446655440007', true),

-- Atreus - God of War
('770e8400-e29b-41d4-a716-446655440007', '660e8400-e29b-41d4-a716-446655440007', true),

-- Aloy - Horizon Zero Dawn
('770e8400-e29b-41d4-a716-446655440008', '660e8400-e29b-41d4-a716-446655440008', true),

-- Arthur Morgan - Red Dead Redemption 2
('770e8400-e29b-41d4-a716-446655440009', '660e8400-e29b-41d4-a716-446655440005', true),

-- John Marston - Red Dead Redemption 2
('770e8400-e29b-41d4-a716-446655440010', '660e8400-e29b-41d4-a716-446655440005', true),

-- Melina - Elden Ring
('770e8400-e29b-41d4-a716-446655440011', '660e8400-e29b-41d4-a716-446655440006', true),

-- Ranni - Elden Ring
('770e8400-e29b-41d4-a716-446655440012', '660e8400-e29b-41d4-a716-446655440006', true),

-- Zagreus - Hades
('770e8400-e29b-41d4-a716-446655440013', '660e8400-e29b-41d4-a716-446655440013', true),

-- Megaera - Hades
('770e8400-e29b-41d4-a716-446655440014', '660e8400-e29b-41d4-a716-446655440013', true),

-- Jin Sakai - Ghost of Tsushima
('770e8400-e29b-41d4-a716-446655440015', '660e8400-e29b-41d4-a716-446655440009', true),

-- Ellie - The Last of Us Part II
('770e8400-e29b-41d4-a716-446655440016', '660e8400-e29b-41d4-a716-446655440015', true),

-- Joel - The Last of Us Part II
('770e8400-e29b-41d4-a716-446655440017', '660e8400-e29b-41d4-a716-446655440015', true)
ON CONFLICT (character_id, game_id) DO NOTHING;
