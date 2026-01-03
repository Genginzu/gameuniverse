-- Seed 12: Classifications pour les jeux d'exemple
-- Ajoute les classifications PEGI aux jeux d'exemple

-- Ajouter PEGI 18 à The Witcher 3
INSERT INTO game_ratings (game_id, rating_id, is_primary)
SELECT 
    g.id,
    r.id,
    true
FROM games g
CROSS JOIN ratings r
JOIN rating_systems rs ON r.rating_system_id = rs.id
WHERE g.slug = 'the-witcher-3' 
AND rs.code = 'PEGI' 
AND r.code = '18'
ON CONFLICT (game_id, rating_id) DO NOTHING;

-- Ajouter descripteurs Violence et Sexe à The Witcher 3
INSERT INTO game_rating_descriptors (game_rating_id, content_descriptor_id)
SELECT 
    gr.id,
    cd.id
FROM game_ratings gr
JOIN games g ON gr.game_id = g.id
JOIN ratings r ON gr.rating_id = r.id
JOIN rating_systems rs ON r.rating_system_id = rs.id
CROSS JOIN content_descriptors cd
WHERE g.slug = 'the-witcher-3'
AND rs.code = 'PEGI'
AND r.code = '18'
AND cd.code IN ('VIOLENCE', 'SEX')
AND cd.rating_system_id = rs.id
ON CONFLICT (game_rating_id, content_descriptor_id) DO NOTHING;

-- Ajouter PEGI 18 à Cyberpunk 2077
INSERT INTO game_ratings (game_id, rating_id, is_primary)
SELECT 
    g.id,
    r.id,
    true
FROM games g
CROSS JOIN ratings r
JOIN rating_systems rs ON r.rating_system_id = rs.id
WHERE g.slug = 'cyberpunk-2077' 
AND rs.code = 'PEGI' 
AND r.code = '18'
ON CONFLICT (game_id, rating_id) DO NOTHING;

-- Ajouter descripteurs Violence, Sexe et Drogues à Cyberpunk 2077
INSERT INTO game_rating_descriptors (game_rating_id, content_descriptor_id)
SELECT 
    gr.id,
    cd.id
FROM game_ratings gr
JOIN games g ON gr.game_id = g.id
JOIN ratings r ON gr.rating_id = r.id
JOIN rating_systems rs ON r.rating_system_id = rs.id
CROSS JOIN content_descriptors cd
WHERE g.slug = 'cyberpunk-2077'
AND rs.code = 'PEGI'
AND r.code = '18'
AND cd.code IN ('VIOLENCE', 'SEX', 'DRUGS')
AND cd.rating_system_id = rs.id
ON CONFLICT (game_rating_id, content_descriptor_id) DO NOTHING;

-- Ajouter PEGI 7 à Minecraft
INSERT INTO game_ratings (game_id, rating_id, is_primary)
SELECT 
    g.id,
    r.id,
    true
FROM games g
CROSS JOIN ratings r
JOIN rating_systems rs ON r.rating_system_id = rs.id
WHERE g.slug = 'minecraft' 
AND rs.code = 'PEGI' 
AND r.code = '7'
ON CONFLICT (game_id, rating_id) DO NOTHING;

-- Ajouter PEGI 18 à GTA V
INSERT INTO game_ratings (game_id, rating_id, is_primary)
SELECT 
    g.id,
    r.id,
    true
FROM games g
CROSS JOIN ratings r
JOIN rating_systems rs ON r.rating_system_id = rs.id
WHERE g.slug = 'grand-theft-auto-v' 
AND rs.code = 'PEGI' 
AND r.code = '18'
ON CONFLICT (game_id, rating_id) DO NOTHING;

-- Ajouter descripteurs Violence, Langage grossier et Drogues à GTA V
INSERT INTO game_rating_descriptors (game_rating_id, content_descriptor_id)
SELECT 
    gr.id,
    cd.id
FROM game_ratings gr
JOIN games g ON gr.game_id = g.id
JOIN ratings r ON gr.rating_id = r.id
JOIN rating_systems rs ON r.rating_system_id = rs.id
CROSS JOIN content_descriptors cd
WHERE g.slug = 'grand-theft-auto-v'
AND rs.code = 'PEGI'
AND r.code = '18'
AND cd.code IN ('VIOLENCE', 'BAD_LANGUAGE', 'DRUGS')
AND cd.rating_system_id = rs.id
ON CONFLICT (game_rating_id, content_descriptor_id) DO NOTHING;

-- Ajouter PEGI 18 à Red Dead Redemption 2
INSERT INTO game_ratings (game_id, rating_id, is_primary)
SELECT 
    g.id,
    r.id,
    true
FROM games g
CROSS JOIN ratings r
JOIN rating_systems rs ON r.rating_system_id = rs.id
WHERE g.slug = 'red-dead-redemption-2' 
AND rs.code = 'PEGI' 
AND r.code = '18'
ON CONFLICT (game_id, rating_id) DO NOTHING;

-- Ajouter descripteurs Violence à Red Dead Redemption 2
INSERT INTO game_rating_descriptors (game_rating_id, content_descriptor_id)
SELECT 
    gr.id,
    cd.id
FROM game_ratings gr
JOIN games g ON gr.game_id = g.id
JOIN ratings r ON gr.rating_id = r.id
JOIN rating_systems rs ON r.rating_system_id = rs.id
CROSS JOIN content_descriptors cd
WHERE g.slug = 'red-dead-redemption-2'
AND rs.code = 'PEGI'
AND r.code = '18'
AND cd.code IN ('VIOLENCE')
AND cd.rating_system_id = rs.id
ON CONFLICT (game_rating_id, content_descriptor_id) DO NOTHING;

-- Ajouter PEGI 16 à Elden Ring
INSERT INTO game_ratings (game_id, rating_id, is_primary)
SELECT 
    g.id,
    r.id,
    true
FROM games g
CROSS JOIN ratings r
JOIN rating_systems rs ON r.rating_system_id = rs.id
WHERE g.slug = 'elden-ring' 
AND rs.code = 'PEGI' 
AND r.code = '16'
ON CONFLICT (game_id, rating_id) DO NOTHING;

-- Ajouter descripteur Violence à Elden Ring
INSERT INTO game_rating_descriptors (game_rating_id, content_descriptor_id)
SELECT 
    gr.id,
    cd.id
FROM game_ratings gr
JOIN games g ON gr.game_id = g.id
JOIN ratings r ON gr.rating_id = r.id
JOIN rating_systems rs ON r.rating_system_id = rs.id
CROSS JOIN content_descriptors cd
WHERE g.slug = 'elden-ring'
AND rs.code = 'PEGI'
AND r.code = '16'
AND cd.code IN ('VIOLENCE')
AND cd.rating_system_id = rs.id
ON CONFLICT (game_rating_id, content_descriptor_id) DO NOTHING;

-- Ajouter PEGI 18 à God of War
INSERT INTO game_ratings (game_id, rating_id, is_primary)
SELECT 
    g.id,
    r.id,
    true
FROM games g
CROSS JOIN ratings r
JOIN rating_systems rs ON r.rating_system_id = rs.id
WHERE g.slug = 'god-of-war' 
AND rs.code = 'PEGI' 
AND r.code = '18'
ON CONFLICT (game_id, rating_id) DO NOTHING;

-- Ajouter descripteur Violence à God of War
INSERT INTO game_rating_descriptors (game_rating_id, content_descriptor_id)
SELECT 
    gr.id,
    cd.id
FROM game_ratings gr
JOIN games g ON gr.game_id = g.id
JOIN ratings r ON gr.rating_id = r.id
JOIN rating_systems rs ON r.rating_system_id = rs.id
CROSS JOIN content_descriptors cd
WHERE g.slug = 'god-of-war'
AND rs.code = 'PEGI'
AND r.code = '18'
AND cd.code IN ('VIOLENCE')
AND cd.rating_system_id = rs.id
ON CONFLICT (game_rating_id, content_descriptor_id) DO NOTHING;

-- Ajouter PEGI 16 à Horizon Zero Dawn
INSERT INTO game_ratings (game_id, rating_id, is_primary)
SELECT 
    g.id,
    r.id,
    true
FROM games g
CROSS JOIN ratings r
JOIN rating_systems rs ON r.rating_system_id = rs.id
WHERE g.slug = 'horizon-zero-dawn' 
AND rs.code = 'PEGI' 
AND r.code = '16'
ON CONFLICT (game_id, rating_id) DO NOTHING;

-- Ajouter descripteur Violence à Horizon Zero Dawn
INSERT INTO game_rating_descriptors (game_rating_id, content_descriptor_id)
SELECT 
    gr.id,
    cd.id
FROM game_ratings gr
JOIN games g ON gr.game_id = g.id
JOIN ratings r ON gr.rating_id = r.id
JOIN rating_systems rs ON r.rating_system_id = rs.id
CROSS JOIN content_descriptors cd
WHERE g.slug = 'horizon-zero-dawn'
AND rs.code = 'PEGI'
AND r.code = '16'
AND cd.code IN ('VIOLENCE')
AND cd.rating_system_id = rs.id
ON CONFLICT (game_rating_id, content_descriptor_id) DO NOTHING;