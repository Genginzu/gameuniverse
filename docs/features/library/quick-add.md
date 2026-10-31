# Ajout rapide à la bibliothèque

## Description

Chaque carte de jeu (`GameCard`) propose deux boutons ronds empilés l'un sous
l'autre, sans ouvrir la fiche :

- **Bibliothèque** (icône `lucide:library`) : ajoute le jeu à la bibliothèque
  (statut « possédé »). Une fois le jeu possédé, l'icône passe sur fond accent ;
  un clic le retire (au survol / focus, l'icône devient une croix rouge pour
  annoncer le retrait).
- **Liste de souhaits** (icône `lucide:star`, voir [wishlist.md](wishlist.md)) :
  même fonctionnement (`status: "wishlist"`). Toujours affiché : un jeu possédé
  passe dans la liste de souhaits (`PATCH { status: "wishlist" }`) et un clic sur
  le bouton bibliothèque d'un jeu souhaité le passe « possédé »
  (`PATCH { status: "owned" }`).

Le bouton cliqué affiche un spinner pendant la requête.

## Accès

Boutons en haut à gauche de la carte, sous les plateformes ou le badge de
statut. Visibles au survol / focus sur desktop, en permanence sur écran tactile.

Pages concernées : `/games`, `/trending`, `/upcoming`, rails « Tendances » et
« À venir » de l'accueil connecté, jeux similaires et recommandations d'une
fiche jeu, bibliothèque d'un autre joueur (`/players/[id]`).

Désactivé là où tous les jeux sont déjà possédés : `/library` (remplacé par le
menu de statut, voir [status.md](status.md)), son propre profil joueur,
« Continuer à jouer », jeux en commun. Les recommandations de l'accueil
utilisent les mêmes boutons, avec « Pas intéressé » empilé au-dessus
(`quickAddLeading`) : un jeu ajouté quitte le rail et un message le confirme
(`quickAddCallbacks`).

## Prérequis

- Joueur connecté (aucun bouton pour un visiteur).
- La grille doit être enveloppée dans un `LibraryStatusProvider` : les statuts
  sont chargés en une seule requête (`POST /api/library/batch-status`, 100 ids
  max). Hors provider, la carte n'affiche pas les boutons.

## Utilisation

- Ajout : `POST /api/library { gameId }` (ou `{ gameId, status: "wishlist" }`),
  mise à jour optimiste du statut (bouton accent immédiat), puis revalidation des
  listes bibliothèque et des recommandations personnelles.
- Retrait : `DELETE /api/library/[gameId]`, retour optimiste au bouton neutre et
  mêmes revalidations.
- En cas d'échec : retour à l'état précédent et toast d'erreur.
- Désactiver sur une grille : `<GameCard quickAdd={false} />`.

## Architecture

- `src/components/games/GameCardQuickAdd.tsx` — boutons bibliothèque + souhaits.
- `src/components/games/CardActiveToggleButton.tsx` — bouton accent « action
  faite » (croix au survol, spinner).
- `src/components/games/CardActionButton.tsx` — bouton rond 44 px partagé avec
  les actions des recommandations.
- `src/hooks/useQuickAddToLibrary.ts` — statut SWR + `useLibraryToggle` /
  `useLibraryStatusChange`.
- `LibraryStatusProvider` expose `signedIn` pour éviter un `useAuth` par carte.
- `.editorial-card-shell` (wrapper de la carte) garde l'état hover de la carte
  quand le pointeur passe sur un bouton.
