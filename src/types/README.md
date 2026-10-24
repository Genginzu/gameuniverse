# Organisation des Types TypeScript

Ce dossier contient tous les types TypeScript du projet, organisés par domaine
fonctionnel.

## Structure des fichiers

### `api.ts`

Types pour les APIs et les erreurs Supabase :

- `SupabaseError` - Interface pour les erreurs Supabase
- `ApiResponse<T>` - Interface générique pour les réponses d'API
- `GameQueryParams`, `GenreQueryParams` - Paramètres de requête

### `auth.ts`

Types liés à l'authentification :

- `AuthMode` - Modes d'authentification (login/register)

### `game.ts`

Types pour les données de jeux transformées (côté client) :

- `GameDetails` - Jeu complet avec données transformées
- `GameSummary` - Résumé de jeu pour les listes
- `GameMedia`, `GamePricing`, `GameRating` - Sous-structures

### `genre.ts`

Types pour les genres de jeux :

- `Genre` - Interface de base pour un genre

### `hooks.ts`

Types pour les hooks personnalisés :

- `UseCharacterFiltersReturn` - Retour du hook useCharacterFilters

### `pagination.ts`

Types pour la pagination :

- `Pagination` - Interface de pagination générique

### `profile.ts`

Types pour les profils utilisateur :

- `Profile` - Interface de profil utilisateur

### `supabase-queries.ts`

Types de résultats de requêtes Supabase avec jointures, partagés entre les
routes API (ex: `GameRowWithRelations`, `CharacterRowWithRelations`).

> Le schéma Supabase généré (`Database`, `Tables`, etc.) vit dans
> `src/lib/database.types.ts` et est régénéré via `bun run supabase:types`.

### `ui.ts`

Types pour les composants UI de base :

- `SpinnerConfig`, `LoadingSpinnerConfig` - Configurations des spinners
- `ButtonVariant`, `InputVariant` - Variantes des composants UI

## Conventions de nommage

1. **Types de base de données** : Préfixés par `Database` (ex:
   `DatabaseGameData`)
2. **Types transformés** : Noms simples (ex: `GameDetails`)
3. **Props de composants** : Suffixés par `Props` (ex: `GameCardProps`)
4. **Retours de hooks** : Suffixés par `Return` (ex: `UseCharacterFiltersReturn`)
5. **Options de hooks** : Suffixées par `Options`

## Usage

```typescript
// Import depuis le fichier du domaine
import type { GameDetails } from "@/types/game";
import type { UseCharacterFiltersReturn } from "@/types/hooks";
```

## Maintenance

- Lors de l'ajout de nouveaux types, les placer dans le fichier approprié
- Éviter les doublons entre les fichiers
- Préférer les types spécifiques aux types génériques quand possible
