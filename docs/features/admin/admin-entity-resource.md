# Admin entity resource

## Description

Module commun des pages de liste et des formulaires du panneau admin. Chaque
entité (genres, plateformes, espèces, avis…) se déclare par une config ; le
module gère la liste SWR, la pagination, la recherche, le tri, la suppression,
la lecture de l'usage et le submit création/édition.

- `defineAdminResource` (`src/lib/admin-resource/defineAdminResource.ts`) :
  config de liste (`path`, `listKey`, `keyOf`, `mapRow`, `defaultSort`,
  `usage`, `forceDelete`, `localized`, `paginated`). Une resource par entité
  dans `src/lib/admin-resource/resources/`.
- `useAdminResource(resource, { pathParams })` : bâti sur `useListingQuery`.
  Retourne `rows`, `pagination`, `isLoading`, `error`, `search`, `sort`,
  `setSearch`, `setSort`, `setPage`, `remove(row)`, `checkUsage(row)`,
  `revalidate()`. Recherche et tri remettent la page à 1 ; `remove` revalide la
  page courante.
- `useAdminDeleteFlow(list, { onDeleted, onError })` : ouvre le dialog, lit
  l'usage, confirme ou annule. `dialog` se passe tel quel à `AdminDeleteDialog`.
- `useAdminEntityForm(config, mode, { initialData, id, pathParams })` : configs
  dans `src/lib/admin-resource/forms/`. POST sur la collection en création, PUT
  sur `<collection>/<clé>` en édition, puis revalide les listes de la
  collection. `useGameForm` et `useCharacterForm` gardent leur hook mais
  partagent `submitAdminEntity`.

## Usage en lecture seule

Chaque entité avec usage expose `GET /api/admin/<entité>/<clé>/usage` →
`{ usageCount }` (helper serveur `createAdminUsageRoute`). Ce endpoint ne
modifie jamais rien. Avant ce module, plusieurs pages lisaient l'usage via un
`DELETE` sans `force`, ce qui supprimait l'élément non utilisé dès l'ouverture
du dialog.

## Accès

Toutes les pages `/admin/*` de liste d'entités (genres, companies, platforms,
roles, languages, genders, species, achievements, age-classifications et leurs
onglets ratings/descriptors, characters, games, comments, reviews,
communities, groups).

## Prérequis

Rôle admin (`requireAdmin` sur chaque route).

## Utilisation

Ajouter une entité : créer `resources/<entité>.ts` avec `defineAdminResource`,
une route `.../[clé]/usage/route.ts` si elle a un usage, puis appeler
`useAdminResource` + `useAdminDeleteFlow` dans la page. Tester uniquement le
`mapRow` dans `src/lib/admin-resource/__tests__/`.
