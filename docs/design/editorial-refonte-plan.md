# Editorial refonte — Plan complet

> **Statut** : plan d'exécution. Document de référence pour le suivi de la refonte.
>
> **Branche** : `design/editorial-refonte` — toute la refonte vit ici jusqu'à un
> merge complet sur `dev` une fois 100 % terminée. **Aucun merge intermédiaire**.

## Sommaire

1. [Contexte et motivation](#1-contexte-et-motivation)
2. [Périmètre](#2-périmètre)
3. [Direction artistique](#3-direction-artistique)
4. [Layout retenu](#4-layout-retenu)
5. [Stratégie de migration](#5-stratégie-de-migration)
6. [Pages à refondre](#6-pages-à-refondre)
7. [Definition of Done par page](#7-definition-of-done-par-page)
8. [Risques et points d'attention](#8-risques-et-points-dattention)
9. [Découpage en issues](#9-découpage-en-issues)

---

## 1. Contexte et motivation

L'application Gamers Universe utilise actuellement un design glassmorphism
sur fond marine. Le POC `/design-poc/*` a exploré une direction nouvelle,
inspirée du thème **Imba** (éditorial dark, typo display large, accent magenta,
mise en page magazine) tout en gardant la palette de couleurs du site.

Ce document acte la décision d'adopter cette direction sur l'ensemble de l'app
**hors admin**, et planifie la migration page par page.

## 2. Périmètre

### In scope

| Aspect | Décision |
|---|---|
| Layout / chrome (sidebar, header) | ✅ Refonte complète, layout G adopté |
| Système de couleurs (palette) | ✅ Conservation de la palette marine actuelle |
| Typographie | ✅ Ajout de **Tomorrow** pour les titres display, conservation de **Geist** pour le corps |
| Composants UI primitifs (Button, Input, Card…) | ✅ Ajustements ponctuels pour intégrer les nouveaux patterns |
| Glassmorphism | ❌ **Retrait du `backdrop-blur` partout**. Les transparences blanches très légères (2-5%) sur les cards/badges restent autorisées (ce ne sont pas du glassmorphism stricto sensu, juste de la hiérarchie visuelle sur fond sombre). Voir détails section 3. |
| Pages publiques | ✅ Toutes |
| Pages auth | ✅ Refonte légère (cohérence visuelle) |

### Out of scope

| Aspect | Raison |
|---|---|
| Pages admin (`/admin/*`) | Layout dashboard actuel conservé, refonte non prioritaire |
| Email templates, OG images, favicon | Mini-projet à part |
| Refonte fonctionnelle (nouveaux features) | Cette refonte est purement visuelle/UX |
| Migration des API / hooks / services | Aucun changement de logique métier |

## 3. Direction artistique

### Inspiration

Thème **Imba (Themerex)**. Trois piliers :

1. **Éditorial** : layouts magazine, typo display généreuse, kickers UPPERCASE
   mono, numérotation 01/02/03, gros guillemets pour les citations.
2. **Immersion** : photos plein cadre, scanlines subtiles, glow néon contrôlé.
3. **Cohérence chromatique** : palette d'accent qui s'adapte à la couleur
   dominante du jeu/personnage (déjà en place via `accentColor` en BDD).

### Design tokens — couleurs

La palette **marine actuelle est conservée** (primary, secondary, accent
définis dans `globals.css`). On y ajoute :

```css
/* Fond éditorial dark — version "contenu immersif" */
--editorial-bg: #120821;       /* aubergine sombre */
--editorial-bg-2: #1a0f2e;
--editorial-bg-3: #251745;
--editorial-line: rgba(255, 255, 255, 0.08);
--editorial-muted: #a89dbf;
```

Les variables `--color-palette-primary-*`, `--color-palette-secondary-*` et
`--color-palette-accent-*` ne changent pas.

### Design tokens — typographie

```css
--font-display: "Tomorrow", system-ui, sans-serif;  /* nouveau */
--font-sans: "Geist", system-ui, sans-serif;        /* existant */
--font-mono: "Geist Mono", ui-monospace, monospace; /* existant */
```

Tomorrow chargé via `next/font` (pas via `@import` Google Fonts comme dans le
POC, pour la perf).

### Patterns réutilisables

| Pattern | Usage |
|---|---|
| `EditorialHero` | Hero plein cadre avec image inline dans le titre |
| `SpotlightCard` | Card avec halo lumineux qui suit le curseur |
| `Bento` | Grilles asymétriques avec carte XL + cartes compactes |
| `KickerLabel` | UPPERCASE mono espacé pour les sur-titres |
| `NumberedSection` | Sections numérotées 01/02/03 |
| `Marquee` | Texte défilant avec mascotte/icône inline |
| `StatXL` | Chiffres XL sans décoration |
| `EditorialCard` | Card full-bleed image + footer arrow circulaire |

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
- ✅ Les dégradés sombres au-dessus d'images plein cadre (Hero), qui ne sont
  pas du blur mais de simples dégradés vers la couleur de fond.

**Surfaces opaques** :

Les sidebars (rail 56px, sub-sidebar 220px), le top header (mega-menu) et la
sidebar `--editorial-bg-2` (`#1a0f2e`) sont **plein opaques**, sans
`backdrop-blur`. Si un effet de séparation est nécessaire au-dessus de
l'image hero d'une page game detail, on utilise un dégradé classique vers
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

- **Mega-menu top, full width, sticky** : 5 catégories qui ouvrent au hover
  un panel riche avec sous-liens à gauche et featured cards à droite. Input
  search visible (pas de Cmd+K). Avatar + dropdown utilisateur à droite.
- **Rail gauche 56px, toujours visible** : 5 icônes des grands espaces
  (Games, Esport, Library, Community, Coaching). L'icône active reflète
  l'espace courant via l'URL.
- **Sub-sidebar 220px, toggle** : fermée par défaut. Clic sur une icône
  rail = ouverture de la sub-sidebar pour cet espace, listant les sous-pages.
  Re-clic = fermeture. État persistant via `localStorage`.

### Mobile

- Mega-menu remplacé par un header simple + bouton hamburger
- Rail caché, ouvert via overlay full-screen au tap hamburger
- Sub-sidebar dans le même overlay, accessible via tab/swipe

### Admin

L'admin garde son layout actuel (`DashboardLayout`). La nouvelle nav s'applique
uniquement aux pages hors `/admin/*`.

## 5. Stratégie de migration

### Approche : page par page (option B)

Chaque page est migrée indépendamment. Pendant la durée du projet, la branche
`design/editorial-refonte` peut contenir un mix de pages anciennes et
nouvelles. Pas grave : le merge final unifie tout.

### Règle absolue

❌ **Aucun merge intermédiaire vers `dev`**. La branche
`design/editorial-refonte` reste indépendante jusqu'au merge final, quand
toutes les pages sont migrées et validées.

### Synchronisation avec dev

Périodiquement (1×/semaine) : `git checkout design/editorial-refonte && git
merge dev` pour récupérer les fixes/features de dev (sécurité, perf, services
métier). Le code refondu doit toujours fonctionner avec les dernières API.

### Phases

| Phase | Contenu | Estimation |
|---|---|---|
| **0 — Foundation** | Design tokens, fonts, layout shell global (mega-menu + rail + sub-sidebar), composants partagés | ~1.5 semaine |
| **1 — Pages prioritaires** | Home, Games listing, Game detail | ~2 semaines |
| **2 — Espaces utilisateur** | Player detail, Library, Collections, Profile, Settings, Favorites | ~1.5 semaine |
| **3 — Esport** | Calendar, Live, Tournaments, Results, Teams, Players, Predictions, Fantasy | ~2 semaines |
| **4 — Community / Coaching / Divers** | Characters listing/detail, Players listing, Discussions, Coaching, Trending, Upcoming, Auth | ~1.5 semaine |
| **5 — Finalisation** | Tests transverses, perf, accessibilité, mise à jour docs, merge final | ~1 semaine |

**Total estimé** : ~10 semaines de travail à temps partiel (estimations
indicatives, à ajuster).

## 6. Pages à refondre

### Phase 1 — Pages prioritaires

- [ ] `/` — Home
- [ ] `/games` — Games listing
- [ ] `/games/[slug]` — Game detail

### Phase 2 — Espaces utilisateur

- [ ] `/players/[id]` — Player profile
- [ ] `/library` — Library
- [ ] `/collections` — Collections list
- [ ] `/collections/[slug]` — Collection detail
- [ ] `/profile` — My profile
- [ ] `/settings` — Settings
- [ ] `/favorites/characters` — Favorite characters
- [ ] `/dashboard` — Dashboard (si encore actif)

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

## 7. Definition of Done par page

Pour qu'une page soit considérée comme migrée, **toutes** les cases
suivantes doivent être cochées :

### Visuel

- [ ] Layout G appliqué (mega-menu + rail + sub-sidebar selon contexte)
- [ ] Direction éditoriale respectée (kicker, typo display, numérotation)
- [ ] Couleur d'accent dynamique branchée (si page liée à un jeu/persona avec
      `accentColor`)
- [ ] Glassmorphism conservé sur les composants utilitaires
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

- [ ] Tests unitaires pour les nouveaux composants
- [ ] Pas de régression sur les tests existants
- [ ] `bun run lint` et `bun run type-check` passent
- [ ] `bun run build` passe

### Documentation

- [ ] Mise à jour `docs/features/...` si la fonctionnalité est documentée
- [ ] Capture d'écran avant/après ajoutée à la PR de la page

## 8. Risques et points d'attention

### Risque 1 — Branche qui dérive trop de dev

**Mitigation** : merger `dev` dans `design/editorial-refonte` chaque semaine.
Résoudre les conflits au fil de l'eau plutôt qu'à la fin.

### Risque 2 — Décalage UX entre pages migrées et pages anciennes

**Mitigation** : on accepte ce décalage pendant la durée du projet. La règle
"jamais de merge intermédiaire" garantit que dev/main reste cohérent. On
publie une seule fois quand tout est prêt.

### Risque 3 — Régression de performance

**Mitigation** : Tomorrow chargé via `next/font` (pas Google Fonts CDN). Pas
d'images ajoutées, on réutilise les médias existants. Lazy-loading préservé.

### Risque 4 — Régression sur les tests

**Mitigation** : on lance lint + type-check + tests ciblés à chaque PR. Les
tests existants doivent rester verts. Les nouveaux composants ont leurs
tests.

### Risque 5 — Composants admin qui partagent du code avec les pages publiques

L'admin utilise les classes `.glass-*` qu'on retire. Mitigation :

- L'admin (out of scope) garde `DashboardLayout` et continuera d'utiliser les
  classes `.glass-*` tant qu'on ne refait pas l'admin.
- **On déprécie** les `.glass-*` dans `globals.css` mais on ne les supprime
  pas tout de suite — leur retrait définitif sera fait après la refonte de
  l'admin (autre projet).
- Tout nouveau composant éditorial **ne doit pas** utiliser `backdrop-blur` ni
  les classes `.glass-*`.

### Risque 6 — Mobile cassé

**Mitigation** : la check mobile-first est dans la DoD de chaque page. Test
systématique à 375px.

### Risque 7 — Accessibilité dégradée

**Mitigation** : DoD inclut contraste WCAG AA, focus visible, ARIA. Le
mega-menu et le command palette doivent être navigables au clavier.

## 9. Découpage en issues

### Organisation GitHub

- **Milestone** : `Editorial refonte`
- **Label unique** : `design`
- **Issue épique** : tracking de toutes les autres issues sous forme de
  checklist
- **Branche cible** : toutes les PRs vont sur `design/editorial-refonte`
  (jamais sur dev directement)

### Phase 0 — Foundation (issues `[F0-XX]`)

| # | Titre | Description |
|---|---|---|
| F0-01 | Design tokens : ajouter les variables éditoriales | Ajouter `--editorial-bg`, `--editorial-line`, `--editorial-muted` dans `globals.css`. Conserver toutes les variables existantes. |
| F0-02 | Charger la police Tomorrow via next/font | Configurer `next/font/google` pour Tomorrow, exposer la variable `--font-display`. |
| F0-03 | Promouvoir SpotlightCard du POC vers shared | Déplacer `src/components/design-poc/SpotlightCard.tsx` vers `src/components/shared/SpotlightCard.tsx`, ajouter tests unitaires. |
| F0-04 | Promouvoir EditorialHero, Marquee, KickerLabel, StatXL | Migrer ces composants depuis `design-poc/` vers `shared/`, durcir API, ajouter tests. |
| F0-05 | Implémenter le système d'accent dynamique réutilisable | `DynamicAccent` + `palettes.ts` + algorithme `paletteFromHex` (depuis le POC). Hook `useGameAccent` pour les pages contenu. |
| F0-06 | Layout shell : mega-menu + rail + sub-sidebar | Créer `src/components/layout/editorial/EditorialLayout.tsx` qui remplace `DashboardLayout` sur les pages publiques refondues. Inclut MegaMenu, Rail, SubSidebar. |
| F0-07 | Mega-menu : nav + featured panels | Composant `EditorialMegaMenu` avec catégories Games/Characters/Esport/Community/Library, panels riches, search input. |
| F0-08 | Rail vertical 56px persistant | Composant `EditorialRail` avec icônes des 5 espaces, indicateur actif basé sur l'URL. |
| F0-09 | Sub-sidebar toggle avec persistance localStorage | Composant `EditorialSubSidebar` qui slide-in/out, persiste l'espace ouvert. |
| F0-10 | Mobile : hamburger overlay full-screen | Variante mobile du layout (rail caché, mega-menu = liste expandable, sub-sidebar = section). |
| F0-11 | Setup i18n des nouveaux composants | Ajouter les clés FR/EN pour mega-menu, rail, sub-sidebar, search input. |
| F0-12 | Documentation des composants éditoriaux | `docs/design/editorial-components.md` avec API et exemples. |
| F0-13 | Retirer le glassmorphism du POC promu et déprécier les `.glass-*` | Quand on migre les composants `design-poc/*` vers `shared/`, retirer toutes les occurrences de `backdrop-blur-*`. Marquer les classes `.glass-*` comme dépréciées dans `globals.css` (commentaire + interdiction d'usage dans les nouveaux composants). |

### Phase 1 — Pages prioritaires

| # | Titre |
|---|---|
| P1-01 | Refondre la page Home (`/`) |
| P1-02 | Refondre la page Games listing (`/games`) |
| P1-03 | Refondre la page Game detail (`/games/[slug]`) |

### Phase 2 — Espaces utilisateur

| # | Titre |
|---|---|
| P2-01 | Refondre Player detail (`/players/[id]`) |
| P2-02 | Refondre Library (`/library`) |
| P2-03 | Refondre Collections listing (`/collections`) |
| P2-04 | Refondre Collection detail (`/collections/[slug]`) |
| P2-05 | Refondre Profile (`/profile`) |
| P2-06 | Refondre Settings (`/settings`) |
| P2-07 | Refondre Favorite characters (`/favorites/characters`) |
| P2-08 | Refondre Dashboard si actif (`/dashboard`) |

### Phase 3 — Esport

| # | Titre |
|---|---|
| P3-01 | Refondre Esport Calendar (`/esport/calendar` + `/esport/calendar/[date]`) |
| P3-02 | Refondre Esport Live (`/esport/live`) |
| P3-03 | Refondre Esport Tournaments (`/esport/tournaments`) |
| P3-04 | Refondre Esport Results (`/esport/results`) |
| P3-05 | Refondre Esport Teams listing + detail (`/esport/teams`, `/esport/teams/[id]`) |
| P3-06 | Refondre Esport Players listing + detail (`/esport/players`, `/esport/players/[id]`) |
| P3-07 | Refondre Esport Predictions (`/esport/predictions`) |
| P3-08 | Refondre Esport Fantasy (`/esport/fantasy`) |

### Phase 4 — Community / Coaching / Divers

| # | Titre |
|---|---|
| P4-01 | Refondre Characters listing (`/characters`) |
| P4-02 | Refondre Character detail (`/characters/[slug]`) |
| P4-03 | Refondre Players listing (`/players`) |
| P4-04 | Refondre Discussions (`/discussions`) |
| P4-05 | Refondre Coaching hub (`/coaching`) |
| P4-06 | Refondre Coaching sessions (`/coaching/sessions`) |
| P4-07 | Refondre Coaching settings (`/coaching/settings`) |
| P4-08 | Refondre Coach profile (`/coaching/[username]`) |
| P4-09 | Refondre Trending (`/trending`) |
| P4-10 | Refondre Upcoming (`/upcoming`) |
| P4-11 | Refondre Posts by tag (`/posts/tags/[tag]`) |
| P4-12 | Refondre Auth pages (`/auth`, `/auth/forgot-password`, `/auth/reset-password`) |

### Phase 5 — Finalisation

| # | Titre |
|---|---|
| P5-01 | Audit accessibilité complet (WCAG AA) |
| P5-02 | Audit performance Lighthouse sur toutes les pages migrées |
| P5-03 | Tests E2E sur les principaux parcours (login → home → game → library) |
| P5-04 | Mise à jour finale de `docs/setup/development.md` (mention de la refonte) |
| P5-05 | Préparer la PR finale `design/editorial-refonte` → `dev` |
| P5-06 | Plan de communication / changelog utilisateur |

### Issue épique

Une issue **`[EPIC] Editorial refonte`** sert de point d'entrée. Sa
description liste toutes les phases avec checklist liée aux issues détaillées.
Elle reste ouverte jusqu'au merge final.

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
