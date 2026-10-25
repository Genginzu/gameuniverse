# Statut des jeux de la bibliothèque

## Description

Chaque jeu de la bibliothèque a un statut : Possédé, En cours, Terminé ou Liste
de souhaits. Le joueur le change depuis la fiche du jeu ou depuis `/library`.
Les jeux « En cours » alimentent le rail « Reprendre » de l'accueil.

## Accès

- **Fiche jeu** (`/games/[slug]`) : quand le jeu est dans la bibliothèque, le
  bouton du hero affiche le statut courant et ouvre un menu (statuts + « Retirer
  de ma bibliothèque »). Sinon, « Ajouter à ma bibliothèque ».
- **`/library`** : bouton rond en haut à gauche de chaque carte (icône du
  statut), visible au survol / focus, en permanence sur écran tactile.
- **Automatique** : enregistrer une session de jeu passe le jeu « En cours »
  (ajouté s'il est absent, promu s'il était Possédé / Liste de souhaits /
  backlog). Un jeu Terminé garde son statut.

## Prérequis

Joueur connecté ; le jeu doit déjà être dans sa bibliothèque pour changer de
statut.

## Utilisation

- `PATCH /api/library/[gameId]` `{ status }` — `owned | playing | completed |
  wishlist` ; 404 si le jeu n'est pas dans la bibliothèque. Rate limit `library`.
- `GET /api/library/[gameId]` et `POST /api/library/batch-status`
  (`libraryStatuses`) renvoient le statut, mis en cache dans la clé SWR
  `/api/library/[gameId]`.
- Changement optimiste (`useLibraryStatusChange`), puis revalidation de la
  bibliothèque, de « Reprendre » et des recommandations.

## Architecture

- `src/components/library/LibraryStatusMenu.tsx` — menu partagé.
- `src/components/games/details/sections/HeroLibraryControl.tsx` — fiche jeu.
- `src/components/library/LibraryCardStatusMenu.tsx` + `LibraryGamesGrid.tsx` —
  `/library`.
- `src/hooks/useLibraryEntry.ts` — statut + ajout / retrait / changement.
- `src/lib/validations/library.ts` — statuts autorisés (zod).
