# Document de conception — Gestion admin des genres

## Vue d'ensemble

Ce module ajoute le CRUD complet des genres de jeux dans l'interface
d'administration. Il suit les mêmes patterns que les modules admin existants
(langues, personnages, jeux) : routes API Next.js protégées par
`requireAdmin()`, hooks React pour la gestion d'état, composants de
table/formulaire/dialogue, et validation Zod partagée client/serveur.

La particularité des genres par rapport aux langues est le support multilingue :
chaque genre possède un slug immuable et des traductions (nom + description)
dans chaque langue supportée, stockées dans `genre_translations`.

## Architecture

```mermaid
graph TD
    subgraph Pages
        LP["/admin/genres - Liste"]
        CP["/admin/genres/new - Création"]
        EP["/admin/genres/[slug]/edit - Édition"]
    end

    subgraph Hooks
        UAG["useAdminGenres()"]
        UGF["useGenreForm()"]
    end

    subgraph Composants
        AGT["AdminGenresTable"]
        GF["GenreForm"]
        DGD["DeleteGenreDialog"]
    end

    subgraph API
        GET_LIST["GET /api/admin/genres"]
        POST_CREATE["POST /api/admin/genres"]
        GET_ONE["GET /api/admin/genres/[slug]"]
        PUT_UPDATE["PUT /api/admin/genres/[slug]"]
        DELETE_ONE["DELETE /api/admin/genres/[slug]"]
    end

    subgraph Validation
        ZS["adminGenreFormSchema (Zod)"]
        ZQ["genreQuerySchema (Zod)"]
    end

    subgraph Base de données
        G["genres (id, slug)"]
        GT["genre_translations (genre_id, language_code, name, description)"]
        GG["game_genres (game_id, genre_id)"]
        SL["supported_languages (code, name)"]
    end

    LP --> UAG
    LP --> AGT
    LP --> DGD
    CP --> UGF
    CP --> GF
    EP --> UGF
    EP --> GF

    UAG --> GET_LIST
    UAG --> DELETE_ONE
    UGF --> POST_CREATE
    UGF --> PUT_UPDATE
    UGF --> GET_ONE

    GET_LIST --> ZQ
    POST_CREATE --> ZS
    PUT_UPDATE --> ZS

    GET_LIST --> G
    GET_LIST --> GT
    GET_LIST --> GG
    POST_CREATE --> G
    POST_CREATE --> GT
    GET_ONE --> G
    GET_ONE --> GT
    PUT_UPDATE --> GT
    DELETE_ONE --> GG
    DELETE_ONE --> GT
    DELETE_ONE --> G

    GT --> SL
    GT --> G
    GG --> G
end
```

## Composants et interfaces

### Routes API

Toutes les routes sont protégées par `requireAdmin()` et suivent le pattern
existant des langues.

#### `GET /api/admin/genres`

- Paramètres query : `page`, `limit`, `search`, `sort_by` (slug | name),
  `sort_order` (asc | desc), `locale` (pour le nom traduit)
- Retourne : `{ genres: AdminGenre[], pagination: PaginationInfo }`
- Recherche sur `slug` et `genre_translations.name` (via la locale)
- Jointure avec `game_genres` pour le compteur de jeux

#### `POST /api/admin/genres`

- Body : `{ slug, translations: [{ language_code, name, description }] }`
- Validation Zod côté serveur
- Insère dans `genres` puis `genre_translations`
- Retourne 201 avec le genre créé, ou 409 si slug dupliqué

#### `GET /api/admin/genres/[slug]`

- Retourne le genre avec toutes ses traductions et le nombre de jeux
- 404 si non trouvé

#### `PUT /api/admin/genres/[slug]`

- Body : `{ translations: [{ language_code, name, description }] }`
- Le slug est immuable (pas dans le body)
- Upsert des traductions dans `genre_translations`

#### `DELETE /api/admin/genres/[slug]`

- Vérifie l'usage dans `game_genres`
- Sans `?force=true` : retourne 409 avec `usageCount` si le genre est utilisé
- Avec `?force=true` : supprime les associations `game_genres`, puis
  `genre_translations`, puis `genres`

### Hooks

#### `useAdminGenres()`

- État : `genres`, `pagination`, `loading`, `error`
- Actions : `fetchGenres(params)`, `deleteGenre(slug)`, `checkGenreUsage(slug)`,
  `refetch()`
- Même pattern que `useAdminLanguages()`

#### `useGenreForm(mode, initialData?)`

- Intègre `react-hook-form` avec `zodResolver(adminGenreFormSchema)`
- Gère la soumission vers POST (create) ou PUT (edit)
- Récupère les langues supportées via `GET /api/admin/languages` pour afficher
  un champ par langue
- Retourne :
  `{ form, submitGenre, isSubmitting, submitError, supportedLanguages }`

### Composants

#### `AdminGenresTable`

- Props : `genres`, `pagination`, `onPageChange`, `onSearch`, `onSort`,
  `onEdit`, `onDelete`, `isLoading`, `currentSort`, `currentSearch`
- Colonnes : slug, nom (locale courante), nombre de jeux, actions (éditer,
  supprimer)

#### `GenreForm`

- Props : `mode`, `form`, `onSubmit`, `isSubmitting`, `supportedLanguages`
- Champ slug (désactivé en mode edit)
- Section traductions : pour chaque langue supportée, un champ nom et un champ
  description

#### `DeleteGenreDialog`

- Props : `genre`, `isOpen`, `onClose`, `onConfirm`, `isDeleting`, `usageCount`
- Affiche un avertissement si le genre est utilisé par des jeux

### Pages

#### `/admin/genres/page.tsx`

- Utilise `useAdminGenres()` pour la liste
- Affiche `AdminGenresTable` et `DeleteGenreDialog`
- Bouton "Nouveau genre" vers `/admin/genres/new`

#### `/admin/genres/new/page.tsx`

- Utilise `useGenreForm("create")`
- Affiche `GenreForm`
- Redirige vers la liste après création

#### `/admin/genres/[slug]/edit/page.tsx`

- Charge le genre via `GET /api/admin/genres/[slug]`
- Utilise `useGenreForm("edit", initialData)`
- Affiche `GenreForm`

## Modèles de données

### Types TypeScript (`src/types/admin-genres.ts`)

```typescript
export interface AdminGenre {
  id: string;
  slug: string;
  gameCount: number;
  translations: GenreTranslation[];
}

export interface GenreTranslation {
  language_code: string;
  name: string;
  description: string;
}

export interface FetchGenresParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  locale?: string;
}
```

### Schéma de validation Zod (`src/lib/validations/admin-genre-form.ts`)

```typescript
const genreTranslationSchema = z.object({
  language_code: z.string().min(1),
  name: z.string().min(1, "Le nom est requis").max(100),
  description: z.string().max(500).optional().or(z.literal("")),
});

const adminGenreFormSchema = z.object({
  slug: z
    .string()
    .min(2, "Le slug doit contenir au moins 2 caractères")
    .max(50, "Le slug ne peut pas dépasser 50 caractères")
    .regex(
      /^[a-z]([a-z0-9-]*[a-z0-9])?$/,
      "Lettres minuscules, chiffres et tirets uniquement"
    ),
  translations: z
    .array(genreTranslationSchema)
    .min(1, "Au moins une traduction est requise"),
});
```

### Schéma de validation query (`genreQuerySchema`)

```typescript
const genreQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  sort_by: z.enum(["slug", "name"]).default("slug"),
  sort_order: z.enum(["asc", "desc"]).default("asc"),
  locale: z.string().default("fr"),
});
```

### Schéma base de données (existant)

```
genres: id (UUID PK), slug (TEXT UNIQUE)
genre_translations: genre_id (FK → genres.id), language_code (FK → supported_languages.code), name (TEXT), description (TEXT)
game_genres: game_id (FK → games.id), genre_id (FK → genres.id)
```

## Propriétés de correction

_Une propriété est une caractéristique ou un comportement qui doit rester vrai
pour toutes les exécutions valides d'un système — essentiellement, une
déclaration formelle de ce que le système doit faire. Les propriétés servent de
pont entre les spécifications lisibles par l'humain et les garanties de
correction vérifiables par la machine._

### Property 1 : La recherche filtre correctement

_Pour tout_ ensemble de genres et _pour tout_ terme de recherche, tous les
genres retournés par l'API doivent contenir le terme dans leur slug ou dans leur
nom traduit (insensible à la casse).

**Validates: Requirements 1.2**

### Property 2 : Le tri ordonne correctement

_Pour tout_ ensemble de genres, _pour tout_ champ de tri (slug ou name) et _pour
tout_ ordre (asc ou desc), les genres retournés par l'API doivent être ordonnés
selon le champ et l'ordre spécifiés.

**Validates: Requirements 1.3**

### Property 3 : La pagination est correcte

_Pour tout_ ensemble de N genres et _pour toute_ limite L ≥ 1, le nombre de
pages doit être ceil(N/L), chaque page doit contenir au plus L éléments, et la
somme des éléments de toutes les pages doit être N.

**Validates: Requirements 1.4**

### Property 4 : Round-trip création de genre

_Pour tout_ slug valide et _pour toute_ liste de traductions valides (au moins
une), créer un genre puis le récupérer via GET doit retourner un genre avec le
même slug et les mêmes traductions.

**Validates: Requirements 2.1**

### Property 5 : Validation du slug

_Pour toute_ chaîne de caractères, le schéma de validation du slug accepte la
chaîne si et seulement si elle contient uniquement des lettres minuscules, des
chiffres et des tirets, commence par une lettre, se termine par une lettre ou un
chiffre, et a entre 2 et 50 caractères.

**Validates: Requirements 2.4**

### Property 6 : Validation des traductions

_Pour toute_ traduction, le schéma de validation accepte la traduction si et
seulement si le nom est non vide et ne dépasse pas 100 caractères, et la
description ne dépasse pas 500 caractères.

**Validates: Requirements 2.5, 2.6**

### Property 7 : Round-trip mise à jour de genre

_Pour tout_ genre existant et _pour toute_ liste de traductions valides, mettre
à jour le genre puis le récupérer via GET doit retourner les traductions mises à
jour.

**Validates: Requirements 3.2**

### Property 8 : Suppression d'un genre non utilisé

_Pour tout_ genre sans jeux associés, la suppression doit réussir et le genre ne
doit plus être récupérable via GET (404).

**Validates: Requirements 4.1**

### Property 9 : Rejet des données invalides par l'API

_Pour tout_ payload ne respectant pas le schéma de validation (slug invalide,
traductions manquantes, nom vide, description trop longue), l'API de création
doit retourner un code 400.

**Validates: Requirements 5.2**

## Gestion des erreurs

| Situation                         | Code HTTP | Comportement                                    |
| --------------------------------- | --------- | ----------------------------------------------- |
| Utilisateur non admin             | 403       | Message "Admin access required"                 |
| Genre non trouvé (GET/PUT/DELETE) | 404       | Message "Genre not found"                       |
| Slug dupliqué (POST)              | 409       | Message "A genre with this slug already exists" |
| Genre utilisé (DELETE sans force) | 409       | Message avec `usageCount` et `type: "IN_USE"`   |
| Données invalides (POST/PUT)      | 400       | Détail des erreurs Zod dans `details`           |
| Paramètres query invalides (GET)  | 400       | Détail des erreurs Zod                          |
| Erreur base de données            | 500       | Message générique, log serveur                  |

Côté client, les erreurs sont gérées par :

- `useGenreForm` : `submitError` affiché dans le formulaire
- `useAdminGenres` : `error` affiché dans la page de liste
- `DeleteGenreDialog` : toast d'erreur via `use-toast`

## Stratégie de tests

### Tests unitaires (bun:test)

Placés dans `test/unit/lib/validations/` :

- `admin-genre-form.test.ts` : Tests du schéma Zod (cas valides, invalides,
  limites)

Placés dans `test/unit/hooks/` :

- `useAdminGenres.test.ts` : Tests du hook de liste (fetch, delete, pagination)
- `useGenreForm.test.ts` : Tests du hook de formulaire (create, edit, erreurs)

### Tests property-based (fast-check + bun:test)

Placés dans `test/unit/lib/validations/` :

- `admin-genre-form.property.test.ts` : Propriétés 5, 6, 9

Chaque test property-based doit :

- Utiliser `fast-check` avec `bun:test`
- Exécuter minimum 100 itérations
- Être annoté avec un commentaire référençant la propriété du design

Format d'annotation : `// Feature: admin-genre-management, Property N: [titre]`

### Tests isolés (test/isolated/)

Les tests d'API qui mockent `fetch` ou `createRouteHandlerClient` doivent être
dans `test/isolated/api/admin/genres/` pour éviter les conflits de mock avec les
tests parallèles.

### Approche complémentaire

- Les tests unitaires vérifient des exemples spécifiques et des edge cases (slug
  dupliqué, genre non trouvé, suppression forcée)
- Les tests property-based vérifient les propriétés universelles sur des entrées
  générées aléatoirement
- Les deux sont nécessaires pour une couverture complète
