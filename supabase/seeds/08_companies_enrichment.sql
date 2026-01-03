-- Seeds pour enrichir les données des entreprises
-- Ajout d'informations détaillées pour les entreprises existantes

-- Mise à jour des entreprises avec des informations détaillées
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

UPDATE companies SET 
    description = 'Studio de développement britannique, filiale de Take-Two Interactive, créateur de GTA.',
    website_url = 'https://www.rockstarnorth.com',
    logo_url = '/images/companies/rockstar-north-logo.png',
    founded_year = 1988,
    headquarters = 'Édimbourg, Écosse',
    company_type = 'developer'
WHERE name = 'Rockstar North';

UPDATE companies SET 
    description = 'Éditeur et développeur américain de jeux vidéo, filiale de Take-Two Interactive.',
    website_url = 'https://www.rockstargames.com',
    logo_url = '/images/companies/rockstar-games-logo.png',
    founded_year = 1998,
    headquarters = 'New York, États-Unis',
    company_type = 'both'
WHERE name = 'Rockstar Games';

UPDATE companies SET 
    description = 'Studio de développement japonais créateur de Dark Souls et Elden Ring.',
    website_url = 'https://www.fromsoftware.jp',
    logo_url = '/images/companies/fromsoftware-logo.png',
    founded_year = 1986,
    headquarters = 'Tokyo, Japon',
    company_type = 'developer'
WHERE name = 'FromSoftware';

UPDATE companies SET 
    description = 'Éditeur japonais de jeux vidéo et d''anime, filiale de Bandai Namco Holdings.',
    website_url = 'https://www.bandainamcoent.com',
    logo_url = '/images/companies/bandai-namco-logo.png',
    founded_year = 2006,
    headquarters = 'Tokyo, Japon',
    company_type = 'publisher'
WHERE name = 'Bandai Namco Entertainment';

UPDATE companies SET 
    description = 'Studio de développement américain appartenant à Sony, créateur de God of War.',
    website_url = 'https://sms.playstation.com',
    logo_url = '/images/companies/santa-monica-studio-logo.png',
    founded_year = 1999,
    headquarters = 'Los Angeles, Californie, États-Unis',
    company_type = 'developer'
WHERE name = 'Santa Monica Studio';

UPDATE companies SET 
    description = 'Division jeux vidéo de Sony, éditeur des exclusivités PlayStation.',
    website_url = 'https://www.playstation.com/sie',
    logo_url = '/images/companies/sony-interactive-logo.png',
    founded_year = 1993,
    headquarters = 'San Mateo, Californie, États-Unis',
    company_type = 'publisher'
WHERE name = 'Sony Interactive Entertainment';

UPDATE companies SET 
    description = 'Studio de développement néerlandais créateur de Horizon Zero Dawn et Killzone.',
    website_url = 'https://www.guerrilla-games.com',
    logo_url = '/images/companies/guerrilla-games-logo.png',
    founded_year = 2000,
    headquarters = 'Amsterdam, Pays-Bas',
    company_type = 'developer'
WHERE name = 'Guerrilla Games';

-- Ajout d'entreprises supplémentaires pour des exemples de collaborations
INSERT INTO companies (name, slug, description, website_url, logo_url, founded_year, headquarters, company_type) VALUES
('Take-Two Interactive', 'take-two-interactive', 'Éditeur américain propriétaire de Rockstar Games et 2K Games.', 'https://www.take2games.com', '/images/companies/take-two-logo.png', 1993, 'New York, États-Unis', 'publisher'),
('Activision', 'activision', 'Éditeur américain de jeux vidéo, créateur de Call of Duty.', 'https://www.activision.com', '/images/companies/activision-logo.png', 1979, 'Santa Monica, Californie, États-Unis', 'publisher'),
('Treyarch', 'treyarch', 'Studio de développement américain spécialisé dans Call of Duty.', 'https://www.treyarch.com', '/images/companies/treyarch-logo.png', 1996, 'Santa Monica, Californie, États-Unis', 'developer'),
('Ubisoft', 'ubisoft', 'Éditeur et développeur français créateur d''Assassin''s Creed et Far Cry.', 'https://www.ubisoft.com', '/images/companies/ubisoft-logo.png', 1986, 'Montreuil, France', 'both'),
('Electronic Arts', 'electronic-arts', 'Éditeur américain créateur de FIFA, The Sims et Battlefield.', 'https://www.ea.com', '/images/companies/ea-logo.png', 1982, 'Redwood City, Californie, États-Unis', 'publisher')
ON CONFLICT (name) DO NOTHING;

-- Exemple de jeu avec plusieurs développeurs (pour démonstration future)
-- Ceci sera utile quand nous ajouterons plus de jeux avec des collaborations