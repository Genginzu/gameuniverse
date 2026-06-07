# Page Bibliothèque — refonte éditoriale (P2-02)

> Statut : Refondue dans la branche `design/editorial-refonte` (issue #222).
>
> **Plan global** :
> [`docs/design/editorial-refonte-plan.md`](../../design/editorial-refonte-plan.md)

## Description

La page `/library` adopte la direction éditoriale : hero asymétrique 5/7
(kicker + titre display + subtitle d'un côté, stats inline de l'autre),
contrôles search + filter, grille `EditorialGameCard` (cohérent avec `/games`).

## Accès

- **URL** : `/[locale]/library` (FR + EN, utilisateur authentifié)
- **Source** : `src/app/[locale]/library/page.tsx`

## Architecture

```
EditorialShell (rail + sub-sidebar + mega-menu + search overlay)
└── LibraryEditorial
    ├── Hero (5/7)
    │   ├── KickerLabel + titre display + subtitle
    │   └── Stats inline (games · completed · playtime · rating)
    ├── Controls (GameSearchBar + FilterButton)
    ├── GameFilters (collapsible, variant=editorial)
    └── LibraryStatusProvider
        └── editorial-library-grid
            └── EditorialGameCard (mêmes cards que /games)
```

## Composants

### Nouveau

- `src/components/library/LibraryEditorial.tsx` — orchestrateur
- `src/app/styles/editorial/library.css` — styles dédiés

### Conservés

- `LibraryPageSkeleton.tsx` — adapté au look éditorial
- Hook `useLibraryGames` — inchangé (logique SWR + filtres + pagination)
- `LibraryStatusProvider` (depuis `/games`)
- `EditorialGameCard` (réutilisé)
- `GameSearchBar`, `FilterButton`, `GameFilters`
- `Pagination` (variant=editorial)

### Supprimés

- `LibraryGamesContent.tsx` (orchestrateur legacy)
- `LibraryStatsCards.tsx` (cards stats remplacées par stats inline du hero)
- `test/unit/components/library/LibraryGamesContent.test.tsx`
- `test/unit/components/library/LibraryGamesContent.error.test.tsx`

Le test pure `fetchLibraryGames.test.ts` est conservé (il teste une logique URL
builder dupliquée localement, pas un composant supprimé).

## Direction artistique

### Tokens utilisés

- `--editorial-bg`, `--editorial-bg-2` : surfaces sombres
- `--editorial-line` : bordures fines
- `--editorial-muted` : texte secondaire
- `--font-display` (Tomorrow) : titre, gros chiffres stats
- `--accent-rgb` : accent par défaut (palette magenta — pas de `<DynamicAccent>`
  ici puisqu'il n'y a pas de jeu/personnage spécifique)

### Patterns

- ✅ Hero asymétrique 5/7 cohérent avec Player detail
- ✅ Stats inline avec divider top/bottom (chiffres XL display + kicker mono)
- ✅ Suffixes (« /5 », « % », « h ») en weight 300 / opacity réduite
- ✅ Grille de cards : `EditorialGameCard` exactement comme `/games`
- ✅ Empty state cohérent (icône cerclée accent + titre display + helper)
- ✅ Pas de glassmorphism, pas de `.glass-*`

## Données affichées

| Section         | Source                                              |
| --------------- | --------------------------------------------------- |
| Stats games     | `useLibraryGames().stats.totalGames`                |
| Stats completed | `useLibraryGames().stats.completedGames` (+ %)      |
| Stats playtime  | `useLibraryGames().stats.totalPlayTime` (h)         |
| Stats rating    | `useLibraryGames().stats.averageRating` (toFixed 1) |
| Search          | `useLibraryGames().searchQuery`                     |
| Filtres genres  | `useLibraryGames().selectedGenres`                  |
| Pagination      | `useLibraryGames().pagination`                      |
| Grille de jeux  | `useLibraryGames().games`                           |

## i18n

Nouvelles clés sous `userLibrary.editorial.*` dans `fr.json` et `en.json` :

- `editorial.kicker` — "Bibliothèque" / "Library"
- `editorial.titlePrefix` + `editorial.titleAccent` — "Votre **collection**"
- `editorial.subtitle` — texte d'accroche
- `editorial.stats.{games,completed,playtime,rating}` — labels
- `editorial.searchPlaceholder` — placeholder de recherche

## Tests

- ✅ `test/unit/components/library/fetchLibraryGames.test.ts` — 26 tests OK
- ❌ Anciens tests `LibraryGamesContent.test.tsx` et `.error.test.tsx` supprimés
  (composant remplacé)
