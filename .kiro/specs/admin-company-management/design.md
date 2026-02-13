# Document de conception — Gestion admin des entreprises

## Vue d'ensemble

Ce module ajoute le CRUD complet des entreprises (développeurs/éditeurs) dans
l'interface d'administration. Il suit les mêmes patterns que les modules admin
existants (genres, langues, jeux) : routes API Next.js protégées par
`requireAdmin()`, hooks React pour la gestion d'état, composants de
table/formulaire/dialogue, et validation Zod partagée client/serveur.

Contrairement aux genres, les entreprises n'ont pas de traductions multilingues
mais possèdent des champs descriptifs riches (description, site web, logo, année
de fondation, siège social, type developer/publisher/both). La table `companies`
et la table de jonction `game_companies` existent déjà en base de données.

## Architecture

```mermaid
graph TD
    subgraph Pages
        LP["/admin/companies - Liste"]
        CP["/admin/companies/new - Création"]
        EP["/admin/companies/[slug]/edit - Édition"]
    end

    subgraph Hooks
        UAC["useAdminCompanies()"]
        UCF["useCompanyForm()"]
    end

    subgraph Composants
        ACT["AdminCompaniesTable"]
        CF["CompanyForm"]
        DCD["DeleteCompanyDialog"]
    end

    subgraph API
        GET_LIST["GET /api/admin/companies"]
        POST_CREATE["POST /api/admin/companies"]
        GET_ONE["GET /api/admin/companies/[slug]"]
        PUT_UPDATE["PUT /api/admin/companies/[slug]"]
        DELETE_ONE["DELETE /api/admin/companies/[slug]"]
    end

    subgraph Validation
        ZS["adminCompanyFormSchema (Zod)"]
        ZQ["companyQuerySchema (Zod)"]
    end

    subgraph Base de données
        C["companies (id, name, slug, description, ...)"]
        GC["game_companies (game_id, company_id, role, is_primary)"]
    end

    LP --> UAC
    LP --> ACT
    LP --> DCD
    CP --> UCF
    CP --> CF
    EP --> UCF
    EP --> CF

    UAC --> GET_LIST
    UAC --> DELETE_ONE
    UCF --> POST_CREATE
    UCF --> PUT_UPDATE
    UCF --> GET_ONE

    GET_LIST --> ZQ
    POST_CREATE --> ZS
    PUT_UPDATE --> ZS

    GET_LIST --> C
    GET_LIST --> GC
    POST_CREATE --> C
    GET_ONE --> C
    GET_ONE --> GC
    PUT_UPDATE --> C
    DELETE_ONE --> GC
    DELETE_ONE --> C
end
```

## Composants et interfaces

### Routes API

Toutes les routes sont protégées par `requireAdmin()` et suivent le pattern
existant des genres.

#### `GET /api/admin/companies`

- Paramètres query : `page`, `limit`, `search`, `sort_by` (name | slug),
  `sort_order` (asc | desc)
- Retourne : `{ companies: AdminCompany[], pagination: PaginationInfo }`
- Recherche sur `name` et `slug` (ilike)
- Jointure avec `game_companies` pour le compteur de jeux

#### `POST /api/admin/companies`

- Body :
  `{ name, slug, description?, website_url?, logo_url?, founded_year?, headquarters?, company_type }`
- Validation Zod côté serveur
- Insère dans `companies`
- Retourne 201 avec l'entreprise créée, ou 409 si nom/slug dupliqué

#### `GET /api/admin/companies/[slug]`

- Retourne l'entreprise avec tous ses champs et le nombre de jeux
- 404 si non trouvée

#### `PUT /api/admin/companies/[slug]`

- Body :
  `{ name, description?, website_url?, logo_url?, founded_year?, headquarters?, company_type }`
- Le slug est immuable (pas dans le body)
- Met à jour les champs dans `companies`

#### `DELETE /api/admin/companies/[slug]`

- Vérifie l'usage dans `game_companies`
- Sans `?force=true` : retourne 409 avec `usageCount` si l'entreprise est
  utilisée
- Avec `?force=true` : supprime les associations `game_companies`, puis
  l'entreprise

### Hooks

#### `useAdminCompanies()`

- État : `companies`, `pagination`, `loading`, `error`
- Actions : `fetchCompanies(params)`, `deleteCompany(slug)`,
  `checkCompanyUsage(slug)`, `refetch()`
- Même pattern que `useAdminGenres()`

#### `useCompanyForm(mode, initialData?)`

- Intègre `react-hook-form` avec `zodResolver(adminCompanyFormSchema)`
- Gère la soumission vers POST (create) ou PUT (edit)
- Retourne : `{ form, submitCompany, isSubmitting, submitError }`

### Composants

#### `AdminCompaniesTable`

- Props : `companies`, `pagination`, `onPageChange`, `onSearch`, `onSort`,
  `onEdit`, `onDelete`, `isLoading`, `currentSort`, `currentSearch`
- Colonnes : nom, slug, type, nombre de jeux, actions (éditer, supprimer)

#### `CompanyForm`

- Props : `mode`, `form`, `onSubmit`, `isSubmitting`
- Champ slug (désactivé en mode edit)
- Champs : nom, type (select), description (textarea), site web, logo URL, année
  de fondation, siège social

#### `DeleteCompanyDialog`

- Props : `company`, `isOpen`, `onClose`, `onConfirm`, `isDeleting`,
  `usageCount`
- Affiche un avertissement si l'entreprise est utilisée par des jeux

### Pages

#### `/admin/companies/page.tsx`

- Utilise `useAdminCompanies()` pour la liste
- Affiche `AdminCompaniesTable` et `DeleteCompanyDialog`
- Bouton "Nouvelle entreprise" vers `/admin/companies/new`

#### `/admin/companies/new/page.tsx`

- Utilise `useCompanyForm("create")`
- Affiche `CompanyForm`
- Redirige vers la liste après création

#### `/admin/companies/[slug]/edit/page.tsx`

- Charge l'entreprise via `GET /api/admin/companies/[slug]`
- Utilise `useCompanyForm("edit", initialData)`
- Affiche `CompanyForm`

## Modèles de données

### Types TypeScript (`src/types/admin-companies.ts`)

```typescript
export interface AdminCompany {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  website_url: string | null;
  logo_url: string | null;
  founded_year: number | null;
  headquarters: string | null;
  company_type: "developer" | "publisher" | "both";
  is_active: boolean;
  gameCount: number;
}

export interface FetchCompaniesParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}
```

### Schéma de validation Zod (`src/lib/validations/admin-company-form.ts`)

```typescript
const adminCompanyFormSchema = z.object({
  name: z
    .string()
    .min(1, "Le nom est requis")
    .max(255, "Le nom ne peut pas dépasser 255 caractères"),
  slug: z
    .string()
    .min(2, "Le slug doit contenir au moins 2 caractères")
    .max(100, "Le slug ne peut pas dépasser 100 caractères")
    .regex(
      /^[a-z]([a-z0-9-]*[a-z0-9])?$/,
      "Lettres minuscules, chiffres et tirets uniquement"
    ),
  company_type: z.enum(["developer", "publisher", "both"]),
  description: z.string().max(2000).optional().or(z.literal("")),
  website_url: z.string().url("URL invalide").optional().or(z.literal("")),
  logo_url: z.string().optional().or(z.literal("")),
  founded_year: z.coerce
    .number()
    .int()
    .min(1800)
    .max(new Date().getFullYear())
    .optional()
    .or(z.literal("")),
  headquarters: z.string().max(255).optional().or(z.literal("")),
});
```

### Schéma de validation query (`companyQuerySchema`)

```typescript
const companyQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  sort_by: z.enum(["name", "slug"]).default("name"),
  sort_order: z.enum(["asc", "desc"]).default("asc"),
});
```

### Schéma base de données (existant)

```
companies: id (UUID PK), name (VARCHAR 255 UNIQUE), slug (VARCHAR 255 UNIQUE),
  description (TEXT), website_url (TEXT), logo_url (TEXT), founded_year (INT),
  headquarters (VARCHAR 255), company_type (VARCHAR 50 DEFAULT 'both'),
  is_active (BOOLEAN DEFAULT TRUE), created_at (TIMESTAMP), updated_at (TIMESTAMP)

game_companies: id (UUID PK), game_id (FK → games.id), company_id (FK → companies.id),
  role (VARCHAR 50), is_primary (BOOLEAN), created_at (TIMESTAMP),
  UNIQUE(game_id, company_id, role)
```

## Propriétés de correction

_Une propriété est une caractéristique ou un comportement qui doit rester vrai
pour toutes les exécutions valides d'un système — essentiellement, une
déclaration formelle de ce que le système doit faire. Les propriétés servent de
pont entre les spécifications lisibles par l'humain et les garanties de
correction vérifiables par la machine._

### Property 1 : La recherche filtre correctement

_Pour tout_ ensemble d'entreprises et _pour tout_ terme de recherche, toutes les
entreprises retournées par l'API doivent contenir le terme dans leur nom ou dans
leur slug (insensible à la casse).

**Validates: Requirements 1.2**

### Property 2 : Le tri ordonne correctement

_Pour tout_ ensemble d'entreprises, _pour tout_ champ de tri (name ou slug) et
_pour tout_ ordre (asc ou desc), les entreprises retournées par l'API doivent
être ordonnées selon le champ et l'ordre spécifiés.

**Validates: Requirements 1.3**

### Property 3 : La pagination est correcte

_Pour tout_ ensemble de N entreprises et _pour toute_ limite L ≥ 1, le nombre de
pages doit être ceil(N/L), chaque page doit contenir au plus L éléments, et la
somme des éléments de toutes les pages doit être N.

**Validates: Requirements 1.4**

### Property 4 : Round-trip création d'entreprise

_Pour tout_ nom valide, slug valide et type valide, créer une entreprise puis la
récupérer via GET doit retourner une entreprise avec les mêmes données.

**Validates: Requirements 2.1**

### Property 5 : Validation du slug

_Pour toute_ chaîne de caractères, le schéma de validation du slug accepte la
chaîne si et seulement si elle contient uniquement des lettres minuscules, des
chiffres et des tirets, commence par une lettre, se termine par une lettre ou un
chiffre, et a entre 2 et 100 caractères.

**Validates: Requirements 2.4**

### Property 6 : Validation des champs du formulaire

_Pour toute_ combinaison de nom, type, description et siège social, le schéma de
validation accepte les données si et seulement si : le nom est non vide et ≤ 255
caractères, le type est `developer`, `publisher` ou `both`, la description est ≤
2000 caractères, et le siège social est ≤ 255 caractères.

**Validates: Requirements 2.5, 2.6, 2.7**

### Property 7 : Validation de l'année de fondation

_Pour tout_ entier, le schéma de validation de l'année de fondation accepte la
valeur si et seulement si elle est comprise entre 1800 et l'année courante
incluse.

**Validates: Requirements 2.9**

### Property 8 : Round-trip mise à jour d'entreprise

_Pour toute_ entreprise existante et _pour toute_ combinaison de champs valides,
mettre à jour l'entreprise puis la récupérer via GET doit retourner les données
mises à jour.

**Validates: Requirements 3.2**

### Property 9 : Suppression d'une entreprise non utilisée

_Pour toute_ entreprise sans jeux associés, la suppression doit réussir et
l'entreprise ne doit plus être récupérable via GET (404).

**Validates: Requirements 4.1**

### Property 10 : Rejet des données invalides par l'API

_Pour tout_ payload ne respectant pas le schéma de validation (slug invalide,
nom vide, type inconnu, description trop longue), l'API de création doit
retourner un code 400.

**Validates: Requirements 5.2**

## Gestion des erreurs

| Situation                               | Code HTTP | Comportement                                           |
| --------------------------------------- | --------- | ------------------------------------------------------ |
| Utilisateur non admin                   | 403       | Message "Admin access required"                        |
| Entreprise non trouvée (GET/PUT/DELETE) | 404       | Message "Company not found"                            |
| Nom ou slug dupliqué (POST)             | 409       | Message "A company with this name/slug already exists" |
| Entreprise utilisée (DELETE sans force) | 409       | Message avec `usageCount` et `type: "IN_USE"`          |
| Données invalides (POST/PUT)            | 400       | Détail des erreurs Zod dans `details`                  |
| Paramètres query invalides (GET)        | 400       | Détail des erreurs Zod                                 |
| Erreur base de données                  | 500       | Message générique, log serveur                         |

Côté client, les erreurs sont gérées par :

- `useCompanyForm` : `submitError` affiché dans le formulaire
- `useAdminCompanies` : `error` affiché dans la page de liste
- `DeleteCompanyDialog` : toast d'erreur via `use-toast`

## Stratégie de tests

### Tests unitaires (bun:test)

Placés dans `test/unit/lib/validations/` :

- `admin-company-form.test.ts` : Tests du schéma Zod (cas valides, invalides,
  limites)

Placés dans `test/isolated/hooks/` :

- `useAdminCompanies.test.ts` : Tests du hook de liste (fetch, delete,
  pagination)
- `useCompanyForm.test.ts` : Tests du hook de formulaire (create, edit, erreurs)

### Tests property-based (fast-check + bun:test)

Placés dans `test/unit/lib/validations/` :

- `admin-company-form.property.test.ts` : Propriétés 5, 6, 7, 10

Chaque test property-based doit :

- Utiliser `fast-check` avec `bun:test`
- Exécuter minimum 100 itérations
- Être annoté avec un commentaire référençant la propriété du design

Format d'annotation :
`// Feature: admin-company-management, Property N: [titre]`

### Tests isolés (test/isolated/)

Les tests de hooks qui mockent `fetch` doivent être dans `test/isolated/hooks/`
pour éviter les conflits de mock avec les tests parallèles.

### Approche complémentaire

- Les tests unitaires vérifient des exemples spécifiques et des edge cases (slug
  dupliqué, entreprise non trouvée, suppression forcée)
- Les tests property-based vérifient les propriétés universelles sur des entrées
  générées aléatoirement
- Les deux sont nécessaires pour une couverture complète
