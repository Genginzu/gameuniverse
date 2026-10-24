# Mutations optimistes (SWR)

## Description

Un seul module, `useOptimisticMutation` (`src/hooks/useOptimisticMutation.ts`),
porte toutes les optimistic mutations côté client (vocabulaire : `GLOSSARY.md`).
À partir d'un `spec` déclaratif, il prend en charge :

1. le dédoublonnage des in-flight toggles (`dedupeId`) : un second toggle de la
   même cible est ignoré tant que le premier est en vol, y compris depuis une
   autre instance du hook (registre attaché au cache SWR) ;
2. l'affichage immédiat de la valeur prédite de chaque affected key (`affects`) ;
3. la requête (`request`), qui doit rejeter sur tout statut non 2xx ;
4. le rollback de toutes les affected keys si la requête échoue (4xx, 5xx,
   réseau), puis le rejet de `trigger` avec l'erreur ;
5. la revalidation des affected keys et des related keys (`related`) après
   confirmation.

Le snapshot, le rollback par clé et la gestion des courses sont délégués à SWR
(`optimisticData`, `rollbackOnError`, `populateCache`) ; le module n'ajoute que
ce que SWR ne fournit pas.

```ts
const { trigger, isPending } = useOptimisticMutation<Args>({
  request: (args) => jsonRequest(url, "POST", body),
  affects: (args) => [affect<Data>(key, pureUpdater(args))],
  related: () => [keyStartsWith("/api/...")],
  dedupeId: (args) => `domain:${id}`,
});
```

## Organisation

| Fichier                                  | Rôle                                                    |
| ---------------------------------------- | ------------------------------------------------------- |
| `src/lib/swr/optimistic.ts`              | Types du `spec`, filtres de clés, registre des toggles  |
| `src/lib/swr/keys.ts`                    | Clés SWR et related keys par domaine                    |
| `src/lib/swr/updaters/*.ts`              | Updaters purs (favori, bibliothèque, backlog, collections) |
| `src/lib/swr/collectionMutationSpecs.ts` | Specs des mutations de collections                      |
| `src/lib/utils/json-request.ts`          | Requête JSON qui rejette sur statut non 2xx             |

## Utilisateurs

- `useCharacterFavorite` / `useEntityCharacterFavorite` : statut + compteur.
- `useLibraryToggle` (via `useGameLibraryStatus`, `useEntityLibraryToggle`,
  `useUserLibrary`) : statut du jeu ; related keys = liste, stats, backlog,
  listing bibliothèque.
- `useBacklog` : réordonnancement et priorité.
- `useCollectionMutations({ playerId })` : le hook connaît ses clés (liste,
  stats, détail) ; les appelants ne fournissent plus de callback de refetch.

## Providers batch

`LibraryStatusProvider` et `CharacterFavoriteStatusProvider` n'ont plus d'état
propre : une requête batch amorce les clés SWR par entité
(`useBatchStatusSeed`). Les cartes lisent et mutent donc le même cache que les
pages détail ; `isSeeding(id)` évite les requêtes individuelles pendant
l'amorçage.

## Tests

- `src/hooks/__tests__/useOptimisticMutation.test.tsx` : état optimiste visible
  avant la réponse, rollback de chaque clé (4xx, réseau), double toggle ignoré,
  revalidation des related keys.
- `src/lib/swr/updaters/__tests__/` : updaters testés comme code pur.
