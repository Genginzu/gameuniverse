# Gestion Admin des Traductions

## Description

Page d'administration permettant de visualiser l'état des traductions pour les
10 types d'entités du site Game Universe, de déclencher des traductions
automatiques via Vercel AI Gateway (modèle GPT-5.4 Nano), et de sauvegarder les
résultats en base de données. Le système supporte la traduction bidirectionnelle
entre toutes les langues configurées (actuellement fr/en).

### Fonctionnalités

- **Statistiques** : cartes par type d'entité avec total, traduit, non traduit
  et pourcentage de couverture, barre de progression globale
- **Traduction individuelle** : bouton "Traduire" pour traduire et sauvegarder
  automatiquement une entité
- **Traduction avec relecture** : bouton "Traduire et relire" pour générer la
  traduction, la relire/modifier dans une modale, puis sauvegarder
- **Traduction par lot** : sélection multiple + "Traduire la sélection" ou "Tout
  traduire" avec progression en temps réel (streaming NDJSON)
- **Annulation** : possibilité d'annuler un traitement par lot en cours (les
  traductions déjà sauvegardées sont conservées)
- **Recherche et pagination** : filtrage par titre/nom, 20 éléments par page
- **Protection admin** : toutes les routes protégées par `requireAdmin()`
- **Internationalisation** : namespace `admin.translations` avec clés FR/EN

### Types d'entités supportés

`games`, `characters`, `genres`, `companies`, `platforms`, `character_roles`,
`genders`, `species`, `content_descriptors`, `ratings`

### Langues supportées

Lues dynamiquement depuis `src/i18n/routing.ts` (actuellement `fr`, `en`). Si de
nouvelles langues sont ajoutées, elles apparaissent automatiquement dans le
sélecteur de langue cible.

## Accès

### Navigation

- **Sidebar admin** → lien **Traductions**
- **URL** : `/{locale}/admin/translations`

### Endpoints API

| Méthode | Route                                     | Description                                         |
| ------- | ----------------------------------------- | --------------------------------------------------- |
| GET     | `/api/admin/translations/stats`           | Statistiques de couverture par type et langue       |
| GET     | `/api/admin/translations/missing`         | Liste paginée des entités avec traduction manquante |
| POST    | `/api/admin/translations/translate`       | Traduction individuelle (option `saveToDb`)         |
| POST    | `/api/admin/translations/translate-batch` | Traduction par lot en streaming NDJSON              |
| PUT     | `/api/admin/translations/save`            | Sauvegarde manuelle d'une traduction éditée         |

## Prérequis

### Variable d'environnement

| Variable                    | Description                                        |
| --------------------------- | -------------------------------------------------- |
| `VERCEL_AI_GATEWAY_API_KEY` | Clé API Vercel AI Gateway (traduction automatique) |

Si la variable n'est pas définie, le service de traduction retourne une erreur
explicite `"VERCEL_AI_GATEWAY_API_KEY is not configured"`.

### Permissions

Accès réservé aux utilisateurs avec le rôle **admin** (vérifié par
`requireAdmin()` sur chaque route API).

### Tables existantes

Aucune migration nécessaire. Les 10 tables `*_translations` existent déjà :

`game_translations`, `character_translations`, `genre_translations`,
`company_translations`, `platform_translations`, `character_role_translations`,
`gender_translations`, `species_translations`,
`content_descriptor_translations`, `rating_translations`

### Traductions i18n

Clés sous le namespace `admin.translations` dans `src/messages/fr.json` et
`src/messages/en.json`.

## Utilisation

### Consultation des statistiques

1. Accéder à `/admin/translations`
2. Sélectionner la langue cible dans le sélecteur (ex : Français, English)
3. Visualiser les cartes de statistiques par type d'entité et la barre de
   progression globale

### Traduction individuelle

1. Filtrer par type d'entité dans le tableau
2. Cliquer sur **Traduire** sur la ligne souhaitée
3. La traduction est générée par l'IA et sauvegardée automatiquement en base

### Traduction avec relecture

1. Cliquer sur **Traduire et relire** sur la ligne souhaitée
2. La modale de relecture s'ouvre avec le texte source et la traduction côte à
   côte dans des champs éditables
3. Modifier si nécessaire, puis cliquer sur **Sauvegarder** (ou **Annuler**)

### Traduction par lot

1. Cocher les entités à traduire (ou cliquer sur **Tout traduire**)
2. Cliquer sur **Traduire la sélection**
3. Suivre la progression en temps réel (barre de progression, compteur x/total)
4. Possibilité d'annuler via le bouton **Annuler** (traductions déjà
   sauvegardées conservées)
5. Résumé final : nombre de traductions réussies et échouées

## Architecture

### API Routes (`src/app/api/admin/translations/`)

| Fichier                    | Rôle                                     |
| -------------------------- | ---------------------------------------- |
| `stats/route.ts`           | GET statistiques par type et langue      |
| `missing/route.ts`         | GET liste paginée des entités manquantes |
| `translate/route.ts`       | POST traduction individuelle             |
| `translate-batch/route.ts` | POST traduction par lot (NDJSON)         |
| `save/route.ts`            | PUT sauvegarde manuelle                  |

### Composants UI (`src/components/admin/translations/`)

| Fichier                        | Rôle                                     |
| ------------------------------ | ---------------------------------------- |
| `TranslationDashboard.tsx`     | Orchestrateur principal du dashboard     |
| `TranslationStatsCards.tsx`    | Cartes de statistiques par type d'entité |
| `TranslationProgressBar.tsx`   | Barre de progression globale             |
| `TranslationTable.tsx`         | Tableau paginé et filtrable              |
| `TranslationTableRow.tsx`      | Ligne du tableau avec actions            |
| `TranslationReviewModal.tsx`   | Modale de relecture/édition              |
| `TranslationBatchProgress.tsx` | Barre de progression du lot              |

### Hooks (`src/hooks/`)

| Fichier                   | Rôle                                          |
| ------------------------- | --------------------------------------------- |
| `useAdminTranslations.ts` | Fetch SWR stats + liste, mutations traduction |

### Services (`src/lib/services/`)

| Fichier                 | Rôle                                       |
| ----------------------- | ------------------------------------------ |
| `translationService.ts` | Requêtes Supabase (missing, stats, upsert) |
| `aiTranslateService.ts` | Appel Vercel AI Gateway via Vercel AI SDK  |

### Autres fichiers

| Fichier                                    | Rôle             |
| ------------------------------------------ | ---------------- |
| `src/types/admin-translations.ts`          | Types TypeScript |
| `src/lib/validations/admin-translation.ts` | Schémas Zod      |
