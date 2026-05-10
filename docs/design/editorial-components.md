# Composants éditoriaux

Cette page documente les composants, tokens et utilitaires de la refonte
éditoriale (Imba-inspired). Voir
[`editorial-refonte-plan.md`](./editorial-refonte-plan.md) pour le plan
global, la direction artistique et les choix de design.

## Sommaire

- [Direction artistique en bref](#direction-artistique-en-bref)
- [Design tokens](#design-tokens)
- [Système d'accent dynamique](#systeme-daccent-dynamique)
  - [`paletteFromHex` — `src/lib/utils/accent-palette.ts`](#palettefromhex)
  - [`useGameAccent` — `src/hooks/useGameAccent.ts`](#usegameaccent)
  - [`DynamicAccent` — `src/components/shared/DynamicAccent.tsx`](#dynamicaccent)
- [Composants partagés (`src/components/shared/`)](#composants-partages)
  - [`EditorialHero`](#editorialhero)
  - [`SpotlightCard`](#spotlightcard)
  - [`Marquee`](#marquee)
  - [`KickerLabel`](#kickerlabel)
  - [`StatXL`](#statxl)
- [Composants de layout (`src/components/layout/editorial/`)](#composants-de-layout)
  - [`EditorialRail`](#editorialrail)
  - [`EditorialSubSidebar`](#editorialsubsidebar)
  - [`EditorialMobileNav`](#editorialmobilenav)
  - [`useEditorialRailState`](#useeditorialrailstate)
- [Composants encore à venir](#composants-encore-a-venir)
- [Conventions générales](#conventions-generales)

---

## Direction artistique en bref

| Règle           | Détail                                                                  |
| --------------- | ----------------------------------------------------------------------- |
| Glassmorphism   | **Retiré** sur les composants éditoriaux. Pas de `backdrop-blur`.       |
| Fond            | Noir profond `--editorial-bg`, blocs secondaires `--editorial-bg-2`.    |
| Bordures        | `1px solid var(--editorial-line)` — fines, faiblement contrastées.      |
| Typo affichage  | [Tomorrow](https://fonts.google.com/specimen/Tomorrow) via `next/font`. |
| Typo kicker     | Police monospace système, uppercase, lettrage espacé.                   |
| Accent          | Palette dynamique par jeu/personnage (`--accent-50` à `--accent-900`).  |
| Animations      | Toujours désactivées sous `prefers-reduced-motion: reduce`.             |

---

## Design tokens

Les tokens sont définis dans `src/app/globals.css` et exposés en CSS variables
sur `:root`. Ils sont utilisables n'importe où dans l'application
(Tailwind arbitrary values, classes utilitaires, styles inline).

### Tokens éditoriaux

| Variable                | Rôle                                                | Valeur (light & dark)         |
| ----------------------- | --------------------------------------------------- | ----------------------------- |
| `--editorial-bg`        | Fond principal (overlay mobile, hero, rail)         | `#08020f`                     |
| `--editorial-bg-2`      | Fond secondaire (sub-sidebar, panneaux de page)     | `#0e051c`                     |
| `--editorial-line`      | Bordure fine (rail, sub-sidebar, dividers)          | `rgba(255, 255, 255, 0.06)`   |
| `--editorial-muted`     | Texte secondaire / icônes inactives                 | `#a89dbf`                     |
| `--font-display`        | Police display (Tomorrow, chargée via `next/font`)  | `"Tomorrow", system-ui, ...`  |

### Tokens d'accent

Injectés par `<DynamicAccent>` (sinon défaut `--neon-primary`).

| Variable                       | Rôle                                                       |
| ------------------------------ | ---------------------------------------------------------- |
| `--accent-50` … `--accent-900` | Échelle Tailwind-like (50 = très clair, 900 = très foncé). |
| `--accent-rgb`                 | Triplet RGB principal (sans virgule), ex: `255 70 85`.     |
| `--accent-glow`                | Alias de `--accent-rgb` pour les `box-shadow rgba(...)`.   |

Exemple d'usage Tailwind :

```tsx
<button className="bg-[rgb(var(--accent-500))] text-white">
  Action
</button>
```

---

## Système d'accent dynamique <a id="systeme-daccent-dynamique"></a>

Le système permet à chaque jeu / personnage d'avoir sa propre palette
d'accent (générée depuis `game.accentColor`), tout en restant compatible
avec un fallback global.

### `paletteFromHex` <a id="palettefromhex"></a>

**Fichier :** `src/lib/utils/accent-palette.ts`
**Type :** module pur, server-safe (pas de `"use client"`).

Génère une `AccentPalette` complète à partir d'une couleur hex.
Préserve la teinte et la saturation, fait varier la luminosité pour
obtenir une échelle 50→900. Fallback gracieux vers `DEFAULT_PALETTE`
(magenta) si l'entrée est invalide.

```ts
import { paletteFromHex, DEFAULT_PALETTE } from "@/lib/utils/accent-palette";

const palette = paletteFromHex("#ff4655", "valorant");
// palette.scale[500]  → "#dd4757" (mid-tone)
// palette.rgbTriplet  → "255 70 85"

paletteFromHex("invalid")  // ⇒ DEFAULT_PALETTE
paletteFromHex(null)        // ⇒ DEFAULT_PALETTE
```

5 palettes prédéfinies sont aussi exportées : `MAGENTA_PALETTE`,
`CYBERPUNK_PALETTE`, `VALORANT_PALETTE`, `GOLD_PALETTE`, `CYAN_PALETTE`.

### `useGameAccent` <a id="usegameaccent"></a>

**Fichier :** `src/hooks/useGameAccent.ts`
**Usage :** Client component uniquement.

Hook memoïzé qui retourne une `AccentPalette` dérivée d'un objet
`{ accentColor }` ou directement d'une chaîne hex. Memoize sur la
chaîne hex pour éviter les régénérations inutiles.

```tsx
import { useGameAccent } from "@/hooks/useGameAccent";

function GameDetail({ game }) {
  const palette = useGameAccent(game);
  // …
}

// Variantes accept�es
useGameAccent(game.accentColor);   // string direct
useGameAccent("#ff4655", "valorant");
useGameAccent(null);  // ⇒ DEFAULT_PALETTE
```

### `DynamicAccent` <a id="dynamicaccent"></a>

**Fichier :** `src/components/shared/DynamicAccent.tsx`
**Usage :** Server **ou** Client component (pas de `"use client"`).

Wrapper qui injecte les CSS variables `--accent-*` sur son sous-arbre.

#### API

| Prop        | Type                                       | Défaut    | Description                              |
| ----------- | ------------------------------------------ | --------- | ---------------------------------------- |
| `palette`   | `AccentPalette`                            | requis    | Palette à appliquer.                     |
| `children`  | `ReactNode`                                | requis    | Sous-arbre qui consommera les variables. |
| `as`        | `"div" \| "section" \| "article" \| "main"` | `"div"`  | Tag HTML rendu.                          |
| `className` | `string`                                   | —         | Classes additionnelles.                  |

#### Exemple

```tsx
import { DynamicAccent } from "@/components/shared/DynamicAccent";
import { paletteFromHex } from "@/lib/utils/accent-palette";

export default async function GamePage({ params }) {
  const game = await getGame(params.slug);

  return (
    <DynamicAccent palette={paletteFromHex(game.accentColor)} as="main">
      <GameHero game={game} />
      <GameDetailContent game={game} />
    </DynamicAccent>
  );
}
```

Tout `bg-[rgb(var(--accent-500))]` ou `border-[rgb(var(--accent-rgb))]/20`
à l'intérieur héritera de la couleur du jeu.

#### Quand l'utiliser

- ✅ Pages de détail jeu / personnage qui veulent un accent contextuel.
- ✅ Sections sponsorisées avec leur propre identité de marque.
- ❌ Pages globales (home, listings) : laisser le défaut `--neon-primary`.

---

## Composants partagés <a id="composants-partages"></a>

### `EditorialHero`

**Fichier :** `src/components/shared/EditorialHero.tsx`
**Rôle :** Hero immersif avec image plein cadre, kicker, titre display
géant pouvant contenir une image inline, paragraphe descriptif et CTAs.

#### API

| Prop              | Type                       | Description                                              |
| ----------------- | -------------------------- | -------------------------------------------------------- |
| `kicker`          | `string`                   | Petit label uppercase au-dessus du titre.                |
| `parts`           | `EditorialHeroPart[]`      | Mots du titre, avec `text` / `break` / `image`.          |
| `description`     | `string`                   | Paragraphe court en bas à droite.                        |
| `ctas`            | `ReactNode`                | Slot pour les boutons.                                   |
| `backgroundImage` | `string`                   | URL de l'image plein cadre.                              |
| `backgroundAlt`   | `string`                   | Texte alternatif.                                        |

`EditorialHeroPart` :

```ts
type EditorialHeroPart =
  | { type: "text"; value: string; accent?: boolean }
  | { type: "break" }
  | { type: "image"; src: string; alt: string };
```

#### Exemple

```tsx
<EditorialHero
  kicker="ÉDITION SPÉCIALE"
  parts={[
    { type: "text", value: "Bienvenue" },
    { type: "text", value: "sur" },
    { type: "image", src: "/avatar.jpg", alt: "Cover du jeu" },
    { type: "text", value: "Gamers Universe", accent: true },
  ]}
  description="Le hub des passionnés de jeu vidéo."
  backgroundImage="/hero-cover.jpg"
  backgroundAlt="Cover artwork"
  ctas={
    <>
      <Button>Découvrir</Button>
      <Button variant="ghost">Voir le tournoi</Button>
    </>
  }
/>
```

#### Quand l'utiliser

- ✅ Page d'accueil, sections "Jeu en avant", landing pages éditoriales.
- ❌ En-têtes de pages d'admin ou utilitaires (utiliser `PageBanner`).

---

### `SpotlightCard`

**Fichier :** `src/components/shared/SpotlightCard.tsx`
**Rôle :** Carte avec halo lumineux qui suit le curseur (style Linear, Resend).

#### API

| Prop        | Type                                       | Défaut    | Description                              |
| ----------- | ------------------------------------------ | --------- | ---------------------------------------- |
| `as`        | `"div" \| "article" \| "section" \| "a"`   | `"div"`   | Tag HTML rendu.                          |
| `href`      | `string`                                   | —         | Requis si `as="a"`.                      |
| `glowColor` | `string`                                   | —         | Triplet RGB override (ex: `"168 85 247"`). |
| `className` | `string`                                   | —         | Classes additionnelles.                  |

Quand `glowColor` est omis, la carte utilise `--neon-primary` du thème (ou
`--accent-rgb` si elle est dans un `DynamicAccent`).

#### Exemple

```tsx
<SpotlightCard as="a" href="/games/zelda" className="p-6">
  <h3>The Legend of Zelda</h3>
  <p>Action-adventure</p>
</SpotlightCard>

// Override de couleur
<SpotlightCard glowColor="168 85 247" className="p-4">
  <p>Halo violet personnalisé</p>
</SpotlightCard>
```

#### Quand l'utiliser

- ✅ Cartes de mise en avant dans une grille (jeux, articles, fonctionnalités).
- ✅ Liens de navigation premium (CTA forts).
- ❌ Listes denses de petits items (overhead inutile).

---

### `Marquee`

**Fichier :** `src/components/shared/Marquee.tsx`
**Rôle :** Conteneur défilant infini horizontal, duplique automatiquement
le contenu pour éviter les sauts.

#### API

| Prop           | Type        | Défaut     | Description                                         |
| -------------- | ----------- | ---------- | --------------------------------------------------- |
| `children`     | `ReactNode` | requis     | Items à faire défiler.                              |
| `className`    | `string`    | —          | Classes sur le wrapper externe.                     |
| `gapClassName` | `string`    | `"gap-16"` | Espacement entre items dupliqués (Tailwind class).  |

L'animation est désactivée sous `prefers-reduced-motion: reduce`.

#### Exemple

```tsx
<Marquee className="border-y border-[var(--editorial-line)]">
  <span className="editorial-display text-2xl">Trending now</span>
  <span className="editorial-display text-2xl text-white/40">·</span>
  <span className="editorial-display text-2xl">Esport</span>
  {/* ... */}
</Marquee>
```

#### Quand l'utiliser

- ✅ Bandeau d'annonces, ticker de top games, mise en valeur d'un thème.
- ❌ Liste navigationnelle : préférer une grille / liens classiques.

---

### `KickerLabel`

**Fichier :** `src/components/shared/KickerLabel.tsx`
**Rôle :** Petit label uppercase mono, lettrage espacé. Utilisé au-dessus
des titres ou comme en-tête de section.

#### API

| Prop        | Type                                                                | Défaut | Description           |
| ----------- | ------------------------------------------------------------------- | ------ | --------------------- |
| `children`  | `ReactNode`                                                         | requis | Texte du kicker.      |
| `as`        | `"p" \| "span" \| "div" \| "h1" \| "h2" \| "h3" \| "h4" \| "h5" \| "h6"` | `"p"` | Tag HTML rendu. |
| `className` | `string`                                                            | —      | Classes additionnelles. |

Applique automatiquement la classe `.editorial-kicker`.

#### Exemple

```tsx
<KickerLabel className="mb-4 text-white/80">
  Édition spéciale · 2026
</KickerLabel>

<KickerLabel as="span" className="text-[rgb(var(--accent-500))]">
  Live now
</KickerLabel>
```

#### Quand l'utiliser

- ✅ Au-dessus des titres de section (h1, h2).
- ✅ Tags / labels courts (statut, catégorie).
- ❌ Texte de paragraphe ou contenu long.

---

### `StatXL`

**Fichier :** `src/components/shared/StatXL.tsx`
**Rôle :** Statistique éditoriale avec un chiffre XL (police display) et
un `KickerLabel` en dessous.

#### API

| Prop        | Type                              | Défaut  | Description                                    |
| ----------- | --------------------------------- | ------- | ---------------------------------------------- |
| `value`     | `ReactNode`                       | requis  | Chiffre / valeur principale (peut être un nœud). |
| `label`     | `ReactNode`                       | requis  | Label sous la valeur.                          |
| `as`        | `"div" \| "li" \| "article"`      | `"div"` | Tag HTML rendu.                                |
| `className` | `string`                          | —       | Classes additionnelles.                        |

#### Exemple

```tsx
<StatXL value="10K+" label="JEUX RÉFÉRENCÉS" />
<StatXL value="240+" label="TOURNOIS LIVE" />

// Avec valeur composée
<StatXL
  value={
    <>
      4.7<span className="text-2xl">/5</span>
    </>
  }
  label="NOTE COMMUNAUTÉ"
/>
```

#### Quand l'utiliser

- ✅ Sections "chiffres clés" (home, à propos, dashboards stats).
- ❌ Stats inline dans du texte (utiliser `<strong>` + `KickerLabel`).

---

## Composants de layout <a id="composants-de-layout"></a>

### `EditorialRail`

**Fichier :** `src/components/layout/editorial/EditorialRail.tsx`
**Rôle :** Barre verticale 56px persistante (Discord-style) avec logo et
5 icônes d'espace cliquables.

#### API

| Prop            | Type                                               | Défaut | Description                                              |
| --------------- | -------------------------------------------------- | ------ | -------------------------------------------------------- |
| `openSpace`     | `EditorialSpaceKey \| null`                        | —      | Space dont la sub-sidebar est ouverte (driven par parent). |
| `onToggleSpace` | `(key: EditorialSpaceKey) => void`                 | —      | Callback au clic sur une icône.                          |
| `className`     | `string`                                           | —      | Classes additionnelles.                                  |

#### Exports utiles

- `EditorialSpaceKey` : `"games" | "esport" | "library" | "community" | "coaching"`
- `EditorialSpace` : structure d'un space (key, icon, pathPrefixes, links).
- `EDITORIAL_SPACES` : tableau readonly des 5 spaces.
- `spaceFromPathname(pathname)` : helper qui retourne la `EditorialSpaceKey`
  matchant le pathname (ou `null`).

#### Exemple

```tsx
"use client";

import { EditorialRail } from "@/components/layout/editorial/EditorialRail";
import { useEditorialRailState } from "@/hooks/useEditorialRailState";

function Shell({ children }) {
  const { openSpace, toggleSpace } = useEditorialRailState();
  return (
    <div className="flex h-screen">
      <EditorialRail openSpace={openSpace} onToggleSpace={toggleSpace} />
      {/* ... sub-sidebar + contenu */}
    </div>
  );
}
```

#### Quand l'utiliser

- ✅ Layout principal du site éditorial (assemble avec `EditorialSubSidebar`).
- ❌ Pages d'admin (utiliser le `Sidebar` admin existant).
- ❌ Mobile (utiliser `EditorialMobileNav` à la place — le rail est masqué via CSS sous `lg`).

---

### `EditorialSubSidebar`

**Fichier :** `src/components/layout/editorial/EditorialSubSidebar.tsx`
**Rôle :** Panneau secondaire 220px qui glisse depuis la gauche, à droite
du rail. Affiche les liens du space sélectionné.

#### API

| Prop              | Type                       | Défaut  | Description                                                   |
| ----------------- | -------------------------- | ------- | ------------------------------------------------------------- |
| `space`           | `EditorialSpace \| null`   | requis  | Space affiché. `null` = sub-sidebar fermée.                   |
| `onClose`         | `() => void`               | requis  | Callback (Escape, ╳, clic en dehors, clic sur un lien).       |
| `closeOnNavigate` | `boolean`                  | `true`  | Si `true`, ferme aussi au clic sur un lien.                   |

#### Comportement

- Slide-in / slide-out via `width: 0 ↔ 220px` (transition CSS 250 ms).
- Fermeture automatique sur **Escape**, **clic en dehors** (mais ignore les
  clics sur le rail), et clic sur un lien (configurable).
- Indicateur visuel sur le lien actif (basé sur `usePathname`).

#### Exemple

```tsx
"use client";

import { EditorialRail, EDITORIAL_SPACES } from "@/components/layout/editorial/EditorialRail";
import { EditorialSubSidebar } from "@/components/layout/editorial/EditorialSubSidebar";
import { useEditorialRailState } from "@/hooks/useEditorialRailState";

function Shell({ children }) {
  const { openSpace, toggleSpace, closeSpace } = useEditorialRailState();
  const space = openSpace ? EDITORIAL_SPACES.find((s) => s.key === openSpace) ?? null : null;

  return (
    <div className="flex h-screen">
      <EditorialRail openSpace={openSpace} onToggleSpace={toggleSpace} />
      <EditorialSubSidebar space={space} onClose={closeSpace} />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
```

---

### `EditorialMobileNav`

**Fichier :** `src/components/layout/editorial/EditorialMobileNav.tsx`
**Rôle :** Bouton hamburger + overlay full-screen pour la navigation mobile.

#### API

| Prop        | Type     | Défaut | Description                                |
| ----------- | -------- | ------ | ------------------------------------------ |
| `className` | `string` | —      | Classes additionnelles sur le bouton hamburger. |

Le composant est **auto-contenu** : il gère son propre state d'ouverture
et l'accordéon des spaces.

#### Comportement

- Hamburger affiché uniquement `< lg`.
- Overlay full-screen avec accordéon des 5 spaces (un seul ouvert à la fois).
- Body scroll lock pendant l'overlay.
- Fermeture sur **Escape**, **╳**, ou clic sur un lien.

#### Exemple

```tsx
"use client";

import { EditorialMobileNav } from "@/components/layout/editorial/EditorialMobileNav";

function MobileHeader() {
  return (
    <header className="flex items-center justify-between p-4 lg:hidden">
      <Logo />
      <EditorialMobileNav />
    </header>
  );
}
```

---

### `useEditorialRailState`

**Fichier :** `src/hooks/useEditorialRailState.ts`
**Rôle :** State + persistance localStorage du space ouvert dans la sub-sidebar.

#### Retour

| Champ          | Type                                                | Description                                                   |
| -------------- | --------------------------------------------------- | ------------------------------------------------------------- |
| `openSpace`    | `EditorialSpaceKey \| null`                         | Space dont la sub-sidebar est ouverte. `null` si fermée.      |
| `toggleSpace`  | `(key: EditorialSpaceKey) => void`                  | Toggle (clic sur icône du rail).                              |
| `closeSpace`   | `() => void`                                        | Force la fermeture (Escape, ╳, clic en dehors).               |
| `openSpaceKey` | `(key: EditorialSpaceKey) => void`                  | Force l'ouverture d'un space spécifique.                      |
| `hydrated`     | `boolean`                                           | `true` une fois la lecture localStorage terminée.             |

#### Notes

- Le state initial est **toujours `null`** côté server, puis on hydrate
  via `localStorage` après mount → pas de mismatch d'hydratation Next.js.
- Storage key : `gu.editorial.openSpace.v1`.
- Tolère les erreurs (mode privé, quota dépassé, JSON corrompu).
- Valide la valeur stockée contre `EDITORIAL_SPACES` — ignore les clés
  inconnues.

---

## Composants encore à venir <a id="composants-encore-a-venir"></a>

| Composant            | Issue / Phase  | Statut                                  |
| -------------------- | -------------- | --------------------------------------- |
| `EditorialLayout`    | F0-06 (#207)   | À implémenter (assemble rail + sub + mobile + futur mega-menu). |
| `EditorialMegaMenu`  | F0-07 (#210)   | À implémenter (header avec catégories survolables).             |

Cette page sera mise à jour au fur et à mesure de leur arrivée.

---

## Conventions générales

- ✅ **Pas de `backdrop-blur`** dans les composants éditoriaux.
- ✅ Tous les libellés visibles passent par `next-intl`
  (namespace `editorial.*`).
- ✅ Animations désactivées sous `prefers-reduced-motion: reduce`.
- ✅ `EDITORIAL_SPACES` est la single source of truth pour les espaces
  (clés, icônes, hrefs, pathPrefixes, labelKeys). Si vous ajoutez un
  space, il apparaît automatiquement dans le rail, la sub-sidebar et le
  mobile nav.
- ❌ Ne pas hardcoder de classes `.glass-*` dans un composant éditorial
  (cf retrait du glassmorphism sur ce périmètre).
- ❌ Ne pas dupliquer les liens des spaces dans des composants tiers ;
  importer `EDITORIAL_SPACES` à la place.
