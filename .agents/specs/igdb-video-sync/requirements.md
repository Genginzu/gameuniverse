# Requirements Document

## Introduction

Le script d'import IGDB existant récupère les screenshots, artworks, genres,
entreprises, langues, classifications d'âge, versions, DLC et plateformes depuis
l'API IGDB, mais ignore les vidéos associées aux jeux. La table `game_videos`
existe déjà dans la base de données et le frontend sait déjà afficher les
vidéos. Cette feature vise à compléter le pipeline d'import en ajoutant la
synchronisation des vidéos YouTube depuis IGDB vers la table `game_videos`.

L'API IGDB expose les vidéos via le champ `videos` sur l'endpoint `/games`,
chaque vidéo contenant un `video_id` (identifiant YouTube) et un `name` (titre
de la vidéo).

## Glossaire

- **Import_Script** : Le script d'import bulk situé dans `scripts/igdb-import/`
  qui orchestre l'import de jeux depuis l'API IGDB vers Supabase
- **Game_Importer** : Le module `game-importer.ts` responsable de l'import
  individuel d'un jeu et de ses entités liées (médias, genres, etc.)
- **Orchestrator** : Le module `orchestrator.ts` qui coordonne l'import en lots,
  gère la pagination et le rate limiting
- **Sync_Service** : Le service `igdb-sync.ts` / `igdb-sync-fields.ts` qui
  synchronise les champs d'un jeu existant depuis IGDB en respectant les
  overrides manuels
- **IGDB_Video** : Un objet vidéo retourné par l'API IGDB, contenant un
  `video_id` (identifiant YouTube) et un `name` (titre)
- **Game_Videos_Table** : La table Supabase `game_videos` existante stockant les
  vidéos associées aux jeux (url, thumbnail_url, title, video_type,
  display_order, is_featured)
- **TrackableField** : Un type union TypeScript définissant les catégories de
  champs synchronisables depuis IGDB, utilisé par le système d'overrides manuels
- **Field_Override** : Un enregistrement dans `game_field_overrides` indiquant
  qu'un champ a été modifié manuellement et ne doit pas être écrasé lors de la
  synchronisation

## Requirements

### Requirement 1 : Récupération des vidéos depuis l'API IGDB

**User Story :** En tant que développeur, je veux que le script d'import
récupère les vidéos associées aux jeux depuis l'API IGDB, afin de pouvoir les
stocker dans la base de données.

#### Acceptance Criteria

1. WHEN the Game_Importer fetches game details from IGDB, THE Game_Importer
   SHALL include the `videos.video_id` and `videos.name` fields in the IGDB API
   query
2. WHEN the Orchestrator fetches a batch of games from IGDB, THE Orchestrator
   SHALL include the `videos.video_id` and `videos.name` fields in the batch
   query
3. THE IGDBGame type SHALL include a `videos` property typed as an optional
   array of objects containing `video_id` (string) and `name` (string)

### Requirement 2 : Insertion des vidéos lors de l'import d'un nouveau jeu

**User Story :** En tant que développeur, je veux que les vidéos IGDB soient
insérées dans la table `game_videos` lors de l'import d'un nouveau jeu, afin que
les utilisateurs puissent voir les vidéos sur la page du jeu.

#### Acceptance Criteria

1. WHEN a new game is imported and the IGDB game data contains videos, THE
   Game_Importer SHALL insert each video into the Game_Videos_Table with the
   game_id of the newly created game
2. WHEN an IGDB_Video is transformed for insertion, THE Game_Importer SHALL
   construct the YouTube URL using the format
   `https://www.youtube.com/watch?v={video_id}`
3. WHEN an IGDB_Video is transformed for insertion, THE Game_Importer SHALL
   construct the YouTube thumbnail URL using the format
   `https://img.youtube.com/vi/{video_id}/maxresdefault.jpg`
4. WHEN an IGDB_Video is transformed for insertion, THE Game_Importer SHALL set
   the `video_type` to `"trailer"`
5. WHEN an IGDB_Video is transformed for insertion, THE Game_Importer SHALL set
   the `title` to the `name` field of the IGDB_Video
6. WHEN multiple videos are imported, THE Game_Importer SHALL assign sequential
   `display_order` values starting from 0
7. WHEN multiple videos are imported, THE Game_Importer SHALL set `is_featured`
   to true only for the first video (display_order 0)
8. WHEN a new game is imported and the IGDB game data contains no videos, THE
   Game_Importer SHALL skip video insertion without error

### Requirement 3 : Synchronisation des vidéos pour les jeux existants

**User Story :** En tant que développeur, je veux que les vidéos soient
synchronisées lors de la mise à jour d'un jeu existant, afin que les vidéos
restent à jour avec les données IGDB.

#### Acceptance Criteria

1. THE TrackableField type SHALL include `"videos"` as a valid field value
2. THE Sync_Service SHALL include a `syncVideos` function that deletes existing
   videos for a game and re-inserts the videos from IGDB data
3. WHEN the Sync_Service synchronizes all fields of a game, THE Sync_Service
   SHALL include videos in the synchronization process
4. WHILE a Field_Override exists for the `"videos"` field of a game, THE
   Sync_Service SHALL skip video synchronization for that game
5. WHEN the `syncVideos` function processes IGDB video data, THE Sync_Service
   SHALL apply the same transformation rules as the Game_Importer (YouTube URL,
   thumbnail URL, video_type, display_order, is_featured)

### Requirement 4 : Intégration dans le flux d'import bulk

**User Story :** En tant que développeur, je veux que la récupération des vidéos
soit intégrée dans le flux d'import bulk existant, afin que les vidéos soient
importées automatiquement pour tous les jeux traités.

#### Acceptance Criteria

1. WHEN the Orchestrator processes a game in dry-run mode, THE Orchestrator
   SHALL log the number of videos that would be imported for that game
2. WHEN the Game_Importer imports a game successfully, THE Game_Importer SHALL
   log the number of videos imported in verbose mode
3. IF the video insertion fails for a game, THEN THE Game_Importer SHALL log the
   error and continue the import process without marking the entire game import
   as failed

### Requirement 5 : Transformation des données vidéo IGDB

**User Story :** En tant que développeur, je veux une fonction utilitaire dédiée
à la transformation des vidéos IGDB, afin de centraliser la logique de
transformation et de la réutiliser entre l'import et la synchronisation.

#### Acceptance Criteria

1. THE Import_Script SHALL provide a pure function that transforms an array of
   IGDB_Video objects into an array of Game_Videos_Table row objects for a given
   game_id
2. FOR ALL valid IGDB_Video arrays, transforming then extracting video_ids from
   the resulting YouTube URLs SHALL produce the original video_id values
   (round-trip property)
3. FOR ALL valid IGDB_Video arrays, THE transformation function SHALL produce
   output arrays of the same length as the input arrays (length preservation)
4. FOR ALL transformed video rows, each row SHALL contain non-empty values for
   url, thumbnail_url, and title fields

### Requirement 6 : Affichage des vidéos sur la page d'aperçu d'un jeu

**User Story :** En tant qu'utilisateur, je veux voir les vidéos d'un jeu en
premier dans la galerie média de la page d'aperçu, afin de pouvoir regarder les
bandes-annonces avant de parcourir les illustrations et captures d'écran.

#### Acceptance Criteria

1. WHEN the GameMediaGallery renders media sections, THE GameMediaGallery SHALL
   display the videos section before the artwork section and before the
   screenshots section
2. WHEN a video from the Game_Videos_Table has a YouTube URL, THE
   GameMediaGallery SHALL render the video as an embedded YouTube iframe player
   instead of an HTML video element
3. WHEN a YouTube video is embedded, THE GameMediaGallery SHALL extract the
   YouTube video identifier from the stored URL and construct the embed URL
   using the format `https://www.youtube.com/embed/{video_id}`
4. THE YouTube iframe SHALL include the `allow` attribute with values
   `accelerometer`, `autoplay`, `clipboard-write`, `encrypted-media`,
   `gyroscope`, and `picture-in-picture` and the `allowfullscreen` attribute
5. WHEN the videos section is displayed, THE GameMediaGallery SHALL use the
   existing translation key `gameDetails.media.videos` for the section heading
6. THE video embed container SHALL use the same `aspect-video` ratio, rounded
   corners (`rounded-xl`), and border styling (`border border-slate-700`) as the
   existing screenshot and artwork sections to maintain visual consistency
7. WHEN no videos exist for a game, THE GameMediaGallery SHALL skip the videos
   section without rendering an empty container
8. WHEN a video thumbnail is displayed in the video list, THE GameMediaGallery
   SHALL show the video title below the thumbnail using the `title` field from
   the Game_Videos_Table
