-- Fichier principal qui orchestre l'exécution de tous les seeds
-- Ce fichier appelle tous les seeds dans l'ordre correct

-- Seeding languages
INSERT INTO languages (code, name, native_name, is_default) VALUES
('fr', 'French', 'Français', true),
('en', 'English', 'English', false)
ON CONFLICT (code) DO NOTHING;

-- Seeding genres
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

-- Seeding genre translations (French)
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
('550e8400-e29b-41d4-a716-446655440010', 'fr', 'Indépendant', 'Jeux indépendants créatifs')
ON CONFLICT (genre_id, language_code) DO NOTHING;

-- Seeding genre translations (English)
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
('550e8400-e29b-41d4-a716-446655440010', 'en', 'Indie', 'Creative independent games')
ON CONFLICT (genre_id, language_code) DO NOTHING;

-- Seeding sample games (sans les colonnes de prix qui sont maintenant dans game_prices)
INSERT INTO games (id, slug, release_date, metascore, pegi_rating) VALUES
('660e8400-e29b-41d4-a716-446655440001', 'the-witcher-3', '2015-05-19', 93, 18),
('660e8400-e29b-41d4-a716-446655440002', 'cyberpunk-2077', '2020-12-10', 86, 18),
('660e8400-e29b-41d4-a716-446655440003', 'minecraft', '2011-11-18', 93, 7),
('660e8400-e29b-41d4-a716-446655440004', 'grand-theft-auto-v', '2013-09-17', 97, 18),
('660e8400-e29b-41d4-a716-446655440005', 'red-dead-redemption-2', '2018-10-26', 97, 18),
('660e8400-e29b-41d4-a716-446655440006', 'elden-ring', '2022-02-25', 96, 16),
('660e8400-e29b-41d4-a716-446655440007', 'god-of-war', '2018-04-20', 94, 18),
('660e8400-e29b-41d4-a716-446655440008', 'horizon-zero-dawn', '2017-02-28', 89, 16)
ON CONFLICT (id) DO NOTHING;

-- Seeding companies (les entreprises seront créées par la migration à partir des anciennes données)
-- Mais nous devons les créer manuellement ici car les anciennes colonnes n'existent plus
INSERT INTO companies (name, slug, company_type, description, website_url, founded_year, headquarters) VALUES
('CD Projekt RED', 'cd-projekt-red', 'developer', 'Studio de développement polonais célèbre pour la série The Witcher et Cyberpunk 2077.', 'https://www.cdprojektred.com', 2002, 'Varsovie, Pologne'),
('CD Projekt', 'cd-projekt', 'publisher', 'Éditeur et développeur polonais, société mère de CD Projekt RED.', 'https://www.cdprojekt.com', 1994, 'Varsovie, Pologne'),
('Mojang Studios', 'mojang-studios', 'developer', 'Studio de développement suédois créateur de Minecraft, racheté par Microsoft.', 'https://www.mojang.com', 2009, 'Stockholm, Suède'),
('Microsoft', 'microsoft', 'publisher', 'Géant technologique américain, propriétaire de Xbox et éditeur de nombreux jeux.', 'https://www.microsoft.com/gaming', 1975, 'Redmond, Washington, États-Unis'),
('Rockstar North', 'rockstar-north', 'developer', 'Studio de développement britannique, filiale de Take-Two Interactive, créateur de GTA.', 'https://www.rockstarnorth.com', 1988, 'Édimbourg, Écosse'),
('Rockstar Games', 'rockstar-games', 'publisher', 'Éditeur et développeur américain de jeux vidéo, filiale de Take-Two Interactive.', 'https://www.rockstargames.com', 1998, 'New York, États-Unis'),
('Rockstar Studios', 'rockstar-studios', 'developer', 'Ensemble des studios Rockstar pour Red Dead Redemption 2.', 'https://www.rockstargames.com', 1998, 'New York, États-Unis'),
('FromSoftware', 'fromsoftware', 'developer', 'Studio de développement japonais créateur de Dark Souls et Elden Ring.', 'https://www.fromsoftware.jp', 1986, 'Tokyo, Japon'),
('Bandai Namco Entertainment', 'bandai-namco-entertainment', 'publisher', 'Éditeur japonais de jeux vidéo et d''anime, filiale de Bandai Namco Holdings.', 'https://www.bandainamcoent.com', 2006, 'Tokyo, Japon'),
('Santa Monica Studio', 'santa-monica-studio', 'developer', 'Studio de développement américain appartenant à Sony, créateur de God of War.', 'https://sms.playstation.com', 1999, 'Los Angeles, Californie, États-Unis'),
('Sony Interactive Entertainment', 'sony-interactive-entertainment', 'publisher', 'Division jeux vidéo de Sony, éditeur des exclusivités PlayStation.', 'https://www.playstation.com/sie', 1993, 'San Mateo, Californie, États-Unis'),
('Guerrilla Games', 'guerrilla-games', 'developer', 'Studio de développement néerlandais créateur de Horizon Zero Dawn et Killzone.', 'https://www.guerrilla-games.com', 2000, 'Amsterdam, Pays-Bas')
ON CONFLICT (name) DO NOTHING;

-- Seeding game-company relationships
INSERT INTO game_companies (game_id, company_id, role, is_primary) VALUES
-- The Witcher 3
((SELECT id FROM games WHERE slug = 'the-witcher-3'), (SELECT id FROM companies WHERE name = 'CD Projekt RED'), 'developer', true),
((SELECT id FROM games WHERE slug = 'the-witcher-3'), (SELECT id FROM companies WHERE name = 'CD Projekt'), 'publisher', true),

-- Cyberpunk 2077
((SELECT id FROM games WHERE slug = 'cyberpunk-2077'), (SELECT id FROM companies WHERE name = 'CD Projekt RED'), 'developer', true),
((SELECT id FROM games WHERE slug = 'cyberpunk-2077'), (SELECT id FROM companies WHERE name = 'CD Projekt'), 'publisher', true),

-- Minecraft
((SELECT id FROM games WHERE slug = 'minecraft'), (SELECT id FROM companies WHERE name = 'Mojang Studios'), 'developer', true),
((SELECT id FROM games WHERE slug = 'minecraft'), (SELECT id FROM companies WHERE name = 'Microsoft'), 'publisher', true),

-- Grand Theft Auto V
((SELECT id FROM games WHERE slug = 'grand-theft-auto-v'), (SELECT id FROM companies WHERE name = 'Rockstar North'), 'developer', true),
((SELECT id FROM games WHERE slug = 'grand-theft-auto-v'), (SELECT id FROM companies WHERE name = 'Rockstar Games'), 'publisher', true),

-- Red Dead Redemption 2
((SELECT id FROM games WHERE slug = 'red-dead-redemption-2'), (SELECT id FROM companies WHERE name = 'Rockstar Studios'), 'developer', true),
((SELECT id FROM games WHERE slug = 'red-dead-redemption-2'), (SELECT id FROM companies WHERE name = 'Rockstar Games'), 'publisher', true),

-- Elden Ring
((SELECT id FROM games WHERE slug = 'elden-ring'), (SELECT id FROM companies WHERE name = 'FromSoftware'), 'developer', true),
((SELECT id FROM games WHERE slug = 'elden-ring'), (SELECT id FROM companies WHERE name = 'Bandai Namco Entertainment'), 'publisher', true),

-- God of War
((SELECT id FROM games WHERE slug = 'god-of-war'), (SELECT id FROM companies WHERE name = 'Santa Monica Studio'), 'developer', true),
((SELECT id FROM games WHERE slug = 'god-of-war'), (SELECT id FROM companies WHERE name = 'Sony Interactive Entertainment'), 'publisher', true),

-- Horizon Zero Dawn
((SELECT id FROM games WHERE slug = 'horizon-zero-dawn'), (SELECT id FROM companies WHERE name = 'Guerrilla Games'), 'developer', true),
((SELECT id FROM games WHERE slug = 'horizon-zero-dawn'), (SELECT id FROM companies WHERE name = 'Sony Interactive Entertainment'), 'publisher', true)
ON CONFLICT (game_id, company_id, role) DO NOTHING;

-- Seeding sample game translations
INSERT INTO game_translations (game_id, language_code, title, description) VALUES
-- The Witcher 3
('660e8400-e29b-41d4-a716-446655440001', 'fr', 'The Witcher 3: Wild Hunt', 'Un RPG épique dans un monde ouvert fantastique. Incarnez Geralt de Riv dans sa quête pour retrouver Ciri et affronter la Chasse Sauvage dans un univers riche et immersif.'),
('660e8400-e29b-41d4-a716-446655440001', 'en', 'The Witcher 3: Wild Hunt', 'An epic RPG in a fantasy open world. Play as Geralt of Rivia in his quest to find Ciri and face the Wild Hunt in a rich and immersive universe.'),

-- Cyberpunk 2077
('660e8400-e29b-41d4-a716-446655440002', 'fr', 'Cyberpunk 2077', 'Un RPG d''action futuriste dans la mégalopole de Night City. Personnalisez votre cyberpunk et façonnez votre destin dans un monde dystopique fascinant.'),
('660e8400-e29b-41d4-a716-446655440002', 'en', 'Cyberpunk 2077', 'A futuristic action RPG in the Night City megalopolis. Customize your cyberpunk and shape your destiny in a fascinating dystopian world.'),

-- Minecraft
('660e8400-e29b-41d4-a716-446655440003', 'fr', 'Minecraft', 'Le jeu de construction et d''aventure ultime. Construisez, explorez et survivez dans des mondes infinis générés procéduralement.'),
('660e8400-e29b-41d4-a716-446655440003', 'en', 'Minecraft', 'The ultimate building and adventure game. Build, explore and survive in infinite procedurally generated worlds.'),

-- Grand Theft Auto V
('660e8400-e29b-41d4-a716-446655440004', 'fr', 'Grand Theft Auto V', 'Un jeu d''action en monde ouvert dans la ville fictive de Los Santos. Vivez trois histoires entremêlées dans l''univers criminel de GTA.'),
('660e8400-e29b-41d4-a716-446655440004', 'en', 'Grand Theft Auto V', 'An open-world action game in the fictional city of Los Santos. Experience three intertwined stories in the criminal universe of GTA.'),

-- Red Dead Redemption 2
('660e8400-e29b-41d4-a716-446655440005', 'fr', 'Red Dead Redemption 2', 'Un western épique dans l''Amérique de 1899. Suivez Arthur Morgan et la bande de Dutch van der Linde dans leur lutte pour la survie.'),
('660e8400-e29b-41d4-a716-446655440005', 'en', 'Red Dead Redemption 2', 'An epic western set in 1899 America. Follow Arthur Morgan and Dutch van der Linde''s gang in their struggle for survival.'),

-- Elden Ring
('660e8400-e29b-41d4-a716-446655440006', 'fr', 'Elden Ring', 'Un action-RPG fantasy créé par FromSoftware et George R.R. Martin. Explorez l''Entre-terre et devenez le Seigneur de l''Anneau d''Elden.'),
('660e8400-e29b-41d4-a716-446655440006', 'en', 'Elden Ring', 'A fantasy action-RPG created by FromSoftware and George R.R. Martin. Explore the Lands Between and become the Elden Lord.'),

-- God of War
('660e8400-e29b-41d4-a716-446655440007', 'fr', 'God of War', 'Kratos et son fils Atreus partent en voyage dans les terres nordiques. Une aventure épique mêlant mythologie et émotion.'),
('660e8400-e29b-41d4-a716-446655440007', 'en', 'God of War', 'Kratos and his son Atreus embark on a journey through Norse lands. An epic adventure blending mythology and emotion.'),

-- Horizon Zero Dawn
('660e8400-e29b-41d4-a716-446655440008', 'fr', 'Horizon Zero Dawn', 'Dans un monde post-apocalyptique dominé par les machines, suivez Aloy dans sa quête pour découvrir les secrets du passé.'),
('660e8400-e29b-41d4-a716-446655440008', 'en', 'Horizon Zero Dawn', 'In a post-apocalyptic world dominated by machines, follow Aloy in her quest to discover the secrets of the past.')
ON CONFLICT (game_id, language_code) DO NOTHING;

-- Seeding sample game genres associations
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

-- Seeding cover images pour les jeux
UPDATE games SET cover_image_url = '/images/witcher3-cover.jpg' WHERE slug = 'the-witcher-3';
UPDATE games SET cover_image_url = '/images/cyberpunk-cover.jpg' WHERE slug = 'cyberpunk-2077';
UPDATE games SET cover_image_url = '/images/minecraft-cover.jpg' WHERE slug = 'minecraft';
UPDATE games SET cover_image_url = '/images/gtav-cover.jpg' WHERE slug = 'grand-theft-auto-v';
UPDATE games SET cover_image_url = '/images/rdr2-cover.jpg' WHERE slug = 'red-dead-redemption-2';
UPDATE games SET cover_image_url = '/images/eldenring-cover.jpg' WHERE slug = 'elden-ring';
UPDATE games SET cover_image_url = '/images/gow-cover.jpg' WHERE slug = 'god-of-war';
UPDATE games SET cover_image_url = '/images/hzd-cover.jpg' WHERE slug = 'horizon-zero-dawn';

-- Seeding sample media (screenshots, artwork, videos) pour quelques jeux
-- Screenshots pour The Witcher 3
INSERT INTO game_screenshots (game_id, url, alt_text, caption, display_order, is_featured) VALUES
('660e8400-e29b-41d4-a716-446655440001', '/images/witcher3-screenshot-1.jpg', 'Geralt dans les marais de Velen', 'Exploration des vastes marais de Velen', 1, true),
('660e8400-e29b-41d4-a716-446655440001', '/images/witcher3-screenshot-2.jpg', 'Combat contre un griffon', 'Combat épique contre un griffon royal', 2, false),
('660e8400-e29b-41d4-a716-446655440001', '/images/witcher3-screenshot-3.jpg', 'Novigrad la nuit', 'Les rues animées de Novigrad sous les étoiles', 3, false)
ON CONFLICT (id) DO NOTHING;

-- Artwork pour The Witcher 3
INSERT INTO game_artwork (game_id, url, alt_text, caption, artwork_type, display_order, is_featured) VALUES
('660e8400-e29b-41d4-a716-446655440001', '/images/witcher3-artwork-1.jpg', 'Geralt et Ciri', 'Art conceptuel de Geralt et Ciri', 'concept', 1, true),
('660e8400-e29b-41d4-a716-446655440001', '/images/witcher3-artwork-2.jpg', 'Paysage de Skellige', 'Les îles mystiques de Skellige', 'concept', 2, false)
ON CONFLICT (id) DO NOTHING;

-- Vidéos pour The Witcher 3
INSERT INTO game_videos (game_id, url, thumbnail_url, title, description, video_type, duration_seconds, display_order, is_featured) VALUES
('660e8400-e29b-41d4-a716-446655440001', '/videos/witcher3-trailer.mp4', '/images/witcher3-trailer-thumb.jpg', 'Bande-annonce officielle', 'La bande-annonce de lancement de The Witcher 3', 'trailer', 180, 1, true),
('660e8400-e29b-41d4-a716-446655440001', '/videos/witcher3-gameplay.mp4', '/images/witcher3-gameplay-thumb.jpg', 'Gameplay - Combat', 'Démonstration du système de combat', 'gameplay', 300, 2, false)
ON CONFLICT (id) DO NOTHING;

-- Screenshots pour Cyberpunk 2077
INSERT INTO game_screenshots (game_id, url, alt_text, caption, display_order, is_featured) VALUES
('660e8400-e29b-41d4-a716-446655440002', '/images/cyberpunk-screenshot-1.jpg', 'Night City vue panoramique', 'Vue panoramique de Night City illuminée', 1, true),
('660e8400-e29b-41d4-a716-446655440002', '/images/cyberpunk-screenshot-2.jpg', 'V dans les rues', 'Le protagoniste V explorant les rues de Night City', 2, false)
ON CONFLICT (id) DO NOTHING;

-- Artwork pour Cyberpunk 2077
INSERT INTO game_artwork (game_id, url, alt_text, caption, artwork_type, display_order, is_featured) VALUES
('660e8400-e29b-41d4-a716-446655440002', '/images/cyberpunk-artwork-1.jpg', 'V et Johnny Silverhand', 'Art promotionnel de V et Johnny Silverhand', 'promotional', 1, true)
ON CONFLICT (id) DO NOTHING;

-- Screenshots pour Minecraft
INSERT INTO game_screenshots (game_id, url, alt_text, caption, display_order, is_featured) VALUES
('660e8400-e29b-41d4-a716-446655440003', '/images/minecraft-screenshot-1.jpg', 'Construction massive', 'Une construction impressionnante en mode créatif', 1, true),
('660e8400-e29b-41d4-a716-446655440003', '/images/minecraft-screenshot-2.jpg', 'Paysage généré', 'Un magnifique paysage généré procéduralement', 2, false)
ON CONFLICT (id) DO NOTHING;

-- Enrichissement des données des entreprises
UPDATE companies SET 
    description = 'Studio de développement polonais célèbre pour la série The Witcher et Cyberpunk 2077.',
    website_url = 'https://www.cdprojektred.com',
    logo_url = '/images/companies/cd-projekt-red-logo.png',
    founded_year = 2002,
    headquarters = 'Varsovie, Pologne',
    company_type = 'both'
WHERE name = 'CD Projekt RED';

UPDATE companies SET 
    description = 'Éditeur et développeur polonais, société mère de CD Projekt RED.',
    website_url = 'https://www.cdprojekt.com',
    logo_url = '/images/companies/cd-projekt-logo.png',
    founded_year = 1994,
    headquarters = 'Varsovie, Pologne',
    company_type = 'both'
WHERE name = 'CD Projekt';

UPDATE companies SET 
    description = 'Studio de développement suédois créateur de Minecraft, racheté par Microsoft.',
    website_url = 'https://www.mojang.com',
    logo_url = '/images/companies/mojang-logo.png',
    founded_year = 2009,
    headquarters = 'Stockholm, Suède',
    company_type = 'developer'
WHERE name = 'Mojang Studios';

UPDATE companies SET 
    description = 'Géant technologique américain, propriétaire de Xbox et éditeur de nombreux jeux.',
    website_url = 'https://www.microsoft.com/gaming',
    logo_url = '/images/companies/microsoft-logo.png',
    founded_year = 1975,
    headquarters = 'Redmond, Washington, États-Unis',
    company_type = 'publisher'
WHERE name = 'Microsoft';

-- Seeding des prix de base pour les jeux (utilisant les données migrées)
-- Ces prix seront créés par la migration, mais nous les ajoutons ici pour les nouveaux environnements

-- Créer des prix de base pour tous les jeux avec la plateforme générique
INSERT INTO game_prices (game_id, platform_id, region_id, edition_id, regular_price, current_price, currency_code, price_type, is_available)
SELECT 
    g.id,
    (SELECT id FROM platforms WHERE slug = 'generic'),
    (SELECT id FROM regions WHERE code = 'GLOBAL'),
    (SELECT id FROM game_editions WHERE game_id = g.id AND is_base_edition = true),
    CASE g.slug
        WHEN 'the-witcher-3' THEN 59.99
        WHEN 'cyberpunk-2077' THEN 59.99
        WHEN 'minecraft' THEN 26.95
        WHEN 'grand-theft-auto-v' THEN 59.99
        WHEN 'red-dead-redemption-2' THEN 59.99
        WHEN 'elden-ring' THEN 59.99
        WHEN 'god-of-war' THEN 59.99
        WHEN 'horizon-zero-dawn' THEN 59.99
        ELSE 39.99
    END,
    CASE g.slug
        WHEN 'the-witcher-3' THEN 29.99
        WHEN 'cyberpunk-2077' THEN 39.99
        WHEN 'minecraft' THEN 26.95
        WHEN 'grand-theft-auto-v' THEN 29.99
        WHEN 'red-dead-redemption-2' THEN 49.99
        WHEN 'elden-ring' THEN 59.99
        WHEN 'god-of-war' THEN 19.99
        WHEN 'horizon-zero-dawn' THEN 19.99
        ELSE 29.99
    END,
    'USD',
    CASE 
        WHEN g.slug IN ('the-witcher-3', 'grand-theft-auto-v', 'god-of-war', 'horizon-zero-dawn') THEN 'sale'
        ELSE 'regular'
    END,
    true
FROM games g
ON CONFLICT (game_id, platform_id, region_id, edition_id) DO NOTHING;
-- Créer les éditions de base pour tous les jeux
INSERT INTO game_editions (game_id, name, slug, description, is_base_edition, display_order)
SELECT 
    id,
    'Standard Edition',
    'standard',
    'The standard edition of the game with base content.',
    true,
    0
FROM games
ON CONFLICT (game_id, slug) DO NOTHING;

-- Créer quelques éditions spéciales pour certains jeux populaires
INSERT INTO game_editions (game_id, name, slug, description, included_content, is_base_edition, display_order)
SELECT 
    g.id,
    'Deluxe Edition',
    'deluxe',
    'Enhanced edition with additional content and bonuses.',
    ARRAY['Base Game', 'Season Pass', 'Digital Soundtrack', 'Digital Artbook', 'Exclusive In-Game Items'],
    false,
    1
FROM games g
WHERE g.slug IN ('the-witcher-3', 'cyberpunk-2077', 'elden-ring', 'god-of-war')
ON CONFLICT (game_id, slug) DO NOTHING;