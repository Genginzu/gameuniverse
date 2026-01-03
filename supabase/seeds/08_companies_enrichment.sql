-- Seeds pour enrichir les données des entreprises
-- Ajout d'informations détaillées pour les entreprises existantes

-- D'abord, créer les entreprises manquantes
INSERT INTO companies (name, slug, description, website_url, logo_url, founded_year, headquarters, company_type) VALUES
('CD Projekt RED', 'cd-projekt-red', 'Studio de développement polonais célèbre pour la série The Witcher et Cyberpunk 2077.', 'https://www.cdprojektred.com', '/images/companies/cd-projekt-red-logo.png', 2002, 'Varsovie, Pologne', 'developer'),
('CD Projekt', 'cd-projekt', 'Éditeur et développeur polonais, société mère de CD Projekt RED.', 'https://www.cdprojekt.com', '/images/companies/cd-projekt-logo.png', 1994, 'Varsovie, Pologne', 'publisher'),
('Mojang Studios', 'mojang-studios', 'Studio de développement suédois créateur de Minecraft, racheté par Microsoft.', 'https://www.mojang.com', '/images/companies/mojang-logo.png', 2009, 'Stockholm, Suède', 'developer'),
('Microsoft', 'microsoft', 'Géant technologique américain, propriétaire de Xbox et éditeur de nombreux jeux.', 'https://www.microsoft.com/gaming', '/images/companies/microsoft-logo.png', 1975, 'Redmond, Washington, États-Unis', 'publisher'),
('Rockstar North', 'rockstar-north', 'Studio de développement britannique, filiale de Take-Two Interactive, créateur de GTA.', 'https://www.rockstarnorth.com', '/images/companies/rockstar-north-logo.png', 1988, 'Édimbourg, Écosse', 'developer'),
('Rockstar Games', 'rockstar-games', 'Éditeur et développeur américain de jeux vidéo, filiale de Take-Two Interactive.', 'https://www.rockstargames.com', '/images/companies/rockstar-games-logo.png', 1998, 'New York, États-Unis', 'publisher'),
('Rockstar Studios', 'rockstar-studios', 'Ensemble des studios Rockstar pour Red Dead Redemption 2.', 'https://www.rockstargames.com', '/images/companies/rockstar-studios-logo.png', 1998, 'New York, États-Unis', 'developer'),
('FromSoftware', 'fromsoftware', 'Studio de développement japonais créateur de Dark Souls et Elden Ring.', 'https://www.fromsoftware.jp', '/images/companies/fromsoftware-logo.png', 1986, 'Tokyo, Japon', 'developer'),
('Bandai Namco Entertainment', 'bandai-namco-entertainment', 'Éditeur japonais de jeux vidéo et d''anime, filiale de Bandai Namco Holdings.', 'https://www.bandainamcoent.com', '/images/companies/bandai-namco-logo.png', 2006, 'Tokyo, Japon', 'publisher'),
('Santa Monica Studio', 'santa-monica-studio', 'Studio de développement américain appartenant à Sony, créateur de God of War.', 'https://sms.playstation.com', '/images/companies/santa-monica-studio-logo.png', 1999, 'Los Angeles, Californie, États-Unis', 'developer'),
('Sony Interactive Entertainment', 'sony-interactive-entertainment', 'Division jeux vidéo de Sony, éditeur des exclusivités PlayStation.', 'https://www.playstation.com/sie', '/images/companies/sony-interactive-logo.png', 1993, 'San Mateo, Californie, États-Unis', 'publisher'),
('Guerrilla Games', 'guerrilla-games', 'Studio de développement néerlandais créateur de Horizon Zero Dawn et Killzone.', 'https://www.guerrilla-games.com', '/images/companies/guerrilla-games-logo.png', 2000, 'Amsterdam, Pays-Bas', 'developer')
ON CONFLICT (name) DO NOTHING;

-- Créer les relations jeu-entreprise pour tous les jeux
-- The Witcher 3: Wild Hunt
INSERT INTO game_companies (game_id, company_id, role, is_primary) VALUES
((SELECT id FROM games WHERE slug = 'the-witcher-3'), (SELECT id FROM companies WHERE name = 'CD Projekt RED'), 'developer', true),
((SELECT id FROM games WHERE slug = 'the-witcher-3'), (SELECT id FROM companies WHERE name = 'CD Projekt'), 'publisher', true)
ON CONFLICT (game_id, company_id, role) DO NOTHING;

-- Cyberpunk 2077
INSERT INTO game_companies (game_id, company_id, role, is_primary) VALUES
((SELECT id FROM games WHERE slug = 'cyberpunk-2077'), (SELECT id FROM companies WHERE name = 'CD Projekt RED'), 'developer', true),
((SELECT id FROM games WHERE slug = 'cyberpunk-2077'), (SELECT id FROM companies WHERE name = 'CD Projekt'), 'publisher', true)
ON CONFLICT (game_id, company_id, role) DO NOTHING;

-- Minecraft
INSERT INTO game_companies (game_id, company_id, role, is_primary) VALUES
((SELECT id FROM games WHERE slug = 'minecraft'), (SELECT id FROM companies WHERE name = 'Mojang Studios'), 'developer', true),
((SELECT id FROM games WHERE slug = 'minecraft'), (SELECT id FROM companies WHERE name = 'Microsoft'), 'publisher', true)
ON CONFLICT (game_id, company_id, role) DO NOTHING;

-- Grand Theft Auto V
INSERT INTO game_companies (game_id, company_id, role, is_primary) VALUES
((SELECT id FROM games WHERE slug = 'grand-theft-auto-v'), (SELECT id FROM companies WHERE name = 'Rockstar North'), 'developer', true),
((SELECT id FROM games WHERE slug = 'grand-theft-auto-v'), (SELECT id FROM companies WHERE name = 'Rockstar Games'), 'publisher', true)
ON CONFLICT (game_id, company_id, role) DO NOTHING;

-- Red Dead Redemption 2
INSERT INTO game_companies (game_id, company_id, role, is_primary) VALUES
((SELECT id FROM games WHERE slug = 'red-dead-redemption-2'), (SELECT id FROM companies WHERE name = 'Rockstar Studios'), 'developer', true),
((SELECT id FROM games WHERE slug = 'red-dead-redemption-2'), (SELECT id FROM companies WHERE name = 'Rockstar Games'), 'publisher', true)
ON CONFLICT (game_id, company_id, role) DO NOTHING;

-- Elden Ring
INSERT INTO game_companies (game_id, company_id, role, is_primary) VALUES
((SELECT id FROM games WHERE slug = 'elden-ring'), (SELECT id FROM companies WHERE name = 'FromSoftware'), 'developer', true),
((SELECT id FROM games WHERE slug = 'elden-ring'), (SELECT id FROM companies WHERE name = 'Bandai Namco Entertainment'), 'publisher', true)
ON CONFLICT (game_id, company_id, role) DO NOTHING;

-- God of War
INSERT INTO game_companies (game_id, company_id, role, is_primary) VALUES
((SELECT id FROM games WHERE slug = 'god-of-war'), (SELECT id FROM companies WHERE name = 'Santa Monica Studio'), 'developer', true),
((SELECT id FROM games WHERE slug = 'god-of-war'), (SELECT id FROM companies WHERE name = 'Sony Interactive Entertainment'), 'publisher', true)
ON CONFLICT (game_id, company_id, role) DO NOTHING;

-- Horizon Zero Dawn
INSERT INTO game_companies (game_id, company_id, role, is_primary) VALUES
((SELECT id FROM games WHERE slug = 'horizon-zero-dawn'), (SELECT id FROM companies WHERE name = 'Guerrilla Games'), 'developer', true),
((SELECT id FROM games WHERE slug = 'horizon-zero-dawn'), (SELECT id FROM companies WHERE name = 'Sony Interactive Entertainment'), 'publisher', true)
ON CONFLICT (game_id, company_id, role) DO NOTHING;

-- Ajout d'entreprises supplémentaires pour des exemples de collaborations futures
INSERT INTO companies (name, slug, description, website_url, logo_url, founded_year, headquarters, company_type) VALUES
('Take-Two Interactive', 'take-two-interactive', 'Éditeur américain propriétaire de Rockstar Games et 2K Games.', 'https://www.take2games.com', '/images/companies/take-two-logo.png', 1993, 'New York, États-Unis', 'publisher'),
('Activision', 'activision', 'Éditeur américain de jeux vidéo, créateur de Call of Duty.', 'https://www.activision.com', '/images/companies/activision-logo.png', 1979, 'Santa Monica, Californie, États-Unis', 'publisher'),
('Treyarch', 'treyarch', 'Studio de développement américain spécialisé dans Call of Duty.', 'https://www.treyarch.com', '/images/companies/treyarch-logo.png', 1996, 'Santa Monica, Californie, États-Unis', 'developer'),
('Ubisoft', 'ubisoft', 'Éditeur et développeur français créateur d''Assassin''s Creed et Far Cry.', 'https://www.ubisoft.com', '/images/companies/ubisoft-logo.png', 1986, 'Montreuil, France', 'both'),
('Electronic Arts', 'electronic-arts', 'Éditeur américain créateur de FIFA, The Sims et Battlefield.', 'https://www.ea.com', '/images/companies/ea-logo.png', 1982, 'Redwood City, Californie, États-Unis', 'publisher')
ON CONFLICT (name) DO NOTHING;