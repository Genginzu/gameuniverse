# Plan d'implémentation : Statistiques Joueur Enrichies

## Vue d'ensemble

Implémentation incrémentale des statistiques enrichies : types → migration DB →
service de calcul → routes API → composants UI → page résumé annuel.

## Tâches

- [ ] 1. Types et migration base de données
  - [ ] 1.1 Créer le fichier de types `src/types/player-stats.ts`
    - Définir `EnrichedStats`, `FavoriteGenre`, `TopGame`, `MostActiveMonth`, `YearInReview`
    - Définir `EnrichedStatsResponse`, `YearInReviewResponse`
    - _Requirements: 1.1, 2.1, 2.4, 3.1, 3.3, 5.1, 5.2, 5.5_

  - [ ] 1.2 Créer la migration `supabase/migrations/20240221000001_player_stats_privacy.sql`
    - Ajouter la colonne `stats_private BOOLEAN DEFAULT FALSE` à la table `profiles`
    - Ajouter un `COMMENT ON COLUMN` pour documenter
    - _Requirements: 8.1, 8.4_

- [ ] 2. Service de calcul des statistiques
  - [ ] 2.1 Créer `src/lib/services/playerStatsService.ts` — méthodes `fetchEnrichedStats` et `computeFavoriteGenre`
    - Implémenter le calcul du temps de jeu total (somme de `play_time_hours`)
    - Implémenter le calcul du genre favori avec pondération multi-genre
    - Implémenter le comptage des reviews et la note moyenne
    - Gérer le cas `stats_private` (retourner null pour les visiteurs)
    - _Requirements: 1.1, 1.3, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 8.2, 8.3_

  - [ ]* 2.2 Écrire le test property pour la somme du temps de jeu total
    - **Property 1 : Somme du temps de jeu total**
    - **Validates: Requirements 1.1**

  - [ ]* 2.3 Écrire le test property pour la précision décimale
    - **Property 2 : Précision décimale du temps de jeu**
    - **Validates: Requirements 1.3**

  - [ ]* 2.4 Écrire le test property pour le calcul du genre favori
    - **Property 3 : Calcul du genre favori avec pondération multi-genre**
    - **Validates: Requirements 2.1, 2.2, 2.4**

  - [ ]* 2.5 Écrire le test property pour le comptage des reviews
    - **Property 4 : Comptage des reviews et note moyenne**
    - **Validates: Requirements 3.1, 3.3**

  - [ ]* 2.6 Écrire le test property pour le formatage des nombres
    - **Property 5 : Formatage des nombres selon la locale**
    - **Validates: Requirements 4.4**

- [ ] 3. Service de calcul du résumé annuel
  - [ ] 3.1 Ajouter les méthodes `fetchYearInReview`, `fetchAvailableYears`, `computeMostActiveMonth` au `PlayerStatsService`
    - Implémenter le filtrage par année (basé sur `added_at`)
    - Implémenter le calcul du jeu le plus joué de l'année
    - Implémenter le calcul du mois le plus actif
    - Implémenter la récupération des années disponibles
    - Valider que l'année n'est pas dans le futur
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ]* 3.2 Écrire le test property pour le filtrage par année
    - **Property 6 : Filtrage par année pour le résumé annuel**
    - **Validates: Requirements 5.1**

  - [ ]* 3.3 Écrire le test property pour le mois le plus actif
    - **Property 7 : Calcul du mois le plus actif**
    - **Validates: Requirements 5.5**

- [ ] 4. Checkpoint — Vérifier que tous les tests passent
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Routes API
  - [ ] 5.1 Créer `src/app/api/players/[id]/stats/route.ts`
    - Endpoint GET retournant les stats enrichies
    - Validation de l'ID joueur (UUID), gestion 404/400
    - Paramètre query `locale` (défaut `fr`)
    - Gestion de la confidentialité (vérifier `stats_private` + identité du visiteur)
    - _Requirements: 1.1, 2.1, 3.1, 8.2, 8.3, 10.2, 10.3_

  - [ ] 5.2 Créer `src/app/api/players/[id]/year/[year]/route.ts`
    - Endpoint GET retournant le résumé annuel
    - Validation de l'ID joueur et de l'année (pas dans le futur)
    - Paramètre query `locale` (défaut `fr`)
    - Gestion de la confidentialité
    - _Requirements: 5.1, 5.4, 8.2, 10.2, 10.3_

  - [ ]* 5.3 Écrire les tests unitaires pour les routes API
    - Tester les cas d'erreur : ID invalide (400), joueur inexistant (404), année future (400)
    - Tester le cas stats privées (réponse avec `stats: null`)
    - _Requirements: 5.4, 8.2, 10.2, 10.3_

- [ ] 6. Composants UI — Statistiques enrichies
  - [ ] 6.1 Créer `src/components/players/PlayerEnrichedStats.tsx`
    - Afficher les cartes : temps de jeu total, genre favori, nombre de reviews
    - Gérer le skeleton de chargement
    - Gérer le cas genre favori nul
    - Gérer le cas stats privées (message « Statistiques privées »)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 8.2_

  - [ ] 6.2 Créer `src/components/players/YearInReviewLink.tsx`
    - Afficher un lien vers le résumé annuel (année courante ou dernière année avec données)
    - Masquer le lien si aucune année n'a de données
    - _Requirements: 7.1, 7.2, 7.3_

  - [ ]* 6.3 Écrire le test property pour la résolution du lien vers l'année
    - **Property 8 : Résolution du lien vers l'année**
    - **Validates: Requirements 7.2**

  - [ ] 6.4 Intégrer `PlayerEnrichedStats` et `YearInReviewLink` dans `PlayerDetailsContent.tsx`
    - Ajouter la section stats enrichies après les stats existantes
    - Passer les props nécessaires (`playerId`, `locale`, `isOwnProfile`, `statsPrivate`)
    - _Requirements: 4.1, 7.1_

  - [ ]* 6.5 Écrire le test property pour la visibilité des statistiques
    - **Property 9 : Visibilité des statistiques selon la confidentialité**
    - **Validates: Requirements 8.2, 8.3**

- [ ] 7. Page Résumé Annuel
  - [ ] 7.1 Créer `src/app/[locale]/players/[id]/year/[year]/page.tsx`
    - Server component qui récupère les données via l'API
    - Gestion 404 si joueur inexistant
    - Gestion du cas année sans données
    - _Requirements: 6.1, 6.3, 6.4_

  - [ ] 7.2 Créer `src/components/players/YearInReviewContent.tsx`
    - Afficher les statistiques annuelles dans des cartes visuelles colorées
    - Afficher le jeu le plus joué avec sa couverture
    - Afficher le mois le plus actif
    - Afficher un lien retour vers le profil
    - _Requirements: 6.1, 6.2, 6.4, 6.5_

- [ ] 8. Internationalisation
  - [ ] 8.1 Ajouter les clés de traduction dans `src/messages/fr.json` et `src/messages/en.json`
    - Clés pour les labels des stats enrichies, le résumé annuel, les messages d'erreur, les états vides
    - _Requirements: 9.1, 9.2_

- [ ] 9. Checkpoint final — Vérifier que tous les tests passent
  - Exécuter `bun run test:all`
  - Vérifier que tous les tests passent (parallèles + isolés)
  - Corriger les tests en échec si nécessaire

- [ ] 10. Lint du code
  - [ ] 10.1 Exécuter `bun run lint`
  - [ ] 10.2 Vérifier qu'il n'y a pas d'erreurs ni de warnings de lint
  - [ ] 10.3 Corriger les erreurs et warnings de lint si nécessaire

- [ ] 11. Build de production
  - [ ] 11.1 Exécuter `bun run build`
  - [ ] 11.2 Vérifier qu'il n'y a pas d'erreurs de compilation
  - [ ] 11.3 Corriger les erreurs de build si nécessaire

- [ ] 12. README de la fonctionnalité
  - [ ] 12.1 Créer `docs/README_PLAYER_ENRICHED_STATS.md`
  - [ ] 12.2 Documenter ce qui a été implémenté, comment y accéder, les prérequis et l'utilisation

## Notes

- Les tâches marquées `*` sont optionnelles et peuvent être ignorées pour un MVP rapide
- Chaque tâche référence les exigences spécifiques pour la traçabilité
- Les checkpoints assurent une validation incrémentale
- Les tests property valident les propriétés universelles de correction
- Les tests unitaires valident les exemples spécifiques et cas limites
- Framework de test : Bun test (`bun:test`) + fast-check pour les property tests
- Les tests sont placés dans `test/unit/lib/services/` (pas dans `src/`)
