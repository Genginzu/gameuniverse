# Editorial refonte — Plan complet

> **Statut** : plan d'exécution. Document de référence pour le suivi de la
> refonte.
>
> **Branche** : `design/editorial-refonte` — toute la refonte vit ici jusqu'à un
> merge complet sur `dev` une fois 100 % terminée. **Aucun merge
> intermédiaire**.

## Sommaire

1. [Contexte et motivation](#1-contexte-et-motivation)
2. [Périmètre](#2-périmètre)
3. [Direction artistique](#3-direction-artistique)
4. [Layout retenu](#4-layout-retenu)
5. [Mega-menu et recherche full-page](#5-mega-menu-et-recherche-full-page)
6. [Stratégie de migration](#6-stratégie-de-migration)
7. [Pages à refondre](#7-pages-à-refondre)
8. [Definition of Done par page](#8-definition-of-done-par-page)
9. [Risques et points d'attention](#9-risques-et-points-dattention)
10. [Découpage en issues](#10-découpage-en-issues)

---

## 1. Contexte et motivation

L'application Gamers Universe utilise actuellement un design glassmorphism sur
fond marine. Le POC `/design-poc/*` a exploré une direction nouvelle, inspirée
du thème **Imba** (éditorial dark, typo display large, accent magenta, mise en
page magazine) tout en gardant la palette de couleurs du site.

Ce document acte la décision d'adopter cette direction sur l'ensemble de l'app
**hors admin**, et planifie la migration page par page.

## 2. Périmètre

### In scope

| Aspect                                         | Décision                                                                                                                                                                                                                                                    |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Layout / chrome (sidebar, header)              | ✅ Refonte complète, layout G adopté                                                                                                                                                                                                                        |
| Système de couleurs (palette)                  | ✅ Conservation de la palette marine actuelle                                                                                                                                                                                                               |
| Typographie                                    | ✅ Ajout de **Tomorrow** pour les titres display, conservation de **Geist** pour le corps                                                                                                                                                                   |
| Composants UI primitifs (Button, Input, Card…) | ✅ Ajustements ponctuels pour intégrer les nouveaux patterns                                                                                                                                                                                                |
| Glassmorphism                                  | ❌ **Retrait du `backdrop-blur` partout**. Les transparences blanches très légères (2-5%) sur les cards/badges restent autorisées (ce ne sont pas du glassmorphism stricto sensu, juste de la hiérarchie visuelle sur fond sombre). Voir détails section 3. |
| Pages publiques                                | ✅ Toutes                                                                                                                                                                                                                                                   |
| Pages auth                                     | ✅ Refonte légère (cohérence visuelle)                                                                                                                                                                                                                      |

### Out of scope

| Aspect                                    | Raison                                                    |
| ----------------------------------------- | --------------------------------------------------------- |
| Pages admin (`/admin/*`)                  | Layout dashboard actuel conservé, refonte non prioritaire |
| Email templates, OG images, favicon       | Mini-projet à part                                        |
| Refonte fonctionnelle (nouveaux features) | Cette refonte est purement visuelle/UX                    |
| Migration des API / hooks / services      | Aucun changement de logique métier                        |

## 3. Direction artistique

### Inspiration

Thème **Imba (Themerex)**. Trois piliers :

1. **Éditorial** : layouts magazine, typo display généreuse, kickers UPPERCASE
   mono, numérotation 01/02/03, gros guillemets pour les citations.
2. **Immersion** : photos plein cadre, scanlines subtiles, glow néon contrôlé.
3. **Cohérence chromatique** : palette d'accent qui s'adapte à la couleur
   dominante du jeu/personnage (déjà en place via `accentColor` en BDD).

### Design tokens — couleurs

La palette **marine actuelle est conservée** (primary, secondary, accent définis
dans `globals.css`). On y ajoute :

```css
/* Fond éditorial dark — version "contenu immersif" */
--editorial-bg: #120821; /* aubergine sombre */
--editorial-bg-2: #1a0f2e;
--editorial-bg-3: #251745;
--editorial-line: rgba(255, 255, 255, 0.08);
--editorial-muted: #a89dbf;
```

Les variables `--color-palette-primary-*`, `--color-palette-secondary-*` et
`--color-palette-accent-*` ne changent pas.

### Design tokens — typographie

```css
--font-display: "Tomorrow", system-ui, sans-serif; /* nouveau */
--font-sans: "Geist", system-ui, sans-serif; /* existant */
--font-mono: "Geist Mono", ui-monospace, monospace; /* existant */
```

Tomorrow chargé via `next/font` (pas via `@import` Google Fonts comme dans le
POC, pour la perf).

### Patterns réutilisables

| Pattern           | Usage                                                 |
| ----------------- | ----------------------------------------------------- |
| `EditorialHero`   | Hero plein cadre avec image inline dans le titre      |
| `SpotlightCard`   | Card avec halo lumineux qui suit le curseur           |
| `Bento`           | Grilles asymétriques avec carte XL + cartes compactes |
| `KickerLabel`     | UPPERCASE mono espacé pour les sur-titres             |
| `NumberedSection` | Sections numérotées 01/02/03                          |
| `Marquee`         | Texte défilant avec mascotte/icône inline             |
| `StatXL`          | Chiffres XL sans décoration                           |
| `EditorialCard`   | Card full-bleed image + footer arrow circulaire       |

Ces composants existent déjà dans le POC (`src/components/design-poc/`) et
seront migrés/durcis en composants de production dans `src/components/shared/`
en Phase 0.

### Glassmorphism : retrait

Le projet utilisait jusqu'ici un design system glassmorphism (classes `.glass`,
`.glass-card`, `.glass-header`, `.glass-sidebar`, etc. dans `globals.css` +
patterns Tailwind `backdrop-blur-xl`). **Cette refonte retire le
glassmorphism**.

**À retirer** :

- ❌ Toutes les classes `.glass-*` dans `src/app/globals.css`
- ❌ Tout usage de `backdrop-blur-*` sur les surfaces de chrome (header, rail,
  sidebars)
- ❌ Le steering `.kiro/steering/glassmorphism.md` (à remplacer par un steering
  éditorial)

**À conserver** (n'est pas du glassmorphism technique) :

- ✅ Les transparences blanches très légères (`bg-white/[0.02]`,
  `bg-white/[0.05]`, `bg-white/10`) sur les **cards de contenu**, **badges**,
  **bordures**. Ces transparences servent à créer une hiérarchie visuelle sur
  fond sombre, comme le font Linear / Vercel / Resend.
- ✅ Le pattern radial-gradient subtil de `SpotlightCard` (effet halo qui suit
  le curseur).
- ✅ Les dégradés sombres au-dessus d'images plein cadre (Hero), qui ne sont pas
  du blur mais de simples dégradés vers la couleur de fond.

**Surfaces opaques** :

Les sidebars (rail 56px, sub-sidebar 220px), le top header (mega-menu) et la
sidebar `--editorial-bg-2` (`#1a0f2e`) sont **plein opaques**, sans
`backdrop-blur`. Si un effet de séparation est nécessaire au-dessus de l'image
hero d'une page game detail, on utilise un dégradé classique vers
`--editorial-bg`, pas un blur.

## 4. Layout retenu

**Variante G** du POC (`?layout=hybrid-discord`) :

```
┌─────────────────────────────────────────────────┐
│         MEGA-MENU TOP HEADER (full width)       │
├──────┬───────────┬──────────────────────────────┤
│      │           │                              │
│ rail │ sub-side  │       CONTENT                │
│ 56px │ 220px     │                              │
│      │ (toggle)  │                              │
└──────┴───────────┴──────────────────────────────┘
```

### Comportement

- **Mega-menu top, full width, sticky** : **3 entrées** (Jeux, Personnages,
  Joueurs) qui ouvrent au hover un panel riche avec sous-liens à gauche et
  featured cards à droite. Barre de recherche compacte à droite servant de
  **trigger** : au clic ou via `Ctrl K` / `Cmd K`, elle ouvre un **overlay de
  recherche full-page**. Avatar + dropdown utilisateur à droite. Spec détaillée
  en section 5.
- **Rail gauche 56px, toujours visible** : 5 icônes des grands espaces (Games,
  Esport, Library, Community, Coaching). L'icône active reflète l'espace courant
  via l'URL.
- **Sub-sidebar 220px, toggle** : fermée par défaut. Clic sur une icône rail =
  ouverture de la sub-sidebar pour cet espace, listant les sous-pages. Re-clic =
  fermeture. État persistant via `localStorage`.

### Mobile

- Mega-menu remplacé par un header simple + bouton hamburger ; les 3 entrées
  deviennent des sections accordéon dans l'overlay (voir section 5.11)
- Barre de recherche : icône loupe seule, ouvre directement l'overlay full-page
- Rail caché, ouvert via overlay full-screen au tap hamburger
- Sub-sidebar dans le même overlay, accessible via tab/swipe

### Admin

L'admin garde son layout actuel (`DashboardLayout`). La nouvelle nav s'applique
uniquement aux pages hors `/admin/*`.

## 5. Mega-menu et recherche full-page

Cette section détaille la structure et le comportement du mega-menu, du
sélecteur de langue, de la barre de recherche et de l'overlay de recherche
full-page. Elle complète la section 4 (layout général) et sert de spécification
pour les issues F0-07, F0-07b, F0-07c, F0-07d et F0-07e.

### 5.1 Structure du top header

Le top header (full width, sticky) contient trois zones :

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ [LOGO]  [Jeux ▾] [Personnages ▾] [Joueurs ▾]   ┃  [🔍 Search…] [🌐 FR ▾] [👤▾]│
└──────────────────────────────────────────────────────────────────────────────┘
   gauche          mega-menu (3 entrées)                       droite
```

| Zone   | Contenu                                                                        | Largeur            |
| ------ | ------------------------------------------------------------------------------ | ------------------ |
| Gauche | Logo Gamers Universe (link vers `/`)                                           | auto               |
| Centre | 3 entrées de mega-menu : **Jeux**, **Personnages**, **Joueurs**                | flex-1, centré     |
| Droite | Barre de recherche (input réduit) + sélecteur de langue + dropdown utilisateur | auto, fin de ligne |

L'ordre des éléments dans la zone droite (de gauche à droite) est : **Search →
Sélecteur de langue → User dropdown**. Les trois sont séparés par un espacement
`gap-2` et alignés verticalement.

### 5.2 Les 3 entrées du mega-menu

Le mega-menu n'expose que **3 catégories**, alignées avec les grands espaces de
contenu de Gamers Universe :

#### 1. Jeux

Panneau riche avec :

- **Colonne gauche — sous-liens** :
  - Tous les jeux (`/games`)
  - Tendances (`/trending`)
  - Sorties à venir (`/upcoming`)
  - Par genre (lien vers `/games?genre=…` filtres rapides : Action, RPG, FPS,
    Indé, Stratégie)
  - Par plateforme (PS5, Xbox, PC, Switch)
- **Colonne droite — featured cards** :
  - 1 carte XL « Trending now » (jeu le plus tendance, image, titre,
    accentColor)
  - 2 cartes M « À surveiller » (sorties imminentes)

#### 2. Personnages

Panneau riche avec :

- **Colonne gauche — sous-liens** :
  - Tous les personnages (`/characters`)
  - Mes favoris (`/favorites/characters`, visible uniquement si connecté)
  - Par espèce (filtres rapides : Humain, Elfe, Mécanique…)
  - Par genre (filtres rapides)
- **Colonne droite — featured cards** :
  - 1 carte XL « Personnage du moment »
  - 2 cartes M « Récemment ajoutés »

#### 3. Joueurs

Cette entrée regroupe **toutes les personnes** présentes sur Gamers Universe,
qu'elles soient utilisateurs du site, joueurs pros ou équipes esport.

- **Colonne gauche — sous-liens** :
  - Tous les joueurs Gamers Universe (`/players`)
  - Joueurs pros (`/esport/players`)
  - Équipes esport (`/esport/teams`)
  - Coachs (`/coaching`)
  - Discussions (`/discussions`)
- **Colonne droite — featured cards** :
  - 1 carte XL « Joueur en vue » (joueur GU mis en avant, ou pro player
    trending)
  - 2 cartes M : 1 équipe esport active + 1 coach disponible

### 5.3 Comportement du mega-menu

| Aspect            | Comportement                                                                                                                                              |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ouverture         | Hover sur une entrée (desktop) ou tap (touch). Délai d'apparition 80 ms pour éviter les ouvertures parasites.                                             |
| Fermeture         | Mouseleave hors du panel (avec délai 200 ms), ou clic en dehors, ou touche `Escape`, ou clic sur un sous-lien.                                            |
| Animation         | Fade + translate-y de 4 px, duration 200 ms, easing `ease-out`.                                                                                           |
| Largeur du panel  | Pleine largeur du header (`max-w-screen-2xl`, padded).                                                                                                    |
| Position          | Absolute sous le header, `top: 100%` du header sticky.                                                                                                    |
| Background        | `bg-[--editorial-bg-2]` opaque, bordure inférieure `--editorial-line`, ombre subtile.                                                                     |
| Indicateur visuel | Bouton de l'entrée active : underline néon (gradient `secondary → primary`) animé.                                                                        |
| Accessibilité     | `role="menu"` sur le panel, `role="menuitem"` sur les liens, focus trap quand ouvert au clavier, navigation flèches ↓ ↑ entre sous-liens, `Escape` ferme. |
| Mobile            | Pas de mega-menu : remplacé par accordéon dans l'overlay hamburger (voir section 4 — Mobile).                                                             |

### 5.4 Barre de recherche du header (état réduit)

L'input de recherche dans le header est volontairement compact : un trigger
visuel qui invite au clic, pas un champ pleinement fonctionnel.

| Aspect             | Spécification                                                                     |
| ------------------ | --------------------------------------------------------------------------------- |
| Largeur            | 240 px sur desktop, icône seule sur tablet `< md`                                 |
| Placeholder        | « Rechercher un jeu, un personnage, un joueur… » (i18n)                           |
| Icône              | Loupe `mdi:magnify` à gauche                                                      |
| Raccourci visible  | Badge `Ctrl K` à droite de l'input (desktop uniquement)                           |
| Comportement focus | Au clic / focus / `Ctrl K` → bascule en mode **overlay full-page** (voir 5.6)     |
| Saisie inline      | ❌ Aucune saisie ne se fait dans cet input réduit. Il sert uniquement de trigger. |

### 5.5 Sélecteur de langue

Le sélecteur de langue est intégré dans la zone droite du header, **entre la
barre de recherche et le dropdown utilisateur**. Il permet de basculer entre les
deux langues supportées (`fr` / `en`) à tout moment, depuis n'importe quelle
page.

#### Composant

Réutiliser le composant existant `LanguageSwitcher`
(`src/components/shared/LanguageSwitcher.tsx`) qui repose sur `next-intl` et
gère déjà la persistance de la langue + la préservation du chemin courant lors
du changement.

Une variante visuelle « header » est à ajouter pour l'aligner avec le style
éditorial (suppression du `backdrop-blur` éventuel, fond transparent ou
`bg-white/[0.05]` au hover, bordure `--editorial-line`).

#### Affichage

| Aspect            | Spécification                                                                                                                          |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Trigger           | Bouton compact avec icône `mdi:translate` + code de la langue active en uppercase mono (ex : `FR` / `EN`) + chevron `mdi:chevron-down` |
| Largeur           | `~64 px` (icône + 2 caractères + chevron). Sur mobile, icône seule (le code disparaît si `< sm`).                                      |
| Hauteur           | Identique au header search trigger pour aligner les éléments (40 px)                                                                   |
| Hover             | Fond `bg-white/[0.05]`, transition 200 ms                                                                                              |
| État ouvert       | Dropdown aligné à droite du trigger, largeur `~160 px`, fond `bg-[--editorial-bg-2]`, bordure `--editorial-line`, ombre subtile        |
| Items du dropdown | 1 ligne par langue : drapeau (emoji 🇫🇷 / 🇬🇧) + nom complet (« Français » / « English ») + check `mdi:check` à droite si langue active  |
| Langue active     | Mise en évidence par `bg-white/[0.05]` + check à droite                                                                                |

#### Comportement

| Aspect                   | Spécification                                                                                                                                                                                                                  |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Ouverture                | Clic sur le trigger. Animation fade + translate-y 4 px, 200 ms.                                                                                                                                                                |
| Sélection                | Au clic sur une langue, naviguer vers la même URL avec la nouvelle locale (gestion existante via `useLocaleManager` / `next-intl` router). Le dropdown se ferme.                                                               |
| Fermeture                | Clic en dehors, touche `Escape`, ou sélection d'une langue.                                                                                                                                                                    |
| Persistance              | Gérée par `next-intl` (cookie `NEXT_LOCALE`). Aucune logique custom à ajouter.                                                                                                                                                 |
| Préservation du contexte | La page courante doit être préservée. Si l'URL contient des params (filtres, search query), ils sont conservés. La query d'un overlay de recherche **n'est pas** persistée (cohérent avec la fermeture lors d'une navigation). |
| Accessibilité            | `aria-haspopup="listbox"`, `aria-expanded`, `role="listbox"` sur le menu, `role="option"` + `aria-selected` sur les items. Navigation clavier : `↓` / `↑` entre items, `Enter` valide, `Esc` ferme.                            |

#### Mobile

Sur mobile, le sélecteur de langue **n'est pas affiché dans le header**
(économie d'espace : seuls le logo, l'icône loupe et le hamburger sont
visibles). Il est accessible :

- Dans le menu hamburger, en bas de la liste de navigation (au-dessus du bouton
  de déconnexion / profil), avec le même composant `LanguageSwitcher` en
  variante « inline ».
- Aussi disponible dans la page `/settings` (déjà en place).

#### Migration depuis la sidebar actuelle

Le `LanguageSwitcher` est aujourd'hui placé dans le dropdown utilisateur de la
sidebar (cf. `docs/systems/navigation-sidebar.md`). Avec la refonte :

- ✅ Sortir le `LanguageSwitcher` du dropdown utilisateur et le **promouvoir**
  comme élément de header à part entière (visibilité accrue).
- ✅ Conserver la navigation préservée (URL + locale) telle qu'implémentée.
- ❌ Ne **pas** dupliquer : retirer l'entrée « Langue » du dropdown utilisateur
  pour éviter la redondance.

### 5.6 Overlay de recherche full-page

Au clic sur la barre de recherche (ou via `Ctrl+K` / `Cmd+K`), un overlay plein
écran s'ouvre. Toute la saisie et l'affichage des résultats se font dans cet
overlay.

#### Structure visuelle

```
┌────────────────────────────────────────────────────────────────────────┐
│ ╳ Fermer                                                          Esc  │
│                                                                        │
│   ┌──────────────────────────────────────────────────────────────┐    │
│   │ 🔍  Rechercher…                                               │    │
│   └──────────────────────────────────────────────────────────────┘    │
│                                                                        │
│   ── État vide ──                                                      │
│   • Recherches récentes (5 dernières, persistées en localStorage)      │
│   • Suggestions populaires (jeux trending, personnages du moment)      │
│                                                                        │
│   ── Résultats (après saisie) ──                                       │
│   ┌─ JEUX ─────────────────────────────────────────────────────┐      │
│   │  [🖼️] Cyberpunk 2077          PC, PS5, Xbox       2020   → │      │
│   │  [🖼️] The Witcher 3            PC, PS4, Switch     2015   → │      │
│   └────────────────────────────────────────────────────────────┘      │
│   ┌─ PERSONNAGES ──────────────────────────────────────────────┐      │
│   │  [🖼️] Geralt of Rivia          The Witcher                → │      │
│   └────────────────────────────────────────────────────────────┘      │
│   ┌─ JOUEURS GAMERS UNIVERSE ──────────────────────────────────┐      │
│   │  [🖼️] @darkennights             Active il y a 2h           → │      │
│   └────────────────────────────────────────────────────────────┘      │
│   ┌─ ÉQUIPES ESPORT ───────────────────────────────────────────┐      │
│   │  [🖼️] G2 Esports                LoL, CS2, Valorant         → │      │
│   └────────────────────────────────────────────────────────────┘      │
│   ┌─ JOUEURS PROS ─────────────────────────────────────────────┐      │
│   │  [🖼️] Caps                      G2 Esports — LoL           → │      │
│   └────────────────────────────────────────────────────────────┘      │
│   ┌─ COACHS ───────────────────────────────────────────────────┐      │
│   │  [🖼️] Coach Mendo               LoL — 5 ★                  → │      │
│   └────────────────────────────────────────────────────────────┘      │
│                                                                        │
│   ↑↓ Naviguer   ⏎ Ouvrir   Esc Fermer                                  │
└────────────────────────────────────────────────────────────────────────┘
```

#### Comportement

| Aspect              | Spécification                                                                                                                                      |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ouverture           | Trigger : clic sur l'input header, `Ctrl+K` / `Cmd+K`, ou bouton mobile dédié. Animation : fade-in + scale 98%→100%, 200 ms.                       |
| Backdrop            | `bg-[--editorial-bg]/95`, pas de blur (cohérence avec retrait glassmorphism). Couvre tout le viewport, par-dessus le header sticky.                |
| Position de l'input | Centré horizontalement, `max-w-2xl`, à `~120 px` du haut sur desktop, `~64 px` sur mobile.                                                         |
| Taille de l'input   | Hauteur 64 px, font display Tomorrow, taille `text-2xl` sur desktop / `text-xl` sur mobile.                                                        |
| Auto-focus          | L'input prend le focus à l'ouverture. Sur mobile, le clavier virtuel s'ouvre automatiquement.                                                      |
| Saisie              | Debounce 300 ms (réutilise le hook `useGlobalSearch` existant). Indicateur de chargement (spinner discret à droite de l'input) pendant la requête. |
| Fermeture           | Touche `Escape`, clic sur le bouton ╳, ou clic sur backdrop hors zone résultats. Reset de la query au close.                                       |
| Scroll              | Si les résultats dépassent la hauteur viewport, scroll interne de la zone résultats (l'input reste sticky en haut).                                |
| Persistance         | Recherches récentes stockées dans `localStorage` (clé `gu.search.recent`, max 5 entrées, dédupliquées).                                            |
| Accessibilité       | `role="dialog"`, `aria-modal="true"`, focus trap, `aria-live="polite"` sur la zone résultats pour annoncer le nombre de résultats.                 |

#### État vide (avant saisie)

Quand l'overlay s'ouvre sans query :

- **Recherches récentes** (si `localStorage` non vide) : liste cliquable avec
  icône horloge, croix pour supprimer une entrée individuelle, lien « Effacer
  tout » en bas.
- **Tendances** : 4-6 cartes compactes mixant jeux trending et personnages du
  moment (alimentées par les API `/api/games/trending` et un endpoint similaire
  pour personnages).

#### Résultats : groupement par type d'entité

Dès qu'une query ≥ 2 caractères est saisie, les résultats sont **toujours
groupés par type d'entité**, dans un ordre fixe et stable :

1. **Jeux** (locaux + IGDB fusionnés)
2. **Personnages**
3. **Joueurs Gamers Universe** (utilisateurs du site)
4. **Équipes esport**
5. **Joueurs pros**
6. **Coachs**

Règles d'affichage par groupe :

- Chaque groupe a un en-tête uppercase mono (`KickerLabel`) avec nom de la
  catégorie + compteur (ex: « JEUX · 12 »).
- Limite par groupe : **5 résultats** dans l'overlay (via `gamesLimit`,
  `charactersLimit`, etc.).
- Si > 5 résultats existent, lien « Voir tous les jeux pour "query" → » en bas
  du groupe, qui navigue vers la page listing avec la query pré-remplie.
- Un groupe **vide est masqué** (pas d'en-tête « JEUX (0) »).
- Si **tous les groupes sont vides** : message centré « Aucun résultat pour
  "query" » + suggestions (recherches populaires).

#### Ligne de résultat

Chaque ligne respecte un gabarit cohérent par type :

| Type          | Avatar               | Titre             | Sous-titre                             | Meta                  |
| ------------- | -------------------- | ----------------- | -------------------------------------- | --------------------- |
| Jeu           | Cover 40×56          | Nom + année       | Plateformes (3 max + « +N »)           | Note moyenne          |
| Personnage    | Portrait carré 48×48 | Nom               | Jeu d'origine                          | —                     |
| Joueur GU     | Avatar rond 40×40    | Pseudo            | Statut (en ligne / dernière connexion) | Badge si premium      |
| Équipe esport | Logo carré 48×48     | Nom de l'équipe   | Jeux pratiqués (3 max)                 | Pays                  |
| Joueur pro    | Portrait rond 40×40  | Pseudo + vrai nom | Équipe — Jeu                           | Rôle (top, mid, etc.) |
| Coach         | Avatar rond 40×40    | Pseudo            | Jeu coaché                             | Note ★ + tarif        |

Hover : fond `bg-white/[0.05]`, accent latéral gauche 2 px en gradient
`secondary → primary`. Ligne sélectionnée au clavier : même style + outline
focus.

#### Navigation clavier

| Touche              | Action                                                  |
| ------------------- | ------------------------------------------------------- |
| `↓`                 | Résultat suivant (traverse les groupes)                 |
| `↑`                 | Résultat précédent (traverse les groupes)               |
| `Tab` / `Shift+Tab` | Idem ↓ / ↑, mais reste dans le focus trap               |
| `⏎`                 | Ouvre la page de l'entité sélectionnée, ferme l'overlay |
| `⌘/Ctrl + ⏎`        | Ouvre dans un nouvel onglet                             |
| `Esc`               | Ferme l'overlay                                         |

### 5.7 API et services réutilisés

L'overlay s'appuie sur l'infrastructure de recherche existante (voir
`docs/systems/global-search.md`), **étendue** pour couvrir les nouveaux types :

- ✅ Réutiliser : `globalSearchService`, hook `useGlobalSearch`, route
  `/api/search/global`, types `GlobalSearchResponse` et items.
- ⚠️ **Étendre** : ajouter dans la réponse les groupes `teams` (équipes esport),
  `proPlayers` (joueurs pros) et `coaches`. Ajouter les paramètres `teamsLimit`,
  `proPlayersLimit`, `coachesLimit` (défaut 5).
- ⚠️ **Nouveaux types** dans `src/types/global-search.ts` :
  `GlobalSearchTeamItem`, `GlobalSearchProPlayerItem`, `GlobalSearchCoachItem`.
  Tous étendent un type discriminé `type: 'team' | 'proPlayer' | 'coach'`.
- ⚠️ **Nouveau service** : étendre `globalSearchService` pour interroger en
  parallèle les tables esport (`teams`, `pro_players`) et coaching
  (`coach_profiles`) via `Promise.allSettled` (tolérance aux pannes partielles
  préservée).

### 5.8 Composants à créer

Tous dans `src/components/layout/editorial/` (sauf composants déjà partagés) :

| Composant                 | Responsabilité                                                                                                                                                                       |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `EditorialMegaMenu`       | Conteneur du top header, orchestration des 3 entrées                                                                                                                                 |
| `MegaMenuTrigger`         | Bouton d'entrée avec underline néon actif                                                                                                                                            |
| `MegaMenuPanel`           | Panneau riche (sous-liens + featured cards)                                                                                                                                          |
| `MegaMenuFeaturedCard`    | Card image + titre dans la colonne droite                                                                                                                                            |
| `HeaderSearchTrigger`     | Input réduit du header, ouvre l'overlay                                                                                                                                              |
| `HeaderLanguageSwitcher`  | Variante « header » du `LanguageSwitcher` partagé : trigger compact (icône + code de langue + chevron) avec dropdown éditorial. Réutilise la logique de navigation locale existante. |
| `SearchOverlay`           | Overlay full-page (dialog)                                                                                                                                                           |
| `SearchOverlayInput`      | Input de saisie XL avec spinner                                                                                                                                                      |
| `SearchOverlayResults`    | Liste des groupes de résultats                                                                                                                                                       |
| `SearchOverlayGroup`      | En-tête + lignes d'un groupe                                                                                                                                                         |
| `SearchOverlayItem`       | Ligne générique (variantes par type)                                                                                                                                                 |
| `SearchOverlayEmptyState` | Recherches récentes + suggestions                                                                                                                                                    |
| `SearchRecentList`        | Liste des recherches récentes (`localStorage`)                                                                                                                                       |

### 5.9 i18n — clés à ajouter

Dans `src/messages/{fr,en}.json`, namespaces `header.megaMenu`,
`header.languageSwitcher` et `globalSearch` :

```json
{
  "header": {
    "megaMenu": {
      "games": {
        "label": "Jeux",
        "all": "Tous les jeux",
        "trending": "Tendances",
        "upcoming": "À venir",
        "byGenre": "Par genre",
        "byPlatform": "Par plateforme",
        "featuredTitle": "Trending now"
      },
      "characters": {
        "label": "Personnages",
        "all": "Tous les personnages",
        "favorites": "Mes favoris",
        "bySpecies": "Par espèce",
        "byGender": "Par genre",
        "featuredTitle": "Personnage du moment"
      },
      "players": {
        "label": "Joueurs",
        "all": "Joueurs Gamers Universe",
        "pros": "Joueurs pros",
        "teams": "Équipes esport",
        "coaches": "Coachs",
        "discussions": "Discussions",
        "featuredTitle": "Joueur en vue"
      }
    },
    "languageSwitcher": {
      "label": "Langue",
      "current": "Langue actuelle",
      "fr": "Français",
      "en": "English",
      "ariaLabel": "Changer de langue"
    }
  },
  "globalSearch": {
    "trigger": {
      "placeholder": "Rechercher un jeu, un personnage, un joueur…",
      "shortcut": "Ctrl K"
    },
    "overlay": {
      "title": "Recherche",
      "inputPlaceholder": "Rechercher…",
      "close": "Fermer",
      "recent": "Recherches récentes",
      "clearRecent": "Effacer tout",
      "trending": "Tendances",
      "noResults": "Aucun résultat pour « {query} »",
      "viewAll": "Voir tous les {category} pour « {query} »",
      "groups": {
        "games": "Jeux",
        "characters": "Personnages",
        "players": "Joueurs Gamers Universe",
        "teams": "Équipes esport",
        "proPlayers": "Joueurs pros",
        "coaches": "Coachs"
      },
      "hints": { "navigate": "Naviguer", "open": "Ouvrir", "close": "Fermer" }
    }
  }
}
```

Toutes les clés doivent être traduites en EN simultanément.

### 5.10 Performance et UX

- **Debounce** : 300 ms (déjà en place dans `useGlobalSearch`).
- **AbortController** : annulation automatique des requêtes obsolètes (déjà
  géré).
- **Skeletons** : afficher un squelette discret par groupe pendant le premier
  load. Ne pas faire clignoter les résultats lors du retyping.
- **Cache SWR** : la même query déjà fetchée est renvoyée immédiatement par le
  cache.
- **Préchargement** : au hover/focus du trigger header, précharger les bundles
  JS de l'overlay (`prefetch` Next/dynamic).
- **Tendances** : les cartes trending de l'état vide sont chargées une seule
  fois par session (cache mémoire, TTL 5 min).

### 5.11 Mobile

| Élément             | Comportement mobile                                                                                                                                    |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Top header          | Logo + icône loupe + bouton hamburger. Pas de mega-menu visible.                                                                                       |
| Mega-menu           | Replié dans l'overlay hamburger : 3 sections accordéon (Jeux, Personnages, Joueurs) listant les sous-liens. Pas de featured cards (économie d'espace). |
| Barre de recherche  | Icône loupe seule dans le header, ouvre directement l'overlay full-page.                                                                               |
| Sélecteur de langue | **Pas dans le header** sur mobile. Disponible dans l'overlay hamburger (en bas de la liste) et dans `/settings`.                                       |
| Overlay full-page   | Couvre 100% du viewport, input en haut (sticky), zone résultats en scroll natif. Bouton ╳ en haut à droite.                                            |
| Touch targets       | Toutes les lignes de résultat ≥ 56 px de haut sur mobile.                                                                                              |
| Clavier virtuel     | Pas de bouton « Recherche » sur le clavier (un input simple suffit, la recherche est live).                                                            |

## 6. Stratégie de migration

### Approche : page par page (option B)

Chaque page est migrée indépendamment. Pendant la durée du projet, la branche
`design/editorial-refonte` peut contenir un mix de pages anciennes et nouvelles.
Pas grave : le merge final unifie tout.

### Règle absolue

❌ **Aucun merge intermédiaire vers `dev`**. La branche
`design/editorial-refonte` reste indépendante jusqu'au merge final, quand toutes
les pages sont migrées et validées.

### Synchronisation avec dev

Périodiquement (1×/semaine) :
`git checkout design/editorial-refonte && git merge dev` pour récupérer les
fixes/features de dev (sécurité, perf, services métier). Le code refondu doit
toujours fonctionner avec les dernières API.

### Phases

| Phase                                 | Contenu                                                                                         | Estimation   |
| ------------------------------------- | ----------------------------------------------------------------------------------------------- | ------------ |
| **0 — Foundation**                    | Design tokens, fonts, layout shell global (mega-menu + rail + sub-sidebar), composants partagés | ~1.5 semaine |
| **1 — Pages prioritaires**            | Home, Games listing, Game detail                                                                | ~2 semaines  |
| **2 — Espaces utilisateur**           | Player detail, Library, Collections, Profile, Settings, Favorites                               | ~1.5 semaine |
| **3 — Esport**                        | Calendar, Live, Tournaments, Results, Teams, Players, Predictions, Fantasy                      | ~2 semaines  |
| **4 — Community / Coaching / Divers** | Characters listing/detail, Players listing, Discussions, Coaching, Trending, Upcoming, Auth     | ~1.5 semaine |
| **5 — Finalisation**                  | Tests transverses, perf, accessibilité, mise à jour docs, merge final                           | ~1 semaine   |

**Total estimé** : ~10 semaines de travail à temps partiel (estimations
indicatives, à ajuster).

## 7. Pages à refondre

### Phase 1 — Pages prioritaires

- [x] `/` — Home
- [x] `/games` — Games listing
- [x] `/games/[slug]` — Game detail

### Phase 2 — Espaces utilisateur

- [x] `/players/[id]` — Player profile
- [x] `/library` — Library
- [x] `/collections` — Collections list
- [x] `/collections/[slug]` — Collection detail
- [x] `/profile` — My profile (redirige vers `/players/[id]`)
- [x] `/settings` — Settings (onglet du profil joueur)
- [x] `/favorites/characters` — Favorite characters
- [x] `/dashboard` — Dashboard (si encore actif)

### Phase 3 — Esport

- [ ] `/esport/calendar` — Calendar
- [ ] `/esport/calendar/[date]` — Day detail
- [ ] `/esport/live` — Live matches
- [ ] `/esport/tournaments` — Tournaments listing
- [ ] `/esport/results` — Results
- [ ] `/esport/teams` — Teams listing
- [ ] `/esport/teams/[id]` — Team detail
- [ ] `/esport/players` — Pro players listing
- [ ] `/esport/players/[id]` — Pro player detail
- [ ] `/esport/predictions` — Predictions
- [ ] `/esport/fantasy` — Fantasy

### Phase 4 — Community / Coaching / Divers

- [ ] `/characters` — Characters listing
- [ ] `/characters/[slug]` — Character detail
- [ ] `/players` — Players listing
- [ ] `/discussions` — Discussions
- [ ] `/coaching` — Coaching hub
- [ ] `/coaching/sessions` — My sessions
- [ ] `/coaching/settings` — Coach settings
- [ ] `/coaching/[username]` — Coach profile
- [ ] `/trending` — Trending
- [ ] `/upcoming` — Upcoming
- [ ] `/posts/tags/[tag]` — Posts by tag
- [ ] `/auth` — Sign in
- [ ] `/auth/forgot-password` — Forgot password
- [ ] `/auth/reset-password` — Reset password

### Out of scope

- ❌ `/admin/*` — Admin (priorité basse, à traiter séparément plus tard)

## 8. Definition of Done par page

Pour qu'une page soit considérée comme migrée, **toutes** les cases suivantes
doivent être cochées :

### Visuel

- [ ] Layout G appliqué (mega-menu + rail + sub-sidebar selon contexte)
- [ ] Direction éditoriale respectée (kicker, typo display, numérotation)
- [ ] Couleur d'accent dynamique branchée (si page liée à un jeu/persona avec
      `accentColor`)
- [ ] Glassmorphism retiré : aucune classe `.glass-*` ni `backdrop-blur-*` sur
      les composants de la page (voir section 3)
- [ ] Cohérence visuelle avec les autres pages déjà migrées

### Fonctionnel

- [ ] Toutes les données affichées dans l'ancienne page sont présentes
- [ ] Comportements préservés (filtres, tri, pagination, CRUD, etc.)
- [ ] API / hooks / services existants utilisés sans modification
- [ ] Performance préservée (Lighthouse score ≥ ancien)

### Qualité

- [ ] Mobile-first : testé à 375px, 768px, 1280px
- [ ] Touch targets ≥ 44px sur mobile
- [ ] Dark mode supporté
- [ ] i18n FR + EN (clés ajoutées dans les 2 fichiers)
- [ ] Accessibilité : contraste WCAG AA, navigation clavier, ARIA labels

### Tests

- [ ] Tests obsolètes supprimés : tout test ciblant un composant/hook/service
      supprimé ou déplacé pendant la migration de la page a été retiré (fichier
      ou `it()` individuel), avec ses mocks/fixtures orphelins
- [ ] Tests unitaires pour les nouveaux composants
- [ ] Pas de régression sur les tests existants
- [ ] `bun run lint` et `bun run type-check` passent
- [ ] `bun run build` passe

### Documentation

- [ ] Mise à jour `docs/features/...` si la fonctionnalité est documentée
- [ ] Capture d'écran avant/après ajoutée à la PR de la page

## 9. Risques et points d'attention

### Risque 1 — Branche qui dérive trop de dev

**Mitigation** : merger `dev` dans `design/editorial-refonte` chaque semaine.
Résoudre les conflits au fil de l'eau plutôt qu'à la fin.

### Risque 2 — Décalage UX entre pages migrées et pages anciennes

**Mitigation** : on accepte ce décalage pendant la durée du projet. La règle
"jamais de merge intermédiaire" garantit que dev/main reste cohérent. On publie
une seule fois quand tout est prêt.

### Risque 3 — Régression de performance

**Mitigation** : Tomorrow chargé via `next/font` (pas Google Fonts CDN). Pas
d'images ajoutées, on réutilise les médias existants. Lazy-loading préservé.

### Risque 4 — Régression sur les tests

**Mitigation** : on lance lint + type-check + tests ciblés à chaque PR. Les
tests existants doivent rester verts. Les nouveaux composants ont leurs tests.

### Risque 5 — Composants admin qui partagent du code avec les pages publiques

L'admin utilise les classes `.glass-*` qu'on retire. Mitigation :

- L'admin (out of scope) garde `DashboardLayout` et continuera d'utiliser les
  classes `.glass-*` tant qu'on ne refait pas l'admin.
- **On déprécie** les `.glass-*` dans `globals.css` mais on ne les supprime pas
  tout de suite — leur retrait définitif sera fait après la refonte de l'admin
  (autre projet).
- Tout nouveau composant éditorial **ne doit pas** utiliser `backdrop-blur` ni
  les classes `.glass-*`.

### Risque 6 — Mobile cassé

**Mitigation** : la check mobile-first est dans la DoD de chaque page. Test
systématique à 375px.

### Risque 7 — Accessibilité dégradée

**Mitigation** : DoD inclut contraste WCAG AA, focus visible, ARIA. Le mega-menu
et le command palette doivent être navigables au clavier.

## 10. Découpage en issues

### Organisation GitHub

- **Milestone** : `Editorial refonte`
- **Label unique** : `design`
- **Issue épique** : tracking de toutes les autres issues sous forme de
  checklist
- **Branche cible** : toutes les PRs vont sur `design/editorial-refonte` (jamais
  sur dev directement)

### Phase 0 — Foundation (issues `[F0-XX]`)

| #      | Titre                                                             | Description                                                                                                                                                                                                                                                                                                                                                                                         |
| ------ | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F0-01  | Design tokens : ajouter les variables éditoriales                 | Ajouter `--editorial-bg`, `--editorial-line`, `--editorial-muted` dans `globals.css`. Conserver toutes les variables existantes.                                                                                                                                                                                                                                                                    |
| F0-02  | Charger la police Tomorrow via next/font                          | Configurer `next/font/google` pour Tomorrow, exposer la variable `--font-display`.                                                                                                                                                                                                                                                                                                                  |
| F0-03  | Promouvoir SpotlightCard du POC vers shared                       | Déplacer `src/components/design-poc/SpotlightCard.tsx` vers `src/components/shared/SpotlightCard.tsx`, ajouter tests unitaires.                                                                                                                                                                                                                                                                     |
| F0-04  | Promouvoir EditorialHero, Marquee, KickerLabel, StatXL            | Migrer ces composants depuis `design-poc/` vers `shared/`, durcir API, ajouter tests.                                                                                                                                                                                                                                                                                                               |
| F0-05  | Implémenter le système d'accent dynamique réutilisable            | `DynamicAccent` + `palettes.ts` + algorithme `paletteFromHex` (depuis le POC). Hook `useGameAccent` pour les pages contenu.                                                                                                                                                                                                                                                                         |
| F0-06  | Layout shell : mega-menu + rail + sub-sidebar                     | Créer `src/components/layout/editorial/EditorialLayout.tsx` qui remplace `DashboardLayout` sur les pages publiques refondues. Inclut MegaMenu, Rail, SubSidebar.                                                                                                                                                                                                                                    |
| F0-07  | Mega-menu : 3 entrées + featured panels                           | Composant `EditorialMegaMenu` avec **3 entrées** Jeux / Personnages / Joueurs (ce dernier regroupe joueurs GU, joueurs pros, équipes esport, coachs). Panels riches : sous-liens à gauche + featured cards à droite. Voir spec détaillée section 5.1 à 5.3.                                                                                                                                         |
| F0-07b | Header search trigger (input réduit)                              | Composant `HeaderSearchTrigger` placé à droite du header, sert uniquement de trigger (pas de saisie inline). Ouvre l'overlay full-page au clic, focus, ou raccourci `Ctrl K` / `Cmd K`. Affiche un badge raccourci à droite. Voir spec détaillée section 5.4.                                                                                                                                       |
| F0-07c | SearchOverlay full-page                                           | Overlay plein viewport (`role="dialog"`, focus trap, `Esc` ferme) avec input XL, état vide (recherches récentes + tendances) et résultats groupés par type d'entité : **Jeux, Personnages, Joueurs GU, Équipes esport, Joueurs pros, Coachs**. Réutilise `useGlobalSearch`. Persistance des recherches récentes via `localStorage` (max 5). Voir spec détaillée section 5.6.                        |
| F0-07d | Étendre `globalSearchService` aux entités esport et coaching      | Ajouter dans `GlobalSearchResponse` les groupes `teams`, `proPlayers`, `coaches`. Ajouter les types `GlobalSearchTeamItem`, `GlobalSearchProPlayerItem`, `GlobalSearchCoachItem` dans `src/types/global-search.ts`. Étendre la route `/api/search/global` avec les paramètres `teamsLimit`, `proPlayersLimit`, `coachesLimit`. Tolérance aux pannes via `Promise.allSettled`. Tests property-based. |
| F0-07e | Header language switcher                                          | Composant `HeaderLanguageSwitcher` dans la zone droite du header (entre search et user dropdown). Réutilise le `LanguageSwitcher` partagé avec une variante visuelle « header » (trigger compact icône + code + chevron, dropdown éditorial). Retirer la duplication dans le dropdown utilisateur. Sur mobile, déplacer dans l'overlay hamburger. Voir spec détaillée section 5.5.                  |
| F0-08  | Rail vertical 56px persistant                                     | Composant `EditorialRail` avec icônes des 5 espaces, indicateur actif basé sur l'URL.                                                                                                                                                                                                                                                                                                               |
| F0-09  | Sub-sidebar toggle avec persistance localStorage                  | Composant `EditorialSubSidebar` qui slide-in/out, persiste l'espace ouvert.                                                                                                                                                                                                                                                                                                                         |
| F0-10  | Mobile : hamburger overlay full-screen                            | Variante mobile du layout (rail caché, mega-menu = liste expandable, sub-sidebar = section).                                                                                                                                                                                                                                                                                                        |
| F0-11  | Setup i18n des nouveaux composants                                | Ajouter les clés FR/EN pour mega-menu, rail, sub-sidebar, search input et language switcher (voir section 5.9).                                                                                                                                                                                                                                                                                     |
| F0-12  | Documentation des composants éditoriaux                           | `docs/design/editorial-components.md` avec API et exemples.                                                                                                                                                                                                                                                                                                                                         |
| F0-13  | Retirer le glassmorphism du POC promu et déprécier les `.glass-*` | Quand on migre les composants `design-poc/*` vers `shared/`, retirer toutes les occurrences de `backdrop-blur-*`. Marquer les classes `.glass-*` comme dépréciées dans `globals.css` (commentaire + interdiction d'usage dans les nouveaux composants).                                                                                                                                             |
| F0-14  | Découper `globals.css` en modules CSS thématiques                 | `src/app/globals.css` est devenu illisible (3613 lignes). Le découper en modules sous `src/app/styles/**` (animations, neon, glass-deprecated, editorial/\*). `globals.css` ne garde que les imports Tailwind, le bloc `@theme` et `@layer base`. Documenter la convention via steering + `docs/setup/styles-organization.md`.                                                                      |

### Phase 1 — Pages prioritaires

| #     | Titre                                          |
| ----- | ---------------------------------------------- |
| P1-01 | Refondre la page Home (`/`)                    |
| P1-02 | Refondre la page Games listing (`/games`)      |
| P1-03 | Refondre la page Game detail (`/games/[slug]`) |

### Phase 2 — Espaces utilisateur

| #     | Titre                                                  |
| ----- | ------------------------------------------------------ |
| P2-01 | Refondre Player detail (`/players/[id]`)               |
| P2-02 | Refondre Library (`/library`)                          |
| P2-03 | Refondre Collections listing (`/collections`)          |
| P2-04 | Refondre Collection detail (`/collections/[slug]`)     |
| P2-05 | Refondre Profile (`/profile`)                          |
| P2-06 | Refondre Settings (`/settings`)                        |
| P2-07 | Refondre Favorite characters (`/favorites/characters`) |
| P2-08 | Refondre Dashboard si actif (`/dashboard`)             |

### Phase 3 — Esport

| #     | Titre                                                                                |
| ----- | ------------------------------------------------------------------------------------ |
| P3-01 | Refondre Esport Calendar (`/esport/calendar` + `/esport/calendar/[date]`)            |
| P3-02 | Refondre Esport Live (`/esport/live`)                                                |
| P3-03 | Refondre Esport Tournaments (`/esport/tournaments`)                                  |
| P3-04 | Refondre Esport Results (`/esport/results`)                                          |
| P3-05 | Refondre Esport Teams listing + detail (`/esport/teams`, `/esport/teams/[id]`)       |
| P3-06 | Refondre Esport Players listing + detail (`/esport/players`, `/esport/players/[id]`) |
| P3-07 | Refondre Esport Predictions (`/esport/predictions`)                                  |
| P3-08 | Refondre Esport Fantasy (`/esport/fantasy`)                                          |

### Phase 4 — Community / Coaching / Divers

| #     | Titre                                                                          |
| ----- | ------------------------------------------------------------------------------ |
| P4-01 | Refondre Characters listing (`/characters`)                                    |
| P4-02 | Refondre Character detail (`/characters/[slug]`)                               |
| P4-03 | Refondre Players listing (`/players`)                                          |
| P4-04 | Refondre Discussions (`/discussions`)                                          |
| P4-05 | Refondre Coaching hub (`/coaching`)                                            |
| P4-06 | Refondre Coaching sessions (`/coaching/sessions`)                              |
| P4-07 | Refondre Coaching settings (`/coaching/settings`)                              |
| P4-08 | Refondre Coach profile (`/coaching/[username]`)                                |
| P4-09 | Refondre Trending (`/trending`)                                                |
| P4-10 | Refondre Upcoming (`/upcoming`)                                                |
| P4-11 | Refondre Posts by tag (`/posts/tags/[tag]`)                                    |
| P4-12 | Refondre Auth pages (`/auth`, `/auth/forgot-password`, `/auth/reset-password`) |

### Phase 5 — Finalisation

| #     | Titre                                                                     |
| ----- | ------------------------------------------------------------------------- |
| P5-01 | Audit accessibilité complet (WCAG AA)                                     |
| P5-02 | Audit performance Lighthouse sur toutes les pages migrées                 |
| P5-03 | Tests E2E sur les principaux parcours (login → home → game → library)     |
| P5-04 | Mise à jour finale de `docs/setup/development.md` (mention de la refonte) |
| P5-05 | Préparer la PR finale `design/editorial-refonte` → `dev`                  |
| P5-06 | Plan de communication / changelog utilisateur                             |

### Issue épique

Une issue **`[EPIC] Editorial refonte`** sert de point d'entrée. Sa description
liste toutes les phases avec checklist liée aux issues détaillées. Elle reste
ouverte jusqu'au merge final.

---

## Annexe — Comment travailler au quotidien

### Sur quelle branche je commit ?

**Toujours** sur `design/editorial-refonte`. Sous-branches feature optionnelles
si la PR est volumineuse, mais base = `design/editorial-refonte`.

### Comment je teste ?

```bash
git checkout design/editorial-refonte
git pull
bun run dev
```

### Comment je crée une PR ?

PR de la sous-branche → `design/editorial-refonte`. Pas vers `dev`. Reviewer
peut être soi-même tant qu'on est seul, mais lint + type-check + build doivent
passer.

### Quand est-ce qu'on push vers dev ?

**Une seule fois, à la toute fin du projet**, quand toutes les phases sont
terminées et la DoD respectée pour chaque page. Une seule grosse PR
`design/editorial-refonte` → `dev`.

### Capture d'écran avant/après

Pour chaque PR de page, joindre une capture avant (vieux design) + après
(nouveau design) pour faciliter la review et constituer un historique visuel.
