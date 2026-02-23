# Plan d'Implémentation : Navigation Sidebar

## Vue d'ensemble

Transformation de la navigation horizontale (`GamingNavBar`) en sidebar latérale fixe avec esthétique gaming/néon. Suppression du header connecté, ajout d'un overlay de recherche globale, et adaptation mobile avec bouton hamburger flottant. Approche incrémentale : utilitaires → composants sidebar → overlay recherche → layout → nettoyage → tests → validation.

## Tâches

- [x] 1. Créer les utilitaires de navigation partagés
  - [x] 1.1 Créer `src/lib/utils/navigation-utils.ts`
    - Extraire et exporter la fonction `isActive(pathname, linkPath)` (actuellement dupliquée dans `GamingNavBar.tsx` et `MobileNavOverlay.tsx`)
    - Définir et exporter l'interface `NavLink` (href, icon, labelKey)
    - Définir et exporter les constantes `NAV_LINKS` (5 liens principaux : Dashboard, Bibliothèque, Favoris, Collections, Profil) et `PUBLIC_LINKS` (3 liens publics : Jeux, Personnages, Joueurs)
    - _Exigences : 1.2, 1.3, 2.1, 2.4_

  - [ ]* 1.2 Écrire le test property-based pour `isActive` — Propriété 1
    - **Propriété 1 : Unicité et exactitude du lien actif**
    - Créer `test/unit/lib/utils/navigation-utils.property.test.ts`
    - Pour tout pathname valide et la liste `NAV_LINKS`, `isActive` retourne `true` pour au plus un seul lien
    - Si le pathname commence par le `href` d'un lien (après suppression du préfixe locale), `isActive` retourne `true` pour ce lien
    - Utiliser `fast-check` avec minimum 100 itérations
    - **Valide : Exigences 2.1, 2.4**

  - [ ]* 1.3 Écrire les tests unitaires pour `navigation-utils`
    - Créer `test/unit/lib/utils/navigation-utils.test.ts`
    - Tester `isActive` avec des cas spécifiques : chemin exact, sous-chemin, chemin non-correspondant, chemin racine, avec/sans préfixe locale
    - Tester que `NAV_LINKS` contient exactement 5 liens et `PUBLIC_LINKS` exactement 3 liens
    - _Exigences : 1.2, 1.3, 2.1, 2.4_

- [x] 2. Implémenter les composants de la sidebar
  - [x] 2.1 Créer `src/components/layout/dashboard/SidebarNav.tsx`
    - Afficher les liens principaux (`NAV_LINKS`) et publics (`PUBLIC_LINKS`) importés depuis `navigation-utils.ts`
    - Séparation visuelle entre liens principaux et publics (bordure subtile)
    - Indicateur actif néon (fond violet lumineux + bordure latérale gauche néon) via `isActive`
    - Effet de glow au survol, anneau de focus néon violet au focus clavier
    - Attributs ARIA : `<nav>` avec `aria-label`
    - Respecter `prefers-reduced-motion` (désactiver animations glow/transitions)
    - Prop `onLinkClick` optionnel pour fermeture overlay mobile
    - _Exigences : 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 7.1, 7.2, 8.1_

  - [x] 2.2 Créer `src/components/layout/dashboard/SidebarSearchButton.tsx`
    - Bouton avec icône loupe, positionné entre navigation et section utilisateur
    - Style gaming/néon cohérent avec la sidebar
    - Prop `onClick` pour ouvrir l'overlay de recherche
    - _Exigences : 9.1_

  - [x] 2.3 Créer `src/components/layout/dashboard/SidebarUserSection.tsx`
    - Section en bas de la sidebar avec bordure de séparation
    - Avatar utilisateur (icône avec dégradé violet/bleu) et nom d'affichage (username > email prefix > fallback)
    - Dropdown au clic : LanguageSwitcher, changement de thème, paramètres, déconnexion
    - _Exigences : 6.1, 6.2, 6.3_

  - [ ]* 2.4 Écrire le test property-based pour la résolution du nom d'affichage — Propriété 3
    - **Propriété 3 : Résolution du nom d'affichage utilisateur**
    - Créer `test/unit/lib/utils/user-display.property.test.ts`
    - Extraire la logique de résolution du nom dans une fonction pure testable
    - Pour tout objet User, le résultat ne doit jamais être vide : username si présent, sinon partie avant `@` de l'email, sinon fallback
    - Utiliser `fast-check` avec minimum 100 itérations
    - **Valide : Exigence 6.2**

  - [x] 2.4b Créer `src/components/layout/dashboard/Sidebar.tsx`
    - Composant principal assemblant : logo Game Universe + nom app en haut, `SidebarNav`, `SidebarSearchButton`, `SidebarUserSection` en bas
    - Style `glass-sidebar` avec accents néon (bordures et glow violet/cyan)
    - Hauteur 100vh, largeur fixe 256px (w-64)
    - Masqué sur mobile (<1024px) via `hidden lg:flex`
    - _Exigences : 1.1, 1.4, 1.5, 1.6_

  - [ ]* 2.5 Écrire les tests unitaires pour les composants sidebar
    - Créer `test/unit/components/layout/Sidebar.test.tsx`
    - Tester le rendu des 5 liens principaux + 3 liens publics, logo, section utilisateur, bouton recherche
    - Créer `test/unit/components/layout/SidebarUserSection.test.tsx`
    - Tester le dropdown avec LanguageSwitcher, changement de thème, paramètres, déconnexion
    - _Exigences : 1.2, 1.3, 1.6, 6.1, 6.2, 6.3_

- [x] 3. Checkpoint — Vérifier les composants sidebar
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implémenter l'overlay de recherche globale
  - [x] 4.1 Créer `src/hooks/useSearchOverlay.ts`
    - Gérer l'état ouvert/fermé de l'overlay
    - Raccourci clavier Ctrl+K (Windows/Linux) / Cmd+K (macOS) pour ouvrir
    - Touche Escape pour fermer
    - Nettoyage des event listeners au démontage
    - _Exigences : 9.7, 9.10_

  - [ ]* 4.2 Écrire le test property-based pour les raccourcis clavier — Propriété 4
    - **Propriété 4 : Raccourcis clavier de l'overlay de recherche**
    - Créer `test/unit/hooks/useSearchOverlay.property.test.ts`
    - Pour tout événement clavier : Ctrl+K/Cmd+K ouvre si fermé, Escape ferme si ouvert, aucune autre touche ne modifie l'état
    - Utiliser `fast-check` avec minimum 100 itérations
    - **Valide : Exigences 9.7, 9.10**

  - [ ]* 4.3 Écrire les tests unitaires pour `useSearchOverlay`
    - Créer `test/unit/hooks/useSearchOverlay.test.ts`
    - Tester les états open/close, raccourci Ctrl+K/Cmd+K, fermeture Escape
    - _Exigences : 9.7, 9.10_

  - [x] 4.4 Créer `src/components/layout/dashboard/SearchOverlay.tsx`
    - Overlay modal centré avec fond semi-transparent
    - Style glassmorphism (effet glass) pour le panneau de résultats
    - Champ de saisie avec style gaming/néon, focus initial sur le champ
    - Réutiliser `useGlobalSearch` et `GlobalSearchDropdown` existants
    - Résultats regroupés par catégorie (Jeux, Personnages)
    - Bouton de fermeture visible, fermeture au clic extérieur
    - Attributs `role="dialog"` et `aria-modal="true"`, focus trap
    - _Exigences : 9.2, 9.3, 9.4, 9.5, 9.6, 9.8, 9.9, 9.11, 9.12_

  - [ ]* 4.5 Écrire les tests unitaires pour `SearchOverlay`
    - Créer `test/unit/components/layout/SearchOverlay.test.tsx`
    - Tester ouverture/fermeture, attributs ARIA, focus initial sur le champ de saisie
    - _Exigences : 9.2, 9.7, 9.8, 9.9, 9.11, 9.12_

- [x] 5. Checkpoint — Vérifier l'overlay de recherche
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Adapter le layout et la navigation mobile
  - [x] 6.1 Créer `src/components/layout/dashboard/MobileHamburgerButton.tsx`
    - Bouton hamburger en position fixe (coin supérieur gauche)
    - Visible uniquement sur mobile (<1024px) via `lg:hidden`
    - Prop `onClick` pour ouvrir l'overlay mobile
    - _Exigences : 5.2_

  - [x] 6.2 Modifier `src/components/layout/dashboard/MobileNavOverlay.tsx`
    - Importer `NAV_LINKS` et `PUBLIC_LINKS` depuis `navigation-utils.ts` (supprimer les constantes locales)
    - Importer `isActive` depuis `navigation-utils.ts` (supprimer la fonction locale)
    - Ajouter un bouton « Recherche » qui ouvre `SearchOverlay`
    - Ajouter les liens publics (`PUBLIC_LINKS`)
    - Conserver les attributs `role="dialog"`, `aria-modal="true"`, focus trap
    - Respecter `prefers-reduced-motion` (pas d'animation de transition)
    - _Exigences : 5.3, 5.4, 5.5, 5.6, 7.3, 7.4, 8.2_

  - [ ]* 6.3 Écrire le test property-based pour la fermeture overlay mobile — Propriété 2
    - **Propriété 2 : Fermeture de l'overlay mobile au clic sur un lien**
    - Ajouter dans `test/unit/lib/utils/navigation-utils.property.test.ts`
    - Pour tout lien dans `NAV_LINKS`, le callback `onClose` est appelé exactement une fois au clic
    - Utiliser `fast-check` avec minimum 100 itérations
    - **Valide : Exigence 5.5**

  - [ ]* 6.4 Écrire les tests unitaires pour `MobileNavOverlay` et `MobileHamburgerButton`
    - Créer `test/unit/components/layout/MobileNavOverlay.test.tsx`
    - Tester bouton recherche, fermeture au clic sur un lien, attributs dialog/aria-modal
    - _Exigences : 5.2, 5.3, 5.4, 5.5, 5.6_

  - [x] 6.5 Modifier `src/components/layout/dashboard/DashboardLayout.tsx`
    - Remplacer l'import de `DashboardHeader` par `Sidebar` et `MobileHamburgerButton`
    - Layout flex horizontal : sidebar à gauche, contenu principal (`flex-1`) à droite
    - Intégrer `useSearchOverlay` pour gérer l'état de l'overlay de recherche
    - Passer `onSearchOpen` à `Sidebar` et `MobileNavOverlay`
    - Rendre `SearchOverlay` au niveau du layout
    - Conserver le fond animé gaming (`dashboard-bg`) et la hauteur pleine (`h-screen`)
    - Supprimer toute référence à `DashboardHeader`
    - _Exigences : 3.1, 3.2, 4.1, 4.2, 4.3_

- [x] 7. Supprimer les fichiers obsolètes
  - [x] 7.1 Supprimer les anciens composants
    - Supprimer `src/components/layout/dashboard/GamingNavBar.tsx`
    - Supprimer `src/components/layout/dashboard/DashboardSidebar.tsx`
    - Supprimer `src/components/layout/dashboard/SidebarContent.tsx`
    - Supprimer `src/components/layout/dashboard/DashboardHeader.tsx`
    - Vérifier qu'aucun import résiduel ne référence ces fichiers
    - _Exigences : 1.1, 3.1, 3.3_

- [x] 8. Checkpoint final — Validation complète
  - Exécuter `bun run test:all`
  - Vérifier que tous les tests passent
  - Corriger les tests en échec si nécessaire
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Lint du code
  - Exécuter `bun run lint`
  - Vérifier qu'il n'y a pas d'erreurs ni de warnings de lint
  - Corriger les erreurs et warnings de lint si nécessaire

- [x] 10. Build de production
  - Exécuter `bun run build`
  - Vérifier qu'il n'y a pas d'erreurs de compilation
  - Corriger les erreurs de build si nécessaire

- [x] 11. README de la fonctionnalité
  - Créer `docs/README_navigation-sidebar.md`
  - Documenter : description de la sidebar, accès (layout connecté, responsive), prérequis (authentification), utilisation (navigation, recherche Ctrl+K, section utilisateur)

## Notes

- Les tâches marquées `*` sont optionnelles et peuvent être ignorées pour un MVP plus rapide
- Chaque tâche référence les exigences spécifiques pour la traçabilité
- Les checkpoints assurent une validation incrémentale
- Les tests property-based valident les propriétés universelles de correction
- Les tests unitaires valident les exemples concrets et cas limites
- Framework de test : Vitest uniquement, tests dans `test/unit/`
- PBT : fast-check (déjà installé)
