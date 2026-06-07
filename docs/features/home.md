# Page d'accueil (`/`)

## Description

Page d'accueil refondue dans le cadre de la refonte éditoriale (P1-01, issue
#217). Deux variantes orchestrées par `HomeContent` :

- **Visiteur déconnecté** — landing éditorial complet avec hero plein cadre,
  bandeau marquee, sections numérotées, grille trending, stats XL et CTA final.
- **Utilisateur connecté** — `HomeDashboard` éditorial avec deux blocs (Jeux
  tendances + Sorties du mois).

## Accès

- Route : `/[locale]` (`/fr`, `/en`)
- Layout : `EditorialShell` (mega-menu + rail + sub-sidebar)

## Données

- Endpoint serveur : `GET /api/home?locale=…` retourne
  `{ trending: GameSummary[], upcoming: GameSummary[] }`.
- Pattern ISR hybrid : `revalidate = 300` (5 min). Le server-component fetch les
  données via l'API interne avec `next: { revalidate: 300 }`, puis passe
  `initialHomeData` au `HomeContent` (Client). SWR utilise `fallbackData` pour
  un rendu immédiat.

## Structure (visiteur déconnecté)

| Section          | Composant         | Source données                  | Notes                                                         |
| ---------------- | ----------------- | ------------------------------- | ------------------------------------------------------------- |
| Hero             | `HeroSection`     | `trending[0]`                   | Image plein cadre + image inline dans le titre                |
| Bandeau défilant | `MarqueeSection`  | i18n `landing.marquee`          | Mots-clés (trending, esport, characters, reviews, …)          |
| 6 piliers        | `FeaturesSection` | i18n `landing.features.items.*` | Grille `SpotlightCard` numérotés 01..06                       |
| Trending         | `TrendingSection` | `trending[0..3]`                | Grille 4 `EditorialGameCard`                                  |
| Stats            | `StatsSection`    | Constantes locales              | 4 `StatXL` avec count-up animé (respect reduced-motion)       |
| CTA final        | `CtaSection`      | i18n `landing.cta`              | Carte sombre avec bordure haute en gradient secondary→primary |

## Structure (utilisateur connecté)

| Section          | Composant       | Source données       |
| ---------------- | --------------- | -------------------- |
| Header bienvenue | `HomeDashboard` | i18n `homeDashboard` |
| Jeux tendances   | `HomeDashboard` | `trending[0..5]`     |
| Sorties du mois  | `HomeDashboard` | `upcoming[0..5]`     |

## i18n

- Namespaces : `landing.hero`, `landing.marquee`, `landing.features`,
  `landing.trending`, `landing.stats`, `landing.cta`, `homeDashboard`.
- FR (référence) : `src/messages/fr.json`
- EN : `src/messages/en.json`

## Composants utilisés (refonte éditoriale)

- `EditorialShell` (`@/components/layout/editorial/EditorialShell`)
- `EditorialHero` (`@/components/shared/EditorialHero`)
- `Marquee` (`@/components/shared/Marquee`)
- `KickerLabel`, `StatXL`, `SpotlightCard` (`@/components/shared/`)
- `EditorialGameCard` (`@/components/games/EditorialGameCard`)

## Mobile-first

- Breakpoints adaptés `sm` / `md` / `lg` (cf classes `editorial-home-*` dans
  `globals.css`).
- Hero : titre clamp `text-[clamp(3rem,8vw,7.5rem)]`.
- Trending grid : 2 colonnes mobile, 4 colonnes ≥ md.
- Stats grid : 2 colonnes mobile, 4 colonnes ≥ md.
- CTA card : empilée mobile, 2 colonnes ≥ md.
- Touch targets ≥ 44px sur les liens et CTAs.

## Voir aussi

- [Plan de refonte éditoriale](../design/editorial-refonte-plan.md)
- [Composants éditoriaux](../design/editorial-components.md)
