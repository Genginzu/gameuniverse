# Dismissable layer

## Description

Tous les menus, dropdowns, panneaux, overlays et dialogs maison passent par un module
unique : `useDismissableLayer` (`src/hooks/useDismissableLayer.ts`). Il possède la séquence
complète : fermeture (Escape, pointeur extérieur), scroll lock, focus trap, retour du focus
au trigger et empilement des calques. Vocabulaire : voir `GLOSSARY.md` (section User
interface).

Remplace `useEscapeKey`, `useClickOutside` et les listeners `keydown` / `mousedown` /
`pointerdown` écrits à la main dans chaque composant.

## Accès

Aucune route : module client utilisé par `EditorialSubSidebar`, `EditorialMobileNav`,
`EditorialMegaMenu`, `HeaderUserDropdown`, `HeaderLanguageSwitcher`, `SearchOverlay`,
`EditorialDialog`, `NotificationDropdown`, `GameSortMenu`, `GameSearchBar`, `SearchBar`,
`AdminSidebar`, `AdminSidebarUserMenu`, `FriendCard`, `CoachPricingSection`,
`GameFormSimilarGamesTab`.

## Prérequis

Le caller possède le container (un `ref`) et l'état ouvert ; le module ne rend aucun DOM.

## Utilisation

```tsx
const containerRef = useRef<HTMLDivElement>(null);
const triggerRef = useRef<HTMLButtonElement>(null);

useDismissableLayer(containerRef, {
  open: isOpen,
  onDismiss: () => setIsOpen(false),
  insideRefs: [triggerRef], // le trigger ne ferme pas puis ré-ouvre
  lockScroll: true,         // overlays plein écran
  trapFocus: true,          // dialogs / overlays aria-modal
  initialFocusRef: inputRef // optionnel
});
```

| Option            | Effet                                                                  |
| ----------------- | ---------------------------------------------------------------------- |
| `open`            | Le calque rejoint la layer stack tant que `true`.                      |
| `onDismiss`       | Escape (top layer seulement) ou `pointerdown` hors des inside regions. |
| `insideRefs`      | Régions intérieures en plus du container (trigger, rail…).             |
| `lockScroll`      | Bloque `body.style.overflow` ; compté entre calques, valeur restaurée. |
| `trapFocus`       | Tab / Shift+Tab bouclent dans le container ; focus initial dedans.     |
| `initialFocusRef` | Élément focus à l'ouverture (prioritaire sur le premier focusable).    |

### Règles de comportement

- **Escape** : phase capture sur `window`, ne ferme que le top layer, `preventDefault`.
- **Pointeur extérieur** : `pointerdown` en capture ; la pile est parcourue du haut vers le
  bas, chaque calque dont les inside regions ne contiennent pas la cible est fermé, jusqu'au
  premier qui la contient.
- **Tab** : phase bubble ; un composant qui consomme déjà Tab (`preventDefault`, ex. onglets
  de la recherche globale) garde la main.
- **Retour du focus** : à la fermeture, le trigger (élément focus à l'ouverture) récupère le
  focus si le focus est encore dans le calque ou perdu sur `body`.
- Appeler le hook **avant** tout effet du composant qui déplace le focus.

### Hors périmètre

- Le scroll lock permanent d'`AdminLayout` (pas un calque).
- Les primitives Radix (`src/components/ui/dialog.tsx`, Select) gardent leur propre
  dismissable layer.

## Tests

`src/hooks/__tests__/useDismissableLayer.test.tsx` couvre l'interface : empilement,
inside regions, scroll lock compté, focus trap, retour du focus.
