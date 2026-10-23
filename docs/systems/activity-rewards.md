# Récompenses d'activité

## Description

Une action joueur récompensée (un **activity event**, voir `GLOSSARY.md`) déclenche
un seul appel serveur : `rewardActivity(event)` dans
`src/lib/services/activityRewards.ts`. Le module possède seul la table qui décide
qui est récompensé (**rewarded party**), quelle catégorie de succès est évaluée
(succès + XP via `AchievementEngine`) et quel type d'activité GU Coins est versé,
avec quelle référence (`award_activity_reward`, qui écrit dans le ledger, voir
[coin-ledger.md](./coin-ledger.md)).

## Accès

Module serveur uniquement, appelé par les route handlers après l'écriture
principale. Aucune route ni UI dédiée. Montants, cooldowns et plafonds : admin
`/admin/coins` (table `coin_reward_config`).

## Prérequis

- Migration `20261023000004_character_comment_coin_activity.sql` appliquée (type
  `character_comment`).
- Client service-role (`SUPABASE_SERVICE_ROLE_KEY`) : l'évaluation lit les
  compteurs du joueur évalué, qui n'est pas toujours l'utilisateur de la session.

## Table des événements

| Événement                   | Parties               | Succès        | Coins (référence)                  |
| --------------------------- | --------------------- | ------------- | ---------------------------------- |
| `library_game_added`        | joueur                | `library`     | `library_add` (jeu)                |
| `review_created`            | joueur                | `reviews`     | `review` (avis)                    |
| `friendship_accepted`       | accepteur + demandeur | `social` ×2   | `friend_add` (id de l'autre) ×2    |
| `collection_created`        | joueur                | `collections` | —                                  |
| `collection_item_added`     | joueur                | —             | `collection_add` (jeu)             |
| `post_created`              | joueur                | —             | `post_create` (post)               |
| `post_comment_created`      | joueur                | —             | `post_comment` (commentaire)       |
| `character_comment_created` | joueur                | —             | `character_comment` (commentaire)  |
| `character_favorited`       | joueur                | —             | `character_favorite` (personnage)  |
| `discussion_message_sent`   | joueur                | —             | `discussion_message` (message)     |
| `playtime_logged`           | joueur                | `playtime`    | —                                  |

L'envoi d'une demande d'ami ne récompense rien : seule l'acceptation compte.

## Utilisation

```ts
import { rewardActivity } from "@/lib/services/activityRewards";

await rewardActivity({ kind: "review_created", userId: user.id, reviewId: review.id });
```

- Ne lève jamais d'erreur : chaque partie (succès, coins) est indépendante et un
  échec est seulement logué.
- Ajouter une récompense : ajouter une variante à `ActivityEvent`
  (`src/types/activityRewards.ts`), son cas dans `rewardedParties`, et une ligne
  dans le test table-driven `src/lib/services/__tests__/activityRewards.test.ts`.
