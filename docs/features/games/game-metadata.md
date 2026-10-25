# Métadonnées IGDB des jeux

## Description

Chaque jeu stocke les métadonnées IGDB suivantes (issues #77 à #82), importées,
synchronisées et éditables dans l'admin comme les autres champs suivis :

| Donnée              | Stockage                                             | Champ suivi           |
| ------------------- | ---------------------------------------------------- | --------------------- |
| Thèmes              | `themes` + `game_themes`                             | `themes`              |
| Modes de jeu        | `game_modes` + `game_game_modes`                     | `game_modes`          |
| Perspectives        | `player_perspectives` + `game_player_perspectives`   | `player_perspectives` |
| Modes multijoueur   | `game_multiplayer_modes` (une ligne par plateforme)  | `multiplayer_modes`   |
| Franchises          | `franchises` + `game_franchises`                     | `franchises`          |
| Collections IGDB    | `series` + `game_series`                             | `franchises`          |
| Mots-clés           | `keywords` + `game_keywords`                         | `keywords`            |
| Moteurs             | `game_engines` + `game_game_engines`                 | `game_engines`        |
| Liens officiels     | `game_websites` (type IGDB, URL, vérifié)            | `websites`            |
| Note IGDB           | `games.igdb_total_rating`, `igdb_total_rating_count` | `igdb_rating`         |

Les collections IGDB vivent dans `series` car `game_collections` est déjà la
fonctionnalité de collections utilisateurs. Elles partagent le type de page des
franchises.

La note IGDB est stockée sans affichage public pour l'instant.

## Écriture

- Une seule voie d'écriture : la RPC `set_games_metadata(p_items)` (SECURITY
  INVOKER, donc admin ou service role), qui recalcule aussi `games.is_adult`
  (thème 42).
- Utilisée par l'import unitaire, l'import en masse admin, la synchro globale,
  le CLI `scripts/igdb-import` et les webhooks IGDB (seulement les champs
  touchés et non surchargés).
- Chaque champ a sa colonne `games.igdb_<champ>_synced_at` : NULL = cible de
  l'import en masse et du backfill.
- L'admin écrit directement les tables (RLS admin) via
  `src/lib/services/adminGameMetadata.ts`.

## Accès

| Route / page                        | Rôle                                                              |
| ----------------------------------- | ----------------------------------------------------------------- |
| `/games/[slug]` section 03          | Fiche technique, multijoueur, liens                               |
| `/games/[slug]` section 14          | Autres jeux de la franchise                                       |
| `/games?themes=&gameModes=&…`       | Filtres `themes`, `gameModes`, `perspectives`, `engines`, `franchises` (slugs) |
| `/franchises`, `/franchises/[slug]` | Listing (recherche) et page d'une franchise ou collection         |
| `/admin/games/[id]/edit`            | Onglets « Classification » et « Liens & multijoueur »             |
| `/admin/franchises`                 | CRUD des franchises (nom, slug, description FR/EN)                |
| `/admin/bulk-import/[champ]`        | Import en masse par champ                                         |
| `GET /api/game-metadata`            | Options des filtres du listing                                    |
| `GET /api/franchises[/slug]`        | Listing (`list_franchises`) et détail                             |

La recherche de jeux (`/api/games?search=`, recherche hybride) ajoute aux
correspondances de titre les jeux dont un mot-clé IGDB porte exactement le
terme recherché.

## Prérequis

1. Appliquer `supabase/migrations/20261026000001_igdb_game_metadata.sql`.
2. Remplir le catalogue existant (reprenable, champs surchargés ignorés) :

   ```bash
   bun --env-file=.env scripts/igdb-import/games/backfill-metadata.ts --dry-run
   bun --env-file=.env scripts/igdb-import/games/backfill-metadata.ts [--limit=N]
   ```

   Également à lancer après un import `--dump`, qui n'assemble pas ces champs.

## Utilisation

- Libellés FR/EN des thèmes, modes, perspectives et types de liens : namespace
  `igdbMetadata` (clé = id IGDB), avec repli sur le nom anglais IGDB.
- Les noms de franchises, moteurs et mots-clés ne sont pas traduits.
- Les mots-clés ne sont pas affichés : ils servent uniquement à la recherche.
