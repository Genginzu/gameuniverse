# Design — Page de Gestion des Amis

## Vue d'ensemble

La page de gestion des amis est une page dédiée (`/[locale]/friends`) qui
centralise les fonctionnalités sociales pour le joueur authentifié. Elle
réutilise largement l'infrastructure du système d'amis existant (table
`friendships`, API `/api/players/[id]/friends/`, `friendService.ts`,
`friendUtils.ts`, composants `FriendCard`, `FriendRequestCard`,
`FriendSearchBar`) tout en ajoutant :

1. Une page Next.js avec `DashboardLayout` et un composant orchestrateur
   `FriendsPageContent`
2. Un lien « Amis » dans la sidebar avec un `NotificationBadge` affichant le
   nombre de demandes en attente
3. Un endpoint API dédié pour le compteur de demandes en attente
4. Un hook `usePendingRequestCount` pour alimenter le badge
5. Un composant `FriendsPageFriendCard` étendant `FriendCard` avec un bouton de
   suppression
6. Des clés i18n ajoutées au namespace `friends` existant

Le flux principal : le joueur authentifié voit le badge dans la sidebar → clique
sur « Amis » → voit ses demandes en attente (section masquée si vide) → gère ses
demandes (accepter/refuser) → consulte et recherche dans sa liste d'amis → peut
supprimer un ami avec confirmation.

## Architecture

```mermaid
graph TD
    subgraph "Page /friends"
        A[FriendsPage] --> B[DashboardLayout]
        B --> C[Sidebar + NotificationBadge]
        A --> D[FriendsPageContent]
        D --> E[FriendRequestList]
        D --> F[FriendSearchBar]
        D --> G[FriendList]
        G --> H[FriendsPageFriendCard]
    end

    subgraph "Hooks"
        D --> I[useFriends]
        C --> J[usePendingRequestCount]
    end

    subgraph "Services"
        I --> K[FriendService]
        J --> L[FriendService.getPendingCount]
    end

    subgraph "API"
        K --> M[/api/players/id/friends]
        L --> N[/api/players/me/friends/pending-count]
    end

    subgraph "Base de données"
        M --> O[(friendships)]
        N --> O
    end
```

### Décisions architecturales

1. **Réutilisation maximale des composants existants** : `FriendRequestList`,
   `FriendRequestCard`, `FriendSearchBar`, `FriendList` et le hook `useFriends`
   sont déjà implémentés pour l'onglet Amis du profil. La page dédiée les
   réutilise directement. Seul `FriendsPageFriendCard` est nouveau car il ajoute
   un bouton de suppression absent de `FriendCard`.

2. **Endpoint `/api/players/me/friends/pending-count`** : Un endpoint léger
   dédié au compteur de demandes en attente, séparé de l'endpoint de liste
   existant. Utilise `me` comme convention pour le joueur authentifié (résolu
   côté serveur via `auth.getUser()`). Cela évite de charger la liste complète
   juste pour un compteur affiché dans la sidebar sur chaque page.

3. **Hook `usePendingRequestCount` séparé** : Ce hook est utilisé dans la
   sidebar (via `SidebarNav`) et doit fonctionner indépendamment du hook
   `useFriends` qui est lié à un `playerId` spécifique. Il fait un polling léger
   ou un fetch initial + invalidation lors des mutations.

4. **`FriendsPageFriendCard` comme wrapper** : Plutôt que de modifier
   `FriendCard` (utilisé dans l'onglet profil sans bouton de suppression), on
   crée un composant wrapper qui compose `FriendCard` avec un bouton de
   suppression et une modale de confirmation. Cela respecte le principe
   ouvert/fermé.

5. **Navigation via `NAV_LINKS`** : Le lien « Amis » est ajouté dans le tableau
   `NAV_LINKS` de `navigation-utils.ts`, entre « Collections » et « Profil ». Le
   `NotificationBadge` est rendu conditionnellement dans `SidebarNav` et
   `MobileNavOverlay` pour le lien `/friends`.

6. **Pas de migration SQL** : Aucune modification de schéma n'est nécessaire.
   L'endpoint de comptage utilise la table `friendships` existante avec une
   simple requête `COUNT`.

7. **Composants dans `src/components/friends/`** : Les nouveaux composants
   spécifiques à la page sont regroupés dans un dossier dédié, conformément à la
   convention de regroupement par feature.

## Composants et Interfaces

### Nouveaux fichiers

```
src/app/[locale]/friends/
├── page.tsx                              # Page Next.js avec DashboardLayout

src/app/api/players/me/friends/
├── pending-count/
│   └── route.ts                          # GET compteur demandes en attente

src/components/friends/
├── FriendsPageContent.tsx                # Orchestrateur de la page
├── FriendsPageFriendCard.tsx             # FriendCard + bouton suppression
├── NotificationBadge.tsx                 # Pastille numérique pour la sidebar

src/hooks/
├── usePendingRequestCount.ts             # Hook pour le compteur de demandes

src/messages/
├── en.json                               # Clés friends.page.* ajoutées
├── fr.json                               # Clés friends.page.* ajoutées
```

### Fichiers modifiés

```
src/lib/utils/navigation-utils.ts        # Ajout du lien /friends dans NAV_LINKS
src/lib/services/friendService.ts         # Ajout méthode getPendingCount()
src/components/layout/dashboard/SidebarNav.tsx    # Rendu du NotificationBadge
src/components/layout/dashboard/MobileNavOverlay.tsx  # Rendu du NotificationBadge
```

### Composants

**FriendsPage** (`page.tsx`) : Page client qui enveloppe `FriendsPageContent`
dans `DashboardLayout` + `ErrorBoundary`. Suit le pattern existant
(`LibraryPage`, `DashboardPage`).

**FriendsPageContent** : Orchestrateur principal. Utilise `useAuth` pour obtenir
le `currentUserId`, puis `useFriends(currentUserId, locale)` pour récupérer les
données. Affiche dans l'ordre :

1. Titre de page traduit (h1)
2. `FriendRequestList` (si demandes en attente)
3. En-tête de section avec compteur d'amis + `FriendSearchBar`
4. Liste d'amis via une grille de `FriendsPageFriendCard` avec scroll infini

Utilise `usePendingRequestCount` pour invalider le badge après
acceptation/refus. Landmarks ARIA : `main` (fourni par DashboardLayout),
`section` avec `aria-label` pour chaque zone.

**FriendsPageFriendCard** : Compose `FriendCard` (lien vers profil) avec un
bouton de suppression (icône `Trash2`). Au clic, affiche une modale de
confirmation. Pendant la suppression, le bouton est désactivé avec spinner.
Props : `friend: FriendSummary`, `locale: string`,
`onRemove: (friendshipId: string) => Promise<void>`.

**NotificationBadge** : Pastille numérique positionnée en absolu sur le lien
parent. Affiche le nombre de demandes en attente. Si > 9, affiche « 9+ ». Si 0,
le composant retourne `null`. Attribut `aria-label` décrivant le nombre (ex : «
3 demandes d'amitié en attente »). Props : `count: number`.

### Hooks

**usePendingRequestCount()** : Appelle `FriendService.getPendingCount()` au
montage. Retourne :

- `count: number` — nombre de demandes en attente
- `isLoading: boolean`
- `decrement()` — décrémente le compteur de 1 (après acceptation/refus)
- `refresh()` — re-fetch le compteur

Le hook utilise `useAuth` en interne pour ne fetch que si authentifié.

### Service

**FriendService.getPendingCount()** : Nouvelle méthode statique.
`GET /api/players/me/friends/pending-count` → `{ count: number }`.

### API

| Méthode | Route                                   | Description                  | Auth |
| ------- | --------------------------------------- | ---------------------------- | ---- |
| GET     | `/api/players/me/friends/pending-count` | Compteur demandes en attente | Oui  |

L'endpoint utilise `createRouteHandlerClient` + `supabase.auth.getUser()` pour
identifier le joueur, puis `FriendServerService.getPendingRequestCount()` (une
simple requête `SELECT COUNT(*)` sur `friendships` avec
`receiver_id = userId AND status = 'pending'`).

## Modèles de données

### Aucune migration SQL nécessaire

La table `friendships` existante contient déjà toutes les données nécessaires.
L'endpoint de comptage utilise :

```sql
SELECT COUNT(*)
FROM friendships
WHERE receiver_id = $1 AND status = 'pending';
```

### Nouveaux types TypeScript

```typescript
// Ajouté dans src/types/friendship.ts

/** Réponse de l'API pour le compteur de demandes en attente */
export interface PendingCountResponse {
  count: number;
}
```

### Nouvelles clés i18n

Ajoutées dans le namespace `friends` existant, sous un sous-objet `page` :

```json
{
  "friends": {
    "page": {
      "title": "My Friends",
      "friendsCount": "{count, plural, =0 {No friends} one {# friend} other {# friends}}",
      "removeFriend": "Remove",
      "confirmRemoveTitle": "Remove friend",
      "confirmRemoveMessage": "Are you sure you want to remove {name} from your friends?",
      "confirmRemoveConfirm": "Remove",
      "confirmRemoveCancel": "Cancel",
      "emptyState": "You don't have any friends yet. Explore the players page to find people to connect with!",
      "explorePlayers": "Explore players",
      "pendingBadgeLabel": "{count, plural, one {# pending friend request} other {# pending friend requests}}"
    }
  }
}
```

Les clés existantes (`friends.searchPlaceholder`, `friends.pendingRequests`,
`friends.accept`, `friends.decline`, `friends.listLabel`) sont réutilisées
telles quelles.

### Navigation

Ajout dans `NAV_LINKS` (entre « Collections » et « Profil ») :

```typescript
{ href: "/friends", icon: FaUserFriends, labelKey: "friends" }
```

Ajout de la clé `dashboard.friends` dans les messages i18n :

```json
{
  "dashboard": {
    "friends": "Friends"
  }
}
```

## Propriétés de Correction

_Une propriété est une caractéristique ou un comportement qui doit rester vrai
pour toutes les exécutions valides d'un système — essentiellement, une
déclaration formelle sur ce que le système doit faire. Les propriétés servent de
pont entre les spécifications lisibles par l'humain et les garanties de
correction vérifiables par la machine._

**Note sur la réutilisation :** Plusieurs critères d'acceptation (7.2 filtrage
de recherche, 10.2 aria-label des boutons) sont déjà couverts par les propriétés
du design `friends-system` (Propriétés 9, 13) car les mêmes fonctions pures
(`filterFriendsByName`, `getAriaLabel`) sont réutilisées sans modification. Ces
propriétés ne sont pas dupliquées ici.

### Propriété 1 : Formatage du badge de notification

_Pour tout_ entier `count` ≥ 0, la fonction `formatBadgeCount(count)` doit
retourner :

- `null` si `count === 0` (badge masqué)
- la représentation en chaîne de `count` si `1 ≤ count ≤ 9`
- `"9+"` si `count > 9`

De plus, _pour tout_ entier `count` > 0, le `aria-label` généré doit contenir la
valeur numérique de `count`.

**Valide : Exigences 3.1, 3.2, 3.3, 10.5**

### Propriété 2 : Compteur de demandes en attente

_Pour toute_ liste de relations d'amitié et tout `userId`, le compteur retourné
par `countPendingRequests(friendships, userId)` doit être égal au nombre de
relations où `receiver_id === userId` et `status === 'pending'`.

**Valide : Exigence 4.1**

## Gestion des erreurs

| Scénario                                    | Code | Comportement                                                                                   |
| ------------------------------------------- | ---- | ---------------------------------------------------------------------------------------------- |
| Utilisateur non authentifié (pending-count) | 401  | L'API retourne `{ error: "Unauthorized" }`. Le hook ne fetch pas si non authentifié.           |
| Utilisateur non authentifié (page /friends) | —    | Redirection côté client vers la page d'authentification (pattern existant DashboardLayout).    |
| Erreur serveur (pending-count)              | 500  | L'API retourne `{ error: "Internal server error" }`. Le badge affiche 0 (fallback silencieux). |
| Erreur réseau (pending-count)               | —    | Le hook capture l'erreur. Le badge affiche 0 (fallback silencieux, pas de toast).              |
| Erreur lors de l'acceptation/refus          | —    | Géré par `useFriends` existant : rollback optimiste + message d'erreur.                        |
| Erreur lors de la suppression d'un ami      | —    | Géré par `useFriends.removeFriend` existant : rollback optimiste + message d'erreur.           |

## Stratégie de tests

### Tests unitaires (Vitest)

Les tests unitaires vérifient des exemples spécifiques, des cas limites et des
conditions d'erreur :

- **Composants** :
  - `test/unit/components/friends/FriendsPageContent.test.tsx` : Rendu avec
    demandes en attente, sans demandes, avec amis, état vide, titre traduit,
    landmarks ARIA.
  - `test/unit/components/friends/FriendsPageFriendCard.test.tsx` : Rendu du
    bouton de suppression, modale de confirmation, état de chargement pendant
    suppression, désactivation du bouton.
  - `test/unit/components/friends/NotificationBadge.test.tsx` : Rendu avec
    count=0 (masqué), count=5 (affiché), count=15 (« 9+ »), aria-label.
- **API Route** :
  - `test/unit/api/players/pending-count.test.ts` : Réponse 200 avec compteur,
    erreur 401 si non authentifié, erreur 500 en cas d'erreur serveur.
- **Hook** :
  - `test/unit/hooks/usePendingRequestCount.test.ts` : Fetch initial, decrement,
    refresh, pas de fetch si non authentifié.
- **Navigation** :
  - `test/unit/lib/utils/navigation-utils.test.ts` : Vérifier que le lien
    `/friends` est présent dans `NAV_LINKS` à la bonne position, et que
    `isActive` fonctionne pour `/friends`.

### Tests property-based (fast-check + Vitest)

Les tests property-based vérifient les propriétés universelles sur des entrées
générées aléatoirement. Chaque test exécute au minimum 100 itérations.

- **Fichier** : `test/unit/lib/utils/friendsPage.property.test.ts`
- **Bibliothèque** : `fast-check` (déjà installé)
- **Convention de tag** : Chaque test est annoté avec un commentaire référençant
  la propriété du design :
  `// Feature: friends-management-page, Property N: [description]`

Les propriétés testées en property-based :

| Propriété | Description                        | Fonction testée                         |
| --------- | ---------------------------------- | --------------------------------------- |
| 1         | Formatage du badge de notification | `formatBadgeCount()` + aria-label logic |
| 2         | Compteur de demandes en attente    | `countPendingRequests()`                |

### Approche complémentaire

- Les tests unitaires couvrent le rendu des composants, les interactions UI
  (confirmation de suppression, états de chargement), les routes API, et les
  intégrations entre composants.
- Les tests property-based couvrent les fonctions pures nouvelles
  (`formatBadgeCount`, `countPendingRequests`) avec des entrées aléatoires.
- Les propriétés déjà couvertes par le design `friends-system` (filtrage de
  recherche, aria-label, pagination, tri) ne sont pas dupliquées.
- Chaque propriété de correction est implémentée par un SEUL test
  property-based.
