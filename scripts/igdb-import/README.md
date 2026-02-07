# IGDB Bulk Import Script

Script d'import en masse des jeux depuis l'API IGDB vers la base de données
Supabase.

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

Les credentials Supabase sont disponibles dans les paramètres de votre projet.

## Utilisation

```bash
bun run scripts/igdb-import/index.ts --from=YYYY-MM-DD [options]
```

### Paramètres obligatoires

| Paramètre     | Description                                                                |
| ------------- | -------------------------------------------------------------------------- |
| `--from=DATE` | Date de début pour filtrer les jeux par date de sortie (format YYYY-MM-DD) |

### Options

| Option       | Description                                               |
| ------------ | --------------------------------------------------------- |
| `--to=DATE`  | Date de fin (format YYYY-MM-DD). Par défaut : aujourd'hui |
| `--dry-run`  | Simule l'import sans écrire dans la base de données       |
| `--limit=N`  | Limite le nombre de jeux à importer                       |
| `--offset=N` | Commence l'import à partir d'un offset donné              |
| `--verbose`  | Active les logs détaillés                                 |
| `--help`     | Affiche l'aide                                            |

## Exemples

### Import des jeux de janvier 2025 (simulation)

```bash
bun run scripts/igdb-import/index.ts --from=2025-01-01 --to=2025-01-31 --dry-run
```

### Import des jeux depuis le 1er janvier 2024 jusqu'à aujourd'hui

```bash
bun run scripts/igdb-import/index.ts --from=2024-01-01
```

### Import avec limite et logs détaillés

```bash
bun run scripts/igdb-import/index.ts --from=2024-01-01 --limit=100 --verbose
```

### Reprendre un import interrompu

```bash
bun run scripts/igdb-import/index.ts --from=2024-01-01 --offset=500
```

## Structure des fichiers

```
scripts/igdb-import/
├── index.ts            # Point d'entrée principal
├── types.ts            # Définitions des types TypeScript
├── cli.ts              # Parser CLI et validation des credentials
├── rate-limiter.ts     # Gestion du rate limiting IGDB (4 req/s)
├── retry.ts            # Logique de retry avec backoff exponentiel
├── progress-tracker.ts # Affichage de la progression
├── orchestrator.ts     # Orchestrateur principal de l'import
├── game-importer.ts    # Import d'un jeu (adapté pour scripts)
├── supabase-client.ts  # Client Supabase pour scripts standalone
└── README.md           # Cette documentation
```

## Fonctionnalités

- **Barre de progression** : Affiche une barre de progression avec temps restant
  estimé (désactivée en mode `--verbose`)
- **Rate limiting** : Respecte la limite de 4 requêtes/seconde de l'API IGDB
- **Retry automatique** : Réessaie les requêtes échouées avec backoff
  exponentiel
- **Mode dry-run** : Permet de tester sans modifier la base de données
- **Gestion des doublons** : Les jeux déjà présents sont ignorés (comptés comme
  "skipped")

### Affichage de la progression

Par défaut (sans `--verbose`), le script affiche une barre de progression :

```
[Progress] [████████░░░░░░░░░░░░] 40.0% | 400/1000 | ✓ 350 | ⊘ 45 | ✗ 5 | Elapsed: 2m 30s | ETA: 3m 45s
```

- `████████░░░░░░░░░░░░` : Barre visuelle de progression
- `40.0%` : Pourcentage de complétion
- `400/1000` : Jeux traités / total estimé
- `✓ 350` : Jeux importés avec succès
- `⊘ 45` : Jeux ignorés (déjà existants)
- `✗ 5` : Erreurs
- `Elapsed` : Temps écoulé
- `ETA` : Temps restant estimé

Avec `--verbose`, les logs détaillés remplacent la barre de progression.

## Codes de sortie

| Code | Signification                               |
| ---- | ------------------------------------------- |
| 0    | Succès complet                              |
| 1    | Erreur fatale (credentials manquants, etc.) |
| 2    | Succès partiel (certains jeux en erreur)    |
