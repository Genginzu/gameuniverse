# Plan d'implémentation : Système de Succès (Achievements)

## Overview

Implémentation incrémentale du système de succès : migrations DB → types → fonctions pures (level system) → moteur d'évaluation → services de lecture → API routes → composants UI → intégration dans les routes existantes → traductions i18n.

## Tasks

- [x] 1. Migrations base de données et types TypeScript
  - [x] 1.1 Créer la migration `achievement_catalog`
    - Créer `supabase/migrations/20240313000001_achievement_catalog.sql`
    - Table `achievement_catalog` avec colonnes : id, key, category, tier, threshold, xp_value, icon, name_fr, name_en, description_fr, description_en, sort_order, created_at
    - Contrainte UNIQUE sur `key`, RLS en lecture publique
    - Insérer les 25 succès prédéfinis (seed data du design)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [x] 1.2 Créer la migration `player_xp`
    - Créer `supabase/migrations/20240313000002_player_xp.sql`
    - Table `player_xp` avec colonnes : id, user_id (UNIQUE, FK auth.users), xp_total (DEFAULT 0), updated_at
    - RLS : lecture publique, écriture par le propriétaire
    - _Requirements: 4.5_

  - [x] 1.3 Créer les types TypeScript partagés
    - Créer `src/types/achievement.ts` avec les types : `AchievementCategory`, `AchievementTier`, `AchievementCatalogEntry`, `PlayerAchievementWithDetails`, `PlayerXpStats`
    - _Requirements: 1.1, 8.1, 8.2_

- [x] 2. Fonctions pures du Level System
  - [x] 2.1 Implémenter le module `levelSystem.ts`
    - Créer `src/lib/services/levelSystem.ts`
    - Implémenter `computeLevel(xpTotal)` : `floor(0.3 × √(xpTotal)) + 1`, traiter les valeurs < 0 comme 0
    - Implémenter `xpForLevel(level)` : XP minimum requis pour atteindre un niveau donné
    - Implémenter `computeLevelProgress(xpTotal)` : retourne `{ level, currentLevelXp, nextLevelXp, progressPercent }`
    - _Requirements: 4.2, 4.4, 4.6_

  - [x] 2.2 Écrire les tests property-based pour le Level System
    - **Property 5: Level formula correctness**
    - **Validates: Requirements 4.2, 4.4, 4.6**
    - Fichier : `test/unit/lib/services/levelSystem.property.test.ts`
    - Vérifier que `computeLevel(xp)` == `floor(0.3 × √(xp)) + 1` pour tout xp ≥ 0
    - Vérifier que `computeLevelProgress(xp).progressPercent` est dans [0, 99]
    - Vérifier la cohérence `currentLevelXp < nextLevelXp`

  - [x] 2.3 Écrire les tests property-based pour la cohérence XP stats
    - **Property 10: XP stats response consistency**
    - **Validates: Requirements 8.2**
    - Fichier : `test/unit/lib/services/levelSystem.property.test.ts` (même fichier)
    - Vérifier que level == computeLevel(xpTotal) et progressPercent == computeLevelProgress(xpTotal).progressPercent

- [x] 3. Moteur d'évaluation des succès (AchievementEngine)
  - [x] 3.1 Implémenter `achievementEngine.ts`
    - Créer `src/lib/services/achievementEngine.ts`
    - Implémenter `AchievementEngine.evaluate(userId, category)` : récupère le catalogue, vérifie les succès non débloqués, insère dans `player_achievements`, ajoute XP dans `player_xp`, met à jour `profiles.level`
    - Implémenter `AchievementEngine.getPlayerCount(userId, category)` : requêtes Supabase pour compter les éléments par catégorie (bibliothèque, heures de jeu, avis, amis, collections)
    - Gérer le cas catalogue vide (retour sans erreur), les doublons (UNIQUE constraint), et les erreurs DB (log sans bloquer)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 4.1, 4.3_

  - [x] 3.2 Écrire les tests unitaires pour AchievementEngine
    - Fichier : `test/unit/lib/services/achievementEngine.test.ts`
    - Tester l'évaluation avec succès débloqués, catalogue vide, doublons
    - _Requirements: 3.1, 3.6, 3.7, 3.8_

  - [x] 3.3 Écrire le test property-based pour l'idempotence
    - **Property 4: Achievement evaluation is idempotent**
    - **Validates: Requirements 3.7**
    - Fichier : `test/unit/lib/services/achievementEngine.property.test.ts`
    - Vérifier que réévaluer un état déjà évalué ne produit aucun changement

- [x] 4. Checkpoint — Vérification back-end
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Service de lecture et API routes
  - [x] 5.1 Implémenter `achievementService.ts`
    - Créer `src/lib/services/achievementService.ts`
    - Implémenter `AchievementService.fetchPlayerAchievements(playerId, locale)` : jointure catalogue + player_achievements, localisation des noms/descriptions selon la locale
    - Implémenter `AchievementService.fetchPlayerXp(playerId)` : récupère player_xp et calcule les stats via `computeLevelProgress`
    - _Requirements: 8.1, 8.2_

  - [x] 5.2 Créer la route API GET `/api/players/[id]/achievements`
    - Créer `src/app/api/players/[id]/achievements/route.ts`
    - Validation UUID du paramètre `id` (400 si invalide)
    - Vérification existence du joueur (404 si inexistant)
    - Retourne la liste complète des succès avec statut débloqué/verrouillé
    - _Requirements: 8.1, 8.3, 8.4_

  - [x] 5.3 Créer la route API GET `/api/players/[id]/xp`
    - Créer `src/app/api/players/[id]/xp/route.ts`
    - Validation UUID (400), vérification existence (404)
    - Retourne : xpTotal, level, currentLevelXp, nextLevelXp, progressPercent
    - _Requirements: 8.2, 8.3, 8.4_

  - [x] 5.4 Écrire les tests unitaires pour les API routes
    - Fichiers : `test/unit/api/players/achievements.test.ts`, `test/unit/api/players/xp.test.ts`
    - Tester les cas 200, 400, 404
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [x] 5.5 Écrire le test property-based pour la complétude de la liste
    - **Property 7: Achievement list completeness**
    - **Validates: Requirements 6.1, 8.1**
    - Fichier : `test/unit/lib/services/achievementService.property.test.ts`
    - Vérifier que le nombre d'entrées retournées == nombre d'entrées du catalogue

- [x] 6. Utilitaires de regroupement et filtrage
  - [x] 6.1 Implémenter les fonctions utilitaires
    - Créer `src/lib/utils/achievementGrouping.ts`
    - Implémenter `groupByCategory(achievements)` : regroupe les succès par catégorie
    - Implémenter `filterByCategory(achievements, category)` : filtre par catégorie sélectionnée
    - _Requirements: 6.4, 6.7_

  - [x] 6.2 Écrire les tests property-based pour le regroupement
    - **Property 8: Category grouping preserves all achievements**
    - **Validates: Requirements 6.4**
    - Fichier : `test/unit/lib/utils/achievementGrouping.property.test.ts`
    - Vérifier que la somme des tailles des groupes == taille totale

  - [x] 6.3 Écrire les tests property-based pour le filtrage
    - **Property 9: Category filtering correctness**
    - **Validates: Requirements 6.7**
    - Fichier : `test/unit/lib/utils/achievementGrouping.property.test.ts` (même fichier)
    - Vérifier que tous les résultats ont la bonne catégorie et qu'aucun n'est perdu

- [x] 7. Composant ProgressRing et intégration profil
  - [x] 7.1 Implémenter le composant `ProgressRing`
    - Créer `src/components/players/ProgressRing.tsx`
    - Anneau SVG circulaire autour de l'avatar avec dégradé neon-violet → neon-cyan
    - Props : `progressPercent`, `level`, `size`
    - Animation fluide au chargement (CSS transition sur stroke-dashoffset)
    - Label de niveau localisé via next-intl (« Niveau X » / « Level X »)
    - Support dark mode, style glassmorphism cohérent
    - _Requirements: 5.1, 5.2, 5.3, 5.6, 7.4_

  - [x] 7.2 Intégrer le ProgressRing dans la page de profil
    - Modifier `src/components/players/PlayerDetailsContent.tsx` (ou le composant avatar du profil)
    - Afficher le ProgressRing autour de l'avatar et le niveau sous l'avatar
    - Visible pour le joueur et les visiteurs
    - _Requirements: 5.4, 5.5_

  - [x] 7.3 Écrire le test property-based pour l'arc du ProgressRing
    - **Property 6: Progress ring arc proportionality**
    - **Validates: Requirements 5.2**
    - Fichier : `test/unit/components/achievements/progressRing.property.test.ts`
    - Vérifier que le stroke-dashoffset est proportionnel au pourcentage

- [x] 8. Page de succès et composants associés
  - [x] 8.1 Créer le hook `useAchievements`
    - Créer `src/hooks/useAchievements.ts`
    - Appels fetch vers `/api/players/[id]/achievements` et `/api/players/[id]/xp`
    - Retourne : achievements, xpStats, isLoading, error
    - _Requirements: 8.1, 8.2_

  - [x] 8.2 Implémenter `AchievementCard.tsx`
    - Créer `src/components/achievements/AchievementCard.tsx`
    - Affichage débloqué : icône en couleur, nom, description, XP, date de déblocage
    - Affichage verrouillé : icône grisée, apparence atténuée
    - Style glassmorphism (`.glass-card`), dark mode, coins arrondis, transitions
    - _Requirements: 6.5, 6.6_

  - [x] 8.3 Implémenter `AchievementCategoryFilter.tsx`
    - Créer `src/components/achievements/AchievementCategoryFilter.tsx`
    - Boutons de filtre par catégorie (toutes, bibliothèque, temps de jeu, avis, social, collections)
    - Labels traduits via next-intl
    - _Requirements: 6.7_

  - [x] 8.4 Implémenter `AchievementsHeader.tsx`
    - Créer `src/components/achievements/AchievementsHeader.tsx`
    - Affiche : nombre de succès débloqués / total, XP total, niveau actuel, progression
    - Style glassmorphism cohérent
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 8.5 Implémenter `AchievementsPageContent.tsx`
    - Créer `src/components/achievements/AchievementsPageContent.tsx`
    - Orchestre AchievementsHeader, AchievementCategoryFilter, liste de AchievementCard
    - Utilise `useAchievements` et les utilitaires de regroupement/filtrage
    - Regroupement par catégorie, filtrage interactif
    - Accessible pour le joueur et les visiteurs (profil d'un autre joueur)
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.9_

  - [x] 8.6 Créer la page `players/[id]/achievements/page.tsx`
    - Créer `src/app/[locale]/players/[id]/achievements/page.tsx`
    - Page serveur qui délègue à `AchievementsPageContent`
    - _Requirements: 6.8_

- [x] 9. Checkpoint — Vérification UI et API
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Traductions i18n (FR/EN)
  - [x] 10.1 Ajouter les clés de traduction pour le système de succès
    - Ajouter le namespace `achievements` dans `src/messages/fr.json` et `src/messages/en.json`
    - Clés : titres de page, labels de catégories, labels de filtres, textes de stats (succès débloqués, XP total, niveau), label « Niveau X » / « Level X », textes d'états (débloqué le, verrouillé)
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 11. Intégration du moteur dans les routes API existantes
  - [x] 11.1 Intégrer l'évaluation dans les routes d'actions utilisateur
    - Ajouter l'appel `AchievementEngine.evaluate(userId, category)` dans les routes existantes :
      - `src/app/api/library/route.ts` (POST) → catégorie `library`
      - Route de sessions de jeu → catégorie `playtime`
      - `src/app/api/reviews/route.ts` (POST) → catégorie `reviews`
      - Route d'ajout d'ami → catégorie `social`
      - Route de création de collection → catégorie `collections`
    - Chaque appel est wrappé dans un try/catch non-bloquant (l'action principale réussit même si l'évaluation échoue)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 11.2 Ajouter le lien vers la page de succès dans la navigation
    - Ajouter un lien depuis le profil du joueur et/ou la navigation principale vers `/players/[id]/achievements`
    - _Requirements: 6.8_

- [x] 12. Validation du seed data et tests de catalogue
  - [x] 12.1 Écrire les tests de validation du seed data
    - **Property 1: Catalog entry completeness**
    - **Validates: Requirements 1.1, 1.2, 7.2**
    - Fichier : `test/unit/lib/services/achievementCatalog.property.test.ts`
    - Vérifier que chaque entrée a tous les champs requis non-null et non-vides

  - [x] 12.2 Écrire le test property-based pour l'ordre des tiers
    - **Property 2: Tier ordering by threshold within category**
    - **Validates: Requirements 2.6**
    - Fichier : `test/unit/lib/services/achievementCatalog.property.test.ts` (même fichier)
    - Vérifier que dans chaque catégorie, un seuil plus bas implique un tier ≤

- [x] 13. Checkpoint final
  - Ensure all tests pass, ask the user if questions arise.

- [x] 14. Lint du code
  - [x] 14.1 Exécuter `bun run lint`
    - Vérifier qu'il n'y a pas d'erreurs ni de warnings de lint
    - Corriger les erreurs et warnings de lint si nécessaire

- [x] 15. Build de production
  - [x] 15.1 Exécuter `bun run build`
    - Vérifier qu'il n'y a pas d'erreurs de compilation
    - Corriger les erreurs de build si nécessaire

- [x] 16. README de la fonctionnalité
  - [x] 16.1 Créer `docs/README_achievements-system.md`
    - Documenter ce qui a été implémenté (système de succès, XP, niveaux, page dédiée)
    - Décrire comment accéder à la fonctionnalité (routes, navigation)
    - Lister les prérequis (migrations, configuration)
    - Guide rapide d'utilisation

## Notes

- Les tâches marquées `*` sont optionnelles et peuvent être ignorées pour un MVP plus rapide
- Chaque tâche référence les exigences spécifiques pour la traçabilité
- Les checkpoints assurent une validation incrémentale
- Les tests property-based valident les propriétés universelles de correction
- Les tests unitaires valident des exemples spécifiques et cas limites
- Respecter la limite de 300 lignes par fichier (steering rule code-quality)
- Toutes les traductions doivent être ajoutées dans fr.json ET en.json simultanément
