# Document de Design : Gestion Admin des Avis

## Vue d'ensemble

La fonctionnalité ajoute une section "Avis" dans le panneau d'administration,
permettant aux administrateurs de lister, modifier et supprimer les reviews des
joueurs. Elle suit les patterns existants des autres entités admin (jeux,
personnages, genres) : page de liste avec table paginée, page d'édition avec
formulaire, dialogue de suppression avec confirmation.

L'implémentation réutilise le schéma de validation Zod existant (`reviewSchema`)
et les types `Review` déjà définis. Côté base de données, une migration ajoute
des politiques RLS permettant aux administrateurs de modifier et supprimer toute
review. Côté API, de nouvelles routes sous `/api/admin/reviews` utilisent
`requireAdmin()` pour sécuriser l'accès.

## Architecture

```mermaid
graph TD
    A[Admin Review List Page] --> B[AdminReviewsTable]
    A --> C[DeleteReviewDialog]
    B -->|GET| D[/api/admin/reviews]
    C -->|DELETE| E[/api/admin/reviews/:id]

    F[Admin Review Edit Page] --> G[AdminReviewForm]
    G -->|GET| E
    G -->|PUT| E
    G --> H[RichTextEditor existant]
    G --> I[ReviewPointsList existant]
    G --> J[RatingInput existant]

    D --> K[requireAdmin]
    E --> K
    D --> L[(Supabase - game_reviews)]
    E --> L

    G --> M[reviewSchema - Zod existant]
```

### Choix techniques

- **Réutilisation maximale** : Les composants `RichTextEditor`,
  `ReviewPointsList` et `RatingInput` de la spec `game-reviews` sont réutilisés
  dans le formulaire admin.
- **Validation partagée** : Le schéma Zod `reviewSchema` existant dans
  `src/lib/validations/review.ts` est réutilisé côté admin pour garantir la
  cohérence.
- **Pattern admin existant** : La structure suit exactement le pattern de
  `admin/games` — hook dédié, table avec pagination/recherche/tri, page
  d'édition avec formulaire.
- **Sécurité** : `requireAdmin()` de `src/lib/auth-admin.ts` protège toutes les
  routes API. Des politiques RLS supplémentaires permettent aux admins de
  modifier/supprimer toute review.

## Composants et Interfaces

### Nouveaux composants

```
src/components/admin/reviews/
├── AdminReviewsTable.tsx      # Table paginée avec recherche et tri
├── AdminReviewForm.tsx         # Formulaire d'édition d'une review
└── DeleteReviewDialog.tsx      # Dialogue de confirmation de suppression
```

### Nouveau hook

```
src/hooks/useAdminReviews.ts    # Gestion état liste reviews admin (fetch, delete, pagination)
```

### Nouvelles routes API

```
src/app/api/admin/reviews/route.ts        # GET (liste paginée avec recherche/tri)
src/app/api/admin/reviews/[id]/route.ts   # GET (détail), PUT (mise à jour), DELETE (suppression)
```

### Nouvelles pages

```
src/app/[locale]/admin/reviews/page.tsx           # Page liste des avis
src/app/[locale]/admin/reviews/[id]/edit/page.tsx  # Page édition d'un avis
```

### Nouveau type

```
src/types/admin-reviews.ts    # Types spécifiques à l'admin reviews
```

### Nouvelle validation

```
src/lib/validations/admin-review-query.ts  # Schéma Zod pour les paramètres de requête liste
```

### Nouvelle migration

```
supabase/migrations/20240218000001_admin_review_rls.sql  # Politiques RLS admin
```

### Interfaces des composants clés

```typescript
// AdminReviewsTable
interface AdminReviewsTableProps {
  reviews: AdminReview[];
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
  onSearch: (query: string) => void;
  onSort: (field: string, order: "asc" | "desc") => void;
  onEdit: (id: string) => void;
  onDelete: (review: AdminReview) => void;
  canDelete: boolean;
  isLoading: boolean;
  currentSort: { field: string; order: "asc" | "desc" };
  currentSearch: string;
}

// AdminReviewForm
interface AdminReviewFormProps {
  review: AdminReviewDetail;
  onSubmit: (data: ReviewFormData) => Promise<void>;
  isSubmitting: boolean;
}

// DeleteReviewDialog
interface DeleteReviewDialogProps {
  review: AdminReview | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
}
```

## Modèles de données

### Types TypeScript (`src/types/admin-reviews.ts`)

```typescript
/** Review telle qu'affichée dans la liste admin */
export interface AdminReview {
  id: string;
  rating: number;
  contentExcerpt: string;
  createdAt: string;
  updatedAt: string;
  playerName: string | null;
  playerEmail: string | null;
  gameTitle: string;
  gameId: string;
}

/** Review complète pour le formulaire d'édition admin */
export interface AdminReviewDetail {
  id: string;
  userId: string;
  gameId: string;
  rating: number;
  content: string;
  positivePoints: string[];
  negativePoints: string[];
  createdAt: string;
  updatedAt: string;
  playerName: string | null;
  gameTitle: string;
}

/** Paramètres de requête pour la liste admin */
export interface FetchAdminReviewsParams {
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}
```

### Schéma de validation des paramètres de requête (`src/lib/validations/admin-review-query.ts`)

```typescript
import { z } from "zod";

export const adminReviewQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  sort_by: z
    .enum(["created_at", "updated_at", "rating", "player_name", "game_title"])
    .default("created_at"),
  sort_order: z.enum(["asc", "desc"]).default("desc"),
});

export type AdminReviewQuery = z.infer<typeof adminReviewQuerySchema>;
```

### Migration RLS (`supabase/migrations/20240218000001_admin_review_rls.sql`)

```sql
-- Migration: Politiques RLS admin pour game_reviews
-- Permet aux administrateurs de modifier et supprimer toute review

-- Mise à jour par un administrateur (basé sur le rôle dans user_metadata)
CREATE POLICY "Admins can update any review"
  ON game_reviews FOR UPDATE
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    OR auth.uid() = user_id
  );

-- Suppression par un administrateur
CREATE POLICY "Admins can delete any review"
  ON game_reviews FOR DELETE
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );
```

### API Routes

**GET `/api/admin/reviews`** — Liste paginée

- Paramètres : `page`, `limit`, `search`, `sort_by`, `sort_order`
- Jointure avec `profiles` (nom joueur) et `games`/`game_translations` (titre
  jeu)
- Retourne : `{ reviews: AdminReview[], pagination: PaginationInfo }`

**GET `/api/admin/reviews/[id]`** — Détail d'une review

- Retourne : `AdminReviewDetail`

**PUT `/api/admin/reviews/[id]`** — Mise à jour

- Body validé avec `reviewSchema`
- Met à jour `updated_at` automatiquement
- Retourne : `AdminReviewDetail` mis à jour

**DELETE `/api/admin/reviews/[id]`** — Suppression

- Retourne : `{ success: true }`

## Propriétés de Correctness

_Une propriété est une caractéristique ou un comportement qui doit rester vrai
pour toutes les exécutions valides d'un système — essentiellement, une
déclaration formelle de ce que le système doit faire. Les propriétés servent de
pont entre les spécifications lisibles par l'humain et les garanties de
correction vérifiables par la machine._

### Property 1 : Pagination correcte

_Pour toute_ collection de N reviews en base et toute combinaison valide de
`page` et `limit`, l'API GET `/api/admin/reviews` doit retourner au maximum
`limit` reviews, et `pagination.totalCount` doit être égal à N, et
`pagination.totalPages` doit être égal à `ceil(N / limit)`.

**Validates: Requirements 1.1**

### Property 2 : Réponse API contient tous les champs requis

_Pour toute_ review retournée par l'API GET `/api/admin/reviews`, la réponse
doit contenir les champs `playerName`, `gameTitle`, `rating`, `contentExcerpt`
et `createdAt` avec des valeurs non-undefined.

**Validates: Requirements 1.2**

### Property 3 : Filtrage par recherche

_Pour tout_ terme de recherche et toute collection de reviews, chaque review
retournée par l'API avec ce terme de recherche doit avoir un `playerName` ou un
`gameTitle` contenant le terme (insensible à la casse).

**Validates: Requirements 1.3**

### Property 4 : Tri correct

_Pour tout_ champ de tri valide et tout ordre (asc/desc), la liste de reviews
retournée par l'API doit être triée selon ce champ dans l'ordre spécifié.

**Validates: Requirements 1.4**

### Property 5 : Round-trip mise à jour

_Pour toute_ review existante et toute donnée de mise à jour valide (conforme à
`reviewSchema`), après un PUT suivi d'un GET sur la même review, les champs
`rating`, `content`, `positivePoints` et `negativePoints` doivent correspondre
aux valeurs envoyées dans le PUT.

**Validates: Requirements 2.2**

### Property 6 : Suppression effective

_Pour toute_ review existante, après un appel DELETE réussi, un GET sur cette
même review doit retourner une erreur 404.

**Validates: Requirements 3.2**

### Property 7 : Rejet d'accès non-admin

_Pour toute_ requête vers les endpoints `/api/admin/reviews` ou
`/api/admin/reviews/[id]` effectuée par un utilisateur non-administrateur, l'API
doit retourner une réponse HTTP 403.

**Validates: Requirements 4.1, 4.2**

### Property 8 : Mise à jour du champ updated_at

_Pour toute_ review mise à jour via PUT, la valeur de `updated_at` dans la
réponse doit être supérieure ou égale à la valeur de `updated_at` avant la mise
à jour.

**Validates: Requirements 5.2**

## Gestion des erreurs

| Scénario                                    | Comportement                                            |
| ------------------------------------------- | ------------------------------------------------------- |
| Utilisateur non authentifié                 | Réponse 401, redirection vers login côté client         |
| Utilisateur non administrateur              | Réponse 403 via `requireAdmin()`                        |
| Review introuvable (GET/PUT/DELETE par id)  | Réponse 404                                             |
| Validation Zod échoue (PUT)                 | Réponse 400 avec détails des erreurs                    |
| Paramètres de requête invalides (GET liste) | Réponse 400 avec détails des erreurs                    |
| Erreur Supabase inattendue                  | Réponse 500, log serveur, message générique côté client |
| Suppression d'une review déjà supprimée     | Réponse 404                                             |

## Stratégie de tests

### Tests unitaires

- Validation `adminReviewQuerySchema` : paramètres valides, valeurs par défaut,
  valeurs hors bornes
- Transformation des données API vers les types `AdminReview` et
  `AdminReviewDetail`
- Composant `AdminReviewsTable` : rendu avec données, état vide, interactions
  recherche/tri
- Composant `AdminReviewForm` : rendu pré-rempli, soumission, affichage erreurs
- Composant `DeleteReviewDialog` : rendu, confirmation, annulation

Emplacement : `test/unit/lib/validations/admin-review-query.test.ts`,
`test/unit/components/admin/reviews/`

### Tests property-based

Bibliothèque : `fast-check` (déjà installée dans le projet)

Chaque test property-based doit exécuter au minimum 100 itérations.

Chaque test doit être annoté avec un commentaire référençant la propriété :
`Feature: admin-review-management, Property N: description`

Emplacement : `test/unit/lib/validations/admin-review-query.property.test.ts`,
`test/isolated/api/admin/reviews.property.test.ts`

### Tests isolés

Les tests des routes API (`/api/admin/reviews`) qui utilisent `mock.module()`
pour mocker Supabase et `requireAdmin` doivent être placés dans
`test/isolated/api/admin/`.

### Approche duale

- **Tests unitaires** : cas spécifiques, edge cases (liste vide, review
  introuvable), erreurs de validation
- **Tests property-based** : propriétés universelles (pagination, tri, filtrage,
  round-trip, auth)
- Les deux sont complémentaires : les tests unitaires attrapent les bugs
  concrets, les tests property-based vérifient la correction générale
