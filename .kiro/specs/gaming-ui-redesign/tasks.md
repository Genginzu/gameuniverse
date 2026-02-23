# Plan d'implémentation : Refonte UI Gaming

## Vue d'ensemble

Transformation visuelle de Game Universe en 4 couches : tokens CSS néon → classes utilitaires → enrichissement glass → refactorisation composants. Approche CSS-first pour minimiser les changements de composants. Navigation sidebar → barre horizontale. Tous les tests utilisent Vitest + fast-check.

## Tâches

- [x] 1. Tokens CSS néon et configuration Tailwind
  - [x] 1.1 Ajouter les tokens néon dans `globals.css`
    - Ajouter les custom properties `--neon-violet`, `--neon-cyan`, `--neon-magenta`, `--neon-glow-opacity`, `--neon-border-opacity` dans `:root` et `.dark`
    - Les valeurs `.dark` doivent avoir des opacités supérieures d'au moins 20% par rapport à `:root` (ex: `--neon-glow-opacity: 0.15` → `0.25`)
    - Modifier `--primary` en teinte violet néon pour `.dark`, `--accent` en cyan néon, `--ring` en violet-500, `--background` en slate-950
    - _Requirements: 1.1, 1.3, 1.5_

  - [x] 1.2 Étendre `tailwind.config.ts` avec les couleurs néon
    - Ajouter `neon.violet`, `neon.cyan`, `neon.magenta` dans `extend.colors` utilisant les CSS custom properties RGB
    - Format : `"rgb(var(--neon-violet) / <alpha-value>)"`
    - _Requirements: 1.1_

  - [ ]* 1.3 Écrire le test de propriété P1 — Présence des tokens néon
    - **Property 1: Présence des tokens néon dans les deux thèmes**
    - Fichier : `test/unit/lib/utils/neonTokens.property.test.ts`
    - Vérifier que pour tout mode (clair/sombre), les 5 tokens néon sont définis avec des valeurs valides
    - **Validates: Requirements 1.1, 1.2, 1.5**

  - [ ]* 1.4 Écrire le test de propriété P2 — Intensification néon mode sombre
    - **Property 2: Intensification néon en mode sombre**
    - Fichier : `test/unit/lib/utils/neonTokens.property.test.ts`
    - Vérifier que `--neon-glow-opacity` et `--neon-border-opacity` en `.dark` sont supérieurs d'au moins 15% aux valeurs `:root`
    - **Validates: Requirements 1.3, 1.5**

- [x] 2. Classes utilitaires néon et enrichissement glass
  - [x] 2.1 Créer les classes utilitaires néon dans `globals.css`
    - Ajouter `.neon-glow` (box-shadow violet/cyan), `.neon-border` (border-image dégradé), `.neon-text` (text-shadow glow), `.neon-focus` (outline violet accessible avec offset ≥ 2px), `.neon-btn` (bordure lumineuse + glow hover)
    - Toutes les transitions ≤ 300ms
    - _Requirements: 3.1, 3.2, 7.2, 8.3, 8.5_

  - [x] 2.2 Enrichir les classes `.glass-*` existantes avec les effets néon
    - Modifier `.glass`, `.glass-card`, `.glass-header`, `.glass-dropdown`, `.glass-input` pour ajouter bordure dégradé néon (violet→cyan) et box-shadow néon
    - Intensifier le glow au `:hover` (opacité hover > opacité par défaut)
    - Conserver `backdrop-filter: blur()` et s'assurer que `rounded-2xl` (16px) est appliqué partout
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 2.3 Mettre à jour le fond animé `.dashboard-bg` avec les couleurs néon
    - Remplacer les couleurs des dégradés mesh par violet-500, cyan-500, magenta-500
    - Ajouter une animation subtile de mesh (keyframe lent, ≤ 300ms pour les transitions)
    - _Requirements: 1.2_

  - [x] 2.4 Ajouter les règles `prefers-reduced-motion` pour toutes les nouvelles classes
    - Ajouter `@media (prefers-reduced-motion: reduce)` désactivant les animations sur `.neon-glow`, `.neon-border`, `.neon-btn`, `.dashboard-bg` animé, et toutes les classes `.animate-*`
    - _Requirements: 4.5, 5.6, 8.4_

  - [ ]* 2.5 Écrire le test de propriété P4 — Propriétés néon des classes glass
    - **Property 4: Propriétés néon des classes glass**
    - Fichier : `test/unit/lib/utils/glassNeon.property.test.ts`
    - Pour toute classe glass, vérifier la présence de bordure néon et box-shadow néon
    - **Validates: Requirements 3.1, 3.2**

  - [ ]* 2.6 Écrire le test de propriété P5 — Intensification glow au survol
    - **Property 5: Intensification du glow au survol des panneaux glass**
    - Fichier : `test/unit/lib/utils/glassNeon.property.test.ts`
    - Vérifier que l'opacité du box-shadow hover > opacité par défaut
    - **Validates: Requirements 3.3**

  - [ ]* 2.7 Écrire le test de propriété P6 — Préservation backdrop-filter et coins
    - **Property 6: Préservation du backdrop-filter et des coins arrondis**
    - Fichier : `test/unit/lib/utils/glassNeon.property.test.ts`
    - Vérifier que `backdrop-filter: blur()` est présent et `rounded-2xl` appliqué
    - **Validates: Requirements 3.4, 3.5**

  - [ ]* 2.8 Écrire les tests de propriétés P9, P10, P11
    - **Property 9: Respect de prefers-reduced-motion** — Fichier : `test/unit/lib/utils/reducedMotion.property.test.ts`
    - **Property 10: Durée maximale des transitions** — Fichier : `test/unit/lib/utils/transitionDuration.property.test.ts`
    - **Property 11: Anneau de focus néon accessible** — Fichier : `test/unit/lib/utils/neonFocus.property.test.ts`
    - **Validates: Requirements 4.5, 5.6, 8.3, 8.4, 8.5**

- [x] 3. Checkpoint — Vérifier la couche CSS
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Refonte du système de navigation
  - [x] 4.1 Créer `GamingNavBar.tsx`
    - Fichier : `src/components/layout/dashboard/GamingNavBar.tsx` (~120 lignes max)
    - Barre horizontale avec les 5 liens (Dashboard, Bibliothèque, Favoris, Collections, Profil) sous forme d'icônes + labels
    - Indicateur actif : bordure inférieure néon (glow) sur le lien actif, un seul lien actif à la fois
    - Effet de glow subtil au survol des icônes
    - Masquée sous 1024px (responsive `hidden lg:flex`)
    - Utiliser les traductions existantes de `useTranslations("dashboard")`
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 4.2 Créer `MobileNavOverlay.tsx`
    - Fichier : `src/components/layout/dashboard/MobileNavOverlay.tsx` (~100 lignes max)
    - Overlay plein écran visible uniquement sous 1024px
    - Liens de navigation stylisés gaming (icônes, glow néon, fond glass)
    - Fermeture via bouton X et clic sur le fond semi-transparent
    - _Requirements: 2.5_

  - [x] 4.3 Créer `NavUserMenu.tsx`
    - Fichier : `src/components/layout/dashboard/NavUserMenu.tsx` (~80 lignes max)
    - Extraire la logique du menu utilisateur de `SidebarContent.tsx` (thème, paramètres, déconnexion)
    - Adapter le style pour le header horizontal (dropdown vers le bas au lieu de vers le haut)
    - _Requirements: 2.7_

  - [x] 4.4 Refactoriser `DashboardHeader.tsx`
    - Intégrer `GamingNavBar` dans le header (entre le logo et la recherche, ou après)
    - Intégrer `NavUserMenu` à droite
    - Remplacer le bouton hamburger sidebar par un bouton hamburger pour `MobileNavOverlay`
    - Conserver `GlobalSearchBar` et `LanguageSwitcher`
    - _Requirements: 2.1, 2.6, 2.7_

  - [x] 4.5 Refactoriser `DashboardLayout.tsx`
    - Supprimer l'import et le rendu de `DashboardSidebar`
    - Supprimer le state `sidebarOpen` lié à la sidebar, ajouter un state pour `MobileNavOverlay`
    - Intégrer `MobileNavOverlay` dans le layout
    - Le contenu principal occupe toute la largeur (plus de `flex` avec sidebar)
    - Supprimer les effets `useEffect` liés à la sidebar (click outside, orientation)
    - _Requirements: 6.4, 6.5_

  - [ ]* 4.6 Écrire le test de propriété P3 — Indicateur actif navigation
    - **Property 3: Indicateur actif de navigation**
    - Fichier : `test/unit/components/layout/GamingNavBar.property.test.ts`
    - Pour tout chemin valide, un seul lien actif à la fois avec la classe d'indicateur néon
    - **Validates: Requirements 2.3**

  - [ ]* 4.7 Écrire les tests unitaires de navigation
    - `test/unit/components/layout/GamingNavBar.test.tsx` : les 5 liens avec icônes et labels sont rendus (Req 2.2)
    - `test/unit/components/layout/MobileNavOverlay.test.tsx` : menu hamburger visible sous 1024px (Req 2.5)
    - `test/unit/components/layout/DashboardHeader.test.tsx` : GlobalSearchBar, LanguageSwitcher et NavUserMenu présents (Req 2.6, 2.7)
    - `test/unit/components/layout/DashboardLayout.test.tsx` : pas de sidebar, contenu pleine largeur (Req 6.4, 6.5)
    - _Requirements: 2.2, 2.5, 2.6, 2.7, 6.4, 6.5_

- [x] 5. Checkpoint — Vérifier la navigation
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Refonte des cartes de jeux
  - [x] 6.1 Modifier `GameCard.tsx` avec les effets néon
    - Ajouter glow néon au survol (box-shadow coloré) en plus du scale existant
    - Ajouter bordure lumineuse animée au survol (gradient border qui pulse)
    - Modifier le badge metascore avec un style néon (glow autour du badge)
    - Conserver l'overlay au survol avec les informations du jeu
    - Désactiver les animations si `prefers-reduced-motion` est activé
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 6.2 Modifier `EntityCard.tsx` avec les mêmes effets néon
    - Appliquer les mêmes effets néon que GameCard pour cohérence (glow, bordure animée)
    - Modifier le rendu du badge metascore variant avec glow néon
    - _Requirements: 4.1, 4.2, 4.3_

  - [ ]* 6.3 Écrire le test de propriété P7 — Badge metascore néon
    - **Property 7: Badge metascore avec style néon**
    - Fichier : `test/unit/components/games/GameCard.property.test.ts`
    - Pour tout score 0-100, le badge doit inclure un glow néon (box-shadow coloré)
    - **Validates: Requirements 4.3**

- [x] 7. Refonte de la page d'accueil (Landing)
  - [x] 7.1 Refactoriser `LandingLayout.tsx`
    - Remplacer le fond `bg-gradient-to-br from-slate-50 to-slate-100` par un fond sombre gaming cohérent
    - _Requirements: 5.1_

  - [x] 7.2 Refactoriser `LandingHeader.tsx`
    - Appliquer le style gaming cohérent avec le header connecté (glass-header, accents néon)
    - Boutons CTA avec style néon (`.neon-btn`)
    - _Requirements: 5.2_

  - [x] 7.3 Refactoriser `LandingContent.tsx`
    - Hero : fond sombre, grille animée CSS, typographie bold avec accents néon (`.neon-text`)
    - CTA : boutons avec bordures lumineuses et glow au survol (`.neon-btn`)
    - Cartes features : utiliser le style `glass-card` gaming (bordures néon, glow)
    - Stats : compteurs avec glow néon sur les chiffres, icônes colorées
    - Conserver la structure responsive (mobile, tablette, desktop)
    - Respecter `prefers-reduced-motion` pour les animations de grille
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [ ]* 7.4 Écrire les tests unitaires de la landing
    - Fichier : `test/unit/components/landing/LandingContent.test.tsx`
    - Hero avec fond sombre et typo bold (Req 5.1)
    - CTA avec style néon (Req 5.2)
    - Cartes features avec glass gaming (Req 5.3)
    - Stats avec compteurs glow (Req 5.4)
    - Structure responsive préservée (Req 5.5)
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 8. Refonte du dashboard connecté et typographie
  - [x] 8.1 Refactoriser `DashboardContent.tsx`
    - Message de bienvenue avec typographie gaming : `.neon-text` ou `font-bold` + accents néon sur le nom du joueur
    - Cartes de statistiques (`DashboardStatCard`) : icônes gaming stylisées, valeurs numériques avec glow néon
    - Boutons d'actions rapides avec style gaming (`.neon-btn`, icônes proéminentes)
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 8.2 Appliquer la typographie gaming globale
    - Vérifier que la police Inter (ou similaire sans-serif géométrique) est configurée dans le layout racine
    - Appliquer `.neon-text` (text-shadow néon) sur les titres h1 des pages
    - S'assurer que les titres de section utilisent `text-2xl` (1.5rem) minimum et `font-bold` (700)
    - Utiliser des icônes gaming cohérentes via react-icons (FaGamepad, FaTrophy, FaFire, etc.)
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [x] 8.3 Ajouter les animations d'entrée de page
    - Appliquer un effet fade-in + slide-up sur le contenu principal au chargement (utiliser les animations existantes `slideInUp`, `fadeIn`)
    - Ajouter glow néon au survol des boutons d'action
    - Anneau de focus néon (`.neon-focus`) sur tous les éléments interactifs
    - Limiter toutes les transitions à 300ms
    - _Requirements: 8.1, 8.2, 8.3, 8.5_

  - [ ]* 8.4 Écrire le test de propriété P8 — Typographie gaming
    - **Property 8: Typographie gaming des titres**
    - Fichier : `test/unit/lib/utils/neonTypography.property.test.ts`
    - Pour tout h1 avec `.neon-text`, un text-shadow néon doit être appliqué ; pour tout titre de section, taille ≥ 1.5rem et graisse 700
    - **Validates: Requirements 7.2, 7.4**

  - [ ]* 8.5 Écrire le test de propriété P12 — Message de bienvenue gaming
    - **Property 12: Message de bienvenue personnalisé gaming**
    - Fichier : `test/unit/components/dashboard/DashboardContent.property.test.ts`
    - Pour tout nom d'utilisateur non vide, le message de bienvenue contient le nom et utilise les classes de typographie gaming
    - **Validates: Requirements 6.1**

  - [ ]* 8.6 Écrire les tests unitaires du dashboard
    - `test/unit/components/dashboard/DashboardContent.test.tsx` : boutons d'action rapide avec style gaming (Req 6.3)
    - `test/unit/components/layout/DashboardLayout.test.tsx` : animation fade-in + slide-up appliquée (Req 8.1)
    - _Requirements: 6.3, 8.1_

- [x] 9. Checkpoint final — Vérifier l'ensemble
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Lint du code
  - [x] 10.1 Exécuter `bun run lint`
  - [x] 10.2 Vérifier qu'il n'y a pas d'erreurs ni de warnings de lint
  - [x] 10.3 Corriger les erreurs et warnings de lint si nécessaire

- [x] 11. Build de production
  - [x] 11.1 Exécuter `bun run build`
  - [x] 11.2 Vérifier qu'il n'y a pas d'erreurs de compilation
  - [x] 11.3 Corriger les erreurs de build si nécessaire

- [x] 12. README de la fonctionnalité
  - [x] 12.1 Créer `docs/README_GAMING_UI_REDESIGN.md`
  - [x] 12.2 Documenter ce qui a été implémenté (description, accès, prérequis, utilisation)

## Notes

- Les tâches marquées `*` sont optionnelles et peuvent être ignorées pour un MVP plus rapide
- Chaque tâche référence les exigences spécifiques pour la traçabilité
- Les checkpoints assurent une validation incrémentale
- Les tests de propriétés utilisent fast-check avec minimum 100 itérations
- Les tests unitaires utilisent Vitest + @testing-library/react
- Aucune migration Supabase n'est nécessaire (refonte purement visuelle)
- Les fichiers `DashboardSidebar.tsx` et `SidebarContent.tsx` ne sont pas supprimés dans les tâches — ils deviennent obsolètes après la tâche 4.5 et pourront être nettoyés ultérieurement
