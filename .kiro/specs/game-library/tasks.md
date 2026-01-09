# Implementation Plan: Game Library

## Overview

Ce plan d'implémentation transforme la conception Game Universe en une série de
tâches de développement incrémentales. L'approche privilégie la création d'un
MVP fonctionnel avec Next.js 16, TypeScript, shadcn/ui, Supabase, et next-intl
pour l'internationalisation.

**Utilisation de Bun comme runtime :**

- **Performances accrues** : Installation des dépendances 10-25x plus rapide
- **Développement optimisé** : Démarrage Next.js et hot reload accélérés
- **Tests intégrés** : Test runner natif compatible avec Jest/fast-check
- **Build optimisé** : Bundler intégré pour des builds plus rapides
- **TypeScript natif** : Transpilation ultra-rapide sans configuration

L'implémentation suit une approche progressive : configuration de base →
authentification → internationalisation → fonctionnalités core → tests →
optimisations.

## Tasks

- [x] 1. Configuration initiale du projet Next.js 16 avec Bun
  - Installer Bun et créer le projet Next.js 16 avec TypeScript et App Router
  - Configurer Bun avec bunfig.toml pour des performances optimales
  - Installer et configurer shadcn/ui avec Tailwind CSS via Bun
  - Configurer la structure de dossiers selon les bonnes pratiques
  - _Requirements: Architecture générale_

- [x] 1.1 Configurer les outils de développement avec Bun
  - Configurer ESLint, Prettier, et Husky avec Bun comme runtime
  - Configurer les scripts de développement et build optimisés pour Bun
  - Configurer bun.config.ts pour les tests et le build
  - _Requirements: Architecture générale_

- [x] 2. Configuration Supabase et base de données
  - [x] 2.1 Initialiser le projet Supabase
    - Créer le projet Supabase et configurer les variables d'environnement
    - Installer les packages Supabase pour Next.js avec Bun
    - _Requirements: 6.1, 6.2_

  - [x] 2.2 Créer les migrations de base de données
    - Implémenter la migration 001: tables principales (games, genres,
      languages, profiles)
    - Implémenter la migration 002: RLS et politiques de sécurité
    - _Requirements: 6.1, 6.2, 10.1_

  - [x] 2.3 Configurer les seeds modulaires
    - Créer les fichiers de seeds par table (languages, genres, sample games)
    - Implémenter le fichier seed.sql principal qui orchestre l'exécution
    - _Requirements: 6.1_

  - [x] 2.4 Tester la configuration de base de données
    - Vérifier que les migrations s'appliquent correctement
    - Vérifier que les seeds s'exécutent sans erreur
    - Tester les politiques RLS
    - _Requirements: 6.1, 6.2_

- [x] 3. Configuration de l'internationalisation
  - [x] 3.1 Installer et configurer next-intl
    - Installer next-intl avec Bun et configurer les locales (fr, en)
    - Créer les fichiers de traduction de base
    - Configurer le middleware pour la détection de langue
    - _Requirements: 7.1, 7.2, 7.3_

  - [x] 3.2 Créer les composants d'internationalisation
    - Implémenter le LanguageSwitcher avec shadcn/ui Select
    - Créer les hooks personnalisés pour les traductions
    - _Requirements: 7.2_

  - [x] 3.3 Tester l'internationalisation
    - Vérifier le changement de langue en temps réel
    - Tester le fallback vers la langue par défaut
    - _Requirements: 7.1, 7.2, 7.5_

- [x] 4. Système d'authentification
  - [x] 4.1 Configurer Supabase Auth
    - Configurer les providers d'authentification (email/password)
    - Implémenter les API routes pour l'authentification
    - Créer le middleware d'authentification
    - _Requirements: 10.1, 10.2, 10.5_

  - [x] 4.2 Créer les composants d'authentification
    - Implémenter AuthForm avec shadcn/ui (signin/signup)
    - Créer les pages de connexion et inscription
    - Implémenter la gestion des erreurs d'authentification
    - _Requirements: 10.1, 10.2, 10.4_

  - [x] 4.3 Implémenter la gestion des profils utilisateurs
    - Créer l'API route pour la gestion des profils
    - Implémenter la création automatique de profil à l'inscription
    - Gérer les préférences utilisateur (langue)
    - _Requirements: 10.1, 7.1_

  - [x] 4.4 Tester l'authentification
    - Tester l'inscription avec validation email
    - Tester la connexion et déconnexion
    - Vérifier les redirections automatiques
    - _Requirements: 10.1, 10.2, 10.3, 9.1, 9.3_

- [x] 5. Page d'accueil et navigation
  - [x] 5.1 Créer la page d'accueil (Landing Page)
    - Implémenter la LandingPage avec shadcn/ui components
    - Créer une présentation attractive du site
    - Ajouter les CTA pour inscription/connexion
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [x] 5.2 Implémenter le système de navigation
    - Créer le Header avec navigation conditionnelle
    - Implémenter les redirections basées sur l'authentification
    - Gérer les états de chargement pendant l'authentification
    - _Requirements: 9.1, 9.2, 9.3, 9.5_

  - [x] 5.3 Tester la navigation et les redirections
    - Vérifier les redirections pour utilisateurs connectés/non connectés
    - Tester la navigation entre les pages
    - _Requirements: 8.4, 8.5, 9.1, 9.3, 9.5_

- [x] 6. Dashboard utilisateur
  - [x] 6.1 Créer la structure du Dashboard
    - Implémenter la page Dashboard avec layout responsive
    - Créer la navigation interne du dashboard
    - Ajouter l'accès à la bibliothèque de jeux
    - _Requirements: 9.2, 9.4_

  - [x] 6.2 Implémenter les fonctionnalités de base du Dashboard
    - Afficher les informations utilisateur
    - Créer les liens vers les fonctionnalités principales
    - Implémenter la déconnexion
    - _Requirements: 9.2, 9.3, 9.4_

- [x] 7. Bibliothèque de jeux - Fonctionnalités core
  - [x] 7.1 Créer l'API pour les jeux
    - Implémenter l'API route pour lister les jeux avec pagination
    - Ajouter le support de l'internationalisation dans les requêtes
    - Implémenter la recherche par titre avec support multilingue
    - _Requirements: 1.1, 1.2, 2.1, 2.4, 7.4_

  - [x] 7.2 Implémenter les composants de la bibliothèque
    - Créer GameLibrary avec grille responsive et shadcn/ui
    - Implémenter GameCard avec informations essentielles
    - Créer SearchBar avec Input de shadcn/ui
    - _Requirements: 1.1, 1.2, 1.4, 2.1, 5.1, 5.2, 5.3_

  - [x] 7.3 Ajouter la pagination
    - Implémenter Pagination avec Button de shadcn/ui
    - Gérer la navigation entre les pages
    - Maintenir l'état de recherche lors de la pagination
    - _Requirements: 1.3_

  - [x] 7.4 (Optionnel) Écrire les tests de propriété pour la bibliothèque avec
        Bun
    - Configurer fast-check avec le test runner intégré de Bun
    - **Property 1: Game List Display Completeness**
    - **Validates: Requirements 1.2**

  - [x] 7.5 (Optionnel) Écrire les tests unitaires pour la bibliothèque avec Bun
    - Utiliser le test runner intégré de Bun pour les tests unitaires
    - Tester l'affichage des jeux avec différents états
    - Tester la gestion des états vides
    - _Requirements: 1.5_

- [x] 8. Système de recherche et filtrage
  - [x] 8.1 Implémenter la recherche avancée
    - Étendre l'API pour supporter les filtres par genre
    - Implémenter la recherche insensible à la casse
    - Gérer les requêtes vides et les résultats vides
    - _Requirements: 2.2, 2.3, 2.5, 3.1, 3.2, 3.3_

  - [x] 8.2 Créer le système de filtres
    - Implémenter FilterPanel avec Checkbox de shadcn/ui
    - Ajouter les compteurs de jeux par genre
    - Gérer les filtres multiples et leur réinitialisation
    - _Requirements: 3.1, 3.2, 3.4, 3.5_

  - [ ] 8.3 (Optionnel) Écrire les tests de propriété pour la recherche avec Bun
    - **Property 3: Search Title Matching**
    - **Property 4: Search State Reset**
    - **Validates: Requirements 2.1, 2.4, 2.5**

  - [ ] 8.4 (Optionnel) Écrire les tests de propriété pour les filtres avec Bun
    - **Property 5: Genre Filter Accuracy**
    - **Property 6: Genre Count Accuracy**
    - **Property 7: Filter State Reset**
    - **Validates: Requirements 3.1, 3.2, 3.4, 3.5**

- [ ] 9. Page de détails des jeux
  - [x] 9.1 Créer l'API pour les détails de jeu
    - Implémenter l'API route pour récupérer un jeu par slug
    - Inclure toutes les informations détaillées et traductions
    - Gérer les cas où le jeu n'existe pas (slug invalide)
    - _Requirements: 4.1, 4.6_

  - [x] 9.2 Créer la page de détails de jeu (/games/[slug])
    - Créer la structure de page /games/[slug]/page.tsx
    - Implémenter GameDetailsContent avec toutes les informations requises
    - Afficher les informations techniques, prix, et métadonnées
    - Implémenter la navigation de retour vers la bibliothèque
    - _Requirements: 4.1, 4.2, 4.5, 4.6_

  - [x] 9.3 Créer la galerie de médias
    - Implémenter MediaGallery avec Dialog et Carousel de shadcn/ui
    - Organiser screenshots, artwork, trailers, et gameplay
    - Ajouter les contrôles de navigation dans la galerie
    - _Requirements: 4.3, 4.4_

  - [ ] 9.4 (Optionnel) Écrire les tests de propriété pour les détails avec Bun
    - **Property 8: Game Details Completeness**
    - **Property 9: Media Gallery Completeness**
    - **Validates: Requirements 4.2, 4.3, 4.4**

- [ ] 10. Responsive design et accessibilité
  - [x] 10.1 Implémenter le responsive design
    - Adapter tous les composants pour mobile, tablette, desktop
    - Gérer les changements d'orientation
    - Optimiser la grille de jeux pour différentes tailles d'écran
    - _Requirements: 5.1, 5.2, 5.3, 5.5_

  - [ ] 10.2 Améliorer l'accessibilité
    - Ajouter les attributs ARIA appropriés
    - Gérer la navigation au clavier
    - Optimiser pour les lecteurs d'écran
    - _Requirements: 5.4_

  - [ ] 10.3 (Optionnel) Écrire les tests de propriété pour le responsive avec
        Bun
    - **Property 10: Responsive Layout Adaptation**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.5**

- [ ] 11. Fonctionnalités administratives
  - [x] 11.1 Créer les API routes d'administration
    - Implémenter CRUD pour les jeux avec validation
    - Ajouter les opérations en lot (bulk operations)
    - Gérer les mises à jour en temps réel
    - _Requirements: 6.1, 6.2, 6.4, 6.5_

  - [x] 11.2 Implémenter la suppression et cohérence
    - Gérer la suppression des jeux avec nettoyage complet
    - Assurer la cohérence dans tous les résultats de recherche
    - _Requirements: 6.3_

  - [ ] 11.3 (Optionnel) Écrire les tests de propriété pour l'administration
        avec Bun
    - **Property 11: Game Validation Integrity**
    - **Property 12: Game Deletion Consistency**
    - **Property 13: Bulk Operations Atomicity**
    - **Property 14: Real-time Display Updates**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5**

- [ ] 12. Gestion d'erreurs et états de chargement
  - [ ] 12.1 Implémenter la gestion d'erreurs globale
    - Créer les Error Boundaries React
    - Implémenter les composants Toast pour les notifications
    - Gérer les erreurs réseau avec retry automatique
    - _Requirements: Gestion d'erreurs_

  - [ ] 12.2 Ajouter les états de chargement
    - Implémenter les Skeleton components de shadcn/ui
    - Ajouter les indicateurs de chargement pour toutes les opérations
    - Gérer le lazy loading des images
    - _Requirements: Gestion d'erreurs_

- [ ] 13. Configuration email avec Resend
  - [ ] 13.1 Configurer Resend pour les emails transactionnels
    - Intégrer Resend avec Supabase Auth
    - Configurer les templates d'email (vérification, reset password)
    - Tester l'envoi d'emails
    - _Requirements: 10.3_

- [ ] 14. Checkpoint final - Tests et déploiement
  - [ ] 14.1 (Optionnel) Tests d'intégration complets avec Bun
    - Utiliser le test runner de Bun pour les tests d'intégration
    - Tester tous les parcours utilisateur critiques
    - Vérifier l'internationalisation sur toutes les pages
    - Tester l'authentification et les redirections
    - _Requirements: Tous_

  - [ ] 14.2 Préparation au déploiement Vercel avec Bun
    - Configurer Vercel pour utiliser Bun comme runtime de build
    - Configurer les variables d'environnement pour la production
    - Optimiser les performances (images, bundles) avec le bundler de Bun
    - Configurer les domaines et redirections
    - _Requirements: Architecture_

  - [ ] 14.3 (Optionnel) Tests de performance et accessibilité
    - Exécuter les audits Lighthouse
    - Tester avec les lecteurs d'écran
    - Vérifier les performances sur mobile
    - _Requirements: 5.4_

- [ ] 15. Finalisation - (Optionnel) Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Les tâches principales sont obligatoires pour un MVP fonctionnel
- **Les étapes de tests sont optionnelles** mais recommandées pour une approche
  robuste
- **Bun est utilisé comme runtime** pour des performances optimales de
  développement
- Chaque tâche référence les exigences spécifiques pour la traçabilité
- Les checkpoints permettent une validation incrémentale
- Les tests de propriété valident les propriétés de correction universelles
  (optionnels)
- Les tests unitaires valident les exemples spécifiques et cas limites
  (optionnels)
- L'approche privilégie un MVP fonctionnel avec possibilité d'ajouter les tests
  plus tard

**Avantages de Bun dans ce projet :**

- **Installation ultra-rapide** des dépendances (10-25x plus rapide que npm)
- **Démarrage accéléré** de Next.js pour une meilleure expérience développeur
- **Test runner intégré** compatible avec Jest et fast-check
- **TypeScript natif** sans configuration supplémentaire
- **Bundler intégré** pour des builds optimisés
- **Compatibilité parfaite** avec Next.js 16 et l'écosystème React

- [x] 16. Restructuration et nouvelles fonctionnalités
  - [x] 16.1 Restructurer l'architecture des composants
    - Créer la structure de dossiers par page (shared/, dashboard/, games/,
      library/)
    - Déplacer les composants existants dans les bons dossiers
    - Créer le DashboardLayout partagé pour toutes les pages connectées
    - _Requirements: Architecture générale_

  - [x] 16.2 Créer la page "Tous les jeux" (/games)
    - Implémenter AllGamesContent avec recherche avancée
    - Créer GameFilters avec filtres par genre, plateforme, éditeur
    - Ajouter GameSearchBar avec recherche en temps réel
    - Implémenter GamePagination pour la navigation
    - _Requirements: 1.1, 1.2, 2.1, 2.4, 7.4_

  - [x] 16.3 Créer la page "Ma bibliothèque" (/library)
    - Implémenter UserLibraryContent pour les jeux de l'utilisateur
    - Afficher les statistiques personnelles (jeux possédés, terminés, temps de
      jeu)
    - Créer l'état vide avec CTA vers la page des jeux
    - _Requirements: Bibliothèque personnelle_

  - [x] 16.4 Mettre à jour la navigation
    - Modifier DashboardLayout pour inclure "Jeux" et "Ma bibliothèque"
    - Distinguer clairement les deux sections dans la sidebar
    - Mettre à jour les breadcrumbs et états actifs
    - _Requirements: Navigation cohérente_

  - [ ] 16.5 (Optionnel) Écrire les tests pour la nouvelle architecture
    - Tester les nouveaux composants games/\*
    - Tester les nouveaux composants library/\*
    - Tester le DashboardLayout partagé
    - _Requirements: Tests de régression_

## Notes sur la nouvelle architecture

**Distinction claire entre les pages :**

- **Dashboard** (`/dashboard`) : Vue d'ensemble, statistiques, actions rapides
- **Tous les jeux** (`/games`) : Catalogue complet avec recherche et filtres
  avancés
- **Ma bibliothèque** (`/library`) : Collection personnelle de l'utilisateur

**Organisation des composants :**

- `src/components/shared/` : Layouts et composants partagés
- `src/components/dashboard/` : Composants spécifiques au tableau de bord
- `src/components/games/` : Composants pour la page de tous les jeux
- `src/components/library/` : Composants pour la bibliothèque utilisateur
- `src/components/ui/` : Composants UI de base (shadcn/ui)

**Layouts :**

- **Landing Page Layout** : Pour les utilisateurs non connectés
- **Dashboard Layout** : Layout unifié pour toutes les pages connectées

- [ ] 17. Fonctionnalités manquantes pour compléter les exigences
  - [ ] 17.1 Améliorer la gestion des médias dans les jeux existants
    - Mettre à jour les seeds pour inclure plus de médias (screenshots, artwork,
      vidéos)
    - Améliorer l'affichage des médias dans GameCard
    - Optimiser le chargement des images avec next/image
    - _Requirements: 4.3, 4.4_

  - [ ] 17.2 Implémenter la fonctionnalité "Ajouter à ma bibliothèque"
    - Créer l'API pour gérer la bibliothèque utilisateur (ajout/suppression)
    - Ajouter le bouton "Ajouter à ma bibliothèque" sur GameCard
    - Mettre à jour UserLibraryContent pour afficher les jeux de l'utilisateur
    - Gérer les états (déjà dans la bibliothèque, ajout en cours)
    - _Requirements: Bibliothèque personnelle_

  - [ ] 17.3 Améliorer la gestion des erreurs et états de chargement
    - Implémenter des Error Boundaries React pour les composants
    - Ajouter des Skeleton components pour les états de chargement
    - Améliorer la gestion des erreurs réseau avec retry automatique
    - _Requirements: Gestion d'erreurs_

  - [ ] 17.4 Optimiser les performances et l'accessibilité
    - Implémenter le lazy loading pour les images
    - Ajouter les attributs ARIA appropriés
    - Optimiser les requêtes de base de données avec des index
    - Tester la navigation au clavier
    - _Requirements: 5.4, Performance_

Cette architecture améliore la maintenabilité et la scalabilité du projet en
séparant clairement les responsabilités de chaque composant.
