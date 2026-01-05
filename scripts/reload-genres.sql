-- Script pour recharger les genres et leurs associations
-- À exécuter dans Supabase SQL Editor ou via psql

-- Supprimer les associations existantes
DELETE FROM game_genres;

-- Supprimer les traductions existantes
DELETE FROM genre_translations;

-- Supprimer les genres existants
DELETE FROM genres;

-- Recharger les genres
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
('550e8400-e29b-41d4-a716-446655440020', 'tower-defense');

-- Recharger les traductions françaises
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
('550e8400-e29b-41d4-a716-446655440020', 'fr', 'Tower Defense', 'Jeux de défense de tour');

-- Recharger les traductions anglaises
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
('550e8400-e29b-41d4-a716-446655440020', 'en', 'Tower Defense', 'Tower defense strategy games');

-- Recharger les associations jeux-genres
INSERT INTO game_genres (game_id, genre_id) VALUES
-- The Witcher 3: RPG + Adventure
('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003'), -- RPG
('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002'), -- Adventure

-- Cyberpunk 2077: RPG + Action + FPS
('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003'), -- RPG
('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001'), -- Action
('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440011'), -- FPS

-- Minecraft: Simulation + Indie + Sandbox + Survival
('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440005'), -- Simulation
('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440010'), -- Indie
('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440016'), -- Sandbox
('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440015'), -- Survival

-- Grand Theft Auto V: Action + Adventure + Racing
('660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440001'), -- Action
('660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440002'), -- Adventure
('660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440007'), -- Racing

-- Red Dead Redemption 2: Action + Adventure + Simulation
('660e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440001'), -- Action
('660e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440002'), -- Adventure
('660e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440005'), -- Simulation

-- Elden Ring: RPG + Action + Indie
('660e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440003'), -- RPG
('660e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440001'), -- Action
('660e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440010'), -- Indie

-- God of War: Action + Adventure + Fighting
('660e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440001'), -- Action
('660e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440002'), -- Adventure
('660e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440013'), -- Fighting

-- Horizon Zero Dawn: Action + RPG + Stealth
('660e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440001'), -- Action
('660e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440003'), -- RPG
('660e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440018'); -- Stealth

-- Afficher le résultat
SELECT 
  g.slug,
  gt.name,
  COUNT(gg.game_id) as game_count
FROM genres g
LEFT JOIN genre_translations gt ON g.id = gt.genre_id AND gt.language_code = 'fr'
LEFT JOIN game_genres gg ON g.id = gg.genre_id
GROUP BY g.slug, gt.name
ORDER BY game_count DESC, gt.name;