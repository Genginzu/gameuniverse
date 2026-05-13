# Organisation des styles CSS

## Vue d'ensemble

Le projet utilise un **système hybride Tailwind v4 + CSS modules** :

- **Tailwind utilities** pour le styling quotidien (`p-4`, `gap-3`, `flex`,
  etc.).
- **CSS modules custom** sous `src/app/styles/**` pour les patterns complexes
  (animations, composants éditoriaux avec states avancés, scrollbar, etc.).

Ce mix est volontaire : Linear, Vercel et Resend utilisent une approche
similaire pour leurs design systems custom. Tailwind couvre le 80% des cas, le
CSS custom couvre les patterns que Tailwind rend illisibles ou impossibles
(animations chaînées, `:has()`, `:focus-within` complexes,
`prefers-reduced-motion` étendu, etc.).

## Fichier d'entrée : `src/app/globals.css`

Court (~225 lignes), il contient uniquement :

1. `@import "tailwindcss"` (en première position, obligatoire pour Tailwind v4 +
   Turbopack).
2. `@import "tw-animate-css"`.
3. La chaîne d'`@import` natifs CSS vers les modules sous `src/app/styles/**`.
4. Le bloc `@theme` (tokens Tailwind utilities).
5. Les blocs `@layer base` (variables `:root` / `.dark`, base resets).

**Aucun composant** n'est défini dans `globals.css`. Tout vit dans les modules.

## Modules CSS

```
src/app/styles/
├── animations.css       # @keyframes (pulse, slide, fade, scale, shimmer, float)
│                        # + .animate-*, .hover-lift, .glow-effect, .focus-visible
├── neon.css             # .neon-glow, .neon-border, .neon-text, .neon-btn
├── landing-grid.css     # .landing-grid-bg + @keyframes gridPulse (legacy)
├── glass-deprecated.css # .glass-*, .topbar, .dashboard-bg, scrollbar (legacy admin)
└── editorial/
    ├── typography.css   # SpotlightCard, .editorial-display/-light, .editorial-kicker,
    │                    # .editorial-divider, .editorial-scanlines, .editorial-hero, .marquee
    ├── layout.css       # rail, sub-sidebar, mobile nav overlay, EditorialLayout shell
    ├── header.css       # HeaderSearchTrigger, HeaderLanguageSwitcher, EditorialMegaMenu
    ├── header-user.css  # HeaderUserDropdown (F0-07f)
    ├── search.css       # SearchOverlay full-page (F0-07c)
    ├── game-card.css    # EditorialGameCard
    ├── games-listing.css# .editorial-games-listing-*
    ├── pagination.css   # .editorial-pagination-*
    ├── sort-menu.css    # .editorial-sort-menu-*
    ├── filters.css      # .editorial-filter-*, .editorial-active-filter-*
    └── home.css         # .editorial-home-* (P1-01)
```

## Ordre d'import

L'ordre dans `globals.css` reflète la cascade :

1. **Tailwind utilities** (`@import "tailwindcss"`) en premier.
2. **Animations + keyframes** (utilisables par tous les modules).
3. **Neon utilities**.
4. **Legacy** (`landing-grid`, `glass-deprecated`) avant l'éditorial.
5. **Éditorial** (typography → layout → header → header-user → search →
   game-card → games-listing → pagination → sort-menu → filters → home).

Les surcharges plus spécifiques (ex : `.editorial-home-cta-title` peint par
dessus `.editorial-display`) viennent **après** la classe parente.

## Règles d'évolution

### Ajouter un nouveau composant éditorial

1. Créer `src/app/styles/editorial/<nom>.css` avec un commentaire d'en-tête.
2. Ajouter `@import "./styles/editorial/<nom>.css"` dans `globals.css`, à la
   position correcte dans l'ordre de cascade.
3. Vérifier `bun run build` et `bun run lint` avant commit.

### Ajouter un utilitaire global non-Tailwind

`src/app/styles/<nom>.css` (ex : `print.css` pour les styles d'impression).

### Ajouter un nouveau token

Toujours dans `globals.css`, dans `@theme { ... }` (utility Tailwind) ou
`@layer base { :root { ... } }` (variable CSS). **Jamais** dans un module
importé.

## Contraintes Tailwind v4

- `@theme` et `@layer base` doivent rester dans le fichier d'entrée
  (`globals.css`) pour que Tailwind v4 génère correctement les utilities.
- Les modules importés ne contiennent que des classes plates, des keyframes et
  des sélecteurs scoped — aucune directive Tailwind.
- `@import` natifs CSS uniquement au niveau de `globals.css` (pas d'imports
  croisés entre modules).

## Limite de taille

- Un module ne devrait pas dépasser **600 lignes**. Si on s'en approche,
  redécouper (ex : `editorial/search.css` est à 670 lignes et candidat au
  redécoupage si on ajoute des fonctionnalités).
- Pas de fichier orphelin < 30 lignes : fusionner avec un voisin si le périmètre
  est cohérent.

## Patterns interdits

- ❌ Recréer une utility Tailwind existante (`.flex-center` au lieu de
  `flex items-center justify-center`).
- ❌ Dupliquer un sélecteur dans deux modules.
- ❌ Importer un module CSS depuis un composant TypeScript (le build Next ne
  charge que `globals.css`).
- ❌ Mettre des règles spécifiques à une page dans un module générique.

## Voir aussi

- [Steering `styles-organization.md`](../../.kiro/steering/styles-organization.md)
  (référence concise pour Kiro)
- [Plan de refonte éditoriale](../design/editorial-refonte-plan.md)
- [Composants éditoriaux](../design/editorial-components.md)
