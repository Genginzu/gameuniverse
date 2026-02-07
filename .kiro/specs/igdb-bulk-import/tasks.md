# Plan d'Implémentation : IGDB Bulk Import

## Vue d'ensemble

Ce plan décrit les étapes pour créer un script TypeScript standalone permettant
d'importer en masse les jeux des 10 dernières années depuis l'API IGDB vers
Supabase.

## Tâches

- [x] 1. Créer la structure de base du script
  - [x] 1.1 Créer le fichier `scripts/import-igdb-games.ts` avec la structure de
        base
    - Importer les dépendances nécessaires (IGDBService, GameImportService)
    - Définir les interfaces CLIOptions, ImportStats, CheckpointData
    - Ajouter la documentation d'utilisation en en-tête
    - _Requirements: 6.1, 6.5_

  - [x] 1.2 Implémenter le CLI Parser
    - Parser les arguments --dry-run, --limit, --offset, --verbose
    - Valider les valeurs numériques
    - Afficher l'aide si --help est passé
    - _Requirements: 6.2, 6.3, 6.4_

- [x] 2. Implémenter le Rate Limiter
  - [x] 2.1 Créer la classe RateLimiter
    - Implémenter la méthode throttle() qui attend si nécessaire
    - Maintenir une fenêtre glissante de 1 seconde avec max 4 requêtes
    - _Requirements: 2.4_

  - [ ]\* 2.2 Écrire le test property-based pour le Rate Limiter
    - **Property 1: Rate Limiting Respecté**
    - **Validates: Requirements 2.4**

- [x] 3. Implémenter la logique de retry
  - [x] 3.1 Créer la fonction withRetry()
    - Implémenter le retry avec backoff exponentiel (délai initial 1s, max 3
      tentatives)
    - Logger chaque tentative en mode verbose
    - _Requirements: 2.5_

  - [ ]\* 3.2 Écrire le test property-based pour le retry
    - **Property 2: Retry avec Backoff Exponentiel**
    - **Validates: Requirements 2.5**

- [ ] 4. Checkpoint - Vérifier les composants de base
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implémenter l'Import Orchestrator
  - [x] 5.1 Créer la méthode fetchGamesBatch()
    - Construire la requête IGDB avec le filtre des 10 dernières années
    - Utiliser le RateLimiter avant chaque requête
    - Appliquer withRetry() pour la résilience
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 5.2 Créer la méthode processGame()
    - Appeler GameImportService.importFromIGDB() pour chaque jeu
    - Gérer le cas "already exists" comme skip (pas erreur)
    - Incrémenter les compteurs appropriés (imported/skipped/errors)
    - _Requirements: 3.1-3.8, 4.1_

  - [x] 5.3 Implémenter la boucle principale run()
    - Parcourir tous les batches avec pagination
    - Respecter les options limit et offset
    - Sauvegarder le checkpoint périodiquement
    - _Requirements: 2.3, 4.3_

  - [ ]\* 5.4 Écrire le test property-based pour l'invariant des statistiques
    - **Property 5: Invariant des Statistiques**
    - **Validates: Requirements 4.4, 5.2, 5.4**

- [x] 6. Implémenter le Progress Tracker
  - [x] 6.1 Créer la classe ProgressTracker
    - Afficher la progression en pourcentage et compteurs
    - Calculer le temps estimé restant
    - Afficher le résumé final avec temps total
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 7. Implémenter la gestion du mode dry-run
  - [x] 7.1 Ajouter la logique dry-run dans processGame()
    - Si dry-run, simuler l'import sans appeler GameImportService
    - Logger ce qui serait importé
    - _Requirements: 6.2_

  - [ ]\* 7.2 Écrire le test property-based pour le mode dry-run
    - **Property 6: Mode Dry-Run**
    - **Validates: Requirements 6.2**

- [ ] 8. Checkpoint - Vérifier l'orchestrateur complet
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Implémenter la gestion des checkpoints
  - [x] 9.1 Créer les fonctions saveCheckpoint() et loadCheckpoint()
    - Sauvegarder dans un fichier JSON temporaire
    - Charger au démarrage si le fichier existe
    - Supprimer le checkpoint à la fin d'un import réussi
    - _Requirements: 4.3_

  - [x] 9.2 Ajouter la gestion des signaux d'interruption
    - Capturer SIGINT et SIGTERM
    - Sauvegarder le checkpoint avant de terminer
    - _Requirements: 4.3_

- [x] 10. Finaliser et tester
  - [x] 10.1 Ajouter la validation des credentials au démarrage
    - Vérifier IGDB_CLIENT_ID et IGDB_CLIENT_SECRET
    - Afficher un message d'erreur explicite si manquants
    - _Requirements: 1.1, 1.2_

  - [x] 10.2 Ajouter le point d'entrée main()
    - Parser les arguments CLI
    - Initialiser l'orchestrateur
    - Lancer l'import et afficher le résumé
    - _Requirements: 6.1_

  - [ ]\* 10.3 Écrire les tests pour les options limit et offset
    - **Property 7: Option Limit**
    - **Property 8: Option Offset**
    - **Validates: Requirements 6.3, 6.4**

- [ ] 11. Checkpoint final
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Les tâches marquées avec `*` sont optionnelles et peuvent être ignorées pour
  un MVP plus rapide
- Le script réutilise les services existants (IGDBService, GameImportService)
  pour éviter la duplication de code
- Les tests property-based utilisent `fast-check` qui est déjà installé dans le
  projet
- Le script est conçu pour être exécuté avec
  `bun run scripts/import-igdb-games.ts`
