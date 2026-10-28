# Gestion Admin des Traductions

## Description

Page d'administration permettant de visualiser l'état des traductions pour les
10 types d'entités du site Game Universe, de déclencher des traductions
automatiques via Vercel AI Gateway (modèle choisi dans l'admin, DeepSeek V3.1 par
défaut), et de sauvegarder les
résultats en base de données. Le système supporte la traduction bidirectionnelle
entre toutes les langues configurées (actuellement fr/en).

### Fonctionnalités

- **Statistiques** : cartes par type d'entité avec total, traduit, non traduit
  et pourcentage de couverture, barre de progression globale
- **Choix du modèle** : au-dessus de la barre de progression, un sélecteur liste
  les modèles de langage disponibles sur Vercel AI Gateway (groupés par
  fournisseur, avec le prix par million de tokens). Le choix est enregistré dans
  la table serveur `admin_settings` (clé `translation_model`) et s'applique aux
  traductions suivantes. Défaut : `deepseek/deepseek-v3.1`, retenu par le
  [comparatif des modèles](translation-model-benchmark.md). Chaque appel IA est
  limité à 60 s (`TRANSLATION_TIMEOUT_MS`)
- **Crédits AI Gateway** : solde restant et total consommé, avec bouton
  d'actualisation
- **Traduction individuelle** : bouton "Traduire" pour traduire et sauvegarder
  automatiquement une entité
- **Traduction avec relecture** : bouton "Traduire et relire" pour générer la
  traduction, la relire/modifier dans une modale, puis sauvegarder
- **Traduction par lot** : cocher des fiches puis « Traduire la sélection ».
  Les fiches partent une par une (requêtes de 5 vers `translate-batch`), avec
  progression en temps réel (streaming NDJSON)
- **Annulation** : possibilité d'annuler un traitement par lot en cours (les
  traductions déjà sauvegardées sont conservées)
- **Onglets « À traduire » / « Traduits »** : en cliquant sur une carte, la liste
  s'ouvre sur l'onglet « À traduire » (entités avec au moins une langue
  incomplète). L'onglet « Traduits » (`?status=complete`) liste les entités
  complètes dans toutes les langues, avec un bouton **Modifier** qui ouvre
  l'éditeur de l'entité pour corriger une traduction existante
- **Recherche et pagination** : recherche sur l'identifiant (slug, code) et sur
  le texte de toutes les langues (titre, nom...) ; 20, 40, 60, 80 ou 100
  éléments par page (`?limit=`)
- **Protection admin** : toutes les routes protégées par `defineRoute({ auth: "admin" })`
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
| GET     | `/api/admin/translations/ai-settings`     | Modèle courant, modèles disponibles et crédits      |
| PUT     | `/api/admin/translations/ai-settings`     | Change le modèle de traduction (`{ model }`)        |
| GET     | `/api/admin/translations/missing`         | Liste paginée par statut (`status=missing` par défaut, ou `complete`) |
| POST    | `/api/admin/translations/translate`       | Traduction individuelle (option `saveToDb`)         |
| POST    | `/api/admin/translations/translate-batch` | Traduction par lot en streaming NDJSON              |
| PUT     | `/api/admin/translations/save`            | Sauvegarde manuelle d'une traduction éditée         |

## Prérequis

### Variable d'environnement

| Variable                    | Description                                        |
| --------------------------- | -------------------------------------------------- |
| `AI_GATEWAY_API_KEY` | Clé API Vercel AI Gateway (traduction, modèles, crédits) |

Si la variable n'est pas définie, le service de traduction retourne une erreur
explicite `"VERCEL_AI_GATEWAY_API_KEY is not configured"`.

### Permissions

Accès réservé aux utilisateurs avec le rôle **admin** (vérifié par
`defineRoute({ auth: "admin" })` sur chaque route API).

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

1. Choisir le nombre de fiches affichées (**Par page** : 20, 40, 60, 80 ou 100)
   et, si besoin, filtrer avec la recherche
2. Cocher les fiches (la case d'en-tête coche toute la page affichée)
3. Cliquer sur **Traduire la sélection** : les fiches sont traduites une par
   une, langue par langue, par requêtes de 5 vers `translate-batch`
4. Suivre la progression en temps réel (barre de progression, compteur x/total)
5. Possibilité d'annuler via le bouton **Annuler** (traductions déjà
   sauvegardées conservées)
6. Résumé final : nombre de traductions réussies et échouées

## Architecture

### API Routes (`src/app/api/admin/translations/`)

| Fichier                    | Rôle                                     |
| -------------------------- | ---------------------------------------- |
| `stats/route.ts`           | GET statistiques par type et langue      |
| `missing/route.ts`         | GET liste paginée par statut (RPC `get_translation_entities`) |
| `translate/route.ts`       | POST traduction individuelle             |
| `translate-batch/route.ts` | POST traduction par lot (NDJSON)         |
| `save/route.ts`            | PUT sauvegarde manuelle                  |

### Composants UI (`src/components/admin/translations/`)

| Fichier                        | Rôle                                     |
| ------------------------------ | ---------------------------------------- |
| `TranslationDashboard.tsx`     | Orchestrateur principal du dashboard     |
| `TranslationProgressBar.tsx`   | Barre de progression globale             |
| `TranslationTable.tsx`         | Tableau paginé et filtrable (2 modes)    |
| `TranslationTableRow.tsx`      | Ligne « À traduire » avec actions        |
| `TranslationCompleteRow.tsx`   | Ligne « Traduits » avec bouton Modifier  |
| `TranslationStatusTabs.tsx`    | Onglets À traduire / Traduits            |
| `TranslationReviewModal.tsx`   | Modale de relecture/édition              |
| `TranslationBatchProgress.tsx` | Barre de progression du lot              |

### Hooks (`src/hooks/`)

| Fichier                   | Rôle                                          |
| ------------------------- | --------------------------------------------- |
| `useAdminTranslations.ts` | Fetch SWR stats + liste, mutations traduction |

### Services (`src/lib/services/`)

| Fichier                 | Rôle                                       |
| ----------------------- | ------------------------------------------ |
| `translationService.ts`            | Requêtes Supabase (missing, stats, upsert)        |
| `aiTranslateService.ts`            | Appel Vercel AI Gateway via Vercel AI SDK         |
| `translationAiSettingsService.ts`  | Modèle choisi, liste des modèles, crédits gateway |

### Autres fichiers

| Fichier                                    | Rôle             |
| ------------------------------------------ | ---------------- |
| `src/types/admin-translations.ts`          | Types TypeScript |
| `src/lib/validations/admin-translation.ts` | Schémas Zod      |
