# Game Platforms

## Description

Gestion des plateformes de jeux vidéo (PlayStation, Xbox, Nintendo Switch, PC,
etc.) avec support multilingue FR/EN. Les plateformes peuvent être associées aux
jeux, utilisées comme filtres sur les pages publiques, et affichées dans les
statistiques du dashboard joueur.

## Accès

### Pages publiques

- **Filtre plateformes (jeux)** : `/[locale]/games` — filtre multi-sélection
  dans la barre de filtres
- **Filtre plateformes (personnages)** : `/[locale]/characters` — filtre les
  personnages par plateforme de jeu
- **Dashboard stats** : `/[locale]/players/[id]` — section "Répartition par
  plateforme"

### Pages admin

- **Gestion des plateformes** : `/[locale]/admin/platforms` — CRUD complet
  (liste, création, édition, suppression)

### API Routes

| Route                                   | Méthode | Description                                                 |
| --------------------------------------- | ------- | ----------------------------------------------------------- |
| `/api/platforms`                        | GET     | Liste publique des plateformes (traduites, avec game count) |
| `/api/admin/platforms`                  | GET     | Liste admin paginée avec search/tri                         |
| `/api/admin/platforms`                  | POST    | Création d'une plateforme                                   |
| `/api/admin/platforms/[slug]`           | GET     | Détail d'une plateforme                                     |
| `/api/admin/platforms/[slug]`           | PUT     | Modification d'une plateforme                               |
| `/api/admin/platforms/[slug]`           | DELETE  | Suppression (avec option `?force=true`)                     |
| `/api/games?platforms=slug1,slug2`      | GET     | Filtrage des jeux par plateforme                            |
| `/api/characters?platforms=slug1,slug2` | GET     | Filtrage des personnages par plateforme                     |

## Prérequis

- Migration SQL appliquée :
  `supabase/migrations/20240317000001_game_platforms.sql`
- Tables créées : `platforms`, `platform_translations`, `game_platforms`
- RLS activé : lecture publique, écriture admin uniquement
- Rôle admin requis pour les routes `/api/admin/platforms/*`

## Utilisation

### Admin — Gérer les plateformes

1. Naviguer vers Admin > Plateformes
2. Créer une plateforme avec slug, icône (optionnel), et traductions FR/EN
3. Les plateformes sont automatiquement disponibles dans les filtres publics

### Import IGDB

Les plateformes sont automatiquement créées lors de l'import de jeux depuis
IGDB. Le script crée la plateforme si elle n'existe pas (upsert par `igdb_id`)
et associe les jeux importés.

### Filtrage public

Les filtres plateformes fonctionnent en intersection avec les filtres genre
existants. Sélectionner plusieurs plateformes retourne les jeux disponibles sur
au moins une des plateformes sélectionnées.

## Structure des fichiers

- `src/types/platform.ts` — Types publics (PlatformSummary, GamePlatform)
- `src/types/admin-platforms.ts` — Types admin (AdminPlatform,
  FetchPlatformsParams)
- `src/lib/services/platformService.ts` — Service client (fetch via API)
- `src/lib/validations/admin-platform-form.ts` — Schémas Zod
- `src/components/games/PlatformFilter.tsx` — Filtre UI jeux
- `src/components/characters/CharacterPlatformFilter.tsx` — Filtre UI
  personnages
- `src/components/admin/platforms/` — Composants admin (PlatformList,
  PlatformForm, DeletePlatformDialog)
- `scripts/igdb-import/platform-importer.ts` — Import IGDB
