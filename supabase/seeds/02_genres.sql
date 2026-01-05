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
('550e8400-e29b-41d4-a716-446655440010', 'indie'),
('550e8400-e29b-41d4-a716-446655440011', 'fps'),
('550e8400-e29b-41d4-a716-446655440012', 'platformer'),
('550e8400-e29b-41d4-a716-446655440013', 'fighting'),
('550e8400-e29b-41d4-a716-446655440014', 'mmo'),
('550e8400-e29b-41d4-a716-446655440015', 'survival'),
('550e8400-e29b-41d4-a716-446655440016', 'sandbox'),
('550e8400-e29b-41d4-a716-446655440017', 'roguelike'),
('550e8400-e29b-41d4-a716-446655440018', 'stealth'),
('550e8400-e29b-41d4-a716-446655440019', 'rhythm'),
('550e8400-e29b-41d4-a716-446655440020', 'tower-defense')
ON CONFLICT (id) DO NOTHING;