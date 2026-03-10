# Page de Gestion des Amis

## Description

Page dédiée à la gestion des amis (`/[locale]/friends`) pour les joueurs
authentifiés de Game Universe. Elle centralise toutes les fonctionnalités
sociales en un point d'accès direct depuis la navigation principale, complétant
l'onglet « Amis » du profil joueur.

La page inclut :

- **Demandes en attente** : section affichant les demandes reçues avec actions
  accepter/refuser (réutilise `FriendRequestList`)
- **Liste d'amis** : grille de cartes avec scroll infini et recherche par nom
- **Suppression d'ami** : bouton de suppression avec dialogue de confirmation
- **Badge de notification** : pastille numérique sur le lien « Amis » dans la
  sidebar indiquant le nombre de demandes en attente (affiche « 9+ » au-delà
  de 9)
- **Endpoint API dédié** : compteur de demandes en attente léger
- **i18n** : traductions complètes français et anglais
- **Accessibilité** : landmarks ARIA, labels descriptifs, navigation clavier

## Accès

### Navigation

1. Cliquer sur le lien **« Amis »** dans la sidebar (section « Mon espace »,
   entre « Collections » et « Profil »)
2. Le badge de notification sur le lien indique le nombre de demandes en attente
3. La page est accessible à l'URL : `/{locale}/friends`

### Endpoint API

| Méthode | Route                                   | Auth | Description                     |
| ------- | --------------------------------------- | ---- | ------------------------------- |
| GET     | `/api/players/me/friends/pending-count` | Oui  | Compteur de demandes en attente |

Retourne `{ count: number }`. Erreur 401 si non authentifié.

## Prérequis

1. **Authentification** : l'utilisateur doit être connecté (Supabase Auth). Les
   utilisateurs non authentifiés sont redirigés vers la page de connexion.

2. **Infrastructure friends-system** : la table `friendships`, les services
   (`FriendService`, `FriendServerService`), le hook `useFriends` et les
   composants du système d'amis doivent être en place (voir
   `docs/README_friends-system.md`).

3. **Clés i18n** : les traductions `friends.page.*` et `dashboard.friends`
   doivent être présentes dans `src/messages/en.json` et `src/messages/fr.json`.

## Utilisation

### Consulter ses amis

Accéder à la page « Amis » via la sidebar. Les amis confirmés s'affichent sous
forme de cartes dans une grille. Le nombre total d'amis est affiché dans
l'en-tête de section.

### Rechercher un ami

Saisir du texte dans la barre de recherche au-dessus de la liste. Le filtrage
est instantané, insensible à la casse, sur le nom d'affichage.

### Gérer les demandes en attente

Les demandes reçues apparaissent en haut de la page (section masquée si aucune
demande). Cliquer « Accepter » ou « Refuser » pour traiter chaque demande. Le
badge de notification se met à jour automatiquement.

### Supprimer un ami

Cliquer l'icône de suppression sur la carte d'un ami. Un dialogue de
confirmation s'affiche avant la suppression effective.

## Architecture

### Composants créés

| Composant               | Fichier                                            | Rôle                                   |
| ----------------------- | -------------------------------------------------- | -------------------------------------- |
| `NotificationBadge`     | `src/components/friends/NotificationBadge.tsx`     | Pastille numérique pour la sidebar     |
| `FriendsPageContent`    | `src/components/friends/FriendsPageContent.tsx`    | Orchestrateur principal de la page     |
| `FriendsPageFriendCard` | `src/components/friends/FriendsPageFriendCard.tsx` | Carte d'ami avec bouton de suppression |
| `FriendsEmptyState`     | `src/components/friends/FriendsEmptyState.tsx`     | État vide quand aucun ami              |

### Autres fichiers créés

| Fichier                                                 | Rôle                              |
| ------------------------------------------------------- | --------------------------------- |
| `src/app/[locale]/friends/page.tsx`                     | Page Next.js avec DashboardLayout |
| `src/app/api/players/me/friends/pending-count/route.ts` | Endpoint API compteur demandes    |
| `src/hooks/usePendingRequestCount.ts`                   | Hook pour le compteur de demandes |

### Fichiers modifiés

| Fichier                                                | Modification                               |
| ------------------------------------------------------ | ------------------------------------------ |
| `src/lib/utils/navigation-utils.ts`                    | Ajout lien `/friends` dans `NAV_LINKS`     |
| `src/lib/services/friendService.ts`                    | Ajout méthode `getPendingCount()`          |
| `src/lib/utils/friendUtils.ts`                         | Ajout `countPendingRequests()`             |
| `src/components/layout/dashboard/SidebarNav.tsx`       | Rendu du `NotificationBadge`               |
| `src/components/layout/dashboard/MobileNavOverlay.tsx` | Rendu du `NotificationBadge`               |
| `src/messages/en.json` / `src/messages/fr.json`        | Clés `friends.page.*`, `dashboard.friends` |

## Tests

| Fichier                                                       | Type           | Contenu                                    |
| ------------------------------------------------------------- | -------------- | ------------------------------------------ |
| `test/unit/components/friends/NotificationBadge.test.tsx`     | Unit           | Badge : masqué, affiché, « 9+ », ARIA      |
| `test/unit/components/friends/FriendsPageContent.test.tsx`    | Unit           | Page : demandes, amis, état vide, ARIA     |
| `test/unit/components/friends/FriendsPageFriendCard.test.tsx` | Unit           | Carte : suppression, confirmation, loading |
| `test/unit/api/players/pending-count.test.ts`                 | Unit           | API : 200, 401, 500                        |
| `test/unit/hooks/usePendingRequestCount.test.ts`              | Unit           | Hook : fetch, decrement, refresh           |
| `test/unit/lib/utils/navigation-utils.test.ts`                | Unit           | Navigation : position lien, isActive       |
| `test/unit/lib/utils/friendsPage.property.test.ts`            | Property-based | 2 propriétés (badge, compteur pending)     |

```bash
# Lancer tous les tests
bun run test:all

# Lancer les tests de la page amis
bunx vitest run test/unit/components/friends/

# Lancer les tests property-based
bunx vitest run test/unit/lib/utils/friendsPage.property.test.ts

# Lancer le test API
bunx vitest run test/unit/api/players/pending-count.test.ts
```
