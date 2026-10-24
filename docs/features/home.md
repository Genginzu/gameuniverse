# Page d'accueil (`/`)

## Description

Page d'accueil éditoriale (P1-01 #217, landing marketing #19). Deux variantes
orchestrées par `HomeContent` :

- **Visiteur déconnecté** (rendu par défaut) : landing marketing `HomeLanding`
  rendu côté serveur (HTML ISR + premier paint), avec 6 aperçus produit live,
  trending, stats réelles et CTA d'inscription.
- **Utilisateur connecté** : `HomeDashboard`, accueil personnalisé (#427).
  Voir [Accueil connecté](#structure-utilisateur-connecté).

La page reste ISR (pas de cookies, pas de `force-dynamic`) : le HTML serveur
contient toujours le landing. Pour éviter de le montrer à un utilisateur
connecté, un script inline du layout racine (`AUTH_HINT_SCRIPT`,
`src/lib/utils/authHint.ts`) pose `<html data-auth-hint>` avant le premier paint
si un cookie de session Supabase (`sb-*-auth-token`) existe. Tant que `useAuth`
charge, le CSS masque alors le landing et affiche `HomeDashboardSkeleton`
(sombre, éditorial). `useAuthCookieHint` resynchronise l'attribut côté client
(navigation douce, cookie supprimé après déconnexion).

## Accès

- Route : `/[locale]` (`/fr`, `/en`)
- Layout : `EditorialShell`
- Aucun prérequis : la page est publique.

## Données

- `GET /api/home?locale=…` → `HomeApiResponse` (`src/types/home.ts`) :
  `trending`, `upcoming`, `popularCharacters`, `recentReviews`, `showcaseGames`,
  `showcaseCharacters`, `stats`.
- Les jeux de la ludothèque et les personnages mis en avant se choisissent dans
  l'admin : voir [Vitrine de l'accueil](admin/home-showcase.md).
- Requêtes landing : `src/lib/services/homeLandingService.ts` (client route
  anonyme, RLS respectée).
- `stats` = `count` exacts sur `games`, `characters`, `profiles`,
  `game_reviews`. `null` si un seul compteur échoue : la section est alors
  masquée (jamais de chiffres inventés).
- ISR : `revalidate = 300` sur la page et le fetch interne.

## Structure (visiteur déconnecté)

| Section           | Composant                | Données                                     |
| ----------------- | ------------------------ | ------------------------------------------- |
| Hero              | `HeroSection`            | `trending[0]`                               |
| Bandeau défilant  | `MarqueeSection`         | i18n `landing.marquee`                      |
| 6 aperçus produit | `ProductPreviewsSection` | voir tableau ci-dessous                     |
| Trending          | `TrendingSection`        | `trending[0..3]` (SWR `fallbackData`)       |
| Stats             | `StatsSection`           | `stats` (count-up, valeur finale `sr-only`) |
| CTA final         | `CtaSection`             | i18n `landing.cta`                          |

### Aperçus produit (`src/components/home/previews/`)

Blocs alternés texte / visuel (empilés sur mobile, 2 colonnes ≥ `lg`). Chaque
bloc a un seul lien discret vers le catalogue : l'inscription est portée par le
hero et le CTA final uniquement. Les visuels sont des mockups `inert` +
`aria-hidden` construits avec les vrais composants partagés, sans capture
d'écran. Le contenu des avis est réduit à un extrait texte
(`toReviewExcerptHtml`) : `/api/home` ne charge pas `sanitize-html`.

| Pilier     | Visuel                                   | Données                           |
| ---------- | ---------------------------------------- | --------------------------------- |
| library    | `GameCard` overlay `library`             | sélection admin, sinon trending   |
| characters | `EntityCard` + config personnage         | sélection admin, sinon populaires |
| community  | `PlayerCard`                             | profils démo                      |
| search     | `GlobalSearchGameItem` / `CharacterItem` | trending + personnages réels      |
| tracking   | `StatXL` + barres de progression         | stats démo + jeux upcoming        |
| reviews    | `ReviewCard`                             | dernier avis public, sinon démo   |

Les données de démo sont dans `previews/previewDemoData.ts`.

## Structure (utilisateur connecté)

Composants dans `src/components/home/dashboard/`, partagés via `HomeSection`
(kicker + titre + lien « voir tout ») et `HomeGameRail` (rail horizontal
scroll-snap de `GameCard`, skeletons puis état vide `HomeEmptyState`). À la
souris, la molette fait défiler le rail horizontalement tant qu'il n'est pas au
bout, puis la page reprend (`useHorizontalWheelScroll`).

| Section              | Composant                | Données                                           |
| -------------------- | ------------------------ | ------------------------------------------------- |
| Hero                 | `HomeHero`               | `/api/profile`, `/api/players/:id/xp`, `/api/library/stats` (`useHomeHero`) |
| Raccourcis           | `HomeShortcuts`          | bibliothèque, backlog, fil, profil                |
| Reprendre            | `ContinuePlayingSection` | `/api/library`, statut `playing`                  |
| Recommandations      | `RecommendationsSection` | `usePersonalRecommendations`                      |
| Activité des amis    | `FriendsActivitySection` | `/api/feed?page=1` (4 événements, `FeedItem`)     |
| Tendances / sorties  | `DiscoverSections`       | `/api/home` (ISR en `fallbackData`)               |

`/dashboard` reste la page compte (infos du compte, stats, accès rapides).

Recommandations : le calcul serveur peut être long (un passage par jeu de la
bibliothèque, résultat mis en cache 1 h). Pendant le chargement, `HomeLoadingNotice`
affiche un message (plus un second après 6 s). Le bouton « Recalculer » appelle
`/api/recommendations/personal?refresh=1`, qui ignore le cache agrégé (limité à
5 fois / 10 min, action `recommendationRefresh`).

## Tendances (`hybrid_popularity_score`)

Score 0..1 recalculé par le trigger `trg_games_hybrid_popularity` (migration
`20261022000001_rebalance_hybrid_popularity.sql`) :

| Partie      | Signal                        | Poids |
| ----------- | ----------------------------- | ----- |
| IGDB (50 %) | Visites (PopScore)            | 32 %  |
|             | Want to play                  | 11 %  |
|             | Playing                       | 7 %   |
| Site (50 %) | Vues de la page               | 25 %  |
|             | Avis + ajouts en bibliothèque | 17 %  |
|             | Activité des 6 derniers mois  | 8 %   |

Les parts IGDB (valeurs normalisées) sont mises sur une échelle logarithmique
entre 1e-6 et le maximum du catalogue. Les jeux `is_adult` (thème IGDB Erotic,
id 42) ont un score forcé à 0 : marqués à l'import/synchro, ou via
`bun --env-file=.env scripts/igdb-import/games/backfill-adult.ts`.

### Tendances du moment (`trending_score`)

Les blocs « Tendances » (accueil, dashboard, première section de `/trending`)
trient par `trending_score` (migration `20261022000002_trending_score.sql`) :

- `hybrid_popularity_score` × facteur de sortie : jeu sorti depuis moins d'un an
  → 1, puis baisse linéaire jusqu'à 0,3 à 5 ans ; date inconnue → 0,5.
- Jeux à venir (migration `20261022000003`) : date au 31 décembre (année seule
  sur IGDB) → 0,7 sans bonus ; sortie dans les 6 mois → 1 + bonus d'attente
  (0,15 × « want to play » IGDB) ; plus tard → 1 sans bonus.
- Jeux adultes → 0.

Le tri « popularité » du catalogue et la section « Les plus populaires » gardent
`hybrid_popularity_score`.

### Rafraîchissement hebdomadaire

Cron Vercel `/api/cron/refresh-popularity` (lundi 5 h, `CRON_SECRET`) :

1. Récupère le top 500 IGDB de chaque signal (visites, want to play, playing).
2. Met à jour les valeurs IGDB de ces jeux s'ils sont au catalogue, plus 1 500
   jeux du catalogue dont les valeurs sont les plus anciennes (rotation).
3. Importe jusqu'à 5 jeux du top 100 absents du catalogue : jeux principaux,
   remakes et remasters uniquement (pas de portages, DLC, bundles ni versions),
   avec une cover, hors jeux adultes.
4. Recalcule tous les scores (`refresh_trending_scores()`).

Filet de sécurité : le job pg_cron `refresh-trending-scores` recalcule les
scores chaque lundi à 5 h 45, même si le cron Vercel échoue.

## i18n

- Namespaces : `landing.hero`, `landing.marquee`, `landing.previews`,
  `landing.trending`, `landing.stats`, `landing.cta`, `homeDashboard`.
- La page d'erreur `[locale]/error.tsx` utilise `errors.*` et
  `common.backToHome`.

## Tests

- `src/components/home/__tests__/` : `HomeContent`, `HomeLanding`,
  `StatsSection`, `ProductPreviewsSection`, `HomeGameRail`,
  `ContinuePlayingSection`, `RecommendationsSection`.
- `src/lib/utils/__tests__/authHint.test.ts`.
- `src/app/api/__tests__/home.test.ts`,
  `src/lib/services/__tests__/homeLandingService.test.ts`.

## Voir aussi

- [Plan de refonte éditoriale](../design/editorial-refonte-plan.md)
- [Composants éditoriaux](../design/editorial-components.md)
