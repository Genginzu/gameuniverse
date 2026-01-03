-- Seeds pour les jeux d'exemple
-- Jeux populaires pour tester et démontrer la plateforme

INSERT INTO games (id, slug, release_date, metascore, pegi_rating, cover_image_url) VALUES
('660e8400-e29b-41d4-a716-446655440001', 'the-witcher-3', '2015-05-19', 93, 18, '/images/witcher3-cover.jpg'),
('660e8400-e29b-41d4-a716-446655440002', 'cyberpunk-2077', '2020-12-10', 86, 18, '/images/cyberpunk-cover.jpg'),
('660e8400-e29b-41d4-a716-446655440003', 'minecraft', '2011-11-18', 93, 7, '/images/minecraft-cover.jpg'),
('660e8400-e29b-41d4-a716-446655440004', 'grand-theft-auto-v', '2013-09-17', 97, 18, '/images/gtav-cover.jpg'),
('660e8400-e29b-41d4-a716-446655440005', 'red-dead-redemption-2', '2018-10-26', 97, 18, '/images/rdr2-cover.jpg'),
('660e8400-e29b-41d4-a716-446655440006', 'elden-ring', '2022-02-25', 96, 16, '/images/eldenring-cover.jpg'),
('660e8400-e29b-41d4-a716-446655440007', 'god-of-war', '2018-04-20', 94, 18, '/images/gow-cover.jpg'),
('660e8400-e29b-41d4-a716-446655440008', 'horizon-zero-dawn', '2017-02-28', 89, 16, '/images/hzd-cover.jpg')
ON CONFLICT (id) DO NOTHING;