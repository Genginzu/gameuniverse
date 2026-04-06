# Review Votes

## Description

Système de votes « utile / pas utile » sur les avis de jeux. Les joueurs
authentifiés peuvent indiquer si un avis est pertinent ou non. Chaque avis
affiche un compteur de votes utiles et pas utiles. Le mécanisme suit un pattern
toggle : cliquer sur le même vote l'annule, cliquer sur le vote opposé le
remplace. La mise à jour de l'interface est optimiste avec rollback en cas
d'erreur.

## Accès

### Navigation

Les boutons de vote apparaissent dans le footer de chaque `ReviewCard` sur les
pages de détail des jeux (`/[locale]/games/[id]`).

### Routes API

| Méthode | Endpoint            | Description                                               |
| ------- | ------------------- | --------------------------------------------------------- |
| POST    | `/api/review-votes` | Créer, modifier ou toggle un vote                         |
| DELETE  | `/api/review-votes` | Supprimer un vote                                         |
| GET     | `/api/reviews`      | Retourne les reviews avec vote counts et vote utilisateur |

### Payloads

**POST** `/api/review-votes`

```json
{ "reviewId": "uuid", "voteType": "helpful" | "not_helpful" }
```

**DELETE** `/api/review-votes`

```json
{ "reviewId": "uuid" }
```

## Prérequis

- Table `review_votes` créée via la migration
  `supabase/migrations/20240224000001_review_votes.sql`
- Table `game_reviews` existante (FK CASCADE)
- Authentification Supabase configurée (RLS activé)
- L'utilisateur doit être authentifié pour voter
- Un utilisateur ne peut pas voter sur son propre avis

## Utilisation

1. Consulter la page d'un jeu contenant des avis
2. Chaque avis affiche deux boutons (pouce haut / pouce bas) avec compteurs
3. Cliquer sur un bouton enregistre le vote (mise à jour immédiate)
4. Cliquer à nouveau sur le même bouton annule le vote (toggle)
5. Cliquer sur le bouton opposé remplace le vote existant
6. Les boutons sont désactivés si l'utilisateur n'est pas connecté ou est
   l'auteur de l'avis
