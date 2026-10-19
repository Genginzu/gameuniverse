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

Dans une route API, après le contrôle d'authentification :

```ts
import { enforceRateLimit } from "@/lib/services/rateLimitService";

const limited = await enforceRateLimit("review", { userId: user.id });
if (limited) return limited; // 429 + en-tête Retry-After

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

Pour une nouvelle action : l'ajouter à `RATE_LIMITS` dans
`src/lib/services/rateLimitService.ts`, puis appeler `enforceRateLimit` dans la
route. L'import IGDB garde son propre limiteur (`gameImportRateLimit.ts`).
