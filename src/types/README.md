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
- `AuthSuccessMessage` - Messages de succès d'authentification

### `components.ts`

Types pour les props des composants React :

- Types de layout (`DashboardSidebarProps`, `LandingLayoutProps`, etc.)
- Types de composants de jeux (`GameCardProps`, `GameDetailsProps`, etc.)
- Types de composants d'authentification (`AuthFormProps`, etc.)
- Types de composants UI (`SpinnerProps`, `LoadingSpinnerProps`, etc.)

### `database.ts`

Types pour les données brutes de la base de données Supabase :

- `DatabaseGameData` - Structure complète d'un jeu depuis la DB
- `DatabaseGameGenre`, `DatabaseGameCompany`, etc. - Types pour les relations
- Préfixés par `Database` pour éviter les conflits avec les types transformés

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

- `UseGameDetailsReturn` - Retour du hook useGameDetails
- `UseGamesOptions`, `UseGamesReturn` - Types pour le hook useGames

### `pagination.ts`

Types pour la pagination :

- `Pagination` - Interface de pagination générique

### `profile.ts`

Types pour les profils utilisateur :

- `Profile` - Interface de profil utilisateur

### `supabase.ts`

Types générés automatiquement par Supabase CLI :

- `Database` - Schema complet de la base de données
- Types utilitaires pour les requêtes Supabase

### `ui.ts`

Types pour les composants UI de base :

- `SpinnerConfig`, `LoadingSpinnerConfig` - Configurations des spinners
- `ButtonVariant`, `InputVariant` - Variantes des composants UI

### `index.ts`

Export central de tous les types pour faciliter les imports.

## Conventions de nommage

1. **Types de base de données** : Préfixés par `Database` (ex:
   `DatabaseGameData`)
2. **Types transformés** : Noms simples (ex: `GameDetails`)
3. **Props de composants** : Suffixés par `Props` (ex: `GameCardProps`)
4. **Retours de hooks** : Suffixés par `Return` (ex: `UseGameDetailsReturn`)
5. **Options de hooks** : Suffixées par `Options` (ex: `UseGamesOptions`)

## Usage

```typescript
// Import depuis l'index central
import { GameDetails, SupabaseError, GameCardProps } from "@/types";

// Ou import spécifique
import { DatabaseGameData } from "@/types/database";
import { UseGameDetailsReturn } from "@/types/hooks";
```

## Maintenance

- Lors de l'ajout de nouveaux types, les placer dans le fichier approprié
- Mettre à jour `index.ts` pour exporter les nouveaux types
- Éviter les doublons entre les fichiers
- Préférer les types spécifiques aux types génériques quand possible
