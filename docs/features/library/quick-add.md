# Ajout rapide à la bibliothèque

## Description

Chaque carte de jeu (`GameCard`) propose un bouton « + » qui ajoute le jeu à la
bibliothèque du joueur (statut « possédé ») en un clic, sans ouvrir la fiche.
Une fois le jeu dans la bibliothèque, le bouton laisse place à une coche.

## Accès

Bouton en haut à gauche de la carte, sous les plateformes ou le badge de
statut. Visible au survol / focus sur desktop, en permanence sur écran tactile.

Pages concernées : `/games`, `/trending`, `/upcoming`, rails « Tendances » et
« À venir » de l'accueil connecté, jeux similaires et recommandations d'une
fiche jeu, bibliothèque d'un autre joueur (`/players/[id]`).

Désactivé là où tous les jeux sont déjà possédés : `/library` (remplacé par le
menu de statut, voir [status.md](status.md)), son propre
profil joueur, « Continuer à jouer », jeux en commun. Les recommandations de
l'accueil gardent leurs propres boutons (« Pas intéressé » + « + » avec message
de confirmation).

## Prérequis

- Joueur connecté (aucun bouton pour un visiteur).
- La grille doit être enveloppée dans un `LibraryStatusProvider` : les statuts
  sont chargés en une seule requête (`POST /api/library/batch-status`, 100 ids
  max). Hors provider, la carte n'affiche pas le bouton.

## Utilisation

- Clic sur « + » : `POST /api/library { gameId }`, mise à jour optimiste du
  statut (coche immédiate), puis revalidation des listes bibliothèque et des
  recommandations personnelles.
- En cas d'échec : retour au « + » et toast d'erreur.
- Désactiver sur une grille : `<GameCard quickAdd={false} />`.

## Architecture

- `src/components/games/GameCardQuickAdd.tsx` — bouton / coche.
- `src/components/games/CardActionButton.tsx` — bouton rond 44 px partagé avec
  les actions des recommandations.
- `src/hooks/useQuickAddToLibrary.ts` — statut SWR + `useLibraryToggle`.
- `LibraryStatusProvider` expose `signedIn` pour éviter un `useAuth` par carte.
- `.editorial-card-shell` (wrapper de la carte) garde l'état hover de la carte
  quand le pointeur passe sur le bouton.
