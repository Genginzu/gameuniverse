# Implementation Plan: Admin Achievements Management

## Overview

Implémentation CRUD du catalogue de succès dans l'interface admin, plus un gestionnaire d'attribution/retrait manuel de succès pour les joueurs. Suit les patterns existants (genres, companies, languages) : API routes protégées, validation Zod, hooks, composants table/form/dialog, i18n FR/EN.

## Tasks

- [x] 1. Types, validation Zod et traductions i18n
  - [x] 1.1 Créer les types admin achievements dans `src/types/admin-achievements.ts`
    - Définir `AdminAchievement`, `FetchAchievementsParams`, `PlayerSearchResult`
    - Réutiliser `AchievementCategory`, `AchievementTier` de `src/types/achievement.ts`
    - _Requirements: 1.1, 2.1, 8.1, 8.2_

  - [x] 1.2 Créer le schéma de validation Zod dans `src/lib/validations/admin-achievement-form.ts`
    - Implémenter `adminAchievementFormSchema`, `achievementQuerySchema`, `playerAchievementActionSchema`
    - Clé : regex `^[a-z][a-z0-9_]*$`, threshold/xpValue : entiers positifs
    - _Requirements: 2.2, 2.4, 5.3, 5.4_

  - [x] 1.3 Écrire le test property-based pour la validation Zod
    - **Property 4: Zod schema rejects invalid achievement data**
    - **Validates: Requirements 2.2, 2.4, 3.2, 5.3, 5.4**
    - Fichier : `test/unit/lib/validations/admin-achievement-form.property.test.ts`

  - [x] 1.4 Ajouter les clés i18n dans `src/messages/fr.json` et `src/messages/en.json`
    - Namespace `adminAchievements` : titres de page, labels de colonnes, labels de champs, boutons, messages de confirmation, messages d'erreur, messages vides, textes des dialogues assign/revoke
    - Ajouter simultanément dans les deux fichiers
    - _Requirements: 7.1, 7.2, 7.3, 8.15_

  - [x] 1.5 Écrire le test property-based pour les clés i18n
    - **Property 10: i18n keys exist in both locales**
    - **Validates: Requirements 7.1, 7.2, 7.3, 8.15**
    - Fichier : `test/unit/lib/validations/admin-achievement-form.property.test.ts`

- [x] 2. API Routes CRUD catalogue
  - [x] 2.1 Implémenter `GET/POST /api/admin/achievements` dans `src/app/api/admin/achievements/route.ts`
    - GET : pagination, recherche, tri avec `achievementQuerySchema`
    - POST : validation `adminAchievementFormSchema`, vérification unicité clé, insertion Supabase
    - Protection `requireAdmin()` sur les deux méthodes
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.2, 2.3, 2.4, 2.5, 2.6, 5.1, 5.2, 5.3, 5.4_

  - [x] 2.2 Implémenter `GET/PUT/DELETE /api/admin/achievements/[id]` dans `src/app/api/admin/achievements/[id]/route.ts`
    - GET : retourne un succès par UUID
    - PUT : validation, vérification unicité clé (exclut ID courant), mise à jour
    - DELETE : support `?force=true`, vérification usage avant suppression
    - Protection `requireAdmin()` sur toutes les méthodes
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.3, 4.4, 4.5, 4.6, 5.1, 5.2_

  - [x] 2.3 Implémenter `GET /api/admin/achievements/[id]/usage` dans `src/app/api/admin/achievements/[id]/usage/route.ts`
    - Retourne `{ usageCount: number }` (count de `player_achievements` pour cette clé)
    - Protection `requireAdmin()`
    - _Requirements: 4.2_

  - [x] 2.4 Écrire les tests unitaires pour les API routes CRUD
    - Fichier : `test/unit/api/admin/achievements/route.test.ts`
    - Fichier : `test/unit/api/admin/achievements/id-route.test.ts`
    - Tester : 403 sans auth, 400 données invalides, 409 clé dupliquée, 404 non trouvé, 201 création, 200 mise à jour, 200 suppression
    - _Requirements: 2.5, 2.6, 2.7, 3.3, 3.4, 3.5, 4.3, 4.5, 4.6, 5.1, 5.2_

  - [x] 2.5 Écrire les tests property-based pour les API CRUD
    - **Property 1: Pagination returns correct page size and count**
    - **Property 2: Search filter returns only matching results**
    - **Property 3: Sort order is respected**
    - **Property 5: Achievement key uniqueness**
    - **Property 6: CRUD round-trip**
    - **Property 7: Usage count accuracy**
    - **Property 8: Delete with player usage requires force flag**
    - **Property 9: All admin endpoints require authentication**
    - **Validates: Requirements 1.2, 1.3, 1.4, 2.3, 2.5, 2.6, 3.1, 3.3, 4.2, 4.4, 5.1, 5.2, 8.13**
    - Fichier : `test/unit/api/admin/achievements/achievements-crud.property.test.ts`

- [x] 3. Checkpoint — Vérifier les API routes
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Hooks de data fetching
  - [x] 4.1 Créer `src/hooks/useAdminAchievements.ts`
    - Même pattern que `useAdminGenres` : `achievements`, `pagination`, `loading`, `fetchAchievements`, `deleteAchievement`, `checkUsage`
    - Gestion des états loading/error/success
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 4.1, 4.2, 4.6_

  - [x] 4.2 Créer `src/hooks/usePlayerAchievementManager.ts`
    - Recherche joueur (debounced), sélection, fetch succès du joueur, attribution, retrait
    - Expose : `players`, `selectedPlayer`, `playerAchievements`, `searchPlayers`, `selectPlayer`, `assignAchievement`, `revokeAchievement`
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.8, 8.9, 8.14_

  - [x] 4.3 Écrire les tests unitaires pour les hooks
    - Fichier : `test/unit/hooks/useAdminAchievements.test.ts`
    - Fichier : `test/unit/hooks/usePlayerAchievementManager.test.ts`
    - Tester les états loading, error, success et les appels API
    - _Requirements: 1.5, 8.14_

- [x] 5. API Routes attribution/retrait joueur
  - [x] 5.1 Implémenter `GET /api/admin/achievements/players/search` dans `src/app/api/admin/achievements/players/search/route.ts`
    - Recherche par username ou ID, retourne `{ players: PlayerSearchResult[] }`
    - Protection `requireAdmin()`
    - _Requirements: 8.1, 8.13_

  - [x] 5.2 Implémenter `POST/DELETE /api/admin/achievements/players` dans `src/app/api/admin/achievements/players/route.ts`
    - POST : validation `playerAchievementActionSchema`, insertion `player_achievements`, ajout XP, recalcul niveau via `computeLevel()`, création ligne `player_xp` si inexistante
    - DELETE : validation, suppression `player_achievements`, soustrait XP (min 0), recalcul niveau
    - Erreur 409 si déjà attribué, 404 si non attribué
    - Protection `requireAdmin()`
    - _Requirements: 8.4, 8.5, 8.6, 8.7, 8.9, 8.10, 8.11, 8.12, 8.13_

  - [x] 5.3 Écrire les tests unitaires pour les API routes joueur
    - Fichier : `test/unit/api/admin/achievements/players-route.test.ts`
    - Tester : 403 sans auth, 409 déjà attribué, 404 non attribué, 201 attribution, 200 retrait, XP clampé à 0
    - _Requirements: 8.4, 8.5, 8.7, 8.9, 8.10, 8.11, 8.12, 8.13_

  - [x] 5.4 Écrire les tests property-based pour attribution/retrait
    - **Property 11: Player achievements partition**
    - **Property 12: Assign then revoke round-trip**
    - **Property 13: XP and level correctness on assign and revoke**
    - **Property 14: Duplicate assignment returns 409**
    - **Property 15: Revoke non-assigned achievement returns 404**
    - **Validates: Requirements 8.2, 8.4, 8.5, 8.7, 8.9, 8.10, 8.11, 8.12**
    - Fichier : `test/unit/lib/services/player-achievement-xp.property.test.ts`

- [x] 6. Checkpoint — Vérifier les API joueur et hooks
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Composants UI — Catalogue CRUD
  - [x] 7.1 Créer `src/components/admin/achievements/AchievementsTable.tsx`
    - Tableau paginé avec colonnes : key, category, tier, threshold, xp_value, name (localisé)
    - Barre de recherche, tri par colonnes cliquables, boutons edit/delete par ligne
    - État vide avec message i18n, loading skeleton
    - Classes `.glass-*`, dark mode
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

  - [x] 7.2 Créer `src/components/admin/achievements/AchievementForm.tsx`
    - Mode création et édition (prop `achievement?`)
    - Champs : key, category (select), tier (select), threshold, xp_value, icon, name_fr, name_en, description_fr, description_en, sort_order
    - Validation côté client avec schéma Zod, erreurs inline, toast succès + redirection
    - Classes `.glass-*`, dark mode
    - _Requirements: 2.1, 2.2, 2.4, 2.8, 3.1, 3.2, 3.5_

  - [x] 7.3 Créer `src/components/admin/achievements/DeleteAchievementDialog.tsx`
    - Dialog de confirmation avec nom du succès
    - Affiche `usageCount`, mode force si `usageCount > 0` (avertissement orange)
    - Classes `.glass-*`, dark mode
    - _Requirements: 4.1, 4.2, 4.4, 4.6_

  - [x] 7.4 Écrire les tests unitaires pour les composants catalogue
    - Fichier : `test/unit/components/admin/achievements/AchievementsTable.test.tsx`
    - Fichier : `test/unit/components/admin/achievements/AchievementForm.test.tsx`
    - Fichier : `test/unit/components/admin/achievements/DeleteAchievementDialog.test.tsx`
    - Tester le rendu, les interactions, les états loading/error/empty
    - _Requirements: 1.1, 1.5, 1.6, 2.1, 2.8, 4.1, 4.6_

- [x] 8. Composants UI — Player Achievement Manager
  - [x] 8.1 Créer `src/components/admin/achievements/PlayerAchievementManager.tsx`
    - Champ de recherche joueur (debounced), liste résultats, sélection joueur
    - Affiche `PlayerAchievementList` quand un joueur est sélectionné
    - Classes `.glass-*`, dark mode
    - _Requirements: 8.1, 8.2, 8.14_

  - [x] 8.2 Créer `src/components/admin/achievements/PlayerAchievementList.tsx`
    - Liste tous les succès du catalogue pour le joueur sélectionné
    - Distingue visuellement débloqués (avec date) vs verrouillés (grisés)
    - Bouton "Attribuer" sur les verrouillés, "Retirer" sur les débloqués
    - _Requirements: 8.2, 8.3, 8.8_

  - [x] 8.3 Créer `src/components/admin/achievements/AssignAchievementDialog.tsx`
    - Confirmation avec nom du succès, nom du joueur, XP à ajouter
    - _Requirements: 8.3, 8.4_

  - [x] 8.4 Créer `src/components/admin/achievements/RevokeAchievementDialog.tsx`
    - Confirmation avec nom du succès, nom du joueur, XP à retirer
    - _Requirements: 8.8, 8.9_

- [x] 9. Pages admin et navigation
  - [x] 9.1 Créer la page liste `src/app/[locale]/admin/achievements/page.tsx`
    - Intègre `AchievementsTable` et `DeleteAchievementDialog`
    - Bouton de création vers `/admin/achievements/new`
    - _Requirements: 1.1, 4.1, 6.3_

  - [x] 9.2 Créer la page création `src/app/[locale]/admin/achievements/new/page.tsx`
    - Intègre `AchievementForm` en mode création
    - _Requirements: 2.1, 2.8_

  - [x] 9.3 Créer la page édition `src/app/[locale]/admin/achievements/[id]/edit/page.tsx`
    - Intègre `AchievementForm` en mode édition, pré-rempli avec les données existantes
    - _Requirements: 3.1, 3.5_

  - [x] 9.4 Créer la page Player Manager `src/app/[locale]/admin/achievements/players/page.tsx`
    - Intègre `PlayerAchievementManager`
    - _Requirements: 8.1, 8.2, 8.14_

  - [x] 9.5 Ajouter le lien "Succès" dans la sidebar admin
    - Ajouter une entrée avec icône `FaTrophy` dans `AdminSidebar.tsx`
    - Lien vers `/admin/achievements`, surbrillance via `isActive()`
    - Ajouter un sous-lien vers `/admin/achievements/players` pour le Player Manager
    - _Requirements: 6.1, 6.2_

- [x] 10. Checkpoint — Vérification finale
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Lint, build et documentation
  - [x] 11.1 Exécuter `bun run lint` et corriger les erreurs éventuelles
  - [x] 11.2 Exécuter `bun run build` et corriger les erreurs éventuelles
  - [x] 11.3 Créer `docs/README_admin-achievements-management.md` documentant la feature

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design
- Unit tests validate specific examples and edge cases
- All components use `.glass-*` classes and support dark mode
- All user-facing text uses `next-intl` with FR/EN translations
- No database migration needed — tables already exist
