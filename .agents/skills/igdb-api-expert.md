---
inclusion: fileMatch
fileMatchPattern: "**/igdb-import/**,**/igdbService*,**/igdb-sync*,**/igdb-fetcher*,**/igdb.ts,**/igdb-character*,**/GameFormSyncTab*,**/igdb/**"
---

# Skill : Expert API IGDB (Internet Game Database)

## Activation

Ce skill est activé manuellement via `#igdb-api-expert` quand on travaille avec
l'API IGDB : import de données, synchronisation, nouveaux endpoints, requêtes
APICalypse, etc.

## Source

Documentation officielle : https://api-docs.igdb.com/  
Extraction locale : `docs/igdb/Getting Started – IGDB API docs.html`

---

## 1. Fondamentaux

### Base URL

```
https://api.igdb.com/v4
```

### Authentification

IGDB utilise OAuth2 via Twitch. Obtenir un token :

```
POST https://id.twitch.tv/oauth2/token
  ?client_id={IGDB_CLIENT_ID}
  &client_secret={IGDB_CLIENT_SECRET}
  &grant_type=client_credentials
```

Réponse :

```json
{
  "access_token": "xxx",
  "expires_in": 5587808,
  "token_type": "bearer"
}
```

Le token expire après ~60 jours. Max 25 tokens actifs simultanément.

### Headers requis

```
Client-ID: {client_id}
Authorization: Bearer {access_token}
```

### Méthode

Toutes les requêtes utilisent `POST` (sauf `/dumps` qui utilise `GET`).  
Le body contient la requête en langage **APICalypse**.

### Rate Limits

- 4 requêtes/seconde max
- 8 requêtes ouvertes simultanément max
- Code `429 Too Many Requests` si dépassé

### CORS

L'API ne supporte PAS les requêtes navigateur directes (CORS bloqué).  
Toujours passer par un backend/proxy.

---

## 2. Langage APICalypse

### Commandes

| Commande  | Shorthand | Description                              |
| --------- | --------- | ---------------------------------------- |
| `fields`  | `f`       | Champs à retourner                       |
| `exclude` | `x`       | Champs à exclure                         |
| `where`   | `w`       | Filtres                                  |
| `sort`    | `s`       | Tri (`asc` / `desc`)                     |
| `limit`   | `l`       | Nombre de résultats (défaut 10, max 500) |
| `offset`  | `o`       | Décalage pour pagination                 |
| `search`  | _(aucun)_ | Recherche textuelle par nom              |

### Exemples

```apicalypse
// Tous les champs d'un jeu
fields *; where id = 1942;

// Recherche avec champs spécifiques
search "Halo"; fields name,release_dates.human;

// Tri + filtre
fields name,rating; sort rating desc; where rating != null;

// Pagination
fields name; limit 50; offset 100;

// Expander (accéder aux sous-objets)
fields name,genres.name; where id = 1942;
fields name,genres.*; where id = 1942;

// Count
// POST https://api.igdb.com/v4/games/count
where rating > 75;
```

### Opérateurs de filtre

| Opérateur            | Description                 |
| -------------------- | --------------------------- |
| `=`                  | Égal                        |
| `!=`                 | Différent                   |
| `>`, `>=`, `<`, `<=` | Comparaisons numériques     |
| `= "X"*`             | Préfixe (case sensitive)    |
| `~ "X"*`             | Préfixe (case insensitive)  |
| `= *"X"`             | Suffixe (case sensitive)    |
| `~ *"X"`             | Suffixe (case insensitive)  |
| `= *"X"*`            | Contient (case sensitive)   |
| `~ *"X"*`            | Contient (case insensitive) |
| `= null` / `!= null` | Null check                  |
| `= (V1,V2)`          | OR dans un tableau          |
| `= [V1,V2]`          | AND dans un tableau         |
| `!= (V1,V2)`         | Aucun des (OR)              |
| `!= [V1,V2]`         | Aucun des (AND)             |
| `= {V1,V2}`          | Match exact sur tableau     |

Combinaison : `&` (AND), `|` (OR), parenthèses pour grouper.

### Raccourcis

- `null` → `n`
- `true` → `t`, `false` → `f`

### Multi-Query

POST vers `https://api.igdb.com/v4/multiquery` (max 10 queries) :

```apicalypse
query games "Jeux PS4" {
  fields name,platforms.name;
  where platforms = {48};
  limit 5;
};

query platforms/count "Nombre de plateformes" {
};
```

### Protocol Buffers

Ajouter `.pb` à l'URL pour des réponses protobuf :
`https://api.igdb.com/v4/games.pb`

---

## 3. Images

URL pattern :

```
https://images.igdb.com/igdb/image/upload/t_{size}/{image_id}.jpg
```

Ajouter `_2x` au size pour retina (DPR 2.0).

### Tailles disponibles

| Nom               | Dimensions  | Mode                  |
| ----------------- | ----------- | --------------------- |
| `cover_small`     | 90 × 128    | Fit                   |
| `cover_big`       | 264 × 374   | Fit                   |
| `screenshot_med`  | 569 × 320   | Lfill, Center gravity |
| `screenshot_big`  | 889 × 500   | Lfill, Center gravity |
| `screenshot_huge` | 1280 × 720  | Lfill, Center gravity |
| `logo_med`        | 284 × 160   | Fit                   |
| `thumb`           | 90 × 90     | Thumb, Center gravity |
| `micro`           | 35 × 35     | Thumb, Center gravity |
| `720p`            | 1280 × 720  | Fit, Center gravity   |
| `1080p`           | 1920 × 1080 | Fit, Center gravity   |

---

## 4. Tag Numbers

Système de hash compact pour filtrage rapide. Calcul sur un entier 32 bits :

- 4 premiers bits = Type ID
- 28 bits restants = ID de l'objet

| Type ID | Entité             |
| ------- | ------------------ |
| 0       | Theme              |
| 1       | Genre              |
| 2       | Keyword            |
| 3       | Game               |
| 4       | Player Perspective |

```javascript
const genreTypeID = 1;
const shooterGenreID = 5;
let tagNumber = genreTypeID << 28; // 268435456
tagNumber |= shooterGenreID; // 268435461
// where tags = (268435461);
```

---

## 5. Référence complète des endpoints

Chaque endpoint est accessible via
`POST https://api.igdb.com/v4/{endpoint_path}`.  
Ajouter `/count` au path pour obtenir le nombre de résultats.

### 5.1 Age Ratings

#### age_ratings

Path: `/age_ratings`

| Champ                       | Type                                           | Description                                             |
| --------------------------- | ---------------------------------------------- | ------------------------------------------------------- |
| category                    | Enum                                           | **DEPRECATED** → utiliser `organization`                |
| checksum                    | uuid                                           | Hash                                                    |
| content_descriptions        | Array of IDs                                   | **DEPRECATED** → utiliser `rating_content_descriptions` |
| organization                | Ref → Age Rating Organization                  | Organisme de classification                             |
| rating                      | Enum                                           | **DEPRECATED** → utiliser `rating_category`             |
| rating_category             | Ref → Age Rating Category                      | Catégorie de classification                             |
| rating_content_descriptions | Array of Age Rating Content Description V2 IDs | Descripteurs de contenu                                 |
| rating_cover_url            | String                                         | URL de l'image de classification                        |
| synopsis                    | String                                         | Texte motivant la classification                        |

Enums legacy `category` : ESRB=1, PEGI=2, CERO=3, USK=4, GRAC=5, CLASS_IND=6,
ACB=7

Enums legacy `rating` : Three=1, Seven=2, Twelve=3, Sixteen=4, Eighteen=5, RP=6,
EC=7, E=8, E10=9, T=10, M=11, AO=12, CERO_A=13..CERO_Z=17, USK_0=18..USK_18=22,
GRAC_ALL=23..GRAC_TESTING=27, CLASS_IND_L=28..CLASS_IND_Eighteen=33,
ACB_G=34..ACB_RC=39

#### age_rating_categories

Path: `/age_rating_categories`

| Champ        | Type                          | Description              |
| ------------ | ----------------------------- | ------------------------ |
| checksum     | uuid                          | Hash                     |
| created_at   | datetime                      | Date d'ajout             |
| organization | Ref → Age Rating Organization | Organisme                |
| rating       | String                        | Nom de la classification |
| updated_at   | datetime                      | Dernière MAJ             |

#### age_rating_content_descriptions (DEPRECATED)

Path: `/age_rating_content_descriptions`

| Champ       | Type   | Description                                                    |
| ----------- | ------ | -------------------------------------------------------------- |
| category    | Enum   | **DEPRECATED** → utiliser `age_rating_content_descriptions_v2` |
| checksum    | uuid   | Hash                                                           |
| description | String | Description                                                    |

Enums `category` : ESRB_alcohol_reference=1 ... CLASS_IND_atos_criminosos=85

#### age_rating_content_description_types

Path: `/age_rating_content_description_types`

| Champ      | Type     | Description   |
| ---------- | -------- | ------------- |
| checksum   | uuid     | Hash          |
| created_at | datetime | Date d'ajout  |
| name       | String   | Nom           |
| slug       | String   | Slug URL-safe |
| updated_at | datetime | Dernière MAJ  |

#### age_rating_content_descriptions_v2

Path: `/age_rating_content_descriptions_v2`

| Champ            | Type                                      | Description  |
| ---------------- | ----------------------------------------- | ------------ |
| checksum         | uuid                                      | Hash         |
| created_at       | datetime                                  | Date d'ajout |
| description      | String                                    | Description  |
| description_type | Ref → Age Rating Content Description Type | Type         |
| organization     | Ref → Age Rating Organization             | Organisme    |
| updated_at       | datetime                                  | Dernière MAJ |

#### age_rating_organizations

Path: `/age_rating_organizations`

| Champ      | Type     | Description        |
| ---------- | -------- | ------------------ |
| checksum   | uuid     | Hash               |
| created_at | datetime | Date d'ajout       |
| name       | String   | Nom de l'organisme |
| updated_at | datetime | Dernière MAJ       |

### 5.2 Games

#### games

Path: `/games`

| Champ                   | Type                            | Description                             |
| ----------------------- | ------------------------------- | --------------------------------------- |
| age_ratings             | Array of Age Rating IDs         | Classifications PEGI/ESRB/etc.          |
| aggregated_rating       | Double                          | Note moyenne critiques externes         |
| aggregated_rating_count | Integer                         | Nombre de notes critiques               |
| alternative_names       | Array of Alternative Name IDs   | Noms alternatifs                        |
| artworks                | Array of Artwork IDs            | Artworks                                |
| bundles                 | Array of Game IDs               | Bundles contenant ce jeu                |
| category                | Enum                            | **DEPRECATED** → utiliser `game_type`   |
| checksum                | uuid                            | Hash                                    |
| collection              | Ref → Collection                | **DEPRECATED** → utiliser `collections` |
| collections             | Array of Collection IDs         | Collections du jeu                      |
| cover                   | Ref → Cover                     | Pochette                                |
| created_at              | datetime                        | Date d'ajout                            |
| dlcs                    | Array of Game IDs               | DLCs                                    |
| expanded_games          | Array of Game IDs               | Jeux étendus                            |
| expansions              | Array of Game IDs               | Extensions                              |
| external_games          | Array of External Game IDs      | IDs externes (Steam, etc.)              |
| first_release_date      | Unix Timestamp                  | Date de première sortie                 |
| follows                 | Integer                         | **DEPRECATED**                          |
| forks                   | Array of Game IDs               | Forks                                   |
| franchise               | Ref → Franchise                 | Franchise principale                    |
| franchises              | Array of Franchise IDs          | Autres franchises                       |
| game_engines            | Array of Game Engine IDs        | Moteurs de jeu                          |
| game_localizations      | Array of Game Localization IDs  | Localisations                           |
| game_modes              | Array of Game Mode IDs          | Modes de jeu                            |
| game_status             | Ref → Game Status               | Statut de sortie                        |
| game_type               | Ref → Game Type                 | Type de jeu                             |
| genres                  | Array of Genre IDs              | Genres                                  |
| hypes                   | Integer                         | Follows avant sortie                    |
| involved_companies      | Array of Involved Company IDs   | Entreprises impliquées                  |
| keywords                | Array of Keyword IDs            | Mots-clés                               |
| language_supports       | Array of Language Support IDs   | Langues supportées                      |
| multiplayer_modes       | Array of Multiplayer Mode IDs   | Modes multijoueur                       |
| name                    | String                          | Nom                                     |
| parent_game             | Ref → Game                      | Jeu parent (si DLC/expansion)           |
| platforms               | Array of Platform IDs           | Plateformes                             |
| player_perspectives     | Array of Player Perspective IDs | Perspectives                            |
| ports                   | Array of Game IDs               | Portages                                |
| rating                  | Double                          | Note moyenne utilisateurs IGDB          |
| rating_count            | Integer                         | Nombre de notes utilisateurs            |
| release_dates           | Array of Release Date IDs       | Dates de sortie                         |
| remakes                 | Array of Game IDs               | Remakes                                 |
| remasters               | Array of Game IDs               | Remasters                               |
| screenshots             | Array of Screenshot IDs         | Captures d'écran                        |
| similar_games           | Array of Game IDs               | Jeux similaires                         |
| slug                    | String                          | Slug URL-safe                           |
| standalone_expansions   | Array of Game IDs               | Extensions standalone                   |
| status                  | Enum                            | **DEPRECATED** → utiliser `game_status` |
| storyline               | String                          | Histoire du jeu                         |
| summary                 | String                          | Description                             |
| tags                    | Array of Tag Numbers            | Tags calculés                           |
| themes                  | Array of Theme IDs              | Thèmes                                  |
| total_rating            | Double                          | Note combinée (users + critiques)       |
| total_rating_count      | Integer                         | Nombre total de notes                   |
| updated_at              | datetime                        | Dernière MAJ                            |
| url                     | String                          | URL IGDB                                |
| version_parent          | Ref → Game                      | Jeu parent si version/édition           |
| version_title           | String                          | Titre de la version                     |
| videos                  | Array of Game Video IDs         | Vidéos                                  |
| websites                | Array of Website IDs            | Sites web                               |

Enums legacy `category` : main_game=0, dlc_addon=1, expansion=2, bundle=3,
standalone_expansion=4, mod=5, episode=6, season=7, remake=8, remaster=9,
expanded_game=10, port=11, fork=12, pack=13, update=14

Enums legacy `status` : released=0, alpha=2, beta=3, early_access=4, offline=5,
cancelled=6, rumored=7, delisted=8

#### game_engines

Path: `/game_engines`

| Champ       | Type                   | Description                     |
| ----------- | ---------------------- | ------------------------------- |
| checksum    | uuid                   | Hash                            |
| companies   | Array of Company IDs   | Entreprises utilisant ce moteur |
| created_at  | datetime               | Date d'ajout                    |
| description | String                 | Description                     |
| logo        | Ref → Game Engine Logo | Logo                            |
| name        | String                 | Nom                             |
| platforms   | Array of Platform IDs  | Plateformes supportées          |
| slug        | String                 | Slug                            |
| updated_at  | datetime               | Dernière MAJ                    |
| url         | String                 | URL                             |

#### game_engine_logos

Path: `/game_engine_logos`

| Champ         | Type    | Description                    |
| ------------- | ------- | ------------------------------ |
| alpha_channel | boolean | Canal alpha                    |
| animated      | boolean | Animé                          |
| checksum      | uuid    | Hash                           |
| height        | Integer | Hauteur en pixels              |
| image_id      | String  | ID image pour construire l'URL |
| url           | String  | URL                            |
| width         | Integer | Largeur en pixels              |

#### game_localizations

Path: `/game_localizations`

| Champ      | Type         | Description        |
| ---------- | ------------ | ------------------ |
| checksum   | uuid         | Hash               |
| cover      | Ref → Cover  | Pochette localisée |
| created_at | datetime     | Date d'ajout       |
| game       | Ref → Game   | Jeu                |
| name       | String       | Nom localisé       |
| region     | Ref → Region | Région             |
| updated_at | datetime     | Dernière MAJ       |

#### game_modes

Path: `/game_modes`

| Champ      | Type     | Description                                   |
| ---------- | -------- | --------------------------------------------- |
| checksum   | uuid     | Hash                                          |
| created_at | datetime | Date d'ajout                                  |
| name       | String   | Nom (Single player, Multiplayer, Co-op, etc.) |
| slug       | String   | Slug                                          |
| updated_at | datetime | Dernière MAJ                                  |
| url        | String   | URL                                           |

#### game_release_formats

Path: `/game_release_formats`

| Champ      | Type     | Description  |
| ---------- | -------- | ------------ |
| checksum   | uuid     | Hash         |
| created_at | datetime | Date d'ajout |
| format     | String   | Format       |
| updated_at | datetime | Dernière MAJ |

#### game_statuses

Path: `/game_statuses`

| Champ      | Type     | Description  |
| ---------- | -------- | ------------ |
| checksum   | uuid     | Hash         |
| created_at | datetime | Date d'ajout |
| status     | String   | Statut       |
| updated_at | datetime | Dernière MAJ |

#### game_time_to_beats

Path: `/game_time_to_beats`

| Champ      | Type     | Description                                |
| ---------- | -------- | ------------------------------------------ |
| checksum   | uuid     | Hash                                       |
| completely | Integer  | Temps moyen 100% (secondes)                |
| count      | Integer  | Nombre de soumissions                      |
| created_at | datetime | Date d'ajout                               |
| game_id    | Integer  | ID du jeu                                  |
| hastily    | Integer  | Temps moyen histoire principale (secondes) |
| normally   | Integer  | Temps moyen histoire + extras (secondes)   |
| updated_at | datetime | Dernière MAJ                               |

#### game_types

Path: `/game_types`

| Champ      | Type     | Description  |
| ---------- | -------- | ------------ |
| checksum   | uuid     | Hash         |
| created_at | datetime | Date d'ajout |
| type       | String   | Type         |
| updated_at | datetime | Dernière MAJ |

#### game_versions

Path: `/game_versions`

| Champ      | Type                              | Description                  |
| ---------- | --------------------------------- | ---------------------------- |
| checksum   | uuid                              | Hash                         |
| created_at | datetime                          | Date d'ajout                 |
| features   | Array of Game Version Feature IDs | Fonctionnalités de l'édition |
| game       | Ref → Game                        | Jeu parent                   |
| games      | Array of Game IDs                 | Versions/éditions            |
| updated_at | datetime                          | Dernière MAJ                 |
| url        | String                            | URL                          |

#### game_version_features

Path: `/game_version_features`

| Champ       | Type                                    | Description              |
| ----------- | --------------------------------------- | ------------------------ |
| category    | Enum                                    | boolean=0, description=1 |
| checksum    | uuid                                    | Hash                     |
| description | String                                  | Description              |
| position    | Integer                                 | Position dans la liste   |
| title       | String                                  | Titre                    |
| values      | Array of Game Version Feature Value IDs | Valeurs                  |

#### game_version_feature_values

Path: `/game_version_feature_values`

| Champ            | Type                       | Description                                  |
| ---------------- | -------------------------- | -------------------------------------------- |
| checksum         | uuid                       | Hash                                         |
| game             | Ref → Game                 | Jeu/édition                                  |
| game_feature     | Ref → Game Version Feature | Feature                                      |
| included_feature | Enum                       | NOT_INCLUDED=0, INCLUDED=1, PRE_ORDER_ONLY=2 |
| note             | String                     | Texte                                        |

#### game_videos

Path: `/game_videos`

| Champ    | Type       | Description     |
| -------- | ---------- | --------------- |
| checksum | uuid       | Hash            |
| game     | Ref → Game | Jeu             |
| name     | String     | Nom de la vidéo |
| video_id | String     | ID YouTube      |

### 5.3 Characters

#### characters

Path: `/characters`

| Champ             | Type                     | Description                                   |
| ----------------- | ------------------------ | --------------------------------------------- |
| akas              | Array of Strings         | Noms alternatifs                              |
| character_gender  | Ref → Character Gender   | Genre (nouveau champ)                         |
| character_species | Ref → Character Specie   | Espèce (nouveau champ)                        |
| checksum          | uuid                     | Hash                                          |
| country_name      | String                   | Pays d'origine                                |
| created_at        | datetime                 | Date d'ajout                                  |
| description       | String                   | Description                                   |
| games             | Array of Game IDs        | Jeux associés                                 |
| gender            | Enum                     | **DEPRECATED** → utiliser `character_gender`  |
| mug_shot          | Ref → Character Mug Shot | Portrait                                      |
| name              | String                   | Nom                                           |
| slug              | String                   | Slug                                          |
| species           | Enum                     | **DEPRECATED** → utiliser `character_species` |
| updated_at        | datetime                 | Dernière MAJ                                  |
| url               | String                   | URL                                           |

Enums legacy `gender` : Male=0, Female=1, Other=2  
Enums legacy `species` : Human=1, Alien=2, Animal=3, Android=4, Unknown=5

#### character_genders

Path: `/character_genders`

| Champ      | Type     | Description  |
| ---------- | -------- | ------------ |
| checksum   | uuid     | Hash         |
| created_at | datetime | Date d'ajout |
| name       | String   | Nom du genre |
| updated_at | datetime | Dernière MAJ |

#### character_mug_shots

Path: `/character_mug_shots`

| Champ         | Type    | Description    |
| ------------- | ------- | -------------- |
| alpha_channel | boolean | Canal alpha    |
| animated      | boolean | Animé          |
| checksum      | uuid    | Hash           |
| height        | Integer | Hauteur pixels |
| image_id      | String  | ID image       |
| url           | String  | URL            |
| width         | Integer | Largeur pixels |

#### character_species

Path: `/character_species`

| Champ      | Type     | Description     |
| ---------- | -------- | --------------- |
| checksum   | uuid     | Hash            |
| created_at | datetime | Date d'ajout    |
| name       | String   | Nom de l'espèce |
| updated_at | datetime | Dernière MAJ    |

### 5.4 Collections & Franchises

#### collections

Path: `/collections`

| Champ               | Type                             | Description           |
| ------------------- | -------------------------------- | --------------------- |
| as_child_relations  | Array of Collection Relation IDs | Relations enfant      |
| as_parent_relations | Array of Collection Relation IDs | Relations parent      |
| checksum            | uuid                             | Hash                  |
| created_at          | datetime                         | Date d'ajout          |
| games               | Array of Game IDs                | Jeux de la collection |
| name                | String                           | Nom                   |
| slug                | String                           | Slug                  |
| type                | Ref → Collection Type            | Type de collection    |
| updated_at          | datetime                         | Dernière MAJ          |
| url                 | String                           | URL                   |

#### collection_memberships

Path: `/collection_memberships`

| Champ      | Type                             | Description  |
| ---------- | -------------------------------- | ------------ |
| checksum   | uuid                             | Hash         |
| collection | Ref → Collection                 | Collection   |
| created_at | datetime                         | Date d'ajout |
| game       | Ref → Game                       | Jeu          |
| type       | Ref → Collection Membership Type | Type         |
| updated_at | datetime                         | Dernière MAJ |

#### collection_membership_types

Path: `/collection_membership_types`

| Champ                   | Type                  | Description   |
| ----------------------- | --------------------- | ------------- |
| allowed_collection_type | Ref → Collection Type | Type autorisé |
| checksum                | uuid                  | Hash          |
| created_at              | datetime              | Date d'ajout  |
| description             | String                | Description   |
| name                    | String                | Nom           |
| updated_at              | datetime              | Dernière MAJ  |

#### collection_relations

Path: `/collection_relations`

| Champ             | Type                           | Description       |
| ----------------- | ------------------------------ | ----------------- |
| checksum          | uuid                           | Hash              |
| child_collection  | Ref → Collection               | Collection enfant |
| created_at        | datetime                       | Date d'ajout      |
| parent_collection | Ref → Collection               | Collection parent |
| type              | Ref → Collection Relation Type | Type de relation  |
| updated_at        | datetime                       | Dernière MAJ      |

#### collection_relation_types

Path: `/collection_relation_types`

| Champ               | Type                  | Description          |
| ------------------- | --------------------- | -------------------- |
| allowed_child_type  | Ref → Collection Type | Type enfant autorisé |
| allowed_parent_type | Ref → Collection Type | Type parent autorisé |
| checksum            | uuid                  | Hash                 |
| created_at          | datetime              | Date d'ajout         |
| description         | String                | Description          |
| name                | String                | Nom                  |
| updated_at          | datetime              | Dernière MAJ         |

#### collection_types

Path: `/collection_types`

| Champ       | Type     | Description  |
| ----------- | -------- | ------------ |
| checksum    | uuid     | Hash         |
| created_at  | datetime | Date d'ajout |
| description | String   | Description  |
| name        | String   | Nom          |
| updated_at  | datetime | Dernière MAJ |

#### franchises

Path: `/franchises`

| Champ      | Type              | Description          |
| ---------- | ----------------- | -------------------- |
| checksum   | uuid              | Hash                 |
| created_at | datetime          | Date d'ajout         |
| games      | Array of Game IDs | Jeux de la franchise |
| name       | String            | Nom                  |
| slug       | String            | Slug                 |
| updated_at | datetime          | Dernière MAJ         |
| url        | String            | URL                  |

### 5.5 Companies

#### companies

Path: `/companies`

| Champ                | Type                         | Description                                    |
| -------------------- | ---------------------------- | ---------------------------------------------- |
| change_date          | Unix Timestamp               | Date de changement d'ID                        |
| change_date_category | Enum                         | **DEPRECATED** → utiliser `change_date_format` |
| change_date_format   | Ref → Date Format            | Format de date                                 |
| changed_company_id   | Ref → Company                | Nouvel ID après changement                     |
| checksum             | uuid                         | Hash                                           |
| country              | Integer                      | Code pays ISO                                  |
| created_at           | datetime                     | Date d'ajout                                   |
| description          | String                       | Description                                    |
| developed            | Array of Game IDs            | Jeux développés                                |
| logo                 | Ref → Company Logo           | Logo                                           |
| name                 | String                       | Nom                                            |
| parent               | Ref → Company                | Société mère                                   |
| published            | Array of Game IDs            | Jeux publiés                                   |
| slug                 | String                       | Slug                                           |
| start_date           | Unix Timestamp               | Date de création                               |
| start_date_category  | Enum                         | **DEPRECATED** → utiliser `start_date_format`  |
| start_date_format    | Ref → Date Format            | Format de date                                 |
| status               | Ref → Company Status         | Statut (active, defunct, merged, renamed)      |
| updated_at           | datetime                     | Dernière MAJ                                   |
| url                  | String                       | URL                                            |
| websites             | Array of Company Website IDs | Sites web                                      |

#### company_logos

Path: `/company_logos`

| Champ         | Type    | Description    |
| ------------- | ------- | -------------- |
| alpha_channel | boolean | Canal alpha    |
| animated      | boolean | Animé          |
| checksum      | uuid    | Hash           |
| height        | Integer | Hauteur pixels |
| image_id      | String  | ID image       |
| url           | String  | URL            |
| width         | Integer | Largeur pixels |

#### company_sizes

Path: `/company_sizes`  
Champs : checksum, created_at, name, updated_at

#### company_statuses

Path: `/company_statuses`  
Champs : checksum, created_at, name, updated_at

#### company_types

Path: `/company_types`  
Champs : checksum, created_at, name, updated_at

#### company_type_histories

Path: `/company_type_histories`

| Champ        | Type               | Description  |
| ------------ | ------------------ | ------------ |
| checksum     | uuid               | Hash         |
| company      | Ref → Company      | Entreprise   |
| company_type | Ref → Company Type | Type         |
| created_at   | datetime           | Date d'ajout |
| updated_at   | datetime           | Dernière MAJ |

#### company_websites

Path: `/company_websites`

| Champ    | Type               | Description                      |
| -------- | ------------------ | -------------------------------- |
| category | Enum               | **DEPRECATED** → utiliser `type` |
| checksum | uuid               | Hash                             |
| trusted  | boolean            | Site vérifié                     |
| type     | Ref → Website Type | Type de site                     |
| url      | String             | URL                              |

### 5.6 Platforms

#### platforms

Path: `/platforms`

| Champ            | Type                          | Description                               |
| ---------------- | ----------------------------- | ----------------------------------------- |
| abbreviation     | String                        | Abréviation                               |
| alternative_name | String                        | Nom alternatif                            |
| category         | Enum                          | **DEPRECATED** → utiliser `platform_type` |
| checksum         | uuid                          | Hash                                      |
| created_at       | datetime                      | Date d'ajout                              |
| generation       | Integer                       | Génération                                |
| name             | String                        | Nom                                       |
| platform_family  | Ref → Platform Family         | Famille                                   |
| platform_logo    | Ref → Platform Logo           | Logo                                      |
| platform_type    | Ref → Platform Type           | Type                                      |
| slug             | String                        | Slug                                      |
| summary          | String                        | Résumé                                    |
| updated_at       | datetime                      | Dernière MAJ                              |
| url              | String                        | URL                                       |
| versions         | Array of Platform Version IDs | Versions                                  |
| websites         | Array of Platform Website IDs | Sites web                                 |

Enums legacy `category` : console=1, arcade=2, platform=3, operating_system=4,
portable_console=5, computer=6

#### platform_families

Path: `/platform_families`  
Champs : checksum, name, slug

#### platform_logos

Path: `/platform_logos`  
Champs : alpha_channel, animated, checksum, height, image_id, url, width

#### platform_types

Path: `/platform_types`  
Champs : checksum, created_at, name, updated_at

#### platform_versions

Path: `/platform_versions`

| Champ                          | Type                                  | Description            |
| ------------------------------ | ------------------------------------- | ---------------------- |
| checksum                       | uuid                                  | Hash                   |
| companies                      | Array of Platform Version Company IDs | Entreprises            |
| connectivity                   | String                                | Connectivité réseau    |
| cpu                            | String                                | Processeur             |
| graphics                       | String                                | Chipset graphique      |
| main_manufacturer              | Ref → Platform Version Company        | Fabricant principal    |
| media                          | String                                | Support physique       |
| memory                         | String                                | Mémoire                |
| name                           | String                                | Nom                    |
| os                             | String                                | Système d'exploitation |
| output                         | String                                | Sortie vidéo           |
| platform_logo                  | Ref → Platform Logo                   | Logo                   |
| platform_version_release_dates | Array of IDs                          | Dates de sortie        |
| resolutions                    | String                                | Résolutions            |
| slug                           | String                                | Slug                   |
| sound                          | String                                | Audio                  |
| storage                        | String                                | Stockage               |
| summary                        | String                                | Résumé                 |
| url                            | String                                | URL                    |

#### platform_version_companies

Path: `/platform_version_companies`

| Champ        | Type          | Description |
| ------------ | ------------- | ----------- |
| checksum     | uuid          | Hash        |
| comment      | String        | Commentaire |
| company      | Ref → Company | Entreprise  |
| developer    | boolean       | Développeur |
| manufacturer | boolean       | Fabricant   |

#### platform_version_release_dates

Path: `/platform_version_release_dates`

| Champ            | Type                   | Description                             |
| ---------------- | ---------------------- | --------------------------------------- |
| category         | Enum                   | **DEPRECATED** → utiliser `date_format` |
| checksum         | uuid                   | Hash                                    |
| created_at       | datetime               | Date d'ajout                            |
| date             | Unix Timestamp         | Date                                    |
| date_format      | Ref → Date Format      | Format                                  |
| human            | String                 | Date lisible                            |
| m                | Integer                | Mois                                    |
| platform_version | Ref → Platform Version | Version                                 |
| region           | Ref → Region           | Région                                  |
| updated_at       | datetime               | Dernière MAJ                            |
| y                | Integer                | Année                                   |

#### platform_websites

Path: `/platform_websites`

| Champ    | Type               | Description                      |
| -------- | ------------------ | -------------------------------- |
| category | Enum               | **DEPRECATED** → utiliser `type` |
| checksum | uuid               | Hash                             |
| trusted  | boolean            | Vérifié                          |
| type     | Ref → Website Type | Type                             |
| url      | String             | URL                              |

### 5.7 Release Dates & Regions

#### release_dates

Path: `/release_dates`

| Champ       | Type                      | Description                             |
| ----------- | ------------------------- | --------------------------------------- |
| category    | Enum                      | **DEPRECATED** → utiliser `date_format` |
| checksum    | uuid                      | Hash                                    |
| created_at  | datetime                  | Date d'ajout                            |
| d           | Integer                   | Jour du mois                            |
| date        | datetime                  | Date de sortie                          |
| date_format | Ref → Date Format         | Format de date                          |
| game        | Ref → Game                | Jeu                                     |
| human       | String                    | Date lisible                            |
| m           | Integer                   | Mois                                    |
| platform    | Ref → Platform            | Plateforme                              |
| region      | Ref → Release Date Region | Région                                  |
| status      | Ref → Release Date Status | Statut                                  |
| updated_at  | datetime                  | Dernière MAJ                            |
| y           | Integer                   | Année                                   |

#### release_date_regions

Path: `/release_date_regions`  
Champs : checksum, created_at, region (String), updated_at

#### release_date_statuses

Path: `/release_date_statuses`  
Champs : checksum, created_at, description, name, updated_at

#### date_formats

Path: `/date_formats`  
Champs : checksum, created_at, format (String), updated_at

#### regions

Path: `/regions`

| Champ      | Type     | Description              |
| ---------- | -------- | ------------------------ |
| category   | String   | 'locale' ou 'continent'  |
| checksum   | uuid     | Hash                     |
| created_at | datetime | Date d'ajout             |
| identifier | String   | Identifiant de la région |
| name       | String   | Nom                      |
| updated_at | datetime | Dernière MAJ             |

### 5.8 Media (Covers, Screenshots, Artworks)

#### covers

Path: `/covers`

| Champ             | Type                    | Description    |
| ----------------- | ----------------------- | -------------- |
| alpha_channel     | boolean                 | Canal alpha    |
| animated          | boolean                 | Animé          |
| checksum          | uuid                    | Hash           |
| game              | Ref → Game              | Jeu            |
| game_localization | Ref → Game Localization | Localisation   |
| height            | Integer                 | Hauteur pixels |
| image_id          | String                  | ID image       |
| url               | String                  | URL            |
| width             | Integer                 | Largeur pixels |

#### screenshots

Path: `/screenshots`

| Champ         | Type       | Description    |
| ------------- | ---------- | -------------- |
| alpha_channel | boolean    | Canal alpha    |
| animated      | boolean    | Animé          |
| checksum      | uuid       | Hash           |
| game          | Ref → Game | Jeu            |
| height        | Integer    | Hauteur pixels |
| image_id      | String     | ID image       |
| url           | String     | URL            |
| width         | Integer    | Largeur pixels |

#### artworks

Path: `/artworks`

| Champ         | Type               | Description    |
| ------------- | ------------------ | -------------- |
| alpha_channel | boolean            | Canal alpha    |
| animated      | boolean            | Animé          |
| artwork_type  | Ref → Artwork Type | Type d'artwork |
| checksum      | uuid               | Hash           |
| game          | Ref → Game         | Jeu            |
| height        | Integer            | Hauteur pixels |
| image_id      | String             | ID image       |
| url           | String             | URL            |
| width         | Integer            | Largeur pixels |

#### artwork_types

Path: `/artwork_types`  
Champs : checksum, created_at, name, slug, updated_at

### 5.9 Genres, Themes, Keywords, Perspectives

#### genres

Path: `/genres`  
Champs : checksum, created_at, name, slug, updated_at, url

#### themes

Path: `/themes`  
Champs : checksum, created_at, name, slug, updated_at, url

Note : Le thème "erotic" a l'ID 42. Filtrer avec `where themes != (42);`

#### keywords

Path: `/keywords`  
Champs : checksum, created_at, name, slug, updated_at, url

#### player_perspectives

Path: `/player_perspectives`  
Champs : checksum, created_at, name, slug, updated_at, url

### 5.10 Companies & Involvement

#### involved_companies

Path: `/involved_companies`

| Champ      | Type          | Description     |
| ---------- | ------------- | --------------- |
| checksum   | uuid          | Hash            |
| company    | Ref → Company | Entreprise      |
| created_at | datetime      | Date d'ajout    |
| developer  | boolean       | Est développeur |
| game       | Ref → Game    | Jeu             |
| porting    | boolean       | Est porteur     |
| publisher  | boolean       | Est éditeur     |
| supporting | boolean       | Est support     |
| updated_at | datetime      | Dernière MAJ    |

### 5.11 Languages

#### languages

Path: `/languages`

| Champ       | Type     | Description                    |
| ----------- | -------- | ------------------------------ |
| checksum    | uuid     | Hash                           |
| created_at  | datetime | Date d'ajout                   |
| locale      | String   | Code locale (ex: en-US, fr-FR) |
| name        | String   | Nom anglais                    |
| native_name | String   | Nom natif                      |
| updated_at  | datetime | Dernière MAJ                   |

#### language_supports

Path: `/language_supports`

| Champ                 | Type                        | Description                        |
| --------------------- | --------------------------- | ---------------------------------- |
| checksum              | uuid                        | Hash                               |
| created_at            | datetime                    | Date d'ajout                       |
| game                  | Ref → Game                  | Jeu                                |
| language              | Ref → Language              | Langue                             |
| language_support_type | Ref → Language Support Type | Type (Audio, Subtitles, Interface) |
| updated_at            | datetime                    | Dernière MAJ                       |

#### language_support_types

Path: `/language_support_types`  
Champs : checksum, created_at, name, updated_at

### 5.12 Multiplayer

#### multiplayer_modes

Path: `/multiplayer_modes`

| Champ             | Type           | Description                 |
| ----------------- | -------------- | --------------------------- |
| campaigncoop      | boolean        | Coop en campagne            |
| checksum          | uuid           | Hash                        |
| dropin            | boolean        | Drop in/out                 |
| game              | Ref → Game     | Jeu                         |
| lancoop           | boolean        | Coop LAN                    |
| offlinecoop       | boolean        | Coop hors ligne             |
| offlinecoopmax    | Integer        | Max joueurs coop hors ligne |
| offlinemax        | Integer        | Max joueurs hors ligne      |
| onlinecoop        | boolean        | Coop en ligne               |
| onlinecoopmax     | Integer        | Max joueurs coop en ligne   |
| onlinemax         | Integer        | Max joueurs en ligne        |
| platform          | Ref → Platform | Plateforme                  |
| splitscreen       | boolean        | Écran partagé               |
| splitscreenonline | boolean        | Écran partagé en ligne      |

### 5.13 External Games

#### external_games

Path: `/external_games`

| Champ                | Type                       | Description                                      |
| -------------------- | -------------------------- | ------------------------------------------------ |
| category             | Enum                       | **DEPRECATED** → utiliser `external_game_source` |
| checksum             | uuid                       | Hash                                             |
| countries            | Array of Integers          | Codes pays ISO                                   |
| created_at           | datetime                   | Date d'ajout                                     |
| external_game_source | Ref → External Game Source | Source externe                                   |
| game                 | Ref → Game                 | Jeu                                              |
| media                | Ref → Game Release Format  | Format                                           |
| name                 | String                     | Nom                                              |
| platform             | Ref → Platform             | Plateforme                                       |
| uid                  | String                     | ID externe                                       |
| updated_at           | datetime                   | Dernière MAJ                                     |
| url                  | String                     | URL                                              |
| year                 | Integer                    | Année                                            |

#### external_game_sources

Path: `/external_game_sources`  
Champs : checksum, created_at, name, updated_at

### 5.14 Events

#### events

Path: `/events`

| Champ           | Type                       | Description    |
| --------------- | -------------------------- | -------------- |
| checksum        | uuid                       | Hash           |
| created_at      | datetime                   | Date d'ajout   |
| description     | String                     | Description    |
| end_time        | datetime                   | Fin (UTC)      |
| event_logo      | Ref → Event Logo           | Logo           |
| event_networks  | Array of Event Network IDs | Réseaux        |
| games           | Array of Game IDs          | Jeux présentés |
| live_stream_url | String                     | URL du stream  |
| name            | String                     | Nom            |
| slug            | String                     | Slug           |
| start_time      | datetime                   | Début (UTC)    |
| time_zone       | String                     | Fuseau horaire |
| updated_at      | datetime                   | Dernière MAJ   |
| videos          | Array of Game Video IDs    | Vidéos         |

#### event_logos

Path: `/event_logos`  
Champs : alpha_channel, animated, checksum, created_at, event, height, image_id,
updated_at, url, width

#### event_networks

Path: `/event_networks`  
Champs : checksum, created_at, event, network_type, updated_at, url

#### network_types

Path: `/network_types`  
Champs : checksum, created_at, event_networks, name, updated_at

### 5.15 Alternative Names & Websites

#### alternative_names

Path: `/alternative_names`

| Champ    | Type       | Description                                |
| -------- | ---------- | ------------------------------------------ |
| checksum | uuid       | Hash                                       |
| comment  | String     | Type de nom (Acronym, Working title, etc.) |
| game     | Ref → Game | Jeu                                        |
| name     | String     | Nom alternatif                             |

#### websites

Path: `/websites`

| Champ    | Type               | Description                      |
| -------- | ------------------ | -------------------------------- |
| category | Enum               | **DEPRECATED** → utiliser `type` |
| checksum | uuid               | Hash                             |
| game     | Ref → Game         | Jeu                              |
| trusted  | boolean            | Vérifié                          |
| type     | Ref → Website Type | Type                             |
| url      | String             | URL                              |

#### website_types

Path: `/website_types`  
Champs : checksum, created_at, type (String), updated_at

### 5.16 Popularity & PopScore

#### popularity_primitives

Path: `/popularity_primitives`

| Champ                      | Type                  | Description        |
| -------------------------- | --------------------- | ------------------ |
| calculated_at              | datetime              | Date de calcul     |
| checksum                   | uuid                  | Hash               |
| created_at                 | datetime              | Date d'ajout       |
| external_popularity_source | Ref → Popularity Type | Source             |
| game_id                    | Integer               | ID du jeu          |
| popularity_type            | Integer               | Type de popularité |
| value                      | Double                | Valeur             |

#### popularity_types

Path: `/popularity_types`  
Champs : checksum, created_at, external_popularity_source, name, updated_at

### 5.17 Search, Reports, Entity Types

#### search

Path: `/search`

| Champ            | Type             | Description           |
| ---------------- | ---------------- | --------------------- |
| alternative_name | String           | Nom alternatif trouvé |
| character        | Ref → Character  | Personnage trouvé     |
| collection       | Ref → Collection | Collection trouvée    |
| description      | String           | Description           |
| game             | Ref → Game       | Jeu trouvé            |
| name             | String           | Nom                   |
| platform         | Ref → Platform   | Plateforme trouvée    |
| published_at     | datetime         | Date de publication   |
| test_dummy       | Ref → Game       | Test                  |
| theme            | Ref → Theme      | Thème trouvé          |

#### reports

Path: `/reports`  
Champs : checksum, created_at, entity_type, reason, updated_at, user

#### report_types

Path: `/report_types`  
Champs : checksum, created_at, name, updated_at

#### entity_types

Path: `/entity_types`  
Champs : checksum, created_at, description, name, updated_at

---

## 6. Migration Enums → Tables

IGDB migre les enums statiques vers des tables dynamiques. Période de migration
terminée (février → août). Les anciens champs sont dépréciés.

### Correspondances

| Endpoint        | Ancien champ         | Nouveau champ                    |
| --------------- | -------------------- | -------------------------------- |
| age_rating      | category             | organization                     |
| age_rating      | rating               | rating_category                  |
| age_rating      | content_descriptions | rating_content_descriptions (v2) |
| character       | gender               | character_gender                 |
| character       | species              | character_species                |
| companies       | change_date_category | change_date_format               |
| companies       | start_date_category  | start_date_format                |
| company_website | category             | type                             |
| external_game   | category             | external_game_source             |
| external_game   | media                | game_release_format              |
| platform        | category             | platform_type                    |
| website         | category             | type                             |
| game            | category             | game_type                        |
| game            | status               | game_status                      |

### Nouveaux endpoints (remplaçant les enums)

- age_rating_organizations
- age_rating_categories
- age_rating_content_descriptions_v2
- character_genders
- character_species
- company_statuses
- company_websites (type field)
- date_formats
- external_game_sources
- game_release_formats
- game_statuses
- game_types
- platform_types
- release_date_regions
- website_types

---

## 7. PopScore (Popularity API)

IGDB PopScore fournit des "popularity primitives" issues de plusieurs sources,
mises à jour toutes les 24 heures. Permet de créer ses propres indicateurs de
tendance en combinant les primitives avec des poids personnalisés.

### Primitives disponibles

| ID  | Nom               | Source (popularity_source) |
| --- | ----------------- | -------------------------- |
| 1   | Visits            | 121 (IGDB)                 |
| 2   | Want to Play      | 121 (IGDB)                 |
| 3   | Playing           | 121 (IGDB)                 |
| 4   | Played            | 121 (IGDB)                 |
| 5   | 24hr Peak Players | 1 (Steam)                  |
| 6   | Positive Reviews  | 1 (Steam)                  |
| 7   | Negative Reviews  | 1 (Steam)                  |
| 8   | Total Reviews     | 1 (Steam)                  |

### Lister les types de popularité

```apicalypse
// POST https://api.igdb.com/v4/popularity_types
fields name,popularity_source,updated_at; sort id asc;
```

### Top 10 jeux par visites IGDB

```apicalypse
// POST https://api.igdb.com/v4/popularity_primitives
fields game_id,value,popularity_type;
sort value desc;
limit 10;
where popularity_type = 1;
```

### Créer un score personnalisé

Combiner plusieurs primitives avec des poids. Exemple : 60% "Want to Play" + 40%
"Playing" :

1. Récupérer les valeurs pour `popularity_type = 2` (Want to Play)
2. Récupérer les valeurs pour `popularity_type = 3` (Playing)
3. Calculer : `0.6 * value_want_to_play + 0.4 * value_playing`

Exemple SQL pour top 10 :

```sql
SELECT igdb_game_id,
  (0.6 * SUM(CASE WHEN popularity_type_id = '2' THEN value ELSE 0 END)
 + 0.4 * SUM(CASE WHEN popularity_type_id = '3' THEN value ELSE 0 END)
  ) AS weighted_score
FROM popularity_primitives
GROUP BY igdb_game_id
ORDER BY weighted_score DESC
LIMIT 10;
```

---

## 8. Webhooks

Les webhooks permettent de recevoir des notifications push quand des données
sont créées, modifiées ou supprimées, au lieu de poller l'API.

### Enregistrer un webhook

```
POST https://api.igdb.com/v4/{ENDPOINT}/webhooks/
Headers:
  Client-ID: {client_id}
  Authorization: Bearer {access_token}
  Content-Type: application/x-www-form-urlencoded

Body (x-www-form-urlencoded):
  url=YOUR_WEBHOOK_URL&secret=YOUR_WEBHOOK_SECRET&method=create
```

Paramètres (x-www-form-urlencoded) :

- `url` : URL de votre endpoint prêt à recevoir les données
- `method` : `create` | `update` | `delete`
- `secret` : mot de passe **choisi par vous**. IGDB le renverra dans le header
  `X-Secret` à chaque notification. Vous pouvez utiliser le même secret pour
  tous vos webhooks ou un secret différent par webhook.

Réponse :

```json
{
  "id": "WEBHOOK_ID",
  "url": "YOUR_WEBHOOK_URL",
  "category": 1,
  "sub_category": 0,
  "active": true,
  "api_key": "YOUR_CLIENT_ID",
  "secret": "YOUR_SECRET",
  "created_at": "2018-11-25T23:00:00.000Z",
  "updated_at": "2018-11-25T23:00:00.000Z"
}
```

### Lister tous les webhooks

```
GET https://api.igdb.com/v4/webhooks/
Headers:
  Client-ID: {client_id}
  Authorization: Bearer {access_token}
```

Retourne un tableau JSON de tous les webhooks enregistrés pour votre
`Client-ID`. Note : le path est `/webhooks/` sans endpoint spécifique.

### Voir un webhook spécifique

```
GET https://api.igdb.com/v4/webhooks/{WEBHOOK_ID}
Headers:
  Client-ID: {client_id}
  Authorization: Bearer {access_token}
```

### Supprimer un webhook

```
DELETE https://api.igdb.com/v4/webhooks/{WEBHOOK_ID}
Headers:
  Client-ID: {client_id}
  Authorization: Bearer {access_token}
```

Note : le path est `/webhooks/{ID}` sans endpoint spécifique. Retourne le
webhook supprimé en confirmation.

### Tester un webhook

```
POST https://api.igdb.com/v4/{ENDPOINT}/webhooks/test/{WEBHOOK_ID}?entityId={ENTITY_ID}
Headers:
  Client-ID: {client_id}
  Authorization: Bearer {access_token}
```

Exemple : `POST games/webhooks/test/42?entityId=1337` envoie l'objet game ID
1337 à votre webhook.

### Gestion du secret

Le `secret` est un mot de passe que **vous choisissez** lors de
l'enregistrement. Ce n'est pas un token généré par IGDB. À chaque notification,
IGDB inclut ce secret dans le header `X-Secret` de la requête POST envoyée à
votre URL.

- Vous pouvez utiliser le **même secret** pour tous vos webhooks
- Ou un secret différent par webhook pour une granularité plus fine
- Côté réception, validez toujours `X-Secret` pour vérifier l'authenticité

### Comportement

- Les données arrivent en POST sur votre URL, body = JSON d'une entité non
  expandée (champs de base uniquement, pas d'expander)
- Les webhooks DELETE n'envoient que l'ID : `{"id": "1234"}`
- Votre endpoint doit répondre `200 OK` en moins de **15 secondes**
- Si l'endpoint met plus de 15 secondes, c'est compté comme un échec
- Après **5 échecs consécutifs**, le webhook passe en `active: false` et IGDB
  arrête d'envoyer des données
- Pour réactiver : ré-enregistrer le webhook (même requête POST), ce qui remet
  `active: true`
- **Bonne pratique** : ré-enregistrer vos webhooks au démarrage du service pour
  s'assurer qu'ils sont toujours actifs

### Intégration dans ce projet

Le projet utilise les webhooks IGDB via :

- **Endpoint de réception** :
  `POST /api/webhooks/igdb?entity={type}&method={method}`
- **Secret** : variable d'environnement `IGDB_WEBHOOK_SECRET` (un seul secret
  pour tous les webhooks)
- **Table d'audit** : `igdb_webhook_events` (log de tous les événements reçus)
- **Traitement** :
  - `create` + `games` → auto-import via `GameImportService.importFromIGDB()`
  - `update` / `delete` → log uniquement pour traitement manuel
- **Admin** : page `/admin/webhooks` avec onglets Jeux, Personnages, Gestion
- **Gestion** : enregistrement/suppression des webhooks via l'API admin
  (`/api/admin/webhooks/registrations`)

---

## 9. Data Dumps (Partenaires uniquement)

Tous les endpoints sont disponibles sous forme de CSV Data Dumps, mis à jour
quotidiennement. Permet de démarrer un projet rapidement ou de garder les
données à jour (dans les 24 heures). Réservé aux partenaires commerciaux (Data
Partners).

### Lister les dumps disponibles

```
GET https://api.igdb.com/v4/dumps
Headers:
  Client-ID: {client_id}
  Authorization: Bearer {access_token}
```

Réponse (tableau) :

```json
[
  {
    "endpoint": "games",
    "file_name": "1234567890_games.csv",
    "updated_at": 1234567890
  }
]
```

### Télécharger un CSV

```
GET https://api.igdb.com/v4/dumps/{ENDPOINT}
Headers:
  Client-ID: {client_id}
  Authorization: Bearer {access_token}
```

Réponse :

```json
{
  "s3_url": "S3_DOWNLOAD_URL",
  "endpoint": "games",
  "file_name": "1234567890_games.csv",
  "size_bytes": 123456789,
  "updated_at": 1234567890,
  "schema_version": "1234567890",
  "schema": {
    "id": "LONG",
    "name": "STRING",
    "url": "STRING",
    "franchises": "LONG[]",
    "rating": "DOUBLE",
    "created_at": "TIMESTAMP",
    "checksum": "UUID"
  }
}
```

### Points importants

- L'URL S3 est une URL pré-signée valide **5 minutes** seulement.
- Le `schema_version` change quand la structure du CSV évolue. Si vous
  automatisez l'import, surveillez ce numéro pour adapter votre parsing.
- Le champ `schema` décrit les colonnes et leurs types de données : `STRING`,
  `LONG`, `DOUBLE`, `TIMESTAMP`, `UUID`, et les variantes tableau (`LONG[]`,
  etc.).
- Les dumps utilisent `GET` (contrairement au reste de l'API qui utilise
  `POST`).

### Exemple JavaScript

```javascript
fetch("https://api.igdb.com/v4/dumps", {
  method: "GET",
  headers: {
    "Client-ID": "Client ID",
    Authorization: "Bearer access_token",
  },
})
  .then((response) => response.json())
  .then((data) => console.log(data))
  .catch((err) => console.error(err));

// Télécharger un dump spécifique
fetch("https://api.igdb.com/v4/dumps/games", {
  method: "GET",
  headers: {
    "Client-ID": "Client ID",
    Authorization: "Bearer access_token",
  },
})
  .then((response) => response.json())
  .then((data) => {
    // data.s3_url contient le lien de téléchargement (valide 5 min)
    console.log(data.s3_url);
  })
  .catch((err) => console.error(err));
```

---

## 10. Intégration dans ce projet

### Service principal

`src/lib/services/igdbService.ts` — Classe `IGDBService` avec :

- `getAccessToken()` : OAuth2 Twitch avec cache
- `buildImageUrl(imageId, size)` : Construction d'URL image
- `searchGames(query, limit)` : Recherche de jeux
- `getGameDetails(igdbId)` : Détails d'un jeu
- `getTimeToBeat(igdbId)` : Temps de jeu
- `getAgeRatings(ids)` : Classifications
- `getGameVersions(igdbId)` : Versions/éditions
- `getDlcExtensions(ids)` : DLC/extensions
- `getCharactersBatch(offset, limit)` : Personnages en batch
- `getCharactersCount()` : Nombre total de personnages

### Types TypeScript

`src/types/igdb.ts` — Interfaces : IGDBAuthToken, IGDBGame, IGDBCharacter,
IGDBSearchResult, IGDBAgeRating, IGDBLanguageSupport, IGDBTimeToBeat,
IGDBGameVersion, IGDBDlcExtension, IGDBImageSize

### Scripts d'import bulk

`scripts/igdb-import/` :

- `games/` : Import en masse de jeux (fetcher, importer, sync, orchestrator)
- `characters/` : Import en masse de personnages
- `shared/` : Rate limiter, retry, progress tracker, CLI, Supabase client

### Variables d'environnement

- `IGDB_CLIENT_ID` : Client ID Twitch
- `IGDB_CLIENT_SECRET` : Client Secret Twitch
