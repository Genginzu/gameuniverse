-- Seeds pour les genres de jeux
-- Insertion des genres principaux avec des UUIDs fixes pour la cohérence

INSERT INTO genres (id, slug) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'action'),
('550e8400-e29b-41d4-a716-446655440002', 'adventure'),
('550e8400-e29b-41d4-a716-446655440003', 'rpg'),
('550e8400-e29b-41d4-a716-446655440004', 'strategy'),
('550e8400-e29b-41d4-a716-446655440005', 'simulation'),
('550e8400-e29b-41d4-a716-446655440006', 'sports'),
('550e8400-e29b-41d4-a716-446655440007', 'racing'),
('550e8400-e29b-41d4-a716-446655440008', 'puzzle'),
('550e8400-e29b-41d4-a716-446655440009', 'horror'),
('550e8400-e29b-41d4-a716-446655440010', 'indie')
ON CONFLICT (id) DO NOTHING;