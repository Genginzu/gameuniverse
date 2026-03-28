# IGDB Field Tracking

## Description

Système de suivi des modifications manuelles des champs de jeux après import
IGDB. Lorsqu'un administrateur modifie un champ d'un jeu importé depuis IGDB,
cette modification est enregistrée dans la table `game_field_overrides`. Lors
d'une synchronisation ou d'un nouvel import IGDB, les champs modifiés
manuellement sont protégés et ne sont pas écrasés.

La fonctionnalité inclut :

- Détection automatique des champs modifiés lors de la sauvegarde admin
- Protection des champs modifiés manuellement lors des imports IGDB
- Onglet « Synchronisation IGDB » dans le formulaire d'édition admin
- Indicateur visuel IGDB à côté des champs non modifiés manuellement
- Synchronisation individuelle ou globale depuis IGDB

## Accès

### Onglet Synchronisation

1. Se connecter en tant qu'administrateur
2. Naviguer vers **Admin > Jeux > Éditer un jeu**
3. L'onglet **Sync** apparaît dans le formulaire d'édition (uniquement pour les
   jeux ayant un `igdb_id`)

### Indicateurs IGDB

Les indicateurs IGDB (petits badges) apparaissent automatiquement à côté des
labels de champs dans tous les onglets du formulaire d'édition, pour les jeux
liés à IGDB. Un champ avec l'indicateur contient encore la donnée originale
d'IGDB (non modifiée manuellement).

### API

- `GET /api/admin/games/:id/overrides` — Liste des champs modifiés manuellement
- `POST /api/admin/games/:id/sync` — Synchroniser un champ
  (`{ field: "genres" }`) ou tous les champs (`{}`)

## Prérequis

- Rôle administrateur (les routes API et la table RLS sont protégées)
- Le jeu doit avoir un `igdb_id` pour que la synchronisation et les indicateurs
  fonctionnent
- La migration `supabase/migrations/20240216000001_game_field_overrides.sql`
  doit être appliquée

## Utilisation

### Édition d'un jeu

Quand un administrateur sauvegarde un jeu via le formulaire d'édition, le
système compare automatiquement les valeurs soumises avec les valeurs actuelles
en base. Les champs modifiés sont enregistrés dans `game_field_overrides`.

### Onglet Sync

- Chaque champ affiche son état : **synced IGDB** (vert) ou **modifié
  manuellement** (orange)
- Cliquer sur **Sync** à côté d'un champ pour récupérer la valeur IGDB et
  supprimer l'override
- Cliquer sur **Sync tout** pour synchroniser tous les champs depuis IGDB

### Champs suivis

Les 13 catégories de champs synchronisables :

| Catégorie          | Description                           |
| ------------------ | ------------------------------------- |
| `translations`     | Titre et description (toutes langues) |
| `cover_image`      | Image de couverture                   |
| `background_image` | Image de fond                         |
| `release_date`     | Date de sortie                        |
| `metascore`        | Note agrégée                          |
| `genres`           | Genres liés                           |
| `companies`        | Développeurs et éditeurs              |
| `screenshots`      | Captures d'écran                      |
| `artworks`         | Artworks                              |
| `age_ratings`      | Classifications d'âge                 |
| `versions`         | Éditions du jeu                       |
| `languages`        | Langues supportées                    |
| `playtime`         | Temps de jeu                          |

### Import IGDB

Le script d'import (`scripts/igdb-import/`) consulte `game_field_overrides`
avant de mettre à jour un jeu existant. Les champs avec un override sont ignorés
et conservent leur valeur actuelle.

## Extensibilité

Pour ajouter un nouveau champ au système de tracking, voir le fichier steering
`.kiro/steering/igdb-field-tracking.md` qui documente la procédure (4 fichiers à
modifier).
