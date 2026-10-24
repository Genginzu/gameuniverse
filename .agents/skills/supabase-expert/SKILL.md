---
name: supabase-expert
description:
  Supabase patterns for this project — three distinct clients (browser, server,
  admin/service-role), SWR→API-route→Supabase data flow, RLS-aware migrations,
  RPC calls with `p_` prefix, and auth via `defineRoute`. Activate when
  working on `src/lib/supabase*.ts`, `src/app/api/**`, `supabase/migrations/**`,
  database types, auth, or RLS.
---

# Skill: Supabase Expert — GameUniverse

Full reference: `.kiro/skills/supabase-expert.md`. Read it when touching
Supabase clients, API routes, migrations, auth, or RLS.

## Key points (see reference for code examples)

### Three clients — never mix them

- **`src/lib/supabase.ts`** — browser singleton (`createBrowserClient`). Rarely
  used for data queries; everything goes through SWR → API routes.
- **`src/lib/supabase-server.ts`** — async factories: `createServerClient()`
  (RSC, cookies read-only) and `createRouteHandlerClient()` (API routes, cookies
  read/write). `cookies()` is async in Next 15+, so these factories are async.
- **`src/lib/supabase-admin.ts`** — `getSupabaseAdmin()` service-role singleton.
  Bypasses RLS. Only for webhooks, background jobs, operations without a user
  context.

### Data flow

```
Client (SWR hook) → API route → createRouteHandlerClient() → Supabase
Server Component → BaseService → internal API route → Supabase
```

The browser Supabase client is **not** used for data queries.

### API route pattern

```ts
const supabase = await createRouteHandlerClient();
const { data, error } = await supabase
  .from("table")
  .select("...")
  .range(offset, offset + limit - 1);
if (error) return NextResponse.json({ error: "..." }, { status: 500 });
```

Use `parsePaginationParams`, `handleApiError` from `src/lib/api-utils.ts`.

### Auth (per-route, no middleware)

Declare it with `defineRoute` (`src/lib/api/route/`, see
`docs/systems/route-pipeline.md`): the module answers 401/403/400/429 as
`{ error, code, details? }` and hands the handler the user and validated input.

```ts
export const POST = defineRoute(
  { auth: "admin", body: adminGenreFormSchema }, // or "required" / "optional"
  async ({ user, body, params }) => {
    if (missing) throw notFound("Genre not found");
    return NextResponse.json({ ... }, { status: 201 });
  }
);
```

Roles come from `app_metadata.role` only (`getUserRoleFromUser`).

### RPC

```ts
await supabase.rpc("get_games_listing", { p_locale, p_limit, p_offset });
```

Parameters must be prefixed `p_`.

### Migrations (`supabase/migrations/YYYYMMDD00000N_description.sql`)

- `IF NOT EXISTS` / `IF EXISTS` for idempotence
- `COMMENT ON TABLE/COLUMN` for documentation
- RLS enabled on every table
- Policies scoped to the owner / role; no `USING (true)` on writes, never read `user_metadata`
- No automatic grants since `20261018000017`: `GRANT` client access explicitly (see `.agents/steering/database.md`)
- UUID PK with `gen_random_uuid()`
- `created_at` / `updated_at` with `DEFAULT NOW()`
- **Never** put migration SQL in `scripts/` or `src/`. See
  `.kiro/steering/database-migrations.md`.

### Types

- `src/lib/database.types.ts` — auto-generated (`bunx supabase gen types`).
  Regenerate with `bun run supabase:types`.
- `src/types/database.ts` — manual raw-data types
- `src/types/supabase-queries.ts` — types for queries with joins
- `src/types/supabase.ts` — supplementary types

### Rules

- Always type the client with `Database`
- Never use `any` for Supabase clients
- Never call Supabase directly from a client component
