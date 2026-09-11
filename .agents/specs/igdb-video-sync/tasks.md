# Implementation Plan: IGDB Video Sync

## Overview

Compléter le pipeline d'import IGDB en ajoutant la synchronisation des vidéos YouTube associées aux jeux. L'implémentation couvre 4 axes : fonction de transformation partagée, import bulk, sync service, et affichage frontend via iframe YouTube. Aucune migration SQL nécessaire (table `game_videos` existante).

Le langage d'implémentation est **TypeScript** (Next.js / Supabase / Vitest / fast-check).

## Tasks

- [x] 1. Fonction de transformation vidéo et types
  - [x] 1.1 Modifier `src/types/igdb.ts` — ajouter `videos` dans `IGDBGame`
    - Ajouter `videos?: Array<{ video_id: string; name: string }>` dans l'interface `IGDBGame`
    - _Requirements: 1.3_

  - [x] 1.2 Modifier `src/types/admin-games.ts` — ajouter `"videos"` dans `TrackableField`
    - Ajouter `"videos"` dans le type union `TrackableField`
    - _Requirements: 3.1_

  - [x] 1.3 Modifier `src/lib/utils/field-tracking.ts` — ajouter `"videos"` dans `TRACKABLE_FIELDS`
    - Ajouter `"videos"` dans le tableau `TRACKABLE_FIELDS`
    - _Requirements: 3.1_

  - [x] 1.4 Créer `scripts/igdb-import/video-transform.ts`
    - Exporter les interfaces `IGDBVideo` et `GameVideoRow`
    - Implémenter la fonction pure `transformIgdbVideos(videos, gameId)` :
      - URL YouTube : `https://www.youtube.com/watch?v={video_id}`
      - Thumbnail : `https://img.youtube.com/vi/{video_id}/maxresdefault.jpg`
      - `video_type` : `"trailer"`
      - `display_order` : index séquentiel à partir de 0
      - `is_featured` : `true` uniquement pour index 0
      - `title` : copie directe du `name`
    - _Requirements: 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 5.1_

  - [x] 1.5 Écrire les tests unitaires pour `transformIgdbVideos`
    - Fichier : `test/scripts/igdb-import/video-transform.test.ts`
    - Tester : tableau vide, une seule vidéo, plusieurs vidéos, caractères spéciaux dans video_id
    - _Requirements: 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 5.1_

  - [x] 1.6 Écrire les tests property-based pour `transformIgdbVideos`
    - Fichier : `test/scripts/igdb-import/video-transform.property.test.ts`
    - **Property 1: Video transformation correctness**
    - **Validates: Requirements 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 5.4**
    - **Property 2: Video ID round-trip**
    - **Validates: Requirements 5.2**
    - **Property 3: Transformation length preservation**
    - **Validates: Requirements 5.3**

- [x] 2. Checkpoint — Vérifier la transformation vidéo
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Import bulk — récupération et insertion des vidéos
  - [x] 3.1 Modifier `scripts/igdb-import/orchestrator.ts`
    - Ajouter `videos.video_id, videos.name` dans la query IGDB de `fetchGamesBatch`
    - En dry-run, logger le nombre de vidéos qui seraient importées
    - _Requirements: 1.2, 4.1_

  - [x] 3.2 Modifier `scripts/igdb-import/game-importer.ts`
    - Importer `transformIgdbVideos` depuis `video-transform.ts`
    - Après l'insertion des médias existants, appeler `transformIgdbVideos` et insérer dans `game_videos`
    - Si `videos` est absent ou vide, skip sans erreur
    - En cas d'échec d'insertion, logger l'erreur et continuer (`success: true`)
    - En verbose, logger le nombre de vidéos importées
    - _Requirements: 2.1, 2.8, 4.2, 4.3_

  - [x] 3.3 Écrire les tests unitaires pour l'import des vidéos
    - Fichier : `test/scripts/igdb-import/video-import.test.ts`
    - Tester : import avec vidéos, import sans vidéos, échec d'insertion DB (continue sans erreur)
    - _Requirements: 2.1, 2.8, 4.3_

- [x] 4. Sync service — synchronisation des vidéos pour jeux existants
  - [x] 4.1 Modifier `src/lib/services/igdb-sync.ts`
    - Ajouter l'entrée `videos` dans `FIELD_SYNC_MAP` pointant vers `syncVideos`
    - _Requirements: 3.3_

  - [x] 4.2 Modifier `src/lib/services/igdb-sync-fields.ts`
    - Ajouter et exporter la fonction `syncVideos(supabase, gameId, igdbGame)`
    - Pattern delete + re-insert : supprimer les vidéos existantes puis réinsérer via `transformIgdbVideos`
    - Réutiliser `transformIgdbVideos` depuis `scripts/igdb-import/video-transform.ts`
    - _Requirements: 3.2, 3.5_

  - [x] 4.3 Modifier `src/lib/services/igdbService.ts`
    - Ajouter `videos.video_id, videos.name` dans la query de `getGameDetails`
    - _Requirements: 1.1_

  - [x] 4.4 Écrire les tests unitaires pour `syncVideos`
    - Fichier : `test/unit/lib/services/igdb-sync-videos.test.ts`
    - Tester : delete + reinsert, override skip, vidéos vides
    - _Requirements: 3.2, 3.4, 3.5_

  - [x] 4.5 Écrire le test property-based pour l'override skip
    - Fichier : `test/unit/lib/services/igdb-sync-videos.property.test.ts`
    - **Property 4: Override skips video synchronization**
    - **Validates: Requirements 3.4**

- [x] 5. Checkpoint — Vérifier import et sync backend
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Frontend — affichage des vidéos dans GameMediaGallery
  - [x] 6.1 Modifier `src/components/games/details/GameMediaGallery.tsx`
    - Déplacer la section vidéos avant artworks et screenshots
    - Remplacer l'élément `<video>` HTML par un iframe YouTube embed
    - Extraire le `video_id` depuis l'URL stockée et construire `https://www.youtube.com/embed/{video_id}`
    - Ajouter les attributs `allow` (accelerometer, autoplay, clipboard-write, encrypted-media, gyroscope, picture-in-picture) et `allowFullScreen`
    - Utiliser la clé de traduction existante `gameDetails.media.videos` pour le heading
    - Appliquer `aspect-video`, `rounded-xl`, `border border-slate-700` pour la cohérence visuelle
    - Afficher le titre de la vidéo sous la thumbnail
    - Ne pas rendre la section si aucune vidéo n'existe
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8_

  - [x] 6.2 Écrire les tests unitaires pour GameMediaGallery (vidéos)
    - Fichier : `test/unit/components/games/details/GameMediaGallery.test.tsx`
    - Tester : iframe YouTube rendu, ordre sections (vidéos en premier), section absente si pas de vidéos, titre affiché
    - _Requirements: 6.1, 6.2, 6.3, 6.7, 6.8_

  - [x] 6.3 Écrire le test property-based pour l'extraction d'URL embed
    - Fichier : `test/unit/components/games/details/GameMediaGallery.property.test.ts`
    - **Property 6: YouTube embed URL extraction**
    - **Validates: Requirements 6.2, 6.3**

- [x] 7. Checkpoint — Vérifier l'ensemble de l'implémentation
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Lint du code
  - [x] 8.1 Exécuter `bun run lint`
  - [x] 8.2 Vérifier qu'il n'y a pas d'erreurs ni de warnings de lint
  - [x] 8.3 Corriger les erreurs et warnings de lint si nécessaire

- [x] 9. Build de production
  - [x] 9.1 Exécuter `bun run build`
  - [x] 9.2 Vérifier qu'il n'y a pas d'erreurs de compilation
  - [x] 9.3 Corriger les erreurs de build si nécessaire

- [x] 10. README de la fonctionnalité
  - [x] 10.1 Créer `docs/README_IGDB_VIDEO_SYNC.md`
    - Description : résumé de ce qui a été implémenté
    - Accès : comment les vidéos apparaissent sur les pages jeux
    - Prérequis : clés API IGDB configurées
    - Utilisation : import bulk et sync automatique des vidéos

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties (fast-check, min 100 iterations)
- Unit tests validate specific examples and edge cases (Vitest)
- All tests in `test/` directory, property tests use `*.property.test.ts` naming
- Translations not needed — existing key `gameDetails.media.videos` already covers the UI
- All files must stay under 300 lines
- No SQL migration needed — `game_videos` table already exists
