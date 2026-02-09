# Plan d'Implémentation: Admin Game Management

## Vue d'ensemble

Ce plan décrit les tâches pour implémenter l'interface d'administration de
gestion des jeux (CRUD). L'implémentation utilise TypeScript, Next.js, React
Hook Form, Zod et les composants UI existants du projet.

## Tâches

- [x] 1. Étendre le système d'authentification admin
  - [x] 1.1 Créer le hook useAdminAuth
    - Créer `src/hooks/useAdminAuth.ts`
    - Implémenter la vérification du rôle (admin/contributor) basée sur le
      domaine email ou metadata
    - Exposer les permissions (canCreate, canRead, canUpdate, canDelete)
    - _Requirements: 1.3, 1.4, 1.5_

  - [x] 1.2 Étendre auth-admin.ts pour supporter les rôles contributeur
    - Modifier `src/lib/auth-admin.ts`
    - Ajouter la fonction `getUserRole()` retournant 'admin' | 'contributor' |
      'user'
    - Ajouter la fonction `requireAdminOrContributor()`
    - _Requirements: 1.3, 1.4_

  - [x] 1.3 Écrire les tests unitaires pour useAdminAuth
    - Tester les différents rôles et permissions
    - Tester les cas d'erreur (non authentifié, rôle invalide)
    - _Requirements: 1.3, 1.4, 1.5_

- [x] 2. Créer le layout et la navigation admin
  - [x] 2.1 Créer le composant AdminLayout
    - Créer `src/components/layout/admin/AdminLayout.tsx`
    - Implémenter la protection de route (redirection si non autorisé)
    - Intégrer le sidebar et l'affichage du rôle utilisateur
    - _Requirements: 1.1, 1.2, 2.1, 2.2_

  - [x] 2.2 Créer le composant AdminSidebar
    - Créer `src/components/layout/admin/AdminSidebar.tsx`
    - Implémenter la navigation avec liens vers les sections admin
    - Supporter le mode mobile (drawer)
    - _Requirements: 2.1, 2.3_

  - [x] 2.3 Créer la page layout admin
    - Créer `src/app/[locale]/admin/layout.tsx`
    - Intégrer AdminLayout
    - _Requirements: 2.4_

  - [x] 2.4 Créer la page d'accueil admin avec redirection
    - Créer `src/app/[locale]/admin/page.tsx`
    - Rediriger vers `/admin/games`
    - _Requirements: 2.4_

  - [x] 2.5 Écrire les tests unitaires pour AdminLayout
    - Tester la redirection pour utilisateurs non autorisés
    - Tester l'affichage correct du rôle
    - _Requirements: 1.1, 1.2, 2.2_

- [x] 3. Checkpoint - Vérifier la structure de base
  - Vérifier que le layout admin fonctionne
  - Vérifier que la protection de route est active
  - Demander à l'utilisateur s'il y a des questions

- [x] 4. Implémenter la liste des jeux
  - [x] 4.1 Créer le hook useAdminGames
    - Créer `src/hooks/useAdminGames.ts`
    - Implémenter fetchGames avec pagination, recherche et tri
    - Implémenter deleteGame
    - Gérer les états de chargement et d'erreur
    - _Requirements: 3.1, 3.3, 3.4, 3.5_

  - [x] 4.2 Créer le composant AdminGamesTable
    - Créer `src/components/admin/games/AdminGamesTable.tsx`
    - Afficher les colonnes: image, titre, date de sortie, date de modification,
      actions
    - Implémenter la pagination
    - Implémenter la recherche par titre
    - Implémenter le tri par colonnes
    - Conditionner le bouton supprimer selon les permissions
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 6.4_

  - [x] 4.3 Créer la page de liste des jeux
    - Créer `src/app/[locale]/admin/games/page.tsx`
    - Intégrer AdminGamesTable et useAdminGames
    - Ajouter le bouton "Nouveau jeu"
    - _Requirements: 3.1, 4.1_

  - [x] 4.4 Écrire les tests property-based pour la recherche et le tri
    - **Property 2: Cohérence de la Recherche et du Tri**
    - Tester que la recherche retourne uniquement les jeux correspondants
    - Tester que le tri produit un ordre correct
    - **Validates: Requirements 3.3, 3.4**

  - [x] 4.5 Écrire les tests unitaires pour AdminGamesTable
    - Tester l'affichage des informations de jeu
    - Tester la pagination
    - Tester le masquage du bouton supprimer pour les contributeurs
    - _Requirements: 3.2, 6.4_

- [x] 5. Implémenter le formulaire de jeu
  - [x] 5.1 Créer le schéma de validation du formulaire admin
    - Créer ou étendre `src/lib/validations/admin-game-form.ts`
    - Définir le schéma Zod pour le formulaire simplifié
    - _Requirements: 4.2, 4.6_

  - [x] 5.2 Créer le hook useGameForm
    - Créer `src/hooks/useGameForm.ts`
    - Charger les options (genres, entreprises)
    - Gérer la soumission (création et modification)
    - Intégrer React Hook Form avec le schéma Zod
    - _Requirements: 4.3, 5.3_

  - [x] 5.3 Créer le composant GameForm
    - Créer `src/components/admin/games/GameForm.tsx`
    - Implémenter les champs: slug, titre (multilingue), description, image,
      date de sortie
    - Implémenter les sélecteurs de genres et entreprises
    - Afficher les erreurs de validation inline
    - Afficher l'indicateur de chargement pendant la soumission
    - _Requirements: 4.2, 4.5, 5.2, 5.5_

  - [x] 5.4 Écrire les tests property-based pour la validation du formulaire
    - **Property 3: Validation et Soumission de Formulaire**
    - Tester que les formulaires valides sont acceptés
    - Tester que les formulaires invalides affichent des erreurs
    - **Validates: Requirements 4.3, 4.5, 4.6**

- [x] 6. Implémenter la création de jeu
  - [x] 6.1 Créer la page de création de jeu
    - Créer `src/app/[locale]/admin/games/new/page.tsx`
    - Intégrer GameForm en mode création
    - Gérer la redirection après succès
    - Afficher les notifications de succès/erreur
    - _Requirements: 4.1, 4.3, 4.4, 7.1, 7.2_

  - [x] 6.2 Écrire les tests unitaires pour la création de jeu
    - Tester la soumission réussie
    - Tester la gestion des erreurs (slug dupliqué)
    - _Requirements: 4.3, 4.4_

- [x] 7. Checkpoint - Vérifier la création de jeux
  - Vérifier que le formulaire de création fonctionne
  - Vérifier la validation et les messages d'erreur
  - Demander à l'utilisateur s'il y a des questions

- [x] 8. Implémenter la modification de jeu
  - [x] 8.1 Créer la page de modification de jeu
    - Créer `src/app/[locale]/admin/games/[id]/edit/page.tsx`
    - Charger les données existantes du jeu
    - Intégrer GameForm en mode édition avec pré-remplissage
    - Gérer la redirection après succès
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [x] 8.2 Écrire les tests property-based pour le round-trip de modification
    - **Property 4: Round-Trip de Modification**
    - Tester que charger puis sauvegarder sans modification préserve les données
    - **Validates: Requirements 5.1, 5.3**

- [x] 9. Implémenter la suppression de jeu
  - [x] 9.1 Créer le composant DeleteGameDialog
    - Créer `src/components/admin/games/DeleteGameDialog.tsx`
    - Afficher le titre du jeu et l'avertissement
    - Implémenter les boutons confirmer/annuler
    - Afficher l'indicateur de chargement pendant la suppression
    - _Requirements: 6.1, 6.2, 6.3, 6.5_

  - [x] 9.2 Intégrer la suppression dans la liste des jeux
    - Connecter DeleteGameDialog à AdminGamesTable
    - Actualiser la liste après suppression
    - _Requirements: 6.3_

  - [x] 9.3 Écrire les tests unitaires pour DeleteGameDialog
    - Tester l'affichage de la modale
    - Tester la confirmation et l'annulation
    - _Requirements: 6.1, 6.2_

- [x] 10. Implémenter l'internationalisation
  - [x] 10.1 Créer les fichiers de traduction admin
    - Ajouter les traductions françaises dans `messages/fr.json`
    - Ajouter les traductions anglaises dans `messages/en.json`
    - Couvrir tous les textes de l'interface admin
    - _Requirements: 2.5_

  - [x] 10.2 Écrire les tests property-based pour l'i18n
    - **Property 6: Support de l'Internationalisation**
    - Tester que toutes les clés de traduction existent pour chaque locale
    - **Validates: Requirements 2.5**

- [x] 11. Implémenter la gestion des erreurs
  - [x] 11.1 Créer les composants de gestion d'erreur admin
    - Créer `src/components/admin/AdminErrorFallback.tsx`
    - Créer `src/app/[locale]/admin/error.tsx` (error boundary)
    - Créer `src/app/[locale]/admin/not-found.tsx`
    - _Requirements: 7.3, 7.4_

  - [x] 11.2 Écrire les tests property-based pour la gestion des erreurs
    - **Property 7: Gestion Robuste des Erreurs Réseau**
    - Tester que les erreurs réseau affichent un message et permettent de
      réessayer
    - **Validates: Requirements 7.5**

  - [x] 11.3 Écrire les tests property-based pour le feedback des opérations
    - **Property 8: Feedback Cohérent des Opérations**
    - Tester que les opérations réussies affichent une notification de succès
    - Tester que les opérations échouées affichent une notification d'erreur
    - **Validates: Requirements 7.1, 7.2**

- [x] 12. Checkpoint final - Vérifier l'ensemble de la fonctionnalité
  - Vérifier le CRUD complet (création, lecture, modification, suppression)
  - Vérifier les permissions (admin vs contributeur)
  - Demander à l'utilisateur s'il y a des questions

- [x] 13. Exécution des tests complets
  - [x] 13.1 Exécuter `bun run test:all`
  - [x] 13.2 Vérifier que tous les tests passent (parallèles + isolés)
  - [x] 13.3 Corriger les tests en échec si nécessaire

- [x] 14. Lint du code
  - [x] 14.1 Exécuter `bun run lint`
  - [x] 14.2 Vérifier qu'il n'y a pas d'erreurs de lint
  - [x] 14.3 Corriger les erreurs de lint si nécessaire

- [x] 15. Build de production
  - [x] 15.1 Exécuter `bun run build`
  - [x] 15.2 Vérifier qu'il n'y a pas d'erreurs de compilation
  - [x] 15.3 Corriger les erreurs de build si nécessaire

## Notes

- Les tâches marquées avec `*` sont optionnelles et peuvent être ignorées pour
  un MVP plus rapide
- Chaque tâche référence les exigences spécifiques pour la traçabilité
- Les checkpoints permettent de valider l'avancement incrémental
- Les tests property-based valident les propriétés de correction universelles
- Les tests unitaires valident les exemples spécifiques et les cas limites
- Utiliser Bun test runner (`bun:test`) pour tous les tests
- Placer les tests dans `test/unit/components/admin/` et `test/unit/hooks/`
