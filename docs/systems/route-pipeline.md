# Pipeline des routes API

## Description

`defineRoute` (`src/lib/api/route/`) est le prologue commun des routes
`src/app/api/**`. Chaque route **déclare** ce dont elle a besoin ; le module
exécute les étapes dans un ordre fixe, donne au handler l'utilisateur et
l'entrée validée, et répond à tout refus avec une seule forme d'erreur.

Décision : [ADR 0001](../adr/0001-route-pipeline.md). Vocabulaire :
[`GLOSSARY.md`](../../GLOSSARY.md).

## Accès

Modules :

| Fichier                  | Rôle                                                       |
| ------------------------ | ---------------------------------------------------------- |
| `defineRoute.ts`         | Interface : config + handler, ordre des étapes             |
| `routeErrors.ts`         | `RouteError` + factories (`notFound`, `conflict`…)         |
| `parseInput.ts`          | Lecture JSON, validation zod du body / query / params      |
| `routeEnvironment.ts`    | Seam I/O : identité, suspension, rate limit (adapter Supabase) |
| `src/test-helpers/route-environment.ts` | Adapter en mémoire pour les tests          |

## Utilisation

```ts
import { conflict, defineRoute, notFound } from "@/lib/api/route";

export const POST = defineRoute(
  {
    auth: "required", // "required" | "optional" | "admin"
    writesContent: true, // refuse les comptes suspendus
    rateLimit: "review", // action de RATE_LIMITS
    body: reviewSchema, // query: / params: aussi
  },
  async ({ user, body, params, query, request }) => {
    if (!game) throw notFound("Game not found");
    return NextResponse.json({ review }, { status: 201 });
  }
);
```

### Ordre des étapes

1. Identité (`auth`) → 401 `unauthorized` si requise et absente.
2. Rôle (`auth: "admin"`, `app_metadata.role` uniquement) → 403 `forbidden`.
3. Suspension (`writesContent`) → 403 `suspended` + `suspendedUntil`.
4. Rate limit (`rateLimit`, clé user sinon IP) → 429 `rate_limited` +
   `retryAfter` + en-tête `Retry-After`.
5. Params, query puis body (JSON invalide ou schéma) → 400 `validation`.
6. Handler.

Un compte suspendu ne consomme pas de quota ; un body malformé en consomme un.

### Forme des erreurs

```json
{ "error": "Genre not found", "code": "not_found", "details": [] }
```

Codes : `unauthorized` 401, `forbidden` 403, `suspended` 403, `not_found` 404,
`validation` 400, `conflict` 409, `rate_limited` 429, `internal` 500. Les
messages sont en anglais ; le client se fonde sur `code`
(`createApiError` dans `src/lib/services/apiError.ts`).

Une `RouteError` n'est pas journalisée. Toute autre exception est journalisée
une fois (méthode + chemin) et répond 500 `internal`.

Les factories acceptent des champs supplémentaires lus par le client, placés à
côté de `error` et `code` sans pouvoir les écraser :

```ts
throw conflict("Genre is in use", { type: "IN_USE", usageCount });
```

`reports/[id]` garde ses propres codes (`closed`, `invalid_days`) lus par l'UI
de modération, donc ses réponses restent écrites à la main.

### Tests de routes

Ne plus mocker `auth.getUser` ni `@/lib/auth-admin` :

```ts
const routeEnv = useTestRouteEnvironment({ signedInAs: "admin" });
routeEnv.signOut(); // 401
routeEnv.signIn("user"); // 403 sur une route admin
routeEnv.suspend("2026-12-01T00:00:00Z");
routeEnv.exceedRateLimit(42);
```

Le client de données (`createRouteHandlerClient`) reste hors de la seam : les
tests continuent de le mocker (`createSupabaseQueryMock`).

## État de la migration

- ✅ Tranche 1 : toutes les routes `src/app/api/admin/**` et
  `games/[slug]/sync`. `src/lib/auth-admin.ts` supprimé.
- ✅ Tranche 2 : routes utilisateur mutantes, avec une décision de rate limit
  et de suspension par route (cf. `rate-limiting.md`). Ajout de la suspension
  sur les commentaires de personnages et de matchs, les posts de groupes et
  communautés, les messages, les collections publiques, le profil, l'avatar,
  le profil de coach et ses avis.
  - `games/import` garde son limiteur propre (contournement admin).
  - Hors périmètre : cron, internal, webhooks, callbacks OAuth
    (`auth/callback`, `auth/itch/callback`) et les modules déjà approfondis
    (`auth/psn` via `platform-connection`, `profile/*/sync-library` via
    `library-sync`).
  - Durcissements de validation suivis à part : #433 à #438.
- ⏳ Tranche 3 : routes GET à auth optionnelle / requise, `views` et `search`
  (limités par IP) ; puis suppression de `enforceRateLimit` et
  `suspendedResponse`.
- ⏳ Tranche 4 : erreurs typées levées par les services, suppression de
  `handleApiError`.
