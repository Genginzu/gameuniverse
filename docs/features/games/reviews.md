# Game Reviews — Avis sur les jeux

## Description

Fonctionnalité permettant aux joueurs authentifiés de laisser un avis sur un jeu
depuis l'onglet "Avis" de la page de détails. Chaque review comprend :

- **Note sur 20** — appréciation globale du jeu (entier de 0 à 20)
- **Texte enrichi** — rédaction libre avec formatage (gras, italique, listes)
  via l'éditeur Tiptap
- **Points positifs** — jusqu'à 10 points forts identifiés
- **Points négatifs** — jusqu'à 10 points faibles identifiés

La soumission d'une review ajoute automatiquement le jeu à la bibliothèque du
joueur si ce n'est pas déjà fait. Un joueur ne peut soumettre qu'une seule
review par jeu.

## Accès

La section avis est visible dans l'onglet **Avis** de la page détails d'un jeu
(`/[locale]/games/[slug]`).

- La liste des reviews et la note moyenne sont visibles par tous
- Le formulaire de soumission apparaît uniquement pour les utilisateurs
  connectés
- Un message invite à se connecter si l'utilisateur n'est pas authentifié
- Si aucune review n'existe, un message invite les joueurs à soumettre la
  première

## Prérequis

- Migration Supabase `game_reviews` appliquée (table `game_reviews` avec
  contraintes RLS)
- Packages Tiptap installés (`@tiptap/react`, `@tiptap/starter-kit`)
- Utilisateur authentifié pour soumettre une review

## Utilisation

1. Naviguer vers la page d'un jeu
2. Aller dans l'onglet **Avis**
3. Remplir le formulaire : note, texte de review, points positifs/négatifs
4. Valider — la review apparaît dans la liste et la note moyenne se met à jour
5. Le jeu est automatiquement ajouté à la bibliothèque du joueur

## API

- `GET /api/reviews?gameId={id}` — récupère les reviews d'un jeu (triées par
  date décroissante), la note moyenne, et si l'utilisateur a déjà reviewé
- `POST /api/reviews` — soumet une review (requiert authentification, validation
  Zod côté serveur)

## Architecture

| Fichier                                             | Rôle                                                |
| --------------------------------------------------- | --------------------------------------------------- |
| `src/types/review.ts`                               | Types `Review`, `ReviewFormData`, `ReviewsResponse` |
| `src/lib/validations/review.ts`                     | Schéma Zod partagé client/serveur, `stripHtmlTags`  |
| `src/lib/services/reviewService.ts`                 | Appels API (`fetchReviews`, `submitReview`)         |
| `src/hooks/useReviews.ts`                           | Hook React (état, fetch, submit)                    |
| `src/app/api/reviews/route.ts`                      | API GET/POST                                        |
| `src/components/games/reviews/GameReviewsTab.tsx`   | Orchestrateur : moyenne + formulaire + liste        |
| `src/components/games/reviews/ReviewForm.tsx`       | Formulaire react-hook-form + Zod                    |
| `src/components/games/reviews/ReviewFormDialog.tsx` | Dialog wrapper du formulaire                        |
| `src/components/games/reviews/ReviewCard.tsx`       | Affichage d'une review individuelle                 |
| `src/components/games/reviews/ReviewList.tsx`       | Liste des reviews                                   |
| `src/components/games/reviews/RatingInput.tsx`      | Saisie de la note sur 20                            |
| `src/components/games/reviews/ReviewPointsList.tsx` | Liste dynamique de points +/-                       |
| `src/components/games/reviews/RichTextEditor.tsx`   | Éditeur Tiptap (gras, italique, listes)             |
