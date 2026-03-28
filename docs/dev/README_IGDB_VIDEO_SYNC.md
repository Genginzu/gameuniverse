# Synchronisation des vidéos IGDB

## Description

Synchronisation automatique des vidéos YouTube associées aux jeux depuis l'API
IGDB vers la table `game_videos`. Les vidéos sont récupérées lors de l'import
bulk et de la synchronisation admin, puis affichées en premier dans la galerie
média des pages jeux via un iframe YouTube embed.

### Fonctionnalités

- **Import bulk** : récupération des vidéos (`video_id`, `name`) lors de
  l'import de jeux depuis IGDB via `scripts/igdb-import/`
- **Sync automatique** : synchronisation des vidéos pour les jeux existants via
  le panneau admin (champ trackable `"videos"` avec support des overrides)
- **Transformation partagée** : fonction pure `transformIgdbVideos` réutilisée
  par l'import et le sync (URL YouTube, thumbnail, type trailer, ordre
  d'affichage)
- **Affichage frontend** : vidéos en premier dans `GameMediaGallery`, iframe
  YouTube embed au lieu de l'élément `<video>` HTML
- **Résilience** : les erreurs d'insertion vidéo sont loggées sans bloquer
  l'import du jeu

## Accès

### Affichage des vidéos

Les vidéos apparaissent sur la page d'aperçu de chaque jeu, dans le composant
`GameMediaGallery` :

- **Ordre** : vidéos → artworks → screenshots
- **Rendu** : iframe YouTube embed avec contrôles natifs (lecture, plein écran)
- **Titre** : affiché sous chaque vidéo
- **Style** : `aspect-video`, `rounded-xl`, `border border-slate-700` (cohérent
  avec les autres sections média)
- **Cas vide** : la section vidéos n'est pas rendue si aucune vidéo n'existe

### URL des pages jeux

```
/{locale}/games/{slug}
```

La galerie média est affichée automatiquement si le jeu possède des vidéos,
artworks ou screenshots.

## Prérequis

### Clés API IGDB

Les variables d'environnement suivantes doivent être configurées :

| Variable             | Description                    |
| -------------------- | ------------------------------ |
| `IGDB_CLIENT_ID`     | Client ID de l'application     |
| `IGDB_CLIENT_SECRET` | Client Secret de l'application |

Ces clés sont obtenues via le
[portail développeur Twitch](https://dev.twitch.tv/console).

### Base de données

La table `game_videos` doit exister dans Supabase (déjà présente, aucune
migration nécessaire). Colonnes utilisées : `game_id`, `url`, `thumbnail_url`,
`title`, `video_type`, `display_order`, `is_featured`.

## Utilisation

### Import bulk

L'import bulk via `scripts/igdb-import/` récupère automatiquement les vidéos
pour chaque jeu importé :

```bash
# Import standard (inclut les vidéos)
bun run scripts/igdb-import/index.ts

# Mode dry-run (affiche le nombre de vidéos sans insérer)
bun run scripts/igdb-import/index.ts --dry-run

# Mode verbose (log le nombre de vidéos importées par jeu)
bun run scripts/igdb-import/index.ts --verbose
```

### Sync admin (jeux existants)

La synchronisation depuis le panneau admin met à jour les vidéos des jeux
existants :

- Le champ `"videos"` est un `TrackableField` dans `FIELD_SYNC_MAP`
- Pattern **delete + re-insert** : les vidéos existantes sont supprimées puis
  réinsérées depuis les données IGDB
- Si un **override** existe pour `"videos"`, la synchronisation est ignorée

### Mapping IGDB → game_videos

| Champ IGDB    | Champ game_videos | Transformation                                            |
| ------------- | ----------------- | --------------------------------------------------------- |
| `video_id`    | `url`             | `https://www.youtube.com/watch?v={video_id}`              |
| `video_id`    | `thumbnail_url`   | `https://img.youtube.com/vi/{video_id}/maxresdefault.jpg` |
| `name`        | `title`           | Copie directe                                             |
| —             | `video_type`      | `"trailer"`                                               |
| (index)       | `display_order`   | Index séquentiel (0, 1, 2…)                               |
| (index === 0) | `is_featured`     | `true` pour la première vidéo uniquement                  |

## Architecture

### Fichiers clés

| Fichier                                             | Rôle                                                     |
| --------------------------------------------------- | -------------------------------------------------------- |
| `scripts/igdb-import/video-transform.ts`            | Fonction pure `transformIgdbVideos` (IGDB → game_videos) |
| `scripts/igdb-import/game-importer.ts`              | Insertion des vidéos lors de l'import bulk               |
| `scripts/igdb-import/orchestrator.ts`               | Requête IGDB incluant `videos.video_id, videos.name`     |
| `src/lib/services/igdb-sync-fields-extended.ts`     | Fonction `syncVideos` (delete + re-insert)               |
| `src/lib/services/igdb-sync.ts`                     | Entrée `videos` dans `FIELD_SYNC_MAP`                    |
| `src/lib/services/igdbService.ts`                   | Requête `getGameDetails` incluant les vidéos             |
| `src/components/games/details/GameMediaGallery.tsx` | Affichage iframe YouTube, vidéos en premier              |

### Types modifiés

| Fichier                           | Modification                                                         |
| --------------------------------- | -------------------------------------------------------------------- |
| `src/types/igdb.ts`               | `videos?: Array<{ video_id: string; name: string }>` dans `IGDBGame` |
| `src/types/admin-games.ts`        | `"videos"` dans `TrackableField`                                     |
| `src/lib/utils/field-tracking.ts` | `"videos"` dans `TRACKABLE_FIELDS`                                   |

## Tests

| Fichier                                                                | Type           | Contenu                                  |
| ---------------------------------------------------------------------- | -------------- | ---------------------------------------- |
| `test/scripts/igdb-import/video-transform.test.ts`                     | Unitaire       | Transformation : vide, 1 vidéo, N vidéos |
| `test/scripts/igdb-import/video-transform.property.test.ts`            | Property-based | URL correctness, round-trip, longueur    |
| `test/scripts/igdb-import/video-import.test.ts`                        | Unitaire       | Import avec/sans vidéos, erreur DB       |
| `test/unit/lib/services/igdb-sync-videos.test.ts`                      | Unitaire       | Delete + reinsert, override skip         |
| `test/unit/lib/services/igdb-sync-videos.property.test.ts`             | Property-based | Override skip video sync                 |
| `test/unit/components/games/details/GameMediaGallery.test.tsx`         | Unitaire       | Iframe YouTube, ordre sections, titre    |
| `test/unit/components/games/details/GameMediaGallery.property.test.ts` | Property-based | Extraction URL embed YouTube             |

```bash
# Lancer tous les tests
bun run test:all

# Lancer les tests de transformation vidéo
bunx vitest run test/scripts/igdb-import/video-transform.test.ts

# Lancer les tests property-based de transformation
bunx vitest run test/scripts/igdb-import/video-transform.property.test.ts
```
