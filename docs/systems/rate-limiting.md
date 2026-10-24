# Rate limiting

## Description

Limiteur de requêtes stocké dans Postgres (un compteur en mémoire ne marche pas
sur Vercel, chaque lambda étant un nouveau process). Migration
`20261018000018_rate_limits.sql` :

- table `rate_limit_events` (une ligne par requête acceptée, service role
  uniquement) ;
- fonction `consume_rate_limit(p_key, p_limit, p_window_seconds)` : verrou
  consultatif sur la clé, comptage sur la fenêtre glissante, enregistrement si
  sous la limite ; renvoie `{ allowed, retry_after }` ;
- job pg_cron `purge-rate-limit-events` (03:17 UTC) qui supprime les lignes de
  plus d'un jour.

## Utilisation

Dans une route déclarée avec `defineRoute` (`src/lib/api/route/`), déclarer
l'action : le module la décompte après l'authentification et la suspension,
avant la lecture du body (clé = id utilisateur, sinon IP via `x-forwarded-for`).

```ts
export const POST = defineRoute(
  { auth: "required", writesContent: true, rateLimit: "review", body: reviewSchema },
  async ({ user, body }) => { ... }
); // 429 { error, code: "rate_limited", retryAfter } + en-tête Retry-After
```

Les routes pas encore migrées appellent directement `enforceRateLimit` :

```ts
import { enforceRateLimit } from "@/lib/services/rateLimitService";

const limited = await enforceRateLimit("review", { userId: user.id });
if (limited) return limited; // même réponse 429

// Route anonyme : limite par IP (x-forwarded-for)
const limited = await enforceRateLimit("search", { request });
```

En cas d'erreur base de données, le limiteur **laisse passer** (fail-open) et
journalise l'erreur.

## Limites actuelles (`RATE_LIMITS`)

| Action            | Limite | Fenêtre | Routes                                                          |
| ----------------- | ------ | ------- | --------------------------------------------------------------- |
| `review`          | 10     | 1 h     | `POST`/`PUT /api/reviews`                                       |
| `comment`         | 30     | 10 min  | commentaires personnages, posts, matchs                         |
| `post`            | 15     | 10 min  | posts profil, groupes, communautés                              |
| `message`         | 60     | 1 min   | `POST /api/discussions/[id]/messages`                           |
| `report`          | 10     | 1 h     | `POST /api/reports`                                             |
| `upload`          | 20     | 10 min  | `POST /api/upload`                                              |
| `friendRequest`   | 30     | 1 h     | `POST /api/players/[id]/friends`                                |
| `invitation`      | 30     | 1 h     | `POST /api/groups/[slug]/invitations`                           |
| `prediction`      | 30     | 10 min  | `POST /api/esport/predictions`                                  |
| `coachingBooking` | 10     | 1 h     | `POST /api/coaching/sessions`                                   |
| `search`          | 120    | 1 min   | `GET /api/search/global`, `GET /api/search/hybrid` (par IP)     |
| `view`            | 60     | 10 min  | `POST /api/games/[slug]/views`, `/api/characters/[slug]/views` (par IP) |
| `gameSession`     | 30     | 1 h     | `POST /api/players/[id]/sessions`, `POST /api/games/[slug]/playtime` |
| `accountDeletion` | 5      | 1 h     | `POST /api/account/deletion`                                    |
| `coachingProfile` | 30     | 10 min  | profil, disponibilités, jeux, tarifs du coach                   |
| `coachingPayout`  | 3      | 1 h     | `POST /api/coaching/payments/payout`, `/api/coaching/stripe/connect` |
| `groupCreate`     | 5      | 1 h     | `POST /api/groups`, `POST /api/communities` (quota commun)      |
| `groupUpdate`     | 20     | 1 h     | `PATCH /api/groups/[slug]`, `/api/communities/[slug]`           |
| `membership`      | 30     | 1 h     | join / leave des groupes et communautés                         |
| `collection`      | 20     | 1 h     | création / édition de collections, suggestions acceptées        |
| `collectionItem`  | 120    | 10 min  | ajout d'item, note d'item                                       |
| `library`         | 120    | 10 min  | `POST /api/library`, `DELETE /api/library/[gameId]`             |
| `favorite`        | 60     | 10 min  | favori personnage (ajout et retrait)                            |
| `vote`            | 60     | 10 min  | `POST /api/review-votes`                                        |
| `reaction`        | 60     | 1 min   | réactions aux commentaires de match                             |
| `follow`          | 60     | 1 h     | `POST /api/players/[id]/subscriptions`                          |
| `profileUpdate`   | 20     | 1 h     | `PATCH /api/profile`                                            |
| `platformLink`    | 20     | 1 h     | `PUT /api/profile/linked-platforms`                             |
| `fantasyTeam`     | 10     | 1 h     | `POST /api/esport/fantasy`                                      |
| `goal`            | 30     | 1 h     | `POST /api/players/[id]/stats/dashboard/goals`                  |

Les coachs utilisent aussi `review` (avis), `comment` (réponse à un avis) et
`coachingBooking` (sessions, checkout, vérification de paiement) ;
`POST /api/admin/disputes` utilise `report`.

Pour une nouvelle action : l'ajouter à `RATE_LIMITS` dans
`src/lib/services/rateLimitService.ts`, puis la déclarer (`rateLimit:`) dans la
route. L'import IGDB garde son propre limiteur (`gameImportRateLimit.ts`).
