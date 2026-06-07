# Recherche Globale

## Description

La fonctionnalité **Recherche globale** est une barre de recherche unifiée qui
couvre **6 types d'entités** :

1. **Jeux** (locaux + IGDB)
2. **Personnages**
3. **Joueurs Gamers Universe**
4. **Équipes esport**
5. **Joueurs pros esport**
6. **Coachs**

Fonctionnalités principales :

- Recherche simultanée sur les 6 types d'entités, en parallèle via
  `Promise.allSettled`
- Résultats groupés par catégorie dans l'ordre canonique stable
- Autocomplétion avec debounce (300 ms) et annulation automatique des requêtes
  via `AbortController`
- Navigation au clavier (↑ ↓ Entrée Échap)
- Import automatique des jeux IGDB à la sélection
- **Tolérance aux pannes** : si une source échoue, les autres continuent de
  retourner des résultats. L'erreur est journalisée mais ne bloque pas la
  réponse.
- Internationalisation FR/EN

## Accès

### Barre de recherche

La `GlobalSearchBar` est intégrée dans le `DashboardHeader` et accessible
depuis toutes les pages de l'application, en version desktop et mobile. La
refonte éditoriale (Phase 0) introduit également un `HeaderSearchTrigger`
compact dans l'`EditorialMegaMenu` qui ouvre un overlay full-page (F0-07c).

### Route API

| Méthode | Route                | Description                     |
| ------- | -------------------- | ------------------------------- |
| GET     | `/api/search/global` | Recherche globale multi-entités |

**Paramètres de requête (validés via Zod) :**

| Paramètre          | Type   | Requis | Défaut côté service | Description                                  |
| ------------------ | ------ | ------ | ------------------- | -------------------------------------------- |
| `query`            | string | oui    | —                   | Terme de recherche (≥ 2 car. après trim)     |
| `locale`           | string | non    | `fr`                | Locale pour les résultats                    |
| `charactersLimit`  | number | non    | `5`                 | Nombre max de personnages retournés          |
| `playersLimit`     | number | non    | `5`                 | Nombre max de joueurs Gamers Universe        |
| `teamsLimit`       | number | non    | `5`                 | Nombre max d'équipes esport retournées       |
| `proPlayersLimit`  | number | non    | `5`                 | Nombre max de joueurs pros retournés         |
| `coachesLimit`     | number | non    | `5`                 | Nombre max de coachs retournés               |

> Les valeurs invalides (≤ 0, non-entiers) sont rejetées avec un statut **400**
> par la validation Zod, plutôt que d'être silencieusement remplacées par la
> valeur par défaut.

### Navigation depuis les résultats

| Type d'entité | URL de destination                                       |
| ------------- | -------------------------------------------------------- |
| Jeu local     | `/[locale]/games/[slug]`                                 |
| Jeu IGDB      | Import automatique puis `/[locale]/games/[slug]`         |
| Personnage    | `/[locale]/characters/[slug]`                            |
| Joueur GU     | `/[locale]/players/[id]`                                 |
| Équipe esport | `/[locale]/esport/teams/[pandascore_id]`                 |
| Joueur pro    | `/[locale]/esport/players/[pandascore_id]`               |
| Coach         | `/[locale]/coaching/[username]`                          |

## Prérequis

1. **Tables existantes** : la recherche globale réutilise les tables :
   - `public.games` + `public.character_translations` (existant)
   - `public.profiles` (joueurs Gamers Universe et coachs)
   - `public.esport_teams`, `public.esport_players` (alimentées par
     `pandascoreSyncService`)
   - `public.coach_profiles` (système de coaching)

   Aucune nouvelle migration n'est nécessaire.

2. **Filtrage strict** des résultats inutilisables :
   - Équipes et joueurs pros **sans `pandascore_id`** sont rejetés (pas de
     route possible vers `/esport/teams/[id]`).
   - Coachs **sans `username`** dans `profiles` sont rejetés (pas de route
     possible vers `/coaching/[username]`).
   - Coachs **inactifs** (`is_active = false`) sont exclus.

3. **Intégration IGDB** : pour les résultats IGDB côté jeux, l'intégration
   IGDB doit être configurée (clés API, etc.).

4. **Authentification** : la recherche est accessible sans auth. L'import
   de jeux IGDB nécessite une session active.

## Utilisation

### Rechercher

Saisir au moins 2 caractères dans la barre de recherche. Les résultats
apparaissent automatiquement après 300 ms, groupés dans l'ordre canonique :

```
Jeux → Personnages → Joueurs → Équipes esport → Joueurs pros → Coachs
```

### Naviguer au clavier

- **↓ / ↑** : parcourir les résultats (traverse tous les groupes)
- **Entrée** : ouvrir la page de l'entité sélectionnée
- **Échap** : fermer le dropdown

### Sélectionner un résultat

Cliquer ou appuyer sur Entrée pour naviguer vers la page de détail. Pour un jeu
IGDB non encore importé, l'import est déclenché automatiquement avant la
navigation.

### Groupes vides

Les groupes sans résultat sont masqués (filtre côté composant). Si aucun
groupe ne contient de résultat, un message « Aucun résultat trouvé » est
affiché.

## Architecture

### Service layer (`src/lib/services/globalSearchService.ts`)

`GlobalSearchService` orchestre 6 sources en parallèle via
`Promise.allSettled`. Chaque source qui échoue ajoute un message dans
`result.errors[]` sans interrompre les autres. La méthode statique
`toGlobalSearchResponse()` transforme le résultat brut en réponse API
prête à sérialiser.

| Méthode privée               | Source                                                       |
| ---------------------------- | ------------------------------------------------------------ |
| `searchGames`                | `HybridSearchService` (local + IGDB)                         |
| `searchCharacters`           | `CharacterService.fetchCharacters`                           |
| `searchPlayers`              | `PlayerService.fetchPlayersFromDB`                           |
| `searchTeams` ✦              | `esport_teams` ILIKE `name`                                  |
| `searchProPlayers` ✦         | `esport_players` ILIKE `name` + JOIN `esport_teams`          |
| `searchCoaches` ✦            | `profiles` ILIKE `username` → `coach_profiles` (`is_active`) |

✦ = ajoutées en F0-07d (#262).

### Route API (`src/app/api/search/global/route.ts`)

- Validation Zod du query string
- Délégation à `GlobalSearchService.search`
- Sérialisation via `GlobalSearchService.toGlobalSearchResponse`

### Composants React (`src/components/shared/`)

- `GlobalSearchBar.tsx` — Barre de recherche principale
- `GlobalSearchDropdown.tsx` — Dropdown de résultats groupés
- `GlobalSearchGameItem.tsx` — Rendu d'un résultat jeu
- `GlobalSearchCharacterItem.tsx` — Rendu d'un résultat personnage
- `GlobalSearchPlayerItem.tsx` — Rendu d'un résultat joueur

> Les rendus pour `team`, `proPlayer`, `coach` sont implémentés par F0-07c
> (`SearchOverlay` et ses sous-composants `SearchOverlayItem`).

### Hook (`src/hooks/useGlobalSearch.ts`)

Logique de recherche : debounce 300 ms, fetch, abort sur nouvelle requête,
navigation clavier sur la liste aplatie via `flattenResults` et génération
d'URL via `getResultUrl` (cf `src/lib/utils/global-search-utils.ts`).

Ces deux helpers utilitaires sont étendus pour les 6 types d'entités.
`flattenResults` aplatit dans l'ordre canonique games → characters → players
→ teams → proPlayers → coaches. `getResultUrl` retourne la route correcte
pour chaque type, `null` pour les jeux IGDB non importés.

### Types (`src/types/global-search.ts`)

- `GlobalSearchRequest` (avec les 6 limites optionnelles)
- `GlobalSearchResponse` (6 groupes + 6 compteurs)
- `GlobalSearchGameItem` / `CharacterItem` / `PlayerItem` / `TeamItem` /
  `ProPlayerItem` / `CoachItem`
- `GlobalSearchResult` (forme interne, avant transformation)

### Internationalisation

Clés de traduction dans `src/messages/fr.json` et `src/messages/en.json`,
section `globalSearch`.

## Tests

| Fichier                                                            | Type             | Couverture                                                  |
| ------------------------------------------------------------------ | ---------------- | ----------------------------------------------------------- |
| `test/unit/lib/services/globalSearchService.test.ts`               | Unitaires        | Orchestration, 3 méthodes esport/coach, mappers, tolérance  |
| `test/unit/lib/utils/globalSearchUtils.test.ts`                    | Unitaires        | `flattenResults`, indices, génération d'URL pour 6 types    |
| `test/unit/lib/utils/global-search.property.test.ts`               | Property-based   | Invariants : longueur, ordre, identité, URLs, indices       |
| `test/unit/api/search/global-search-route.test.ts`                 | Unitaires        | Validation Zod, paramètres, sérialisation, erreurs          |
| `test/unit/components/shared/GlobalSearchDropdown.test.tsx`        | Tests composant  | Rendu, états (loading, empty, results)                      |

Le `useGlobalSearch.test.ts` reste sur le périmètre du hook lui-même
(debounce, fetch, navigation clavier).
