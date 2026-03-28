# Système de Succès (Achievements)

## Description

Système complet de succès et de progression XP/niveaux intégré à la plateforme.
Les joueurs débloquent des succès automatiquement en réalisant des actions
(ajout de jeux, temps de jeu, avis, amis, collections). Chaque succès octroie de
l'XP qui alimente un système de niveaux affiché sur le profil.

### Fonctionnalités

- **Catalogue de 24 succès** répartis en 5 catégories (bibliothèque, temps de
  jeu, avis, social, collections) avec 3 paliers (bronze, argent, or)
- **Moteur d'évaluation automatique** : les succès sont détectés et débloqués
  côté serveur après chaque action pertinente
- **Système XP/niveaux** : formule `floor(0.3 × √(xp_total)) + 1`, progression
  persistée en base
- **Anneau de progression** : composant SVG autour de l'avatar du joueur avec
  dégradé néon violet → cyan
- **Page dédiée** : liste tous les succès (débloqués et verrouillés), filtrables
  par catégorie, avec stats globales
- **Internationalisation** : tous les textes et noms de succès traduits FR/EN

## Accès

### Navigation

- **Profil joueur** → onglet **Trophées** (icône trophée) : accès direct à la
  page de succès
- **URL directe** : `/{locale}/players/{id}/achievements`

### Endpoints API

| Méthode | Route                            | Paramètres        | Description                                      |
| ------- | -------------------------------- | ----------------- | ------------------------------------------------ |
| GET     | `/api/players/{id}/achievements` | `locale` (fr\|en) | Liste complète des succès avec statut par joueur |
| GET     | `/api/players/{id}/xp`           | —                 | Stats XP : total, niveau, progression            |

### Réponse `/achievements`

Retourne un tableau de succès, chacun avec : `key`, `category`, `tier`,
`threshold`, `xpValue`, `icon`, `name`, `description` (localisés), `unlockedAt`
(date ISO ou `null`), `sortOrder`.

### Réponse `/xp`

```json
{
  "xpTotal": 150,
  "level": 4,
  "currentLevelXp": 100,
  "nextLevelXp": 178,
  "progressPercent": 64
}
```

## Prérequis

### Migrations base de données

Deux migrations à exécuter dans `supabase/migrations/` :

| Migration                                | Table                 | Description                                   |
| ---------------------------------------- | --------------------- | --------------------------------------------- |
| `20240313000001_achievement_catalog.sql` | `achievement_catalog` | Catalogue de 24 succès avec traductions FR/EN |
| `20240313000002_player_xp.sql`           | `player_xp`           | Suivi XP par joueur (xp_total, updated_at)    |

La table `player_achievements` (existante) est réutilisée sans modification.

### Types base de données

Les types Supabase dans `src/lib/database.types.ts` doivent inclure les tables
`achievement_catalog` et `player_xp`.

### Dépendances

- **fast-check** (déjà installé) — tests property-based
- **next-intl** (déjà installé) — internationalisation
- **lucide-react** (déjà installé) — icônes des succès

### Traductions

Clés i18n sous le namespace `achievements` dans `src/messages/fr.json` et
`src/messages/en.json`.

## Utilisation

### Déblocage automatique des succès

Les succès sont évalués automatiquement après chaque action utilisateur :

| Action                    | Catégorie évaluée | Routes concernées                    |
| ------------------------- | ----------------- | ------------------------------------ |
| Ajout d'un jeu            | `library`         | `POST /api/library`                  |
| Enregistrement temps jeu  | `playtime`        | `POST /api/game-sessions` (playtime) |
| Publication d'un avis     | `reviews`         | `POST /api/reviews`                  |
| Ajout/acceptation d'ami   | `social`          | `POST/PATCH /api/friends`            |
| Création d'une collection | `collections`     | `POST /api/collections`              |

L'évaluation est non-bloquante : si elle échoue, l'action principale reste
réussie.

### Catégories et seuils

| Catégorie    | Seuils                      | Paliers                                    |
| ------------ | --------------------------- | ------------------------------------------ |
| Bibliothèque | 1, 5, 10, 25, 50, 100       | bronze, bronze, silver, silver, gold, gold |
| Temps de jeu | 10h, 50h, 100h, 500h, 1000h | bronze, bronze, silver, gold, gold         |
| Avis         | 1, 5, 10, 25, 50            | bronze, bronze, silver, silver, gold       |
| Social       | 1, 5, 10, 25                | bronze, bronze, silver, gold               |
| Collections  | 1, 3, 5, 10                 | bronze, bronze, silver, gold               |

### Page de succès

La page affiche :

- **En-tête** : nombre de succès débloqués / total, XP total, niveau et
  progression
- **Filtres** : par catégorie (toutes, bibliothèque, temps de jeu, avis, social,
  collections)
- **Cartes de succès** : icône colorée (débloqué) ou grisée (verrouillé), nom,
  description, XP, date de déblocage
- **Profil visiteur** : les succès d'un autre joueur sont visibles

## Architecture

### Services (`src/lib/services/`)

| Fichier                 | Rôle                                                                   |
| ----------------------- | ---------------------------------------------------------------------- |
| `levelSystem.ts`        | Fonctions pures : `computeLevel`, `xpForLevel`, `computeLevelProgress` |
| `achievementEngine.ts`  | Évaluation et attribution des succès, gestion XP                       |
| `achievementService.ts` | Lecture des succès et stats XP pour l'API                              |

### Composants UI

| Fichier                                                     | Rôle                                   |
| ----------------------------------------------------------- | -------------------------------------- |
| `src/components/players/ProgressRing.tsx`                   | Anneau SVG de progression sur l'avatar |
| `src/components/achievements/AchievementsHeader.tsx`        | En-tête avec stats globales            |
| `src/components/achievements/AchievementCard.tsx`           | Carte individuelle d'un succès         |
| `src/components/achievements/AchievementCategoryFilter.tsx` | Filtres par catégorie                  |
| `src/components/achievements/AchievementsPageContent.tsx`   | Orchestrateur de la page               |

### Autres fichiers

| Fichier                                               | Rôle                          |
| ----------------------------------------------------- | ----------------------------- |
| `src/types/achievement.ts`                            | Types TypeScript partagés     |
| `src/hooks/useAchievements.ts`                        | Hook client fetch succès + XP |
| `src/lib/utils/achievementGrouping.ts`                | Regroupement et filtrage      |
| `src/app/[locale]/players/[id]/achievements/page.tsx` | Page serveur                  |
| `src/app/api/players/[id]/achievements/route.ts`      | Route API succès              |
| `src/app/api/players/[id]/xp/route.ts`                | Route API XP                  |

## Tests

| Fichier                                                           | Type           | Contenu                                     |
| ----------------------------------------------------------------- | -------------- | ------------------------------------------- |
| `test/unit/lib/services/levelSystem.property.test.ts`             | Property-based | P5 : formule niveau, P10 : cohérence XP     |
| `test/unit/lib/services/achievementEngine.property.test.ts`       | Property-based | P4 : idempotence de l'évaluation            |
| `test/unit/lib/services/achievementEngine.test.ts`                | Unitaire       | Évaluation, catalogue vide, doublons        |
| `test/unit/lib/services/achievementService.property.test.ts`      | Property-based | P7 : complétude de la liste                 |
| `test/unit/lib/services/achievementCatalog.property.test.ts`      | Property-based | P1 : complétude catalogue, P2 : ordre tiers |
| `test/unit/lib/utils/achievementGrouping.property.test.ts`        | Property-based | P8 : regroupement, P9 : filtrage            |
| `test/unit/components/achievements/progressRing.property.test.ts` | Property-based | P6 : proportionnalité de l'arc              |

```bash
# Lancer tous les tests
bun run test:all

# Lancer les tests property-based du level system
bunx vitest run test/unit/lib/services/levelSystem.property.test.ts

# Lancer les tests du moteur d'évaluation
bunx vitest run test/unit/lib/services/achievementEngine.property.test.ts
```
