-- Seed 11: Données des systèmes de classification
-- Insertion des systèmes de classification et leurs données

-- Insertion des systèmes de classification principaux
INSERT INTO rating_systems (code, name, description, country_codes, website_url) VALUES
('PEGI', 'Pan European Game Information', 'Système de classification européen pour les jeux vidéo', ARRAY['FR', 'DE', 'IT', 'ES', 'NL', 'BE', 'AT', 'PT', 'FI', 'DK', 'SE', 'NO', 'IS', 'LU', 'IE', 'GR', 'CY', 'MT', 'EE', 'LV', 'LT', 'PL', 'CZ', 'SK', 'HU', 'SI', 'HR', 'BG', 'RO'], 'https://pegi.info/'),
('ESRB', 'Entertainment Software Rating Board', 'Système de classification nord-américain', ARRAY['US', 'CA'], 'https://www.esrb.org/'),
('CERO', 'Computer Entertainment Rating Organization', 'Système de classification japonais', ARRAY['JP'], 'https://www.cero.gr.jp/'),
('USK', 'Unterhaltungssoftware Selbstkontrolle', 'Système de classification allemand', ARRAY['DE'], 'https://usk.de/'),
('OFLC', 'Office of Film and Literature Classification', 'Système de classification australien', ARRAY['AU'], 'https://www.classification.gov.au/');

-- Insertion des classifications PEGI
INSERT INTO ratings (rating_system_id, code, display_name, minimum_age, color_hex, description, sort_order)
SELECT rs.id, '3', 'PEGI 3', 3, '#00B04F', 'Convient à tous les âges', 1
FROM rating_systems rs WHERE rs.code = 'PEGI'
UNION ALL
SELECT rs.id, '7', 'PEGI 7', 7, '#73C442', 'Peut effrayer les très jeunes enfants', 2
FROM rating_systems rs WHERE rs.code = 'PEGI'
UNION ALL
SELECT rs.id, '12', 'PEGI 12', 12, '#F9A825', 'Contenu inapproprié pour les moins de 12 ans', 3
FROM rating_systems rs WHERE rs.code = 'PEGI'
UNION ALL
SELECT rs.id, '16', 'PEGI 16', 16, '#FF6F00', 'Contenu inapproprié pour les moins de 16 ans', 4
FROM rating_systems rs WHERE rs.code = 'PEGI'
UNION ALL
SELECT rs.id, '18', 'PEGI 18', 18, '#D32F2F', 'Convient uniquement aux adultes', 5
FROM rating_systems rs WHERE rs.code = 'PEGI';

-- Insertion des classifications ESRB
INSERT INTO ratings (rating_system_id, code, display_name, minimum_age, color_hex, description, sort_order)
SELECT rs.id, 'EC', 'ESRB EC', 3, '#00B04F', 'Early Childhood', 1
FROM rating_systems rs WHERE rs.code = 'ESRB'
UNION ALL
SELECT rs.id, 'E', 'ESRB E', 6, '#73C442', 'Everyone', 2
FROM rating_systems rs WHERE rs.code = 'ESRB'
UNION ALL
SELECT rs.id, 'E10+', 'ESRB E10+', 10, '#9CCC65', 'Everyone 10+', 3
FROM rating_systems rs WHERE rs.code = 'ESRB'
UNION ALL
SELECT rs.id, 'T', 'ESRB T', 13, '#F9A825', 'Teen', 4
FROM rating_systems rs WHERE rs.code = 'ESRB'
UNION ALL
SELECT rs.id, 'M', 'ESRB M', 17, '#FF6F00', 'Mature 17+', 5
FROM rating_systems rs WHERE rs.code = 'ESRB'
UNION ALL
SELECT rs.id, 'AO', 'ESRB AO', 18, '#D32F2F', 'Adults Only 18+', 6
FROM rating_systems rs WHERE rs.code = 'ESRB';

-- Insertion des descripteurs de contenu PEGI
INSERT INTO content_descriptors (rating_system_id, code)
SELECT rs.id, 'VIOLENCE'
FROM rating_systems rs WHERE rs.code = 'PEGI'
UNION ALL
SELECT rs.id, 'BAD_LANGUAGE'
FROM rating_systems rs WHERE rs.code = 'PEGI'
UNION ALL
SELECT rs.id, 'FEAR'
FROM rating_systems rs WHERE rs.code = 'PEGI'
UNION ALL
SELECT rs.id, 'GAMBLING'
FROM rating_systems rs WHERE rs.code = 'PEGI'
UNION ALL
SELECT rs.id, 'SEX'
FROM rating_systems rs WHERE rs.code = 'PEGI'
UNION ALL
SELECT rs.id, 'DRUGS'
FROM rating_systems rs WHERE rs.code = 'PEGI'
UNION ALL
SELECT rs.id, 'DISCRIMINATION'
FROM rating_systems rs WHERE rs.code = 'PEGI'
UNION ALL
SELECT rs.id, 'ONLINE'
FROM rating_systems rs WHERE rs.code = 'PEGI';

-- Insertion des descripteurs de contenu ESRB
INSERT INTO content_descriptors (rating_system_id, code)
SELECT rs.id, 'ALCOHOL_REFERENCE'
FROM rating_systems rs WHERE rs.code = 'ESRB'
UNION ALL
SELECT rs.id, 'ANIMATED_BLOOD'
FROM rating_systems rs WHERE rs.code = 'ESRB'
UNION ALL
SELECT rs.id, 'BLOOD'
FROM rating_systems rs WHERE rs.code = 'ESRB'
UNION ALL
SELECT rs.id, 'BLOOD_AND_GORE'
FROM rating_systems rs WHERE rs.code = 'ESRB'
UNION ALL
SELECT rs.id, 'CARTOON_VIOLENCE'
FROM rating_systems rs WHERE rs.code = 'ESRB'
UNION ALL
SELECT rs.id, 'CRUDE_HUMOR'
FROM rating_systems rs WHERE rs.code = 'ESRB'
UNION ALL
SELECT rs.id, 'DRUG_REFERENCE'
FROM rating_systems rs WHERE rs.code = 'ESRB'
UNION ALL
SELECT rs.id, 'FANTASY_VIOLENCE'
FROM rating_systems rs WHERE rs.code = 'ESRB'
UNION ALL
SELECT rs.id, 'INTENSE_VIOLENCE'
FROM rating_systems rs WHERE rs.code = 'ESRB'
UNION ALL
SELECT rs.id, 'LANGUAGE'
FROM rating_systems rs WHERE rs.code = 'ESRB'
UNION ALL
SELECT rs.id, 'LYRICS'
FROM rating_systems rs WHERE rs.code = 'ESRB'
UNION ALL
SELECT rs.id, 'MATURE_HUMOR'
FROM rating_systems rs WHERE rs.code = 'ESRB'
UNION ALL
SELECT rs.id, 'NUDITY'
FROM rating_systems rs WHERE rs.code = 'ESRB'
UNION ALL
SELECT rs.id, 'PARTIAL_NUDITY'
FROM rating_systems rs WHERE rs.code = 'ESRB'
UNION ALL
SELECT rs.id, 'REAL_GAMBLING'
FROM rating_systems rs WHERE rs.code = 'ESRB'
UNION ALL
SELECT rs.id, 'SEXUAL_CONTENT'
FROM rating_systems rs WHERE rs.code = 'ESRB'
UNION ALL
SELECT rs.id, 'SEXUAL_THEMES'
FROM rating_systems rs WHERE rs.code = 'ESRB'
UNION ALL
SELECT rs.id, 'SEXUAL_VIOLENCE'
FROM rating_systems rs WHERE rs.code = 'ESRB'
UNION ALL
SELECT rs.id, 'SIMULATED_GAMBLING'
FROM rating_systems rs WHERE rs.code = 'ESRB'
UNION ALL
SELECT rs.id, 'STRONG_LANGUAGE'
FROM rating_systems rs WHERE rs.code = 'ESRB'
UNION ALL
SELECT rs.id, 'STRONG_SEXUAL_CONTENT'
FROM rating_systems rs WHERE rs.code = 'ESRB'
UNION ALL
SELECT rs.id, 'SUGGESTIVE_THEMES'
FROM rating_systems rs WHERE rs.code = 'ESRB'
UNION ALL
SELECT rs.id, 'TOBACCO_REFERENCE'
FROM rating_systems rs WHERE rs.code = 'ESRB'
UNION ALL
SELECT rs.id, 'USE_OF_DRUGS'
FROM rating_systems rs WHERE rs.code = 'ESRB'
UNION ALL
SELECT rs.id, 'USE_OF_ALCOHOL'
FROM rating_systems rs WHERE rs.code = 'ESRB'
UNION ALL
SELECT rs.id, 'USE_OF_TOBACCO'
FROM rating_systems rs WHERE rs.code = 'ESRB'
UNION ALL
SELECT rs.id, 'VIOLENCE'
FROM rating_systems rs WHERE rs.code = 'ESRB'
UNION ALL
SELECT rs.id, 'VIOLENT_REFERENCES'
FROM rating_systems rs WHERE rs.code = 'ESRB'
UNION ALL
SELECT rs.id, 'ONLINE_INTERACTIONS'
FROM rating_systems rs WHERE rs.code = 'ESRB';

-- Traductions françaises pour les descripteurs PEGI
INSERT INTO content_descriptor_translations (content_descriptor_id, language_code, name, description)
SELECT cd.id, 'fr', 'Violence', 'Le jeu contient des représentations de violence'
FROM content_descriptors cd 
JOIN rating_systems rs ON cd.rating_system_id = rs.id 
WHERE rs.code = 'PEGI' AND cd.code = 'VIOLENCE'
UNION ALL
SELECT cd.id, 'fr', 'Langage grossier', 'Le jeu contient un langage grossier'
FROM content_descriptors cd 
JOIN rating_systems rs ON cd.rating_system_id = rs.id 
WHERE rs.code = 'PEGI' AND cd.code = 'BAD_LANGUAGE'
UNION ALL
SELECT cd.id, 'fr', 'Peur', 'Le jeu peut faire peur ou être effrayant pour de jeunes enfants'
FROM content_descriptors cd 
JOIN rating_systems rs ON cd.rating_system_id = rs.id 
WHERE rs.code = 'PEGI' AND cd.code = 'FEAR'
UNION ALL
SELECT cd.id, 'fr', 'Jeux de hasard', 'Le jeu incite aux jeux de hasard ou enseigne les jeux de hasard'
FROM content_descriptors cd 
JOIN rating_systems rs ON cd.rating_system_id = rs.id 
WHERE rs.code = 'PEGI' AND cd.code = 'GAMBLING'
UNION ALL
SELECT cd.id, 'fr', 'Sexe', 'Le jeu contient des représentations de nudité et/ou de comportements ou de références de nature sexuelle'
FROM content_descriptors cd 
JOIN rating_systems rs ON cd.rating_system_id = rs.id 
WHERE rs.code = 'PEGI' AND cd.code = 'SEX'
UNION ALL
SELECT cd.id, 'fr', 'Drogues', 'Le jeu fait référence à la consommation de drogues ou montre cette consommation'
FROM content_descriptors cd 
JOIN rating_systems rs ON cd.rating_system_id = rs.id 
WHERE rs.code = 'PEGI' AND cd.code = 'DRUGS'
UNION ALL
SELECT cd.id, 'fr', 'Discrimination', 'Le jeu contient des représentations discriminatoires ou du matériel qui peut encourager la discrimination'
FROM content_descriptors cd 
JOIN rating_systems rs ON cd.rating_system_id = rs.id 
WHERE rs.code = 'PEGI' AND cd.code = 'DISCRIMINATION'
UNION ALL
SELECT cd.id, 'fr', 'En ligne', 'Le jeu peut être joué en ligne'
FROM content_descriptors cd 
JOIN rating_systems rs ON cd.rating_system_id = rs.id 
WHERE rs.code = 'PEGI' AND cd.code = 'ONLINE';

-- Traductions anglaises pour les descripteurs PEGI
INSERT INTO content_descriptor_translations (content_descriptor_id, language_code, name, description)
SELECT cd.id, 'en', 'Violence', 'The game contains depictions of violence'
FROM content_descriptors cd 
JOIN rating_systems rs ON cd.rating_system_id = rs.id 
WHERE rs.code = 'PEGI' AND cd.code = 'VIOLENCE'
UNION ALL
SELECT cd.id, 'en', 'Bad Language', 'The game contains bad language'
FROM content_descriptors cd 
JOIN rating_systems rs ON cd.rating_system_id = rs.id 
WHERE rs.code = 'PEGI' AND cd.code = 'BAD_LANGUAGE'
UNION ALL
SELECT cd.id, 'en', 'Fear', 'The game may be frightening or scary for young children'
FROM content_descriptors cd 
JOIN rating_systems rs ON cd.rating_system_id = rs.id 
WHERE rs.code = 'PEGI' AND cd.code = 'FEAR'
UNION ALL
SELECT cd.id, 'en', 'Gambling', 'The game encourages or teaches gambling'
FROM content_descriptors cd 
JOIN rating_systems rs ON cd.rating_system_id = rs.id 
WHERE rs.code = 'PEGI' AND cd.code = 'GAMBLING'
UNION ALL
SELECT cd.id, 'en', 'Sex', 'The game contains depictions of nudity and/or sexual behaviour or sexual references'
FROM content_descriptors cd 
JOIN rating_systems rs ON cd.rating_system_id = rs.id 
WHERE rs.code = 'PEGI' AND cd.code = 'SEX'
UNION ALL
SELECT cd.id, 'en', 'Drugs', 'The game refers to or depicts the use of drugs'
FROM content_descriptors cd 
JOIN rating_systems rs ON cd.rating_system_id = rs.id 
WHERE rs.code = 'PEGI' AND cd.code = 'DRUGS'
UNION ALL
SELECT cd.id, 'en', 'Discrimination', 'The game contains discriminatory depictions or material which may encourage discrimination'
FROM content_descriptors cd 
JOIN rating_systems rs ON cd.rating_system_id = rs.id 
WHERE rs.code = 'PEGI' AND cd.code = 'DISCRIMINATION'
UNION ALL
SELECT cd.id, 'en', 'Online', 'The game can be played online'
FROM content_descriptors cd 
JOIN rating_systems rs ON cd.rating_system_id = rs.id 
WHERE rs.code = 'PEGI' AND cd.code = 'ONLINE';