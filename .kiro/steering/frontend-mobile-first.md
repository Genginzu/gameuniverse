---
inclusion: always
---

# Frontend : Mobile-First & Responsive Design

## Règle principale

Toute page et tout composant **doit** être conçu en **mobile-first**. Le CSS de
base cible les écrans mobiles, puis les breakpoints supérieurs ajoutent la
complexité via les préfixes Tailwind (`sm:`, `md:`, `lg:`, `xl:`).

## Breakpoints du projet

Le projet définit un breakpoint custom `xs: 475px` en plus des breakpoints
Tailwind par défaut :

| Préfixe | Largeur min | Usage                         |
| ------- | ----------- | ----------------------------- |
| (base)  | 0px         | Mobile portrait               |
| `xs:`   | 475px       | Mobile paysage / grand mobile |
| `sm:`   | 640px       | Petit tablet                  |
| `md:`   | 768px       | Tablet                        |
| `lg:`   | 1024px      | Desktop / sidebar visible     |
| `xl:`   | 1280px      | Grand desktop                 |
| `2xl:`  | 1536px      | Très grand écran              |

## Approche mobile-first obligatoire

### Écriture des classes Tailwind

```tsx
// ✅ Mobile-first : base = mobile, puis on ajoute
<div className="px-4 sm:px-6 lg:px-8">
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
<h1 className="text-2xl md:text-3xl lg:text-4xl">

// ❌ Desktop-first : ne jamais écrire les styles desktop en base
<div className="px-8 max-md:px-4">
```

### Ordre de réflexion

1. Designer d'abord pour un écran de **375px** (iPhone SE)
2. Ajouter les adaptations pour tablette (`md:`)
3. Ajouter les adaptations pour desktop (`lg:`, `xl:`)

## Layouts responsive

### Sidebar (admin)

- Mobile : sidebar masquée, accessible via bouton hamburger (déjà en place)
- `lg:` : sidebar visible en permanence

### Grilles de contenu

```tsx
// Grille de cartes standard
<div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">

// Grille de stats / dashboard
<div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
```

### Navigation

- Mobile : menu hamburger ou bottom navigation
- Desktop : navigation horizontale ou sidebar

### Tableaux

- Mobile : transformer en cartes empilées ou utiliser un scroll horizontal
- Desktop : tableau classique

```tsx
// ✅ Pattern : tableau desktop, cartes mobile
<div className="hidden md:block">
  <Table>...</Table>
</div>
<div className="space-y-3 md:hidden">
  {items.map(item => <MobileCard key={item.id} {...item} />)}
</div>
```

### Formulaires

- Mobile : champs en pleine largeur, empilés verticalement
- Desktop : possibilité de colonnes côte à côte

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <Input ... />
  <Input ... />
</div>
```

## Patterns responsive obligatoires

### Padding et marges

```tsx
// Conteneur de page
<div className="p-4 md:p-6 lg:p-8">

// Espacement entre sections
<div className="space-y-4 md:space-y-6 lg:space-y-8">
```

### Typographie

```tsx
// Titres de page
<h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">

// Sous-titres
<h2 className="text-lg sm:text-xl font-semibold">

// Corps de texte — taille de base suffisante sur mobile (min 16px)
<p className="text-sm sm:text-base">
```

### Images

```tsx
// Toujours responsive
<Image className="w-full h-auto object-cover" ... />

// Aspect ratio adaptatif
<div className="aspect-[3/4] sm:aspect-[4/3] lg:aspect-video">
```

### Boutons et actions

```tsx
// Boutons pleine largeur sur mobile, auto sur desktop
<Button className="w-full sm:w-auto">

// Groupe de boutons : empilés sur mobile, en ligne sur desktop
<div className="flex flex-col sm:flex-row gap-2">
```

### Modales et dialogs

- Mobile : plein écran ou drawer depuis le bas
- Desktop : modale centrée classique

```tsx
// Dialog responsive
<DialogContent className="max-h-[90vh] w-[95vw] sm:max-w-lg overflow-y-auto">
```

## Touch targets

Sur mobile, les zones cliquables doivent être suffisamment grandes :

- ✅ Taille minimale de **44x44px** pour tout élément interactif (boutons,
  liens, icônes cliquables)
- ✅ Utiliser `min-h-[44px] min-w-[44px]` ou `p-3` sur les boutons icônes
- ❌ Ne jamais avoir de bouton ou lien plus petit que 44px sur mobile

## Texte et lisibilité mobile

- ✅ Taille de police minimale de **14px** (`text-sm`) pour le contenu, **16px**
  (`text-base`) pour les inputs (évite le zoom auto sur iOS)
- ✅ Line-height suffisant : `leading-relaxed` ou `leading-normal`
- ✅ Contraste suffisant (WCAG AA minimum)
- ❌ Ne jamais utiliser `text-xs` pour du contenu principal sur mobile

## Overflow et scroll

- ✅ Aucun scroll horizontal involontaire sur mobile
- ✅ Utiliser `overflow-x-auto` uniquement quand nécessaire (tableaux larges)
- ✅ Tester que le contenu ne déborde pas à 375px de large
- ❌ Ne jamais utiliser de largeurs fixes (`w-[500px]`) sans responsive

## Règles obligatoires

- ✅ Tout nouveau composant/page **doit** être testé visuellement à 375px, 768px
  et 1280px minimum.
- ✅ Les classes Tailwind **doivent** être écrites en mobile-first (base → `sm:`
  → `md:` → `lg:`).
- ✅ Les grilles **doivent** commencer à `grid-cols-1` et augmenter avec les
  breakpoints.
- ✅ Les inputs **doivent** avoir `text-base` minimum (16px) pour éviter le zoom
  iOS.
- ✅ Utiliser `gap-*` plutôt que des marges manuelles pour l'espacement dans les
  grilles et flex.

## Interdictions

- ❌ Ne **jamais** écrire de CSS desktop-first (styles desktop en base, override
  mobile).
- ❌ Ne **jamais** utiliser de largeurs/hauteurs fixes sans alternative
  responsive.
- ❌ Ne **jamais** masquer du contenu important sur mobile avec
  `hidden md:block` sans alternative mobile.
- ❌ Ne **jamais** ignorer le test mobile. Si un composant casse à 375px, c'est
  un bug.
- ❌ Ne **jamais** utiliser `max-md:`, `max-lg:` etc. comme approche principale.
  Toujours partir du mobile.

## Checklist responsive pour tout nouveau composant/page

1. Fonctionne à 375px (iPhone SE) sans scroll horizontal
2. Touch targets ≥ 44px sur mobile
3. Inputs en `text-base` minimum (pas de zoom iOS)
4. Grilles adaptatives (`grid-cols-1` → `sm:` → `md:` → `lg:`)
5. Padding/marges responsive (`p-4 md:p-6 lg:p-8`)
6. Typographie responsive (tailles croissantes avec breakpoints)
7. Tableaux transformés en cartes ou scrollables sur mobile
8. Modales/dialogs adaptées au mobile (plein écran ou drawer)
9. Pas de contenu tronqué ou caché sans alternative
