# Plan d'Implémentation : Import des Versions de Jeux IGDB

## Vue d'ensemble

Ce plan implémente la fonctionnalité d'import des versions de jeux (éditions
collector, deluxe, etc.) depuis l'API IGDB. Les versions sont stockées dans une
table dédiée et affichées dans un nouvel onglet sur la page de détail du jeu.

## Tâches

- [x] 1. Créer la migration pour la table game_versions
  - [x] 1.1 Créer le fichier de migration SQL avec la table game_versions
    - Champs : id (UUID), game_id (FK), igdb_id, version_title, cover_image_url,
      display_order, created_at
    - Contrainte unique sur (game_id, igdb_id)
    - Index sur game_id et igdb_id
    - _Requirements: 2.1_
  - [x] 1.2 Ajouter les politiques RLS pour la table
    - Lecture publique autorisée
    - Écriture réservée au service_role
    - _Requirements: 2.1_

- [x] 2. Étendre les types TypeScript
  - [x] 2.1 Ajouter le type IGDBGameVersion dans src/types/igdb.ts
    - Champs : id, name, slug, version_title, cover
    - _Requirements: 1.2_
  - [x] 2.2 Ajouter le type GameVersion dans src/types/game.ts
    - Champs : id, igdbId, title, coverImageUrl
    - Ajouter versions?: GameVersion[] à GameDetails
    - _Requirements: 5.2_

- [x] 3. Implémenter la récupération des versions depuis IGDB
  - [x] 3.1 Ajouter la méthode getGameVersions dans IGDBService
    - Requête IGDB avec where version_parent = igdbId
    - Récupérer id, name, slug, version_title, cover.image_id
    - _Requirements: 1.1, 1.2_
  - [x] 3.2 Écrire un test property-based pour l'extraction des données
    - **Property 1: Extraction correcte des données de version**
    - **Validates: Requirements 1.2**

- [ ] 4. Checkpoint - Vérifier que les types et le service IGDB fonctionnent
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implémenter l'import des versions dans game-importer
  - [x] 5.1 Créer la fonction importGameVersions dans game-importer.ts
    - Appeler IGDBService.getGameVersions
    - Transformer et insérer les versions avec upsert
    - Gérer le display_order basé sur l'index
    - _Requirements: 1.1, 2.2, 2.3_
  - [x] 5.2 Intégrer l'appel à importGameVersions dans importGameFromIGDB
    - Appeler après la création du jeu principal
    - Logger le nombre de versions importées en mode verbose
    - _Requirements: 4.1, 4.4_
  - [x] 5.3 Gérer le mode dry-run pour les versions
    - Ne pas écrire en base si dryRun est true
    - _Requirements: 4.2_
  - [x] 5.4 Écrire un test property-based pour l'idempotence
    - **Property 2: Idempotence de l'import des versions**
    - **Validates: Requirements 2.4**
  - [x] 5.5 Écrire un test property-based pour l'association et l'ordonnancement
    - **Property 3: Association et ordonnancement des versions**
    - **Validates: Requirements 2.2, 2.3**

- [ ] 6. Checkpoint - Vérifier que l'import fonctionne
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Étendre l'API de détail du jeu
  - [x] 7.1 Modifier /api/games/[slug]/route.ts pour récupérer les versions
    - Requête Supabase sur game_versions avec game_id
    - Ordonner par display_order
    - _Requirements: 5.1_
  - [x] 7.2 Ajouter les versions à la réponse transformée
    - Mapper vers le format GameVersion
    - Retourner tableau vide si pas de versions
    - _Requirements: 5.2, 5.3_
  - [x] 7.3 Écrire un test property-based pour la structure de la réponse API
    - **Property 5: Structure complète de la réponse API**
    - **Validates: Requirements 5.1, 5.2**

- [x] 8. Créer le composant d'affichage des versions
  - [x] 8.1 Créer le composant GameVersions.tsx
    - Props : versions, accentColor
    - Afficher grille de versions avec cover et titre
    - Retourner null si pas de versions
    - _Requirements: 3.2, 3.3_
  - [x] 8.2 Écrire un test property-based pour l'affichage
    - **Property 4: Affichage correct des versions**
    - **Validates: Requirements 3.2, 3.4**

- [x] 9. Intégrer le composant dans la page de détail
  - [x] 9.1 Ajouter l'onglet "Versions" dans GameDetailsContent.tsx
    - Positionner après l'onglet "Classifications"
    - Utiliser une icône appropriée (Package ou Layers)
    - _Requirements: 3.1_
  - [x] 9.2 Afficher le composant GameVersions dans le contenu de l'onglet
    - Passer les versions et accentColor
    - _Requirements: 3.2, 3.4_
  - [x] 9.3 Ajouter les traductions pour l'onglet et la section
    - Clés : gameDetails.tabs.versions, gameDetails.versions.\*
    - Langues : fr, en
    - _Requirements: 3.1_

- [ ] 10. Checkpoint final - Vérifier l'intégration complète
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Les tâches marquées avec `*` sont optionnelles et peuvent être ignorées pour
  un MVP plus rapide
- Chaque tâche référence les exigences spécifiques pour la traçabilité
- Les checkpoints permettent de valider l'avancement incrémental
- Les tests property-based utilisent `fast-check` avec minimum 100 itérations
