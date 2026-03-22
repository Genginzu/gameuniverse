# IGDB Character Bulk Import Script

Script d'import en masse des personnages depuis l'API IGDB vers la base de
données Supabase. Complètement indépendant du script d'import des jeux.

## Prérequis

- [Bun](https://bun.sh/) installé
- Variables d'environnement configurées :
  - `IGDB_CLIENT_ID` - Client ID Twitch/IGDB
  - `IGDB_CLIENT_SECRET` - Client Secret Twitch/IGDB
  - `NEXT_PUBLIC_SUPABASE_URL` - URL de votre projet Supabase
  - `SUPABASE_SERVICE_ROLE_KEY` - Clé service role Supabase (recommandé, bypass
    RLS)
  - ou `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Clé anonyme Supabase (fallback)

Les credentials IGDB peuvent être obtenus sur
[Twitch Developer Console](https://dev.twitch.tv/console).

## Utilisation

```bash
bun run scripts/igdb-import/characters/index.ts [options]
```

### Options

| Option       | Description                                         |
| ------------ | --------------------------------------------------- |
| `--dry-run`  | Simule l'import sans écrire dans la base de données |
| `--limit=N`  | Limite le nombre de personnages à importer          |
| `--offset=N` | Commence l'import à partir d'un offset donné        |
| `--verbose`  | Active les logs détaillés                           |
| `--help`     | Affiche l'aide                                      |

> **Note** : Contrairement au game importer, il n'y a pas de paramètre
> `--from`/`--to`. L'API IGDB characters ne filtre pas par date de sortie — le
> script pagine sur l'ensemble des personnages triés par ID.

## Exemples

### Simulation avec 10 personnages

```bash
bun run scripts/igdb-import/characters/index.ts --dry-run --limit=10 --verbose
```

### Import des 500 premiers personnages

```bash
bun run scripts/igdb-import/characters/index.ts --limit=500
```

### Import avec logs détaillés

```bash
bun run scripts/igdb-import/characters/index.ts --limit=100 --verbose
```

### Reprendre un import interrompu

```bash
bun run scripts/igdb-import/characters/index.ts --offset=500 --limit=500
```

## Structure des fichiers

```
scripts/igdb-import/
├── shared/                  # Utilitaires communs (games + characters)
│   ├── types.ts             # Types partagés (ImportStats, RetryOptions…)
│   ├── cli.ts               # Validation des credentials IGDB
│   ├── rate-limiter.ts      # Rate limiting IGDB (4 req/s)
│   ├── retry.ts             # Retry avec backoff exponentiel
│   ├── progress-tracker.ts  # Barre de progression terminal
│   ├── supabase-client.ts   # Client Supabase pour scripts standalone
│   └── color-extractor.ts   # Extraction de couleurs depuis les images
├── characters/              # Fichiers spécifiques au character importer
│   ├── index.ts             # Point d'entrée principal + CLI parser
│   ├── character-importer.ts # Import d'un personnage dans Supabase
│   ├── orchestrator.ts      # Orchestrateur (pagination, batch, progress)
│   └── README.md            # Cette documentation
└── games/                   # Fichiers spécifiques au game importer
    ├── index.ts
    ├── orchestrator.ts
    ├── game-importer.ts
    ├── game-sync.ts
    ├── platform-importer.ts
    ├── video-transform.ts
    └── README.md
```

## Données importées

Pour chaque personnage IGDB, le script crée :

| Table                    | Données                                                    |
| ------------------------ | ---------------------------------------------------------- |
| `characters`             | slug, igdb_id, main_image (mug_shot), background_color     |
| `character_translations` | Traduction EN : name, role (gender + species), description |
| `character_games`        | Liaison vers les jeux déjà présents en base (par igdb_id)  |
| `character_media`        | Mug shot sauvegardé comme artwork featured                 |

### Champs IGDB utilisés

Le script utilise les champs non-deprecated de l'endpoint `/v4/characters` :

- `name`, `slug`, `description`, `country_name`, `url`, `akas`
- `character_gender.name` (au lieu de `gender` deprecated)
- `character_species.name` (au lieu de `species` deprecated)
- `mug_shot.image_id` (expandé depuis `character_mug_shots`)
- `games` (tableau d'IDs IGDB)

## Fonctionnalités

- **Déduplication** : Les personnages déjà importés (par `igdb_id`) sont ignorés
  et comptés comme "skipped"
- **Barre de progression** : Affiche une barre avec temps restant estimé
  (désactivée en mode `--verbose`)
- **Rate limiting** : Respecte la limite de 4 requêtes/seconde de l'API IGDB
- **Retry automatique** : Réessaie les requêtes échouées avec backoff
  exponentiel
- **Mode dry-run** : Permet de tester sans modifier la base de données
- **Liaison aux jeux** : Lie automatiquement les personnages aux jeux déjà
  présents dans la base (via `igdb_id` des jeux)
- **Extraction de couleurs** : Extrait la couleur de fond depuis le mug_shot
  pour le thème visuel du personnage
- **Arrêt gracieux** : Ctrl+C interrompt proprement l'import en cours

### Affichage de la progression

Par défaut (sans `--verbose`), le script affiche une barre de progression :

```
[Progress] [████████░░░░░░░░░░░░] 40.0% | 400/1000 | ✓ 350 | ⊘ 45 | ✗ 5 | Elapsed: 2m 30s | ETA: 3m 45s
```

Avec `--verbose`, les logs détaillés remplacent la barre de progression.

## Migration requise

Le script nécessite la migration `20240322000001_add_characters_igdb_id.sql` qui
ajoute la colonne `igdb_id` (unique, indexée) à la table `characters`.

## Codes de sortie

| Code | Signification                                   |
| ---- | ----------------------------------------------- |
| 0    | Succès complet                                  |
| 1    | Erreur fatale (credentials manquants, etc.)     |
| 2    | Succès partiel (certains personnages en erreur) |

## Différences avec le game importer

| Aspect             | Game Importer                 | Character Importer                |
| ------------------ | ----------------------------- | --------------------------------- |
| Endpoint IGDB      | `/v4/games`                   | `/v4/characters`                  |
| Filtrage par date  | Oui (`--from`/`--to`)         | Non (pagination par ID)           |
| Entités liées      | Genres, companies, platforms… | Jeux existants en base            |
| Sync (mise à jour) | Oui (game-sync.ts)            | Non (skip si existe)              |
| Point d'entrée     | `scripts/igdb-import/games/`  | `scripts/igdb-import/characters/` |
