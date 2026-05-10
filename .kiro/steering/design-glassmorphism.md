---
inclusion: always
---

# Design : Glassmorphism (admin & legacy uniquement)

> **⚠️ Périmètre restreint depuis la refonte éditoriale (#258 / F0-13).**
>
> Ce steering ne s'applique **plus** aux pages éditoriales refondues. Il est
> conservé pour deux périmètres uniquement :
>
> - **`/admin/*`** — pas encore refondu (hors scope de la milestone éditoriale).
> - **Pages publiques legacy** — celles non encore migrées vers le nouveau
>   layout (cf docs/design/editorial-refonte-plan.md).
>
> ## Pour tout nouveau composant éditorial / public refondu
>
> Suivre la direction artistique éditoriale **à la place** :
>
> - 📘 **Plan** : [`docs/design/editorial-refonte-plan.md`](../../docs/design/editorial-refonte-plan.md)
> - 📘 **Composants** : [`docs/design/editorial-components.md`](../../docs/design/editorial-components.md)
>
> Les classes `.glass-*` sont marquées `@deprecated` dans `globals.css` :
> elles fonctionnent encore mais ne doivent plus être utilisées dans les
> nouveaux composants. Suppression définitive après la refonte de l'admin.
>
> ## Quand utiliser ce steering vs l'éditorial
>
> | Contexte                                                  | Steering à suivre               |
> | --------------------------------------------------------- | ------------------------------- |
> | Nouvelle page / composant **public** ou éditorial         | Editorial (plan + composants)   |
> | Nouvelle page / composant **dans `/admin`**               | Glassmorphism (ce fichier)      |
> | Modification d'une page legacy non encore refondue        | Glassmorphism (compat)          |
> | Composants `src/components/layout/editorial/*`            | Editorial — pas de `.glass-*`   |
> | Composants `src/components/admin/*`                       | Glassmorphism                   |

## Règle principale (admin & legacy)

Tout composant ou page d'**admin** ou de **legacy** doit respecter le style
**glassmorphism** établi dans le projet et maintenir une **cohérence visuelle
globale** avec l'existant.

## Classes utilitaires glassmorphism

Le projet définit un design system glassmorphism complet dans
`src/app/globals.css`. Utiliser ces classes en priorité **dans le périmètre
admin/legacy** :

| Classe              | Usage                                   |
| ------------------- | --------------------------------------- |
| `.glass`            | Conteneur générique avec effet verre    |
| `.glass-card`       | Cartes de stats, panneaux d'information |
| `.glass-header`     | En-tête de page / navigation            |
| `.glass-sidebar`    | Barre latérale de navigation            |
| `.glass-dropdown`   | Menus déroulants                        |
| `.glass-input`      | Champs de saisie                        |
| `.glass-nav-active` | Lien de navigation actif                |
| `.glass-nav-hover`  | Lien de navigation au survol            |
| `.glass-overlay`    | Overlay mobile                          |

> ⚠️ Ces classes sont marquées `@deprecated` dans `globals.css` pour le
> périmètre éditorial mais restent utilisables dans `/admin`.

## Patterns Tailwind complémentaires

Quand les classes utilitaires ne suffisent pas, utiliser les patterns Tailwind
cohérents avec le reste du projet :

```
/* Fond semi-transparent avec blur */
bg-white/40 backdrop-blur-xl          (light)
bg-slate-800/50 backdrop-blur-xl      (dark)

/* Bordures subtiles */
border border-white/20                (light)
border border-slate-700/50            (dark)

/* Ombres douces */
shadow-lg shadow-black/5              (light)
shadow-lg shadow-black/20             (dark)

/* Hover avec transition */
hover:bg-white/60 transition-all      (light)
hover:bg-slate-700/60 transition-all  (dark)
```

## Palette de couleurs

Le projet utilise un système de couleurs sémantiques défini dans
`src/app/globals.css` via des échelles `palette-primary-*`,
`palette-secondary-*` et `palette-accent-*` (50 à 950).

Palette actuelle (marine) :

- **Primary** (marine, H:209) : `palette-primary-{50..950}` — couleur dominante
- **Secondary** (ocean, H:200) : `palette-secondary-{50..950}` — couleur
  complémentaire
- **Accent** (bright blue, H:215) : `palette-accent-{50..950}` — accents vifs

Variables néon pour les effets glow/border :

- `neon-primary` — glow principal (box-shadow, text-shadow)
- `neon-secondary` — glow secondaire
- `neon-accent` — glow accent

Pour changer les couleurs du site, modifier uniquement les valeurs hex des
`--color-palette-*` dans le `@theme` de `globals.css` + les valeurs RGB des
`--neon-*` dans `:root`.

> Pour le périmètre éditorial, voir le système d'accent dynamique
> (`paletteFromHex`, `useGameAccent`, `DynamicAccent`) dans
> [`docs/design/editorial-components.md`](../../docs/design/editorial-components.md).

## Gradient principal (obligatoire)

Lorsqu'un gradient est utilisé (bannières, boutons d'accent, barres de
progression, badges, cercles, etc.), il **doit** utiliser le gradient secondary
→ primary :

```css
/* CSS — direction adaptable selon le contexte */
background: linear-gradient(to right, #0697e0, #0077e6);

/* SVG (linearGradient) */
<stop offset="0%" stop-color="#0697e0" />   /* secondary-500 */
<stop offset="100%" stop-color="#0077e6" /> /* primary-500 */

/* Équivalent Tailwind */
bg-linear-to-r from-palette-secondary-500 to-palette-primary-500
/* ou avec les custom colors du projet */
bg-linear-to-r from-neon-secondary to-neon-primary
```

- ✅ Utiliser ce gradient secondary → primary comme référence unique pour tout
  nouvel élément.
- ❌ Ne **jamais** inventer un gradient custom différent (ex : rouge-orange,
  vert-jaune, etc.) sans validation explicite.

## Règles obligatoires (admin & legacy)

- ✅ Toujours supporter le **dark mode** (`dark:` prefix Tailwind).
- ✅ Utiliser les classes `.glass-*` existantes plutôt que recréer les effets
  manuellement.
- ✅ Avant de créer un nouveau composant, vérifier les composants existants dans
  `src/components/shared/` et `src/components/ui/` pour réutiliser les patterns.
- ✅ Les cartes et panneaux doivent avoir des coins arrondis (`rounded-xl` ou
  `rounded-2xl`).
- ✅ Les transitions doivent être fluides (`transition-all duration-300`).
- ✅ Garder une hiérarchie visuelle claire : titres, sous-titres, contenu.

## Interdictions

- ❌ Ne **jamais** utiliser de fonds opaques plats (`bg-white`, `bg-gray-900`)
  pour les conteneurs principaux d'admin/legacy. Préférer les fonds
  semi-transparents.
- ❌ Ne **jamais** ignorer le dark mode. Chaque style light doit avoir son
  équivalent dark.
- ❌ Ne **jamais** introduire une nouvelle palette de couleurs sans cohérence
  avec l'existant.
- ❌ Ne **jamais** créer de composant UI sans vérifier la cohérence avec les
  composants similaires déjà en place.
- ❌ Ne **jamais** réutiliser une classe `.glass-*` dans un composant
  éditorial (`src/components/layout/editorial/*` ou les composants éditoriaux
  de `src/components/shared/`).

## Icônes : Iconify uniquement

Le projet utilise la librairie **Iconify** (`@iconify/react`) pour toutes les
icônes. C'est la seule librairie d'icônes autorisée.

```tsx
import { Icon } from "@iconify/react";

<Icon icon="mdi:home" className="size-5" />;
```

- ✅ Toujours utiliser `@iconify/react` pour afficher des icônes.
- ❌ Ne **jamais** utiliser une autre librairie d'icônes (`lucide-react`,
  `react-icons`, `heroicons`, etc.) sauf demande explicite de l'utilisateur.
- ⚠️ Si dans un cas précis une autre librairie semble plus adaptée, **proposer
  l'alternative à l'utilisateur** et attendre sa validation avant de l'utiliser.

## Checklist pour tout nouveau composant/page (admin & legacy)

1. Utilise les classes `.glass-*` ou les patterns Tailwind semi-transparents
2. Supporte le dark mode
3. Coins arrondis cohérents (`rounded-xl` / `rounded-2xl`)
4. Transitions fluides sur les interactions
5. Couleurs d'accent cohérentes (palette-primary/secondary)
6. Icônes via Iconify (`@iconify/react`)
7. Vérifié visuellement à côté des pages existantes

> 📘 **Pour les composants éditoriaux**, suivre la checklist de
> [`docs/design/editorial-components.md`](../../docs/design/editorial-components.md)
> à la place.
