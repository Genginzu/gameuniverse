# Gestion Admin des Succès

## Description

Interface d'administration CRUD complète pour le catalogue de succès
(`achievement_catalog`), avec un gestionnaire d'attribution/retrait manuel de
succès pour les joueurs. Suit les patterns existants (genres, companies,
languages) : API routes protégées par `requireAdmin()`, validation Zod, hooks de
data fetching, composants table/form/dialog, i18n FR/EN.

### Fonctionnalités

- **CRUD catalogue** : liste paginée avec recherche et tri, création, édition et
  suppression de succès avec vérification d'usage
- **Validation Zod** : clé technique (`^[a-z][a-z0-9_]*$`), seuils et XP entiers
  positifs, champs bilingues obligatoires
- **Player Achievement Manager** : recherche de joueur, visualisation des succès
  débloqués/verrouillés, attribution et retrait manuels avec recalcul XP/niveau
- **Protection admin** : toutes les routes protégées par `requireAdmin()`
- **Internationalisation** : namespace `adminAchievements` avec 102 clés FR/EN

## Accès

### Navigation

- **Sidebar admin** → catégorie **Joueurs** → lien **Succès** (icône trophée)
- **Catalogue** : `/{locale}/admin/achievements`
- **Création** : `/{locale}/admin/achievements/new`
- **Édition** : `/{locale}/admin/achievements/{id}/edit`
- **Player Manager** : `/{locale}/admin/achievements/players`

### Endpoints API

| Méthode | Route                                    | Description                              |
| ------- | ---------------------------------------- | ---------------------------------------- |
| GET     | `/api/admin/achievements`                | Liste paginée avec recherche et tri      |
| POST    | `/api/admin/achievements`                | Création d'un succès                     |
| GET     | `/api/admin/achievements/{id}`           | Détail d'un succès                       |
| PUT     | `/api/admin/achievements/{id}`           | Modification d'un succès                 |
| DELETE  | `/api/admin/achievements/{id}`           | Suppression (support `?force=true`)      |
| GET     | `/api/admin/achievements/{id}/usage`     | Nombre de joueurs ayant ce succès        |
| GET     | `/api/admin/achievements/players/search` | Recherche de joueur par username ou UUID |
| GET     | `/api/admin/achievements/players`        | Succès d'un joueur (query `userId`)      |
| POST    | `/api/admin/achievements/players`        | Attribution d'un succès + ajout XP       |
| DELETE  | `/api/admin/achievements/players`        | Retrait d'un succès + soustraction XP    |

## Prérequis

### Permissions

Accès réservé aux utilisateurs avec le rôle **admin** (vérifié par
`requireAdmin()` sur chaque route).

### Tables existantes

Aucune migration nécessaire. Les tables utilisées sont :

| Table                 | Rôle                              |
| --------------------- | --------------------------------- |
| `achievement_catalog` | Catalogue des succès (CRUD)       |
| `player_achievements` | Succès débloqués par joueur       |
| `player_xp`           | XP total et niveau par joueur     |
| `profiles`            | Recherche de joueurs par username |

### Traductions

Clés i18n sous le namespace `adminAchievements` dans `src/messages/fr.json` et
`src/messages/en.json`.

## Utilisation

### Gestion du catalogue

1. Accéder à la liste via la sidebar admin → Succès
2. Rechercher par clé ou nom, trier par colonne
3. Créer un succès : remplir tous les champs (clé, catégorie, palier, seuil, XP,
   icône, noms et descriptions FR/EN, ordre d'affichage)
4. Modifier un succès existant via le bouton d'édition
5. Supprimer un succès : confirmation requise, mode force si des joueurs l'ont
   débloqué

### Attribution/retrait de succès

1. Accéder au Player Manager via la sidebar ou `/admin/achievements/players`
2. Rechercher un joueur par username ou UUID
3. Visualiser ses succès : débloqués (avec date) et verrouillés (grisés)
4. Attribuer un succès verrouillé : confirmation avec XP ajouté, recalcul du
   niveau via `computeLevel()`
5. Retirer un succès débloqué : confirmation avec XP retiré (clampé à 0),
   recalcul du niveau

## Architecture

### API Routes (`src/app/api/admin/achievements/`)

| Fichier                   | Rôle                               |
| ------------------------- | ---------------------------------- |
| `route.ts`                | GET liste paginée, POST création   |
| `[id]/route.ts`           | GET/PUT/DELETE par UUID            |
| `[id]/usage/route.ts`     | GET nombre de joueurs              |
| `players/route.ts`        | GET/POST/DELETE attribution joueur |
| `players/search/route.ts` | GET recherche joueur               |

### Composants UI (`src/components/admin/achievements/`)

| Fichier                        | Rôle                                  |
| ------------------------------ | ------------------------------------- |
| `AchievementsTable.tsx`        | Tableau paginé avec recherche et tri  |
| `AchievementForm.tsx`          | Orchestrateur du formulaire           |
| `AchievementFormFields.tsx`    | Champs du formulaire avec validation  |
| `DeleteAchievementDialog.tsx`  | Dialog de confirmation de suppression |
| `PlayerAchievementManager.tsx` | Orchestrateur du gestionnaire joueur  |
| `PlayerAchievementList.tsx`    | Liste succès débloqués/verrouillés    |
| `PlayerSearchResults.tsx`      | Résultats de recherche joueur         |
| `AssignAchievementDialog.tsx`  | Dialog de confirmation d'attribution  |
| `RevokeAchievementDialog.tsx`  | Dialog de confirmation de retrait     |

### Hooks (`src/hooks/`)

| Fichier                          | Rôle                                    |
| -------------------------------- | --------------------------------------- |
| `useAdminAchievements.ts`        | Fetch paginé, suppression, vérif. usage |
| `usePlayerAchievementManager.ts` | Recherche joueur, attribution, retrait  |

### Autres fichiers

| Fichier                                         | Rôle                   |
| ----------------------------------------------- | ---------------------- |
| `src/types/admin-achievements.ts`               | Types TypeScript admin |
| `src/lib/validations/admin-achievement-form.ts` | Schémas Zod            |

## Tests

| Fichier                                                                      | Type           | Contenu                                    |
| ---------------------------------------------------------------------------- | -------------- | ------------------------------------------ |
| `test/unit/lib/validations/admin-achievement-form.property.test.ts`          | Property-based | P4 : validation Zod, P10 : parité i18n     |
| `test/unit/api/admin/achievements/route.test.ts`                             | Unitaire       | GET/POST catalogue (8 tests)               |
| `test/unit/api/admin/achievements/id-route.test.ts`                          | Unitaire       | GET/PUT/DELETE par ID (13 tests)           |
| `test/unit/api/admin/achievements/achievements-crud.property.test.ts`        | Property-based | P1-P3, P5-P6 : pagination, recherche, tri  |
| `test/unit/api/admin/achievements/achievements-crud-delete.property.test.ts` | Property-based | P7-P9 : usage, delete force, auth          |
| `test/unit/api/admin/achievements/players-route.test.ts`                     | Unitaire       | Attribution/retrait joueur (16 tests)      |
| `test/unit/api/admin/achievements/players-search-route.test.ts`              | Unitaire       | Recherche joueur (6 tests)                 |
| `test/unit/hooks/useAdminAchievements.test.ts`                               | Unitaire       | Hook catalogue (9 tests)                   |
| `test/unit/hooks/usePlayerAchievementManager.test.ts`                        | Unitaire       | Hook player manager (8 tests)              |
| `test/unit/lib/services/player-achievement-xp.property.test.ts`              | Property-based | P11-P15 : partition, round-trip, XP/niveau |
| `test/unit/components/admin/achievements/AchievementsTable.test.ts`          | Unitaire       | Tableau (15 tests)                         |
| `test/unit/components/admin/achievements/AchievementForm.test.ts`            | Unitaire       | Formulaire (9 tests)                       |
| `test/unit/components/admin/achievements/DeleteAchievementDialog.test.ts`    | Unitaire       | Dialog suppression (11 tests)              |

```bash
# Lancer tous les tests
bun run test:all

# Lancer les tests property-based de validation
bunx vitest run test/unit/lib/validations/admin-achievement-form.property.test.ts

# Lancer les tests API CRUD
bunx vitest run test/unit/api/admin/achievements/route.test.ts

# Lancer les tests property-based XP/niveau
bunx vitest run test/unit/lib/services/player-achievement-xp.property.test.ts
```
