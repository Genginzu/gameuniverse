# Page de détail d'un jeu — refonte éditoriale (P1-03)

> Statut : Refondue dans la branche `design/editorial-refonte` (issue #215).
>
> **Plan global** :
> [`docs/design/editorial-refonte-plan.md`](../../design/editorial-refonte-plan.md)
> · **Composants éditoriaux** :
> [`docs/design/editorial-components.md`](../../design/editorial-components.md)

## Description

La page `/games/[slug]` adopte la direction artistique éditoriale
(Imba-inspired) mise en place pour la refonte du site. Elle remplace l'ancienne
version à onglets glassmorphism par une mise en page **magazine** : scroll
vertical, sections numérotées 01..13, hero plein cadre, Bento asymétrique,
accent dynamique par jeu.

## Accès

- **URL** : `/[locale]/games/[slug]` (FR + EN)
- **Source** : `src/app/[locale]/games/[slug]/page.tsx`
- **ISR** : `revalidate = 60s`

## Architecture

```
EditorialShell (rail + sub-sidebar + mega-menu + search overlay)
└── DynamicAccent (palette dérivée de game.accentColor)
    └── GameDetailsContent
        ├── 00 — DetailHero            (cover sticky + titre display +
        │                               kicker dev/year/platforms +
        │                               tagline + genres pills + CTAs)
        ├── 01 — AboutSection          (description + storyline 2 cols)
        ├── 02 — StatsBento            (Bento asymétrique : Metascore XL,
        │                               prix mini, age, date, plateformes,
        │                               dev/publisher, genres)
        ├── 03 — AgeRatingsSection     (badges PEGI/ESRB + descriptors)
        ├── 04 — LanguagesSection      (table interface/audio/subtitles)
        ├── 05 — PlaytimeSection       (HowLongToBeat + moyenne communauté
        │                               + contributors + form add)
        ├── 06 — MediaSection          (gallery asymétrique 1 grand + 2
        │                               petits + grille vidéos)
        ├── 07 — VersionsSection       (cards éditions GOTY/Deluxe/etc)
        ├── 08 — DlcSection            (cards DLC/extensions)
        ├── 09 — MusicSection          (compositeur + Spotify/YouTube)
        ├── 10 — PricingSection        (multi-store, "Best" sur le moins cher)
        ├── 11 — PriceHistorySection   (chart Recharts 90j)
        ├── 12 — ReviewsSection        (GameReviewsTab existant en wrapper)
        └── 13 — SimilarGamesSection   (IGDB similar_games ou recos algo)
```

Toutes les sections sont autonomes : si la donnée associée est absente, la
section retourne `null` (pas d'affichage vide).

## Composants

### Sections éditoriales (nouvelles)

Toutes sous `src/components/games/details/sections/` :

| Fichier                          | Rôle                                                  |
| -------------------------------- | ----------------------------------------------------- |
| `DetailHero.tsx`                 | Hero plein cadre + cover + identité du jeu            |
| `AboutSection.tsx`               | Description + storyline 2 cols magazine               |
| `StatsBento.tsx`                 | Bento Metascore XL + cards stats                      |
| `AgeRatingsSection.tsx`          | Badges PEGI/ESRB + descriptors                        |
| `LanguagesSection.tsx`           | Table interface/audio/subtitles                       |
| `PlaytimeSection.tsx`            | Officiel + communauté + form add                      |
| `MediaSection.tsx`               | Screenshots + videos asymétrique                      |
| `VersionsSection.tsx`            | Cards éditions du jeu                                 |
| `DlcSection.tsx`                 | Cards DLC + extensions                                |
| `MusicSection.tsx`               | Compositeur + embeds Spotify/YouTube                  |
| `PricingSection.tsx`             | Cards prix multi-store                                |
| `PriceHistorySection.tsx`        | Wrapper editorial autour de PriceHistoryTab           |
| `ReviewsSection.tsx`             | Wrapper editorial autour de GameReviewsTab            |
| `SimilarGamesSection.tsx`        | IGDB similar_games + fallback algo recos              |
| `AlgorithmicRecommendations.tsx` | Fallback de SimilarGames (utilise useRecommendations) |

### Composants partagés réutilisés

- `SpotlightCard` (`src/components/shared/`) — toutes les cards des sections
  sont des SpotlightCard (halo curseur + bordure accent au hover)
- `KickerLabel` (`src/components/shared/`) — kickers numérotés et labels
- `DynamicAccent` (`src/components/shared/`) — injecte `--accent-*` depuis
  `game.accentColor`
- `EditorialGameCard` (`src/components/games/`) — cards de la grille similar
  games

### Composants conservés inchangés

- `PriceHistoryTab` + `PriceHistoryChart` + `PriceHistoryStats` +
  `PriceHistoryFilters` (chart Recharts existant)
- `GameReviewsTab` + sous-composants reviews
- `PlayerPlaytimeForm` (form de soumission de temps de jeu)

### Helpers

- `utils/render-accent-segments.tsx` — transforme les balises pseudo-XML
  `<accent>...</accent>` dans les traductions en JSX `<span class="accent">`
  pour permettre aux clés i18n de désigner le mot accentué d'un titre

## Direction artistique

### Tokens utilisés

- `--editorial-bg`, `--editorial-bg-2` : surfaces sombres
- `--editorial-line` : bordures fines
- `--editorial-muted` : texte secondaire
- `--font-display` (Tomorrow) : titres, gros chiffres, valeurs stats
- `--accent-50` … `--accent-900`, `--accent-rgb` : injectés par
  `<DynamicAccent>` à partir de `game.accentColor`

### Patterns

- ✅ Surfaces opaques `bg-[var(--editorial-bg-2)]` + bordure
  `border-[var(--editorial-line)]`
- ✅ Hero plein cadre avec dégradé vers `--editorial-bg` (pas de
  `backdrop-blur`)
- ✅ Kicker numéroté `01 — About` au-dessus de chaque section
- ✅ Titre de section : display Tomorrow avec dernier mot en accent dégradé
  (rendu via `<accent>...</accent>` dans la clé i18n)
- ✅ Bouton library coloré sur l'accent dynamique du jeu
- ✅ Chiffres XL (Metascore, durée communauté) en typo display
- ✅ Plus de `backdrop-blur` ni de `.glass-*`

### Styles

CSS modulaire dans `src/app/styles/editorial/game-detail.css`. Importé depuis
`src/app/globals.css` après les autres modules éditoriaux.

## Données conservées

Aucun changement fonctionnel — toutes les données affichées par l'ancienne
version sont conservées :

- **Hero** : background image, cover, titre, kicker dev/year/plateformes,
  description (tagline), genres, CTAs library/share, stats inline
- **About** : description complète + storyline IGDB
- **Bento** : metascore, prix mini, age (PEGI), date, plateformes,
  dev/publisher, genres
- **Sections** : age ratings (PEGI/ESRB + descriptors), langues
  (interface/audio/subtitles), playtime IGDB officiel + moyenne communauté
  - contributeurs, médias (screenshots + videos), éditions, DLC, bande son
    (compositeur + Spotify + YouTube), pricing multi-store, historique de prix
    (90 jours), reviews, jeux similaires

## Hooks utilisés

- `useBackgroundSync(slug, igdbId, lastSyncedAt)` — sync IGDB en arrière-plan
- `useViewTracker("games", slug)` — tracking des vues
- `useGameLibraryStatus(gameId)` — état de la bibliothèque + add/remove (hero)
- `usePlayerPlaytime(slug)` — moyennes/contributeurs/userPlaytime + submit
- `usePriceHistory(slug, filters)` — chart Recharts (PriceHistoryTab)
- `useRecommendations(slug)` — fallback similar games

## SEO

- `generateMetadata` : titre, description, OG, alternates FR/EN
- `<JsonLd>` : Schema.org `VideoGame` avec `aggregateRating` (metascore) et
  `datePublished` (release date)

## Mobile

- Hero : 60vh sur mobile, fade vers `--editorial-bg`
- Layout : sections empilées en 1 colonne sous `lg`, grilles bento en 2 cols dès
  `xs`/`sm`
- Touch targets : ≥ 44px (CTA library, share, buttons)
- Tableau langues : scroll horizontal sur mobile

## i18n

Toutes les nouvelles clés sont sous `gameDetails.editorial.*` dans
`src/messages/{fr,en}.json` :

- `editorial.sections.*` — kickers et titres de sections (avec balises
  `<accent>...</accent>` pour le mot accentué)
- `editorial.playtime.*` — kickers playtime
- `editorial.languages.*` — colonnes de la table langues
- `editorial.review.*` — labels prix/buy
- `editorial.metascoreRating.*` — phrases d'accompagnement metascore
- `editorial.heroPlatformsCount`, `editorial.liveTicker` — labels du hero

## Tests

- Tests existants conservés :
  `test/unit/components/games/details/PriceHistoryTab.test.tsx`
- Tests de hooks éditoriaux : `useGameAccent`, `useEditorialRailState`
- Pas de régression sur les services (IGDB, GameService)
