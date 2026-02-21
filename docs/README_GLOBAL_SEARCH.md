# Recherche Globale

## Description

La fonctionnalité **Recherche globale** remplace l'ancienne barre de recherche
de jeux (`GameSearchBar`) par une barre de recherche unifiée couvrant trois
types d'entités : **jeux**, **personnages** et **joueurs**.

Fonctionnalités principales :

- Recherche simultanée sur jeux (locaux + IGDB), personnages et joueurs
- Résultats groupés par catégorie avec en-têtes visuels
- Autocomplétion avec debounce (300 ms) et annulation automatique des requêtes
- Navigation au clavier (↑ ↓ Entrée Échap)
- Import automatique des jeux IGDB à la sélection
- Tolérance aux pannes : résultats partiels si une source échoue
- Internationalisation FR/EN

## Accès

### Barre de recherche

La `GlobalSearchBar` est intégrée dans le `DashboardHeader` et accessible depuis
**toutes les pages** de l'application, en version desktop et mobile.

### Route API

| Méthode | Route                | Description                     |
| ------- | -------------------- | ------------------------------- |
| GET     | `/api/search/global` | Recherche globale multi-entités |

**Paramètres de requête :**

| Paramètre         | Type   | Requis | Défaut | Description                         |
| ----------------- | ------ | ------ | ------ | ----------------------------------- |
| `query`           | string | oui    | —      | Terme de recherche (≥ 2 car.)       |
| `locale`          | string | non    | `fr`   | Locale pour les résultats           |
| `gamesLimit`      | number | non    | `5`    | Nombre max de jeux retournés        |
| `charactersLimit` | number | non    | `5`    | Nombre max de personnages retournés |
| `playersLimit`    | number | non    | `5`    | Nombre max de joueurs retournés     |

### Navigation depuis les résultats

| Type d'entité | URL de destination                   |
| ------------- | ------------------------------------ |
| Jeu local     | `/[locale]/games/[slug]`             |
| Jeu IGDB      | Import puis `/[locale]/games/[slug]` |
| Personnage    | `/[locale]/characters/[slug]`        |
| Joueur        | `/[locale]/players/[id]`             |

## Prérequis

1. **Aucune migration** : la recherche globale réutilise les tables et index
   existants (`games`, `characters`, `profiles`). Aucune migration de base de
   données n'est nécessaire.
2. **Intégration IGDB** : pour que les résultats IGDB apparaissent dans la
   catégorie jeux, l'intégration IGDB doit être configurée (clés API, etc.).
3. **Authentification** : la recherche est accessible sans authentification.
   L'import de jeux IGDB nécessite une session active.

## Utilisation

### Rechercher

Saisir au moins 2 caractères dans la barre de recherche du header. Les résultats
apparaissent automatiquement après 300 ms, groupés par catégorie : Jeux,
Personnages, Joueurs.

### Naviguer au clavier

- **↓ / ↑** : parcourir les résultats (traverse les catégories)
- **Entrée** : ouvrir la page de l'entité sélectionnée
- **Échap** : fermer le dropdown

### Sélectionner un résultat

Cliquer ou appuyer sur Entrée pour naviguer vers la page de détail. Pour un jeu
IGDB non encore importé, l'import est déclenché automatiquement avant la
navigation.

### Catégories vides

Les catégories sans résultat sont masquées. Si aucune catégorie ne contient de
résultat, un message « Aucun résultat trouvé » est affiché.

## Architecture

### Service layer (`src/lib/services/`)

- `globalSearchService.ts` — Orchestre les recherches parallèles via
  `Promise.allSettled`, transforme les résultats en `GlobalSearchResponse`

### Route API (`src/app/api/search/global/`)

- `route.ts` — Endpoint GET avec validation, appel au service et sérialisation

### Composants React (`src/components/shared/`)

- `GlobalSearchBar.tsx` — Barre de recherche principale
- `GlobalSearchDropdown.tsx` — Dropdown de résultats groupés
- `GlobalSearchGameItem.tsx` — Rendu d'un résultat jeu
- `GlobalSearchCharacterItem.tsx` — Rendu d'un résultat personnage
- `GlobalSearchPlayerItem.tsx` — Rendu d'un résultat joueur

### Hook (`src/hooks/`)

- `useGlobalSearch.ts` — Logique de recherche : debounce, fetch, abort,
  navigation clavier, génération d'URL

### Types (`src/types/`)

- `global-search.ts` — Interfaces : `GlobalSearchRequest`,
  `GlobalSearchResponse`, `GlobalSearchGameItem`, `GlobalSearchCharacterItem`,
  `GlobalSearchPlayerItem`, `GlobalSearchResult`

### Internationalisation

Clés de traduction dans `src/messages/fr.json` et `src/messages/en.json`,
section `globalSearch`.

## Tests

- Tests property-based (fast-check) :
  `test/unit/lib/services/globalSearchService.property.test.ts` (7 propriétés),
  `test/unit/hooks/useGlobalSearch.property.test.ts` (2 propriétés)
- Tests unitaires : `test/unit/lib/services/globalSearchService.test.ts`,
  `test/unit/hooks/useGlobalSearch.test.ts`
- Tests composants : `test/unit/components/shared/GlobalSearchDropdown.test.tsx`
