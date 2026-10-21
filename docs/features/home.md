# Page d'accueil (`/`)

## Description

Page d'accueil éditoriale (P1-01 #217, landing marketing #19). Deux variantes
orchestrées par `HomeContent` :

- **Visiteur déconnecté** (rendu par défaut) : landing marketing `HomeLanding`
  rendu côté serveur (HTML ISR + premier paint), avec 6 aperçus produit live,
  trending, stats réelles et CTA d'inscription.
- **Utilisateur connecté** : `HomeDashboard` (Jeux tendances + Sorties du mois).
  La bascule a lieu côté client une fois `useAuth` résolu : un bref flash du
  landing est accepté pour conserver l'ISR (pas de cookies, pas de
  `force-dynamic`).

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

## i18n

- Namespaces : `landing.hero`, `landing.marquee`, `landing.previews`,
  `landing.trending`, `landing.stats`, `landing.cta`, `homeDashboard`.
- La page d'erreur `[locale]/error.tsx` utilise `errors.*` et
  `common.backToHome`.

## Tests

- `src/components/home/__tests__/` : `HomeContent`, `HomeLanding`,
  `StatsSection`, `ProductPreviewsSection`.
- `src/app/api/__tests__/home.test.ts`,
  `src/lib/services/__tests__/homeLandingService.test.ts`.

## Voir aussi

- [Plan de refonte éditoriale](../design/editorial-refonte-plan.md)
- [Composants éditoriaux](../design/editorial-components.md)
