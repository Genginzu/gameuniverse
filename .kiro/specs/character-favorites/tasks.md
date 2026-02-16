# Plan d'Implémentation : Favoris de Personnages

## Vue d'ensemble

Implémentation incrémentale du système de favoris de personnages, en suivant le pattern existant de `user_library`. Chaque tâche construit sur la précédente, en commençant par la base de données, puis le service, les API, les hooks, et enfin les composants UI.

## Tâches

- [ ] 1. Migration base de données et types TypeScript
  - [ ] 1.1 Créer la migration Supabase `supabase/migrations/20240220000001_character_favorites.sql`
    - Table `character_favorites` avec colonnes `id`, `user_id`, `character_id`, `created_at`
    - Contrainte UNIQUE sur `(user_id, character_id)`
    - Index sur `user_id`, `character_id`, `created_at`
    - Politiques RLS : lecture publique, insertion/suppression limitée au propriétaire
    - Fonctions SQL `get_character_favorite_count` et `is_character_favorited`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ] 1.2 Ajouter le type `CharacterFavoriteSummary` dans `src/types/character.ts`
    - Interface avec `id`, `slug`, `name`, `role?`, `mainImage?`, `backgroundColor?`, `primaryGame`, `favoritedAt`
    - _Requirements: 3.2, 4.1_

- [ ] 2. Service de favoris
  - [ ] 2.1 Créer `src/lib/services/characterFavoriteService.ts`
    - Méthodes : `addFavorite`, `removeFavorite`, `isFavorite`, `getFavoriteCount`, `getUserFavorites`, `getPlayerFavorites`
    - Utiliser `createServerClient` pour les requêtes Supabase
    - Gérer le cas `PGRST205` (table non trouvée) comme dans le pattern `user_library`
    - _Requirements: 1.1, 1.2, 2.1, 3.1, 4.1, 5.1, 5.2_

  - [ ]* 2.2 Écrire les tests de propriétés pour le service dans `test/unit/lib/services/characterFavoriteService.property.test.ts`
    - **Propriété 1 : Aller-retour ajout/suppression de favori**
    - **Validates: Requirements 1.1, 1.2**
    - **Propriété 3 : Exactitude du compteur de favoris**
    - **Validates: Requirements 2.1, 2.2, 2.3**
    - **Propriété 4 : Tri des favoris par date décroissante**
    - **Validates: Requirements 3.1**
    - **Propriété 6 : Unicité des favoris**
    - **Validates: Requirements 5.2**

  - [ ]* 2.3 Écrire les tests unitaires pour le service dans `test/unit/lib/services/characterFavoriteService.test.ts`
    - Tester les cas d'erreur : personnage introuvable, table manquante
    - Tester le cas limite : compteur à zéro
    - _Requirements: 2.4, 5.1_

- [ ] 3. Checkpoint — Vérifier que tous les tests passent
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Routes API
  - [ ] 4.1 Créer `src/app/api/characters/[slug]/favorite/route.ts`
    - POST : ajouter aux favoris (auth requise, résoudre le slug en character_id)
    - DELETE : retirer des favoris (auth requise)
    - GET : statut du favori pour l'utilisateur courant (auth requise)
    - Codes d'erreur : 401, 404, 409, 500
    - _Requirements: 1.1, 1.2, 1.3_

  - [ ] 4.2 Créer `src/app/api/characters/[slug]/favorite/count/route.ts`
    - GET : compteur public de favoris (pas d'auth requise)
    - _Requirements: 2.1_

  - [ ] 4.3 Créer `src/app/api/favorites/characters/route.ts`
    - GET : liste des personnages favoris de l'utilisateur courant (auth requise)
    - _Requirements: 3.1, 3.2_

  - [ ] 4.4 Créer `src/app/api/players/[id]/favorite-characters/route.ts`
    - GET : personnages favoris publics d'un joueur
    - _Requirements: 4.1, 4.2_

- [ ] 5. Hooks React
  - [ ] 5.1 Créer `src/hooks/useCharacterFavorite.ts`
    - Gestion de l'état `isFavorite`, `favoriteCount`, `isLoading`, `isToggling`, `error`
    - Mise à jour optimiste avec rollback en cas d'erreur
    - Fonction `toggleFavorite` qui appelle POST ou DELETE selon l'état
    - _Requirements: 1.1, 1.2, 1.4, 2.1, 2.2, 2.3_

  - [ ] 5.2 Créer `src/hooks/useCharacterFavorites.ts`
    - Hook `useCharacterFavorites` pour la page favoris de l'utilisateur courant
    - Hook `usePlayerFavoriteCharacters` pour le profil joueur
    - _Requirements: 3.1, 4.1_

  - [ ]* 5.3 Écrire les tests de propriétés pour le hook dans `test/unit/hooks/useCharacterFavorite.property.test.ts`
    - **Propriété 2 : Rollback de la mise à jour optimiste en cas d'erreur**
    - **Validates: Requirements 1.4**

  - [ ]* 5.4 Écrire les tests unitaires pour les hooks dans `test/unit/hooks/useCharacterFavorite.test.ts`
    - Tester le toggle favori/non-favori
    - Tester l'état de chargement
    - Tester la gestion d'erreur
    - _Requirements: 1.1, 1.2, 1.4_

- [ ] 6. Checkpoint — Vérifier que tous les tests passent
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Composants UI — Bouton favori
  - [ ] 7.1 Créer `src/components/characters/FavoriteCharacterButton.tsx`
    - Bouton cœur avec icône pleine/vide selon l'état
    - Affichage du compteur à côté du bouton
    - Utilise `useCharacterFavorite`
    - Masqué si l'utilisateur n'est pas authentifié
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4_

  - [ ] 7.2 Intégrer `FavoriteCharacterButton` dans `CharacterDetailsContent.tsx`
    - Ajouter le bouton dans la section hero, à côté du nom du personnage
    - _Requirements: 1.1, 2.1_

  - [ ]* 7.3 Écrire les tests de propriétés pour le composant dans `test/unit/components/characters/FavoriteCharacterButton.property.test.ts`
    - **Propriété 5 : Complétude de l'affichage des favoris**
    - **Validates: Requirements 3.2, 4.1**

  - [ ]* 7.4 Écrire les tests unitaires pour le bouton dans `test/unit/components/characters/FavoriteCharacterButton.test.tsx`
    - Tester le rendu conditionnel (auth/non-auth)
    - Tester le compteur à zéro
    - _Requirements: 1.3, 2.4_

- [ ] 8. Composants UI — Page favoris et profil joueur
  - [ ] 8.1 Créer `src/components/characters/favorites/FavoriteCharactersContent.tsx`
    - Grille de personnages favoris avec `EntityCard` ou cards personnalisées
    - État vide avec lien vers `/characters`
    - _Requirements: 3.1, 3.2, 3.3_

  - [ ] 8.2 Créer la page `src/app/[locale]/favorites/characters/page.tsx`
    - Page protégée (redirection si non authentifié)
    - Utilise `DashboardLayout` et `FavoriteCharactersContent`
    - _Requirements: 3.1, 3.4_

  - [ ] 8.3 Créer `src/components/players/PlayerFavoriteCharacters.tsx`
    - Section aperçu des favoris sur le profil joueur
    - Affiche les N premiers favoris avec lien « Voir tous »
    - État vide si aucun favori
    - _Requirements: 4.1, 4.2, 4.3_

  - [ ] 8.4 Intégrer `PlayerFavoriteCharacters` dans `PlayerDetailsContent.tsx`
    - Ajouter la section favoris dans le profil joueur
    - _Requirements: 4.1_

  - [ ]* 8.5 Écrire les tests unitaires pour les composants favoris dans `test/unit/components/characters/FavoriteCharactersContent.test.tsx`
    - Tester l'état vide
    - Tester le rendu de la liste
    - _Requirements: 3.2, 3.3_

- [ ] 9. Traductions i18n
  - [ ] 9.1 Ajouter les clés de traduction dans `messages/fr.json` et `messages/en.json`
    - Clés pour le bouton favori, le compteur, la page favoris, les états vides, les erreurs
    - _Requirements: 1.1, 2.1, 3.3, 4.3_

- [ ] 10. Checkpoint final — Vérifier que tous les tests passent
  - Exécuter `bun run test:all`
  - Vérifier que tous les tests passent (parallèles + isolés)
  - Corriger les tests en échec si nécessaire

- [ ] 11. Lint du code
  - [ ] 11.1 Exécuter `bun run lint`
  - [ ] 11.2 Vérifier qu'il n'y a pas d'erreurs de lint
  - [ ] 11.3 Corriger les erreurs de lint si nécessaire

- [ ] 12. Build de production
  - [ ] 12.1 Exécuter `bun run build`
  - [ ] 12.2 Vérifier qu'il n'y a pas d'erreurs de compilation
  - [ ] 12.3 Corriger les erreurs de build si nécessaire

- [ ] 13. README de la fonctionnalité
  - [ ] 13.1 Créer `docs/README_CHARACTER_FAVORITES.md`
  - [ ] 13.2 Documenter ce qui a été implémenté, comment y accéder, les prérequis et l'utilisation

## Notes

- Les tâches marquées `*` sont optionnelles et peuvent être ignorées pour un MVP plus rapide
- Chaque tâche référence les exigences spécifiques pour la traçabilité
- Les checkpoints assurent une validation incrémentale
- Les tests de propriétés valident les propriétés universelles de correction
- Les tests unitaires valident les exemples spécifiques et cas limites
