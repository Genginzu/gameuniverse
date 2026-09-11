---
name: supabase-expert
description:
  Patterns Supabase du projet — clients, services, migrations, auth, RLS.
  Activer quand on travaille sur la DB, les API routes, l'auth ou les
  migrations.
---

# Skill : Expert Supabase — GameUniverse

## 3 Clients Supabase

### Client Browser (`src/lib/supabase.ts`)

```ts
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";
// Singleton, lazy init, typé avec Database
const client = createBrowserClient<Database>(url, anonKey);
```

- Usage : composants `"use client"` uniquement
- En pratique, **rarement utilisé pour les queries data** — tout passe par SWR →
  API routes

### Client Server (`src/lib/supabase-server.ts`)

```ts
// Server Components (cookies read-only)
export const createServerClient = async () => { ... };
// API Routes (cookies read/write)
export const createRouteHandlerClient = async () => { ... };
```

- Async factory (car `cookies()` est async dans Next 15+)
- Typé avec `Database` via `@supabase/ssr`

### Client Admin (`src/lib/supabase-admin.ts`)

```ts
import { createClient } from "@supabase/supabase-js";
// Singleton, SUPABASE_SERVICE_ROLE_KEY, bypasse RLS
export function getSupabaseAdmin(): SupabaseClient { ... }
```

- Usage : webhooks IGDB, background jobs, opérations sans contexte user

## Pattern Data Fetching

```
Client (SWR) → API Route → createRouteHandlerClient() → Supabase
Server Component → BaseService.fetchDetails() → API Route interne → Supabase
```

- Le client browser Supabase n'est PAS utilisé pour les queries data
- Tout passe par les API routes Next.js

## Pattern API Route

```ts
import { createRouteHandlerClient } from "@/lib/supabase-server";
import { parsePaginationParams, handleApiError } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient();
    const { data, error } = await supabase
      .from("table")
      .select("...")
      .range(offset, offset + limit - 1);
    if (error) return NextResponse.json({ error: "..." }, { status: 500 });
    return NextResponse.json({ data, pagination });
  } catch (error) {
    return NextResponse.json(handleApiError(error, "Failed to ..."), {
      status: 500,
    });
  }
}
```

## Pattern Auth (pas de middleware)

```ts
// Dans chaque API route :
const supabase = await createRouteHandlerClient();
const {
  data: { user },
} = await supabase.auth.getUser();
if (!user)
  return NextResponse.json({ error: "Auth required" }, { status: 401 });

// Admin check :
await requireAdmin(); // src/lib/auth-admin.ts — basé sur le domaine email
```

## Pattern RPC (fonctions Postgres)

```ts
const { data } = await supabase.rpc("get_games_listing", {
  p_locale: locale,
  p_limit: limit,
  p_offset: offset,
});
```

- Paramètres préfixés `p_`

## Migrations (`supabase/migrations/`)

Format : `YYYYMMDD00000N_description.sql`

Patterns obligatoires :

- `IF NOT EXISTS` / `IF EXISTS` systématique
- `COMMENT ON TABLE/COLUMN` pour documenter
- RLS activé sur toutes les tables
- Policies : SELECT public, INSERT/UPDATE/DELETE pour authenticated
- UUID PK avec `gen_random_uuid()`
- `created_at`/`updated_at` avec `DEFAULT NOW()`

## Types

- `src/lib/database.types.ts` — auto-généré (`bunx supabase gen types`)
- `src/types/database.ts` — types manuels pour données brutes
- `src/types/supabase-queries.ts` — types pour queries avec joins
- `src/types/supabase.ts` — types supplémentaires

## Règles

- ✅ Toujours typer le client avec `Database`
- ✅ Utiliser `createRouteHandlerClient()` dans les API routes
- ✅ Utiliser `createServerClient()` dans les Server Components
- ✅ Utiliser `getSupabaseAdmin()` uniquement pour les opérations sans user
- ❌ Ne jamais utiliser `any` pour le client Supabase
- ❌ Ne jamais appeler Supabase directement depuis un composant client
