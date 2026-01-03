-- Seeds pour les associations jeux-genres
-- Association des jeux d'exemple avec leurs genres appropriés

INSERT INTO game_genres (game_id, genre_id) VALUES
-- The Witcher 3: RPG + Adventure
('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003'), -- RPG
('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002'), -- Adventure

-- Cyberpunk 2077: RPG + Action
('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003'), -- RPG
('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001'), -- Action

-- Minecraft: Simulation + Indie
('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440005'), -- Simulation
('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440010'), -- Indie

-- Grand Theft Auto V: Action + Adventure
('660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440001'), -- Action
('660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440002'), -- Adventure

-- Red Dead Redemption 2: Action + Adventure
('660e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440001'), -- Action
('660e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440002'), -- Adventure

-- Elden Ring: RPG + Action
('660e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440003'), -- RPG
('660e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440001'), -- Action

-- God of War: Action + Adventure
('660e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440001'), -- Action
('660e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440002'), -- Adventure

-- Horizon Zero Dawn: Action + RPG
('660e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440001'), -- Action
('660e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440003')  -- RPG
ON CONFLICT (game_id, genre_id) DO NOTHING;