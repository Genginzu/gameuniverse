# Navigation Model (shell éditorial)

## Description

Un module pur, `src/lib/navigation`, décrit toute la navigation du shell
éditorial. À partir de la location (pathname + query), de l'état d'auth et
des appartenances (groupes, communautés), `resolveNavigation(input, translate)`
renvoie un `NavigationModel` :

- `publicEntries` : Public Entries (jeux, personnages, joueurs, e-sport) et
  leurs sections de liens ;
- `spaces` : Spaces du rail, avec leurs liens et leurs Membership Links ;
- `account` : Account Links (profil, bibliothèque, paramètres), vide pour un
  visiteur anonyme ;
- `activeEntryKey`, `activeSpaceKey`, `activeHref` : l'état actif.

Les labels sont déjà traduits. Les renderers ne font que de la mise en page.
Vocabulaire : voir `GLOSSARY.md`, section « Navigation ».

## Règle d'Active Link

Un seul href est actif par modèle : le plus spécifique gagne.

1. Lien avec query (`/groups?create=1`) : actif si le pathname est identique
   et que tous ses paramètres sont présents dans l'URL.
2. Lien `exact` (par défaut) : pathname identique.
3. Lien `prefix` : pathname identique ou descendant. Le préfixe le plus long
   gagne. Les Membership Links sont en `prefix` (`/groups/slug/members`).

Chaque rendu de ce href est marqué actif (ex. `/library` dans le rail et dans
le dropdown). L'Active Space et l'Active Entry suivent les `pathPrefixes` du
catalogue.

`resolveActiveHref(links, location)` est exporté seul pour l'admin
(`AdminSidebarNav`), qui garde son propre catalogue.

## Accès

| Élément                         | Fichier                                                         |
| ------------------------------- | --------------------------------------------------------------- |
| Catalogue Public Entries        | `src/lib/navigation/publicEntries.ts`                           |
| Catalogue Spaces + Account      | `src/lib/navigation/spaces.ts`                                  |
| Résolution                      | `src/lib/navigation/resolveNavigation.ts`                       |
| Types                           | `src/types/navigation.ts`                                       |
| Adapter live (hooks, next-intl) | `src/components/layout/editorial/EditorialNavigationProvider.tsx` |
| Lecture dans les renderers      | `useEditorialNavigation()` (`src/hooks/useEditorialNavigation.ts`) |

`EditorialLayout` monte le provider : header, rail, sub-sidebar et nav mobile
lisent le même modèle. La query est lue par un listener isolé dans un
`Suspense` pour ne pas sortir les pages ISR du rendu statique ; au premier
paint, le modèle est résolu sans query.

## Prérequis

Aucun : pas de migration, pas de variable d'environnement.

## Utilisation

- Ajouter un lien : l'ajouter au catalogue (`publicEntries.ts` ou
  `spaces.ts`) avec son `labelKey`, puis la clé i18n dans `fr.json` et
  `en.json` (`editorial.megaMenu.links.*` ou `editorial.links.{space}.*`).
- Compteur live : renseigner `badge` (`unreadNotifications`,
  `pendingFriends`), rendu par `NavCountBadge`.
- Tests : tests purs dans `src/lib/navigation/__tests__/` ; les tests de
  composant construisent un modèle via `src/test-helpers/editorial-navigation.tsx`.
  `navigation-parity.test.tsx` vérifie que mobile et desktop offrent les mêmes
  destinations et le même Active Link.
