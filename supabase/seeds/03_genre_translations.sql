-- Seeds pour les traductions des genres
-- Traductions en français et anglais pour tous les genres

-- Traductions françaises des genres
INSERT INTO genre_translations (genre_id, language_code, name, description) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'fr', 'Action', 'Jeux d''action et d''aventure rapides'),
('550e8400-e29b-41d4-a716-446655440002', 'fr', 'Aventure', 'Jeux d''aventure et d''exploration'),
('550e8400-e29b-41d4-a716-446655440003', 'fr', 'RPG', 'Jeux de rôle et progression de personnage'),
('550e8400-e29b-41d4-a716-446655440004', 'fr', 'Stratégie', 'Jeux de stratégie et tactique'),
('550e8400-e29b-41d4-a716-446655440005', 'fr', 'Simulation', 'Jeux de simulation réaliste'),
('550e8400-e29b-41d4-a716-446655440006', 'fr', 'Sport', 'Jeux de sport et compétition'),
('550e8400-e29b-41d4-a716-446655440007', 'fr', 'Course', 'Jeux de course automobile'),
('550e8400-e29b-41d4-a716-446655440008', 'fr', 'Puzzle', 'Jeux de réflexion et énigmes'),
('550e8400-e29b-41d4-a716-446655440009', 'fr', 'Horreur', 'Jeux d''horreur et suspense'),
('550e8400-e29b-41d4-a716-446655440010', 'fr', 'Indépendant', 'Jeux indépendants créatifs'),
('550e8400-e29b-41d4-a716-446655440011', 'fr', 'FPS', 'Jeux de tir à la première personne'),
('550e8400-e29b-41d4-a716-446655440012', 'fr', 'Plateforme', 'Jeux de plateforme et saut'),
('550e8400-e29b-41d4-a716-446655440013', 'fr', 'Combat', 'Jeux de combat et arts martiaux'),
('550e8400-e29b-41d4-a716-446655440014', 'fr', 'MMO', 'Jeux massivement multijoueurs'),
('550e8400-e29b-41d4-a716-446655440015', 'fr', 'Survie', 'Jeux de survie et crafting'),
('550e8400-e29b-41d4-a716-446655440016', 'fr', 'Bac à sable', 'Jeux de création libre'),
('550e8400-e29b-41d4-a716-446655440017', 'fr', 'Roguelike', 'Jeux avec génération procédurale'),
('550e8400-e29b-41d4-a716-446655440018', 'fr', 'Infiltration', 'Jeux d''infiltration et discrétion'),
('550e8400-e29b-41d4-a716-446655440019', 'fr', 'Rythme', 'Jeux musicaux et de rythme'),
('550e8400-e29b-41d4-a716-446655440020', 'fr', 'Tower Defense', 'Jeux de défense de tour')
ON CONFLICT (genre_id, language_code) DO NOTHING;

-- Traductions anglaises des genres
INSERT INTO genre_translations (genre_id, language_code, name, description) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'en', 'Action', 'Fast-paced action and adventure games'),
('550e8400-e29b-41d4-a716-446655440002', 'en', 'Adventure', 'Adventure and exploration games'),
('550e8400-e29b-41d4-a716-446655440003', 'en', 'RPG', 'Role-playing and character progression games'),
('550e8400-e29b-41d4-a716-446655440004', 'en', 'Strategy', 'Strategy and tactical games'),
('550e8400-e29b-41d4-a716-446655440005', 'en', 'Simulation', 'Realistic simulation games'),
('550e8400-e29b-41d4-a716-446655440006', 'en', 'Sports', 'Sports and competition games'),
('550e8400-e29b-41d4-a716-446655440007', 'en', 'Racing', 'Racing and driving games'),
('550e8400-e29b-41d4-a716-446655440008', 'en', 'Puzzle', 'Puzzle and brain teaser games'),
('550e8400-e29b-41d4-a716-446655440009', 'en', 'Horror', 'Horror and suspense games'),
('550e8400-e29b-41d4-a716-446655440010', 'en', 'Indie', 'Creative independent games'),
('550e8400-e29b-41d4-a716-446655440011', 'en', 'FPS', 'First-person shooter games'),
('550e8400-e29b-41d4-a716-446655440012', 'en', 'Platformer', 'Platform and jumping games'),
('550e8400-e29b-41d4-a716-446655440013', 'en', 'Fighting', 'Fighting and martial arts games'),
('550e8400-e29b-41d4-a716-446655440014', 'en', 'MMO', 'Massively multiplayer online games'),
('550e8400-e29b-41d4-a716-446655440015', 'en', 'Survival', 'Survival and crafting games'),
('550e8400-e29b-41d4-a716-446655440016', 'en', 'Sandbox', 'Open-world creative games'),
('550e8400-e29b-41d4-a716-446655440017', 'en', 'Roguelike', 'Procedurally generated games'),
('550e8400-e29b-41d4-a716-446655440018', 'en', 'Stealth', 'Stealth and infiltration games'),
('550e8400-e29b-41d4-a716-446655440019', 'en', 'Rhythm', 'Music and rhythm games'),
('550e8400-e29b-41d4-a716-446655440020', 'en', 'Tower Defense', 'Tower defense strategy games')
ON CONFLICT (genre_id, language_code) DO NOTHING;