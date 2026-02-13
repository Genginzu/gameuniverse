# Implementation Plan: Player Playtime

## Overview

Implémentation incrémentale de la fonctionnalité de temps de jeu des joueurs. On
commence par la validation et les types, puis l'API, le hook, et enfin les
composants UI. Les tests property-based valident la logique métier à chaque
étape.

## Tasks

- [ ] 1. Créer le schéma de validation Zod et les types
  - [ ] 1.1 Créer `src/lib/validations/player-playtime.ts` avec le schéma
        `playerPlaytimeSchema`
    - Valider : nombre strictement positif, max 50 000, précision 0.1h
    - Exporter le type `PlayerPlaytimeInput`
    - _Requirements: 6.1, 6.2, 6.3_
  - [ ] 1.2 Ajouter l'interface `PlayerPlaytimeStats` dans `src/types/game.ts`
    - Champs : `average: number | null`, `count: number`,
      `userPlaytime: number | null`
    - _Requirements: 4.1, 4.3, 4.4_
  - [ ] 1.3 Écrire les property tests pour le schéma de validation
    - **Property 1: Validation schema accepts valid inputs and rejects invalid
      inputs**
    - **Validates: Requirements 6.1, 6.2, 6.3, 2.2**
    - Fichier : `test/unit/lib/validations/player-playtime.property.test.ts`

- [ ] 2. Créer les API routes pour le temps de jeu des joueurs
  - [ ] 2.1 Créer `src/app/api/games/[slug]/playtime/route.ts` — handler GET
    - Résoudre le slug en game_id via la table `games`
    - Calculer la moyenne et le count via agrégation sur `user_library`
      (play_time_hours > 0)
    - Si l'utilisateur est authentifié, inclure son `userPlaytime`
    - Retourner `{ average, count, userPlaytime }`
    - _Requirements: 4.1, 4.3, 4.4_
  - [ ] 2.2 Créer le handler POST dans la même route
    - Valider le body avec `playerPlaytimeSchema`
    - Résoudre le slug en game_id
    - Vérifier l'authentification (401 si absent)
    - Upsert dans `user_library` : si l'entrée existe, UPDATE `play_time_hours`
      ; sinon INSERT avec `status = "playing"`
    - Retourner les stats mises à jour (average, count, userPlaytime)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2_
  - [ ] 2.3 Écrire les property tests pour la logique de calcul de moyenne
    - **Property 4: Average calculation correctness**
    - **Validates: Requirements 4.1**
    - Fichier : `test/unit/lib/services/player-playtime.property.test.ts`
    - Extraire la logique de calcul de moyenne dans une fonction utilitaire pure
      testable

- [ ] 3. Checkpoint — Vérifier que les API fonctionnent
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Créer le hook `usePlayerPlaytime`
  - [ ] 4.1 Créer `src/hooks/usePlayerPlaytime.ts`
    - Utiliser `useAuth()` pour l'état d'authentification
    - State : `{ stats, loading, error, submitting }`
    - `fetchStats()` : GET `/api/games/{slug}/playtime`
    - `submitPlaytime(hours)` : POST `/api/games/{slug}/playtime`
    - Re-fetch automatique après soumission réussie
    - _Requirements: 4.3, 4.4, 5.4_

- [ ] 5. Refactoriser et créer les composants UI
  - [ ] 5.1 Extraire `src/components/games/GamePlaytimeOfficial.tsx` depuis le
        code existant de `GamePlaytime`
    - Déplacer les 3 cartes IGDB (rapidement, normalement, complètement) et
      l'attribution source
    - _Requirements: 1.1, 1.2, 1.3_
  - [ ] 5.2 Créer `src/components/games/GamePlaytimePlayers.tsx`
    - Afficher la moyenne, le nombre de contributeurs, le temps personnel du
      joueur
    - Afficher un message d'invitation si aucun temps joueur n'existe
    - Intégrer le formulaire de soumission (composant enfant)
    - Afficher un message "connectez-vous" si non authentifié
    - _Requirements: 4.2, 4.3, 4.4, 5.1, 5.2_
  - [ ] 5.3 Créer `src/components/games/PlayerPlaytimeForm.tsx`
    - Input numérique pour les heures (step 0.1)
    - Pré-remplir avec la valeur existante si disponible
    - Afficher les erreurs de validation et de soumission
    - _Requirements: 5.1, 5.3, 5.5_
  - [ ] 5.4 Mettre à jour `GamePlaytime.tsx` comme orchestrateur
    - Accepter `gameId` et `slug` en props supplémentaires
    - Rendre `GamePlaytimeOfficial` + `GamePlaytimePlayers`
    - _Requirements: 1.1, 4.3_
  - [ ] 5.5 Mettre à jour `GameDetailsTabs.tsx` pour passer `gameId` et `slug`
        au composant playtime
    - _Requirements: 1.1_

- [ ] 6. Ajouter les traductions i18n
  - [ ] 6.1 Ajouter les clés de traduction pour la section joueurs dans les
        fichiers de messages (fr/en)
    - Clés : section title, average label, contributors count, form placeholder,
      submit button, login prompt, no data message, error messages
    - _Requirements: 4.2, 5.2, 5.5_

- [ ] 7. Exécution des tests complets
  - [ ] 7.1 Exécuter `bun run test:all`
  - [ ] 7.2 Vérifier que tous les tests passent (parallèles + isolés)
  - [ ] 7.3 Corriger les tests en échec si nécessaire

- [ ] 8. Lint du code
  - [ ] 8.1 Exécuter `bun run lint`
  - [ ] 8.2 Vérifier qu'il n'y a pas d'erreurs de lint
  - [ ] 8.3 Corriger les erreurs de lint si nécessaire

- [ ] 9. Build de production
  - [ ] 9.1 Exécuter `bun run build`
  - [ ] 9.2 Vérifier qu'il n'y a pas d'erreurs de compilation
  - [ ] 9.3 Corriger les erreurs de build si nécessaire

- [ ] 10. README de la fonctionnalité
  - [ ] 10.1 Créer `docs/README_PLAYER_PLAYTIME.md`
  - [ ] 10.2 Documenter ce qui a été implémenté, comment y accéder, les
        prérequis et l'utilisation

## Notes

- Les tâches marquées `*` sont optionnelles et peuvent être ignorées pour un MVP
  rapide
- Chaque tâche référence les exigences spécifiques pour la traçabilité
- La table `user_library` existe déjà avec la colonne `play_time_hours` — aucune
  migration nécessaire
- Les property tests utilisent `fast-check` avec le test runner Bun
- Les tests sont placés dans `test/unit/` conformément aux conventions du projet
