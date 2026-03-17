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
- Utiliser `bg-gradient-to-br from-neon-violet to-neon-cyan` pour les accents
  forts

## Gradient principal (obligatoire)

Lorsqu'un gradient est utilisé (bannières, boutons d'accent, barres de
progression, badges, etc.), il **doit** reprendre le gradient du header
(`.topbar` dans `globals.css`) :

```css
/* Light */
background: linear-gradient(135deg, #615dfa 0%, #5b36d4 50%, #7c5cfc 100%);

/* Dark */
background: linear-gradient(135deg, #4a3fcf 0%, #3d1fa8 50%, #5b3fd4 100%);

/* Équivalent Tailwind (approximation) */
bg-gradient-to-r from-[#615dfa] via-[#5b36d4] to-[#7c5cfc]
```

- ✅ Utiliser ce gradient comme référence unique pour tout nouvel élément.
- ❌ Ne **jamais** inventer un gradient custom différent (ex : rouge-orange,
  vert-jaune, bleu→violet, etc.) sans validation explicite.

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

## Checklist pour tout nouveau composant/page

1. Utilise les classes `.glass-*` ou les patterns Tailwind semi-transparents
2. Supporte le dark mode
3. Coins arrondis cohérents (`rounded-xl` / `rounded-2xl`)
4. Transitions fluides sur les interactions
5. Couleurs d'accent cohérentes (néon violet/cyan)
6. Vérifié visuellement à côté des pages existantes
