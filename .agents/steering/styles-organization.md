# Styles : organisation modulaire de `globals.css`

## Règle principale

`src/app/globals.css` est le **fichier d'entrée Tailwind v4 minimal**. Il ne
contient **que** :

1. `@import "tailwindcss"` (en première position, obligatoire).
2. `@import "tw-animate-css"`.
3. La chaîne d'`@import` natifs CSS vers les modules `src/app/styles/**`.
4. Le bloc `@theme` (tokens Tailwind utilities).
5. Les blocs `@layer base` (variables `:root` / `.dark`, base resets).

Tout le reste — utilitaires custom, composants éditoriaux, animations,
scrollbar, glass deprecated, etc. — vit dans des modules CSS dédiés sous
`src/app/styles/**`.

## Structure

```
src/app/
├── globals.css              # Entrée Tailwind v4 (imports + @theme + :root + .dark)
└── styles/
    ├── animations.css       # @keyframes + .animate-*, hover-lift, etc.
    ├── neon.css             # .neon-glow, .neon-border, .neon-text, .neon-btn
    ├── landing-grid.css     # .landing-grid-bg (legacy)
    ├── glass-deprecated.css # .glass-* + .topbar + .dashboard-bg + scrollbar (legacy admin)
    └── editorial/
        ├── typography.css   # SpotlightCard, .editorial-display, kicker, scanlines, hero, marquee
        ├── layout.css       # rail, sub-sidebar, mobile nav overlay, EditorialLayout shell
        ├── header.css       # search trigger, language switcher, mega-menu
        ├── header-user.css  # HeaderUserDropdown
        ├── search.css       # SearchOverlay full-page
        ├── game-card.css    # EditorialGameCard
        ├── games-listing.css# .editorial-games-listing-*
        ├── pagination.css   # .editorial-pagination-*
        ├── sort-menu.css    # .editorial-sort-menu-*
        ├── filters.css      # FilterChip, ActiveFilterChip, FilterSection editorial variants
        ├── home.css         # .editorial-home-* (P1-01)
        ├── game-detail.css  # .editorial-game-detail-* (P1-03)
        ├── player-detail.css # .editorial-player-detail-* (P2-01)
        └── library.css      # .editorial-library-* (P2-02)
```

## Règles obligatoires

### Standard éditorial : Tailwind inline par défaut

> **Standard depuis le dashboard (`/dashboard`, page de référence).**
> La migration des pages éditoriales antérieures (encore en CSS module) se
> fait progressivement.

Les composants éditoriaux s'écrivent en **Tailwind inline**, pas en classes
`.editorial-*` dans des modules CSS. La réutilisation passe par des
**composants React** partagés (ex `KickerLabel`, `GameCard`) et par des
**tokens `@theme`**, pas par des classes CSS sémantiques.

Les tokens éditoriaux sont exposés comme utilities Tailwind dans `@theme` :

| Utility Tailwind        | Token source                                  |
| ----------------------- | --------------------------------------------- |
| `bg-editorial-bg`       | `--editorial-bg`                              |
| `bg-editorial-2`        | `--editorial-bg-2`                            |
| `bg-editorial-3`        | `--editorial-bg-3`                            |
| `border-editorial-line` | `--editorial-line`                            |
| `text-editorial-muted`  | `--editorial-muted`                           |
| `text-editorial-accent` | `rgb(var(--accent-rgb, var(--neon-primary)))` |

- ✅ Surfaces sombres → `bg-editorial-2` / `bg-editorial-3`, bordures
  `border-editorial-line`, texte secondaire `text-editorial-muted`, accent
  dynamique `text-editorial-accent` / `bg-editorial-accent/15`.
- ✅ Titre display → `font-display` + `text-[clamp(...)]`.
- ✅ Factoriser la répétition en **sous-composants React**, jamais en classes
  `.editorial-*`.

### Skeletons : design éditorial obligatoire

Tout skeleton (état de chargement) affiché sur une page **refondue/éditoriale**
doit adopter la direction artistique éditoriale sombre dès le **premier paint**.
Aucun skeleton ne doit apparaître blanc/clair puis basculer en sombre.

- ✅ Surfaces sombres via tokens éditoriaux (`bg-editorial-2` / `bg-editorial-3`,
  bordures `border-editorial-line`) ou blocs en transparence blanche
  (`bg-white/[0.06]` à `bg-white/10`) qui ne dépendent **pas** du thème.
- ✅ Réutiliser les classes skeleton éditoriales existantes quand elles
  conviennent (`.editorial-card-skeleton`, `.editorial-*-skeleton`).
- ❌ Ne **jamais** utiliser de couleurs claires/dépendantes du thème dans un
  skeleton éditorial : `bg-white` opaque, `bg-gray-*`, `bg-slate-*`,
  `bg-muted` (le `Skeleton` de base `@/components/ui/skeleton`), `.glass-card`,
  ni de gradient clair (`from-slate-50`, `from-blue-50`…).
- ⚠️ Un composant skeleton **partagé** avec des pages legacy (ex `EntitySkeleton`,
  `GridSkeleton`) ne doit pas être modifié globalement : neutraliser les surfaces
  claires via un override scopé au conteneur éditorial racine
  (`.editorial-layout-main`) plutôt qu'en touchant le composant partagé.

### Quand un module CSS reste justifié

Réservé à ce que Tailwind ne sait **pas** exprimer proprement inline :

- ✅ `@keyframes` + animations custom (scanlines, scan, breath, marquee…).
- ✅ Gradients animés complexes, effets multi-couches, `prefers-reduced-motion`.
- ✅ Un **nouvel utilitaire global** non couvert par Tailwind
  (`src/app/styles/<nom>.css`).
- ❌ Ne **plus** créer de module `src/app/styles/editorial/<nom>.css` pour le
  simple layout/couleur d'un composant : utiliser Tailwind inline.

### Tokens de design

- ✅ Pour un **nouveau token** (couleur, spacing, font) : ajouter dans `@theme`
  (utilities Tailwind) ou `:root` / `.dark` (variables CSS). **Ne jamais** dans
  un module importé.

### Contraintes Tailwind v4 + Turbopack

Tailwind v4 a besoin de voir `@theme` et `@layer base` dans le **fichier
d'entrée** (`globals.css`) pour générer les utilities et les tokens.

- ❌ Ne **jamais** déplacer `@theme { ... }` dans un module importé.
- ❌ Ne **jamais** déplacer `@layer base { ... }` dans un module importé (sauf
  si l'utilité de la règle ne dépend pas des tokens Tailwind).
- ✅ Un module peut contenir des `@layer` typés (`@layer components`,
  `@layer utilities`) si Tailwind les expose, mais en pratique on s'en passe :
  les modules contiennent juste des classes plates qui ne sont pas enchaînées
  dans la cascade Tailwind.

### Ordre d'import

L'ordre des `@import` dans `globals.css` reflète l'ordre de la cascade :

1. **Tailwind utilities** (`@import "tailwindcss"`) en premier.
2. **Animations + keyframes** (utilisables par tous les modules).
3. **Neon utilities** (utilisables par les composants editoriaux).
4. **Legacy** (landing-grid, glass-deprecated) avant l'éditorial.
5. **Éditorial** (typography → layout → header → search → game-card →
   games-listing → pagination → sort-menu → filters → home).

Les surcharges plus spécifiques (ex : `.editorial-home-cta-title` qui peint
par-dessus `.editorial-display`) doivent venir **après** la classe parente.

### Règles de contenu

- ✅ Chaque module est **autonome** : ses sélecteurs ne dépendent pas d'un ordre
  relatif avec d'autres modules.
- ✅ Chaque module **commence** par un commentaire d'en-tête expliquant son
  périmètre.
- ✅ Les `@media (prefers-reduced-motion: reduce)` restent dans le module qui
  définit les animations qu'ils désactivent.
- ❌ Pas de doublon : si une classe utilise une animation déjà définie dans
  `animations.css`, on importe ce module et on ne redéfinit pas le keyframe.
- ❌ Pas de classe `.glass-*` dans les modules `editorial/*` (cf retrait du
  glassmorphism, F0-13 / issue #258).

### Limite de taille

- ✅ Un module ne devrait **jamais dépasser 600 lignes**. Au-delà, le redécouper
  (ex : `editorial/search.css` proche de cette limite : si on ajoute une
  fonctionnalité significative, sortir un sous-module).
- ✅ Si un module < 30 lignes peut être absorbé par un voisin (ex :
  `landing-grid.css` pourrait fusionner avec `glass-deprecated.css`), on le
  laisse tant que le découpage thématique reste clair.

## Patterns interdits

- ❌ Recréer une utility Tailwind existante en CSS (`.flex-center`, etc.).
- ❌ Dupliquer un sélecteur dans deux modules.
- ❌ Mettre des règles métier (page-spécifique) dans un module générique. Ex :
  une animation de la home va dans `editorial/home.css`, pas dans
  `animations.css`.
- ❌ Importer un module CSS depuis un composant TypeScript (Tailwind v4 + le
  build Next chargent uniquement `globals.css` via `app/layout.tsx`).
- ❌ Ajouter un `@import` natif CSS dans un module (les `@import` ne marchent
  qu'au niveau de `globals.css`).

## Quand redécouper

Si un module dépasse 600 lignes ou couvre plus de 2 préoccupations distinctes,
le redécouper. Exemples possibles à terme :

- `editorial/search.css` → `editorial/search/{overlay,results,recent}.css` si on
  étend la recherche.
- `glass-deprecated.css` → à **supprimer** entièrement après la refonte de
  l'admin (cf F0-13).

## Voir aussi

- [Plan de refonte éditoriale](../../docs/design/editorial-refonte-plan.md)
- [Composants éditoriaux](../../docs/design/editorial-components.md)
- Steering [`design-glassmorphism.md`](./design-glassmorphism.md) (périmètre
  admin/legacy uniquement)
