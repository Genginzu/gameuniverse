# IGDB Game Bulk Import Script

Script d'import en masse des jeux depuis l'API IGDB (ou un fichier dump local)
vers la base de données Supabase.

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

> **Note** : Les credentials IGDB sont nécessaires même en mode dump, car
> l'import de certaines données complémentaires (versions, DLC, playtime)
> nécessite des appels API.

## Utilisation

### Mode API (par défaut)

```bash
bun run scripts/igdb-import/games/index.ts --from=YYYY-MM-DD [options]
```

### Mode Dump (fichier local)

```bash
bun run scripts/igdb-import/games/index.ts --source=dump [options]
```

### Paramètres obligatoires

| Paramètre         | Mode | Description                                                    |
| ----------------- | ---- | -------------------------------------------------------------- |
| `--from=DATE`     | API  | Date de début pour filtrer les jeux (format YYYY-MM-DD)        |
| `--source=dump`   | Dump | Télécharge les CSV dumps IGDB et importe depuis ceux-ci        |
| `--dump-dir=PATH` | Dump | Répertoire pour les CSV (défaut : `scripts/igdb-import/dumps`) |

### Options

| Option           | Description                                                          |
| ---------------- | -------------------------------------------------------------------- |
| `--to=DATE`      | Date de fin (format YYYY-MM-DD). Par défaut : aujourd'hui (API only) |
| `--dry-run`      | Simule l'import sans écrire dans la base de données                  |
| `--limit=N`      | Limite le nombre de jeux à importer                                  |
| `--offset=N`     | Commence l'import à partir d'un offset donné                         |
| `--notable-only` | N'importe que les jeux notables (avec avis, notes, hypes ou follows) |
| `--verbose`      | Active les logs détaillés                                            |
| `--help`         | Affiche l'aide                                                       |

## Exemples

### Import des jeux de janvier 2025 (simulation)

```bash
bun run scripts/igdb-import/games/index.ts --from=2025-01-01 --to=2025-01-31 --dry-run
```

### Import des jeux depuis le 1er janvier 2024 jusqu'à aujourd'hui

```bash
bun run scripts/igdb-import/games/index.ts --from=2024-01-01
```

### Import avec limite et logs détaillés

```bash
bun run scripts/igdb-import/games/index.ts --from=2024-01-01 --limit=100 --verbose
```

### Import uniquement des jeux notables (avec avis/notes/hypes)

```bash
bun run scripts/igdb-import/games/index.ts --from=2024-01-01 --notable-only
```

### Reprendre un import interrompu

```bash
bun run scripts/igdb-import/games/index.ts --from=2024-01-01 --offset=500
```

### Import depuis un fichier dump JSON (chemin par défaut)

```bash
bun run scripts/igdb-import/games/index.ts --source=dump --verbose
```

### Import depuis un fichier dump custom

```bash
bun run scripts/igdb-import/games/index.ts --source=dump --dump-dir=./dumps --verbose
```

### Import depuis un fichier dump NDJSON avec limite

```bash
bun run scripts/igdb-import/games/index.ts --source=dump --dump-dir=./dumps --limit=100
```

## Mode Dump

Le mode dump permet d'importer des jeux depuis un fichier local au lieu de l'API
IGDB. C'est plus rapide car il n'y a pas de rate limiting ni d'appels réseau
pour la récupération des jeux.

### Formats supportés

- **JSON Array** : un fichier contenant un tableau JSON d'objets `IGDBGame`
- **NDJSON** : un objet JSON par ligne (Newline-Delimited JSON)

### Créer un fichier dump

Vous pouvez créer un dump en exportant les résultats de l'API IGDB. Le format
attendu est le même que la réponse de l'endpoint `/v4/games` avec les champs
expandés (genres, companies, platforms, etc.).

### Quand utiliser le mode dump

- Import initial de gros volumes (évite le rate limiting de 4 req/s)
- Ré-import après un reset de la base de données
- Tests et développement local

## Structure des fichiers

```
scripts/igdb-import/
├── shared/                  # Utilitaires communs (games + characters)
│   ├── types.ts             # Types partagés (ImportStats, RetryOptions…)
│   ├── cli.ts               # Parser CLI et validation des credentials
│   ├── rate-limiter.ts      # Rate limiting IGDB (4 req/s)
│   ├── retry.ts             # Retry avec backoff exponentiel
│   ├── progress-tracker.ts  # Barre de progression terminal
│   ├── supabase-client.ts   # Client Supabase pour scripts standalone
│   ├── color-extractor.ts   # Extraction de couleurs depuis les images
│   └── dump-reader.ts       # Lecteur de fichiers dump (JSON/NDJSON)
├── dumps/                   # Fichiers dump par défaut (gitignored)
│   └── games.json           # Dump des jeux (à placer ici)
├── games/                   # Fichiers spécifiques au game importer
│   ├── index.ts             # Point d'entrée principal
│   ├── orchestrator.ts      # Orchestrateur principal de l'import
│   ├── game-importer.ts     # Import d'un jeu (adapté pour scripts)
│   ├── game-sync.ts         # Synchronisation des jeux existants
│   ├── platform-importer.ts # Import des plateformes
│   ├── video-transform.ts   # Transformation des vidéos IGDB
│   └── README.md            # Cette documentation
└── characters/              # Fichiers spécifiques au character importer
    ├── index.ts
    ├── orchestrator.ts
    ├── character-importer.ts
    └── README.md
```

## Fonctionnalités

- **Barre de progression** : Affiche une barre de progression avec temps restant
  estimé (désactivée en mode `--verbose`)
- **Rate limiting** : Respecte la limite de 4 requêtes/seconde de l'API IGDB
- **Retry automatique** : Réessaie les requêtes échouées avec backoff
  exponentiel
- **Mode dry-run** : Permet de tester sans modifier la base de données
- **Gestion des doublons** : Les jeux déjà présents sont synchronisés (mis à
  jour), pas dupliqués

### Affichage de la progression

Par défaut (sans `--verbose`), le script affiche une barre de progression :

```
[Progress] [████████░░░░░░░░░░░░] 40.0% | 400/1000 | ✓ 350 | ⊘ 45 | ✗ 5 | Elapsed: 2m 30s | ETA: 3m 45s
```

Avec `--verbose`, les logs détaillés remplacent la barre de progression.

## Codes de sortie

| Code | Signification                               |
| ---- | ------------------------------------------- |
| 0    | Succès complet                              |
| 1    | Erreur fatale (credentials manquants, etc.) |
| 2    | Succès partiel (certains jeux en erreur)    |
