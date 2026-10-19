# Palette de couleurs (tokens uniques)

## Description

Toutes les couleurs du site dérivent de quatre échelles définies dans le
`@theme` de `src/app/globals.css`. Changer la couleur complète du site revient à
modifier ces échelles : aucun composant ne contient de couleur de marque codée
en dur.

| Échelle               | Rôle                                                  |
| --------------------- | ----------------------------------------------------- |
| `palette-primary-*`   | Terracotta `#e08a5c` — couleur dominante, accent      |
| `palette-secondary-*` | Ambre — complémentaire, début du dégradé CTA          |
| `palette-accent-*`    | Terracotta profond — accents vifs                     |
| `palette-neutral-*`   | Gris foncés éditoriaux (950 = fond, 400 = texte muet) |

Tokens dérivés (tous en `var(--color-palette-*)`) :

- `--editorial-bg`, `--editorial-bg-2`, `--editorial-bg-3`, `--editorial-muted`.
- Tokens shadcn (`--primary`, `--ring`, `--muted`, `--border`…).
- `--chart-1` à `--chart-8` : séries Recharts via `chartColor(i)`
  (`src/lib/utils/chart-colors.ts`).
- `--color-cta-from` / `--color-cta-to` : dégradé de la classe `.btn-filled`
  (`src/app/styles/buttons.css`), utilisée par tous les boutons pleins.
- `accent-color`, `::selection`, `:focus-visible` : UI native du navigateur.
- Les échelles Tailwind `gray-*`, `slate-*` et `zinc-*` sont aliasées sur
  `palette-neutral-*`.

Exceptions volontaires :

- Couleurs sémantiques (rouge erreur, vert succès, ambre/jaune avertissement ou
  note).
- Couleurs officielles de marques tierces : `--color-brand-facebook`,
  `--color-brand-x`, `--color-brand-twitch` (`bg-brand-*`). Elles ne changent
  pas lors d'un rebrand.

L'accent dynamique éditorial (`DynamicAccent`) utilise toujours
`DEFAULT_PALETTE`, dérivée de `palette-primary-500`. Les couleurs stockées en
base (`accent_color`, `background_color`) ne stylisent plus l'UI publique.

## Accès

Système transversal : s'applique à toutes les pages publiques et à l'admin.

## Prérequis

Aucun. Les garde-fous tournent avec la suite Vitest (`src/lib/__tests__/`).

## Utilisation

### Changer la couleur du site

1. Modifier les échelles `--color-palette-*` dans le `@theme` de `globals.css`.
2. Mettre à jour les triplets `--neon-primary` / `--neon-secondary` /
   `--neon-accent` dans `:root` (= RGB des `*-500`).
3. Mettre à jour le miroir hex `BRAND_COLORS` (`src/lib/utils/brand-colors.ts`),
   utilisé là où le CSS n'est pas lisible : favicon, image OG, manifest,
   `themeColor`.
4. Reteinter l'image placeholder : `bun scripts/dev/recolor-no-cover.ts`.
5. Lancer `bunx vitest run src/lib/`.

### Garde-fous

- `src/lib/utils/__tests__/brand-colors.test.ts` : échoue si `BRAND_COLORS` ou
  les `--neon-*` divergent de `globals.css`.
- `src/lib/__tests__/palette-guard.test.ts` : échoue si une teinte froide codée
  en dur (`blue-*`, `sky-*`, `cyan-*`, `indigo-*`, `violet-*`, `purple-*`,
  `pink-*`, hex ou rgb bleu-violet) apparaît dans `src/`.
