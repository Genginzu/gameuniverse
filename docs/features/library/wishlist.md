# Liste de souhaits

## Description

Liste des jeux que le joueur a envie de faire mais qu'il n'a pas encore achetés.
Il y revient quand il cherche son prochain achat ; une fois le jeu acheté, il le
passe dans sa bibliothèque en un clic.

Un jeu souhaité est une ligne `user_library` avec `status = 'wishlist'`
(un jeu est soit souhaité, soit dans la bibliothèque : contrainte
`UNIQUE(user_id, game_id)`). Il ne fait **pas** partie de la bibliothèque possédée :

- absent du listing `/library` (`get_games_listing` avec `p_in_library`) et de
  ses statistiques (`get_user_library_stats`) — migration
  `20261030000001_wishlist_out_of_library.sql` ;
- absent du backlog (`/api/library/backlog`) ;
- non compté pour les succès « bibliothèque » et sans récompense
  `library_game_added` à l'ajout.

## Accès

- **`/library/wishlist`** : sous-navigation « Mon univers » (« Ma liste de
  souhaits ») ou lien depuis l'en-tête de `/library`.
- **Cartes de jeu** (catalogue, tendances, accueil…) : étoile sous le bouton bibliothèque
  (voir [quick-add.md](quick-add.md)).
- **Fiche jeu** (`/games/[slug]`) : bouton « Ajouter à ma liste de souhaits » à
  côté de « Ajouter à la bibliothèque » quand le jeu n'est pas encore suivi. Un
  jeu souhaité affiche le statut « Liste de souhaits » ; le menu de statut permet
  de le passer « Possédé » ou de le retirer.

## Prérequis

Joueur connecté (sinon la page affiche une invitation à se connecter).

## Utilisation

- Chaque carte de `/library/wishlist` porte deux boutons : « J'ai acheté »
  (statut `owned`, le jeu rejoint la bibliothèque) et « Retirer ».
- Jeux triés du plus récemment souhaité au plus ancien.
- Enregistrer une session de jeu promeut un jeu souhaité en « En cours ».

## API

- `POST /api/library` `{ gameId, status: "wishlist" }` — statut validé par zod
  (`libraryStatusSchema`) : 400 si inconnu.
- `GET /api/library?status=wishlist&locale=fr|en` — liste traduite dans la
  locale demandée.
- `PATCH /api/library/[gameId]` `{ status: "owned" }` / `DELETE` — achat /
  retrait.

## Architecture

- `src/app/[locale]/library/wishlist/page.tsx` — page.
- `src/components/library/wishlist/` — `WishlistEditorial`,
  `WishlistCardActions`, `WishlistStates`.
- `src/hooks/useWishlist.ts` — SWR de la liste (clé `/api/library?status=wishlist…`,
  revalidée par toute mutation de bibliothèque).
- `src/hooks/useLibraryEntry.ts` — `addToWishlist()`.
