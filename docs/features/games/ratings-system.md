# Système de Classification des Jeux

Ce document décrit le nouveau système de classification des jeux qui remplace
les simples colonnes `pegi_rating` et `esrb_rating` par un système complet et
extensible.

## Architecture

### Tables principales

#### `rating_systems`

Contient les différents systèmes de classification (PEGI, ESRB, CERO, etc.)

- `code`: Code unique du système (ex: 'PEGI', 'ESRB')
- `name`: Nom complet du système
- `country_codes`: Pays où ce système est utilisé
- `website_url`: Site officiel du système

#### `ratings`

Contient les classifications spécifiques (PEGI 12, ESRB T, etc.)

- `rating_system_id`: Référence vers le système de classification
- `code`: Code de la classification (ex: '12', 'T')
- `display_name`: Nom d'affichage (ex: 'PEGI 12', 'ESRB T')
- `minimum_age`: Âge minimum recommandé
- `color_hex`: Couleur associée pour l'affichage

#### `content_descriptors`

Descripteurs de contenu (Violence, Langage, etc.)

- `rating_system_id`: Système auquel appartient ce descripteur
- `code`: Code unique du descripteur (ex: 'VIOLENCE', 'LANGUAGE')

#### `content_descriptor_translations`

Traductions des descripteurs de contenu

- `content_descriptor_id`: Référence vers le descripteur
- `language_code`: Code de langue (fr, en, etc.)
- `name`: Nom traduit du descripteur
- `description`: Description détaillée

#### `game_ratings`

Liaison entre jeux et classifications

- `game_id`: Référence vers le jeu
- `rating_id`: Référence vers la classification
- `is_primary`: Indique si c'est la classification principale du jeu

#### `game_rating_descriptors`

Liaison entre classifications de jeux et descripteurs de contenu

- `game_rating_id`: Référence vers la classification du jeu
- `content_descriptor_id`: Référence vers le descripteur

## Utilisation

### Ajouter une classification à un jeu

```sql
-- Exemple: Ajouter PEGI 12 avec Violence à un jeu
WITH game_data AS (
  SELECT id FROM games WHERE slug = 'mon-jeu'
),
rating_data AS (
  SELECT r.id
  FROM ratings r
  JOIN rating_systems rs ON r.rating_system_id = rs.id
  WHERE rs.code = 'PEGI' AND r.code = '12'
)
INSERT INTO game_ratings (game_id, rating_id, is_primary)
SELECT g.id, r.id, true
FROM game_data g, rating_data r;

-- Ajouter le descripteur Violence
WITH game_rating_data AS (
  SELECT gr.id
  FROM game_ratings gr
  JOIN games g ON gr.game_id = g.id
  JOIN ratings r ON gr.rating_id = r.id
  JOIN rating_systems rs ON r.rating_system_id = rs.id
  WHERE g.slug = 'mon-jeu' AND rs.code = 'PEGI' AND r.code = '12'
),
descriptor_data AS (
  SELECT cd.id
  FROM content_descriptors cd
  JOIN rating_systems rs ON cd.rating_system_id = rs.id
  WHERE rs.code = 'PEGI' AND cd.code = 'VIOLENCE'
)
INSERT INTO game_rating_descriptors (game_rating_id, content_descriptor_id)
SELECT gr.id, cd.id
FROM game_rating_data gr, descriptor_data cd;
```

### Récupérer les classifications d'un jeu

```sql
-- Utiliser la vue simplifiée
SELECT * FROM game_ratings_view
WHERE slug = 'mon-jeu' AND language_code = 'fr';

-- Ou utiliser la fonction pour la classification principale
SELECT * FROM get_primary_game_rating(
  (SELECT id FROM games WHERE slug = 'mon-jeu'),
  'fr'
);
```

### Requête complète pour l'affichage

```sql
SELECT
  g.slug,
  gt.title,
  r.display_name as rating,
  r.minimum_age,
  r.color_hex,
  array_agg(cdt.name) as content_warnings
FROM games g
JOIN game_translations gt ON g.id = gt.game_id
JOIN game_ratings gr ON g.id = gr.game_id AND gr.is_primary = true
JOIN ratings r ON gr.rating_id = r.id
LEFT JOIN game_rating_descriptors grd ON gr.id = grd.game_rating_id
LEFT JOIN content_descriptors cd ON grd.content_descriptor_id = cd.id
LEFT JOIN content_descriptor_translations cdt ON cd.id = cdt.content_descriptor_id
  AND cdt.language_code = gt.language_code
WHERE gt.language_code = 'fr'
GROUP BY g.slug, gt.title, r.display_name, r.minimum_age, r.color_hex;
```

## Classifications pré-configurées

### PEGI (Europe)

- PEGI 3 (vert) - Convient à tous les âges
- PEGI 7 (vert clair) - Peut effrayer les très jeunes enfants
- PEGI 12 (jaune) - Contenu inapproprié pour les moins de 12 ans
- PEGI 16 (orange) - Contenu inapproprié pour les moins de 16 ans
- PEGI 18 (rouge) - Convient uniquement aux adultes

### ESRB (Amérique du Nord)

- EC (Early Childhood) - Petite enfance
- E (Everyone) - Tout public
- E10+ (Everyone 10+) - Tout public 10+
- T (Teen) - Adolescents
- M (Mature 17+) - Adultes 17+
- AO (Adults Only 18+) - Adultes uniquement

### Descripteurs de contenu PEGI

- Violence
- Langage grossier
- Peur
- Jeux de hasard
- Sexe
- Drogues
- Discrimination
- En ligne

## Migration des données existantes

La migration `20240101000012_migrate_existing_ratings.sql` migre automatiquement
les données des anciennes colonnes `pegi_rating` et `esrb_rating` vers le
nouveau système.

Les anciennes colonnes peuvent être supprimées après vérification que la
migration s'est bien déroulée.
