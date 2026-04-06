# Collections de Jeux

## Description

La fonctionnalité **Collections de jeux** permet aux joueurs de Game Universe de
créer des listes thématiques de jeux (ex. « À jouer », « Meilleurs RPG », «
Nostalgie PS2 »). Chaque collection est associée à un joueur, contient un
ensemble ordonné de jeux avec notes optionnelles, et peut être partagée
publiquement via un lien unique.

Fonctionnalités principales :

- Création, modification et suppression de collections
- Ajout, retrait et réordonnancement de jeux dans une collection
- Note textuelle optionnelle par jeu
- Visibilité privée (par défaut) ou publique
- Partage public via URL canonique
- Contrôle d'accès RLS (Row Level Security)
- Internationalisation FR/EN

## Accès

### Pages

| Page                  | URL                                         | Description              |
| --------------------- | ------------------------------------------- | ------------------------ |
| Liste des collections | `/[locale]/players/[id]/collections`        | Collections d'un joueur  |
| Détail collection     | `/[locale]/players/[id]/collections/[slug]` | Contenu d'une collection |

### Routes API

| Méthode | Route                                                 | Description              |
| ------- | ----------------------------------------------------- | ------------------------ |
| GET     | `/api/players/[id]/collections`                       | Lister les collections   |
| POST    | `/api/players/[id]/collections`                       | Créer une collection     |
| GET     | `/api/players/[id]/collections/[slug]`                | Détail d'une collection  |
| PATCH   | `/api/players/[id]/collections/[slug]`                | Modifier une collection  |
| DELETE  | `/api/players/[id]/collections/[slug]`                | Supprimer une collection |
| POST    | `/api/players/[id]/collections/[slug]/items`          | Ajouter un jeu           |
| DELETE  | `/api/players/[id]/collections/[slug]/items/[gameId]` | Retirer un jeu           |
| PATCH   | `/api/players/[id]/collections/[slug]/items/reorder`  | Réordonner les jeux      |

## Prérequis

1. **Migration Supabase** : la migration
   `supabase/migrations/20240221000001_game_collections.sql` doit être
   appliquée. Elle crée les tables `game_collections` et `game_collection_items`
   avec index, contraintes, trigger `updated_at` et politiques RLS.
2. **Authentification** : un utilisateur doit être connecté pour créer, modifier
   ou supprimer des collections. La lecture des collections publiques est
   accessible sans authentification.
3. **RLS activé** : les politiques Row Level Security garantissent que seul le
   propriétaire peut modifier ses collections et que les collections privées
   sont invisibles aux autres utilisateurs.

## Utilisation

### Créer une collection

Depuis la page `/[locale]/players/[id]/collections`, cliquer sur « Créer une
collection ». Renseigner un nom (obligatoire, 100 car. max) et une description
optionnelle (500 car. max). La collection est privée par défaut.

### Modifier une collection

Sur la page de détail, utiliser les actions du propriétaire pour modifier le
nom, la description ou la visibilité. Le slug reste inchangé après modification.

### Supprimer une collection

Sur la page de détail, cliquer sur « Supprimer ». La suppression est en cascade
: tous les éléments associés sont supprimés automatiquement.

### Ajouter un jeu

Sur la page de détail, utiliser l'interface d'ajout pour rechercher un jeu et
l'ajouter à la collection. Une note optionnelle (250 car. max) peut être
associée. Les doublons sont rejetés.

### Retirer un jeu

Sur la page de détail, retirer un jeu de la collection. Les positions des jeux
restants sont automatiquement réordonnées.

### Réordonner les jeux

Modifier l'ordre d'affichage des jeux via l'interface de réordonnancement.

### Basculer la visibilité

Basculer entre « privée » et « publique » depuis les actions du propriétaire.
Une collection publique est accessible à tous via son URL.

### Partager une collection

Copier le lien de partage depuis les actions du propriétaire. Le lien correspond
à l'URL canonique `/[locale]/players/[id]/collections/[slug]`.

## Architecture

### Base de données

- `game_collections` — Collections avec nom, slug, description, visibilité
- `game_collection_items` — Jeux dans une collection avec position et note

### Service layer (`src/lib/services/`)

- `collectionService.ts` — Fonctions utilitaires (slug, positions,
  réordonnancement)
- `collectionMutations.ts` — Opérations CRUD Supabase
- `collectionQueries.ts` — Requêtes de lecture Supabase
- `collectionApi.ts` — Fonctions d'appel API côté client

### Composants React (`src/components/collections/`)

- `CollectionList.tsx` — Grille de cartes
- `CollectionCard.tsx` — Carte résumé
- `CollectionDetail.tsx` — Affichage détaillé
- `CollectionGameCard.tsx` — Carte d'un jeu
- `CollectionForm.tsx` — Formulaire création/édition
- `CollectionActions.tsx` — Actions propriétaire
- `AddGameToCollection.tsx` — Ajout de jeu
- `CollectionSkeleton.tsx` — Skeleton de chargement
- `CollectionsPageContent.tsx` — Contenu page liste
- `CollectionDetailPageContent.tsx` — Contenu page détail

### Hooks (`src/hooks/`)

- `useCollections.ts` — Fetch des collections d'un joueur
- `useCollectionDetail.ts` — Fetch du détail d'une collection
- `useCollectionMutations.ts` — Mutations CRUD avec invalidation de cache

### Validation (`src/lib/validations/collection.ts`)

Schémas Zod : `createCollectionSchema`, `updateCollectionSchema`,
`addCollectionItemSchema`, `reorderCollectionItemsSchema`.

### Types (`src/types/collection.ts`)

Interfaces : `CollectionSummary`, `CollectionDetail`, `CollectionItem`,
`CreateCollectionInput`, `UpdateCollectionInput`, `AddCollectionItemInput`,
`ReorderCollectionItemsInput`.

### Internationalisation

Clés de traduction dans `src/messages/fr.json` et `src/messages/en.json`,
section `collections`.

## Tests

- Tests unitaires : `test/unit/lib/services/collectionService.test.ts`,
  `test/unit/lib/validations/collection.test.ts`
- Tests property-based (fast-check) :
  `test/unit/lib/services/collectionService.property.test.ts`,
  `test/unit/lib/validations/collection.property.test.ts`
- Tests composants : `test/unit/components/collections/CollectionCard.test.ts`,
  `test/unit/components/collections/CollectionForm.test.ts`,
  `test/unit/components/collections/CollectionList.test.ts`
- Tests API : `test/unit/lib/services/collectionApi.test.ts`
