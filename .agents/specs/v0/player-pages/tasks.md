# Plan d'implémentation : Player Pages

## Vue d'ensemble

Ce plan implémente les pages joueurs pour Game Universe en suivant les patterns
existants des pages games et characters. L'implémentation utilise TypeScript,
Next.js App Router, Supabase et les composants UI existants.

## Tâches

- [x] 1. Configuration de la base de données et types
  - [x] 1.1 Créer la migration pour la politique RLS de lecture publique des
        profils
    - Ajouter une politique permettant la lecture publique des profils (sans
      email)
    - _Requirements: 5.1, 6.1_
  - [x] 1.2 Créer les types TypeScript pour les joueurs
    - Créer `src/types/player.ts` avec PlayerSummary, PlayerDetails,
      PlayerStats, PlayerLibraryGame
    - _Requirements: 1.2, 5.2, 6.4_

- [x] 2. Service et API des joueurs
  - [x] 2.1 Créer le service PlayerService
    - Créer `src/lib/services/playerService.ts`
    - Implémenter fetchPlayersFromDB avec pagination, recherche et filtres
    - Implémenter fetchPlayerDetailsFromDB avec bibliothèque et stats
    - _Requirements: 1.1, 2.1, 3.2, 4.1, 5.1, 6.1_
  - [x] 2.2 Écrire le test property pour le calcul des statistiques
    - **Property 7: Calcul des statistiques**
    - **Validates: Requirements 6.4**
  - [x] 2.3 Créer l'API route pour la liste des joueurs
    - Créer `src/app/api/players/route.ts`
    - Supporter les paramètres: search, gameCountRange, page, limit
    - _Requirements: 1.1, 2.1, 3.2, 4.1_
  - [x] 2.4 Créer l'API route pour les détails d'un joueur
    - Créer `src/app/api/players/[id]/route.ts`
    - Retourner le profil complet avec bibliothèque et stats
    - _Requirements: 5.1, 5.3, 6.1_

- [ ] 3. Checkpoint - Vérifier les API
  - Tester les endpoints API manuellement
  - S'assurer que les données sont correctement retournées

- [x] 4. Composants de la liste des joueurs
  - [x] 4.1 Créer le composant PlayerCard
    - Créer `src/components/players/PlayerCard.tsx`
    - Afficher avatar, nom, nombre de jeux
    - Lien vers la page de profil
    - _Requirements: 1.2, 7.1_
  - [x] 4.2 Créer le composant PlayerCardSkeleton
    - Créer `src/components/players/PlayerCardSkeleton.tsx`
    - Skeleton de chargement pour la carte
    - _Requirements: 1.3_
  - [x] 4.3 Créer le composant PlayerGridSkeleton
    - Créer `src/components/players/PlayerGridSkeleton.tsx`
    - Grille de skeletons pour le chargement initial
    - _Requirements: 1.3_
  - [x] 4.4 Créer le composant PlayerSearchBar
    - Créer `src/components/players/PlayerSearchBar.tsx`
    - Input avec debounce de 300ms
    - _Requirements: 3.1, 3.2, 3.4_
  - [x] 4.5 Écrire le test property pour la recherche
    - **Property 3: Recherche par nom insensible à la casse**
    - **Validates: Requirements 3.2**
  - [x] 4.6 Créer le composant PlayerFilters
    - Créer `src/components/players/PlayerFilters.tsx`
    - Filtres par plage de nombre de jeux (0, 1-5, 6-20, 20+)
    - _Requirements: 4.1, 4.3_
  - [x] 4.7 Écrire le test property pour le filtrage
    - **Property 4: Filtrage par plage de nombre de jeux**
    - **Validates: Requirements 4.1**
  - [x] 4.8 Créer le composant PlayerFilterButton
    - Créer `src/components/players/PlayerFilterButton.tsx`
    - Bouton avec indicateur de filtres actifs
    - _Requirements: 4.4_
  - [x] 4.9 Créer le composant PlayerPagination
    - Créer `src/components/players/PlayerPagination.tsx`
    - Navigation entre pages avec info total
    - _Requirements: 2.1, 2.2, 2.3_
  - [x] 4.10 Écrire le test property pour la pagination
    - **Property 2: Pagination correcte**
    - **Validates: Requirements 2.1, 2.3**

- [x] 5. Composant principal de la liste
  - [x] 5.1 Créer le composant AllPlayersContent
    - Créer `src/components/players/AllPlayersContent.tsx`
    - Intégrer recherche, filtres, grille et pagination
    - Gérer les états de chargement et erreur
    - _Requirements: 1.1, 1.4, 2.4, 3.3, 4.2, 9.1, 9.3_

- [ ] 6. Checkpoint - Vérifier les composants liste
  - S'assurer que tous les composants de liste fonctionnent ensemble
  - Vérifier le responsive design

- [x] 7. Composants du profil joueur
  - [x] 7.1 Créer le composant PlayerLibraryGrid
    - Créer `src/components/players/PlayerLibraryGrid.tsx`
    - Grille de jeux avec image, titre, statut
    - Liens vers les pages de jeux
    - _Requirements: 6.1, 6.2, 6.3, 7.3_
  - [x] 7.2 Écrire le test property pour l'affichage de la bibliothèque
    - **Property 6: Affichage de la bibliothèque**
    - **Validates: Requirements 6.1, 6.2**
  - [x] 7.3 Créer le composant PlayerDetailsContent
    - Créer `src/components/players/PlayerDetailsContent.tsx`
    - Afficher profil complet avec stats et bibliothèque
    - Bouton retour vers la liste
    - _Requirements: 5.2, 6.4, 7.2_
  - [x] 7.4 Écrire le test property pour le rendu des informations
    - **Property 1: Rendu des informations joueur**
    - **Validates: Requirements 1.2, 5.2**

- [x] 8. Pages Next.js
  - [x] 8.1 Créer la page liste des joueurs
    - Créer `src/app/[locale]/players/page.tsx`
    - Utiliser DashboardLayout et ErrorBoundary
    - _Requirements: 1.1, 9.2_
  - [x] 8.2 Créer la page d'erreur
    - Créer `src/app/[locale]/players/error.tsx`
    - Gestion des erreurs de la page
    - _Requirements: 9.1, 9.2_
  - [x] 8.3 Créer la page profil joueur
    - Créer `src/app/[locale]/players/[id]/page.tsx`
    - Server component avec fetch des données
    - Gestion 404 si joueur non trouvé
    - Métadonnées SEO
    - _Requirements: 5.1, 5.3, 5.4, 9.2_

- [x] 9. Internationalisation
  - [x] 9.1 Ajouter les traductions françaises
    - Mettre à jour `src/messages/fr.json` avec la section players
    - _Requirements: 8.1, 8.2_
  - [x] 9.2 Ajouter les traductions anglaises
    - Mettre à jour `src/messages/en.json` avec la section players
    - _Requirements: 8.1, 8.2_
  - [x] 9.3 Écrire le test property pour l'internationalisation
    - **Property 8: Internationalisation**
    - **Validates: Requirements 8.1, 8.3, 8.4**

- [ ] 10. Checkpoint final
  - S'assurer que tous les tests passent
  - Vérifier l'intégration complète
  - Demander à l'utilisateur s'il y a des questions

## Notes

- Les tâches marquées avec `*` sont optionnelles (tests property-based)
- Chaque tâche référence les exigences spécifiques pour la traçabilité
- Les checkpoints permettent de valider l'avancement incrémental
- Les tests property-based utilisent fast-check avec minimum 100 itérations
