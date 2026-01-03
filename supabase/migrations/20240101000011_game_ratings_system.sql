-- Migration 011: Système de classifications de jeux détaillé
-- Création d'un système complet pour gérer les classifications PEGI, ESRB, etc.

-- Table des systèmes de classification (PEGI, ESRB, CERO, etc.)
CREATE TABLE public.rating_systems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(10) UNIQUE NOT NULL, -- 'PEGI', 'ESRB', 'CERO', 'USK', etc.
  name VARCHAR(100) NOT NULL,
  description TEXT,
  country_codes TEXT[], -- ['FR', 'DE', 'IT'] pour PEGI par exemple
  website_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table des classifications (PEGI 3, PEGI 7, ESRB E, etc.)
CREATE TABLE public.ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rating_system_id UUID REFERENCES rating_systems(id) ON DELETE CASCADE,
  code VARCHAR(10) NOT NULL, -- '3', '7', '12', '16', '18' pour PEGI
  display_name VARCHAR(50) NOT NULL, -- 'PEGI 3', 'ESRB E', etc.
  minimum_age INTEGER,
  color_hex VARCHAR(7), -- Couleur associée à la classification
  icon_url TEXT,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(rating_system_id, code)
);

-- Table des descripteurs de contenu (Violence, Langage, etc.)
CREATE TABLE public.content_descriptors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rating_system_id UUID REFERENCES rating_systems(id) ON DELETE CASCADE,
  code VARCHAR(30) NOT NULL, -- 'VIOLENCE', 'LANGUAGE', 'FEAR', etc.
  icon_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(rating_system_id, code)
);

-- Table des traductions pour les descripteurs de contenu
CREATE TABLE public.content_descriptor_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_descriptor_id UUID REFERENCES content_descriptors(id) ON DELETE CASCADE,
  language_code VARCHAR(2) REFERENCES languages(code),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  UNIQUE(content_descriptor_id, language_code)
);

-- Table de liaison entre jeux et classifications
CREATE TABLE public.game_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  rating_id UUID REFERENCES ratings(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT TRUE, -- Un jeu peut avoir plusieurs classifications (différents pays)
  assigned_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(game_id, rating_id)
);

-- Table de liaison entre classifications de jeux et descripteurs de contenu
CREATE TABLE public.game_rating_descriptors (
  game_rating_id UUID REFERENCES game_ratings(id) ON DELETE CASCADE,
  content_descriptor_id UUID REFERENCES content_descriptors(id) ON DELETE CASCADE,
  PRIMARY KEY (game_rating_id, content_descriptor_id)
);

-- Index pour les performances
CREATE INDEX idx_ratings_system_id ON ratings(rating_system_id);
CREATE INDEX idx_content_descriptors_system_id ON content_descriptors(rating_system_id);
CREATE INDEX idx_game_ratings_game_id ON game_ratings(game_id);
CREATE INDEX idx_game_ratings_rating_id ON game_ratings(rating_id);
CREATE INDEX idx_game_ratings_primary ON game_ratings(game_id, is_primary);

-- Fonction pour obtenir la classification principale d'un jeu
CREATE OR REPLACE FUNCTION get_primary_game_rating(game_uuid UUID, lang_code VARCHAR(2) DEFAULT 'fr')
RETURNS TABLE (
    rating_system_code VARCHAR(10),
    rating_display_name VARCHAR(50),
    minimum_age INTEGER,
    color_hex VARCHAR(7),
    content_descriptors JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        rs.code,
        r.display_name,
        r.minimum_age,
        r.color_hex,
        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'code', cd.code,
                    'name', cdt.name,
                    'description', cdt.description
                )
            ) FILTER (WHERE cd.id IS NOT NULL),
            '[]'::jsonb
        ) as content_descriptors
    FROM game_ratings gr
    JOIN ratings r ON gr.rating_id = r.id
    JOIN rating_systems rs ON r.rating_system_id = rs.id
    LEFT JOIN game_rating_descriptors grd ON gr.id = grd.game_rating_id
    LEFT JOIN content_descriptors cd ON grd.content_descriptor_id = cd.id
    LEFT JOIN content_descriptor_translations cdt ON cd.id = cdt.content_descriptor_id 
        AND cdt.language_code = lang_code
    WHERE gr.game_id = game_uuid 
        AND gr.is_primary = true
    GROUP BY rs.code, r.display_name, r.minimum_age, r.color_hex
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;