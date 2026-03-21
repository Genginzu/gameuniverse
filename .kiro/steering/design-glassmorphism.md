---
inclusion: always
---

# Design : Glassmorphism & Cohérence Visuelle

## Règle principale

Tout composant ou page créé doit respecter le style **glassmorphism** établi
dans le projet et maintenir une **cohérence visuelle globale** avec l'existant.

## Classes utilitaires glassmorphism

Le projet définit un design system glassmorphism complet dans
`src/app/globals.css`. Utiliser ces classes en priorité :

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

Le projet utilise des couleurs néon comme accents :

- Violet néon : `neon-violet` / `rgba(139, 92, 246, ...)`
- Cyan néon : `neon-cyan` / classes `text-cyan-*`, `bg-cyan-*`
- Utiliser `bg-linear-to-br from-neon-violet to-neon-cyan` pour les accents
  forts

## Gradient principal (obligatoire)

Lorsqu'un gradient est utilisé (bannières, boutons d'accent, barres de
progression, badges, cercles, etc.), il **doit** reprendre le gradient cyan →
violet utilisé dans les cercles d'avis de l'onglet stats joueur
(`ReviewMetricsRadial`) :

```css
/* CSS — direction adaptable selon le contexte */
background: linear-gradient(to right, rgb(6, 182, 212), rgb(139, 92, 246));

/* SVG (linearGradient) */
<stop offset="0%" stop-color="rgb(6, 182, 212)" />   /* cyan */
<stop offset="100%" stop-color="rgb(139, 92, 246)" /> /* violet */

/* Équivalent Tailwind */
bg-linear-to-r from-cyan-500 to-violet-500
/* ou avec les custom colors du projet */
bg-linear-to-r from-neon-cyan to-neon-violet
```

- ✅ Utiliser ce gradient cyan → violet comme référence unique pour tout nouvel
  élément.
- ❌ Ne **jamais** inventer un gradient custom différent (ex : rouge-orange,
  vert-jaune, violet monochrome, etc.) sans validation explicite.

## Règles obligatoires

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
  pour les conteneurs principaux. Préférer les fonds semi-transparents.
- ❌ Ne **jamais** ignorer le dark mode. Chaque style light doit avoir son
  équivalent dark.
- ❌ Ne **jamais** introduire une nouvelle palette de couleurs sans cohérence
  avec l'existant.
- ❌ Ne **jamais** créer de composant UI sans vérifier la cohérence avec les
  composants similaires déjà en place.

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

## Checklist pour tout nouveau composant/page

1. Utilise les classes `.glass-*` ou les patterns Tailwind semi-transparents
2. Supporte le dark mode
3. Coins arrondis cohérents (`rounded-xl` / `rounded-2xl`)
4. Transitions fluides sur les interactions
5. Couleurs d'accent cohérentes (néon violet/cyan)
6. Icônes via Iconify (`@iconify/react`)
7. Vérifié visuellement à côté des pages existantes
