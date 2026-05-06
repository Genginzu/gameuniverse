# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

## Commands

Runtime is **Bun** (not npm/yarn). All scripts are defined in `package.json`.

```bash
bun run dev              # Next.js dev server (host 0.0.0.0)
bun run build            # Production build
bun run lint             # ESLint (run before pushing)
bun run lint:fix         # Autofix lint issues
bun run format           # Prettier write
bun run type-check       # tsc --noEmit
bun run test             # Full Vitest suite (~10 min — do not run during dev)
bunx vitest run <path>   # Targeted tests (preferred — see Testing below)
bun run test:e2e         # Playwright E2E
bun run supabase:types   # Regenerate src/lib/database.types.ts from local DB
bun run supabase:start   # Start local Supabase
bun run supabase:migrate # Push migrations to remote
bun run check-all:unix   # Full gate: lint + format + type-check + tests
```

### Testing strategy

The full test suite takes **10+ minutes** — never run `bun run test:all` during
iteration. Match modified files to targeted test dirs:

| Source changed                   | Targeted command                               |
| -------------------------------- | ---------------------------------------------- |
| `src/components/games/X.tsx`     | `bunx vitest run test/unit/components/games/`  |
| `src/hooks/useX.ts`              | `bunx vitest run test/unit/hooks/useX.test.ts` |
| `src/lib/services/X.ts`          | `bunx vitest run test/unit/lib/services/X*`    |
| `src/app/api/admin/.../route.ts` | `bunx vitest run test/unit/api/admin*`         |

**Never** append redirections (`2>&1`, `| tee`, etc.) to test commands. Tests
live in `test/` (never `src/**/__tests__/`). Use Vitest only — **never**
`bun:test`. See `.kiro/steering/testing.md`.

Vitest has a two-project setup (`node` vs `dom`) configured in
`vitest.config.ts`. Hook tests that use `renderHook` must be listed in the
`HOOK_TESTS_NEEDING_DOM` array there or they will fail with "document is not
defined".

## Architecture

Next.js 16 App Router + React 19 + Supabase + Tailwind 4 + next-intl. See
`.kiro/steering/project-architecture.md` for the full hook/service inventory.

### Request flow

1. **Pages** live under `src/app/[locale]/` (public) or
   `src/app/[locale]/admin/`. Never create pages outside these two layouts.
2. **API routes** live under `src/app/api/` (outside `[locale]`).
3. **Client components** fetch through SWR hooks in `src/hooks/` → which hit
   `src/app/api/*` routes → which call **services** in `src/lib/services/`.
4. **Server components / server actions** import services directly (look for
   `*ServerService.ts` variants — these are the server-only counterparts that
   use `supabase-server.ts` or `supabase-admin.ts`).

The `supabase.ts` / `supabase-server.ts` / `supabase-admin.ts` split is
intentional: client-side, cookie-aware SSR, and service-role respectively. Do
not mix them.

### Domain split

Services are organized by domain under `src/lib/services/`. Several domains have
parallel client/server service pairs (e.g. `playerPostsService.ts` +
`playerPostsServerService.ts`) — the server variant is for RSC/API routes; the
client variant is for SWR hooks.

Recommendation scoring logic is split into sub-modules under
`src/lib/services/recommendation/`. The IGDB import pipeline lives both in
`src/lib/services/igdb-*` (runtime sync) and `scripts/igdb-import/` (bulk import
CLI).

### i18n

Two locales: `fr` (default) and `en`. Every user-facing string must use
`next-intl` (`useTranslations` / `getTranslations`). Add keys to **both**
`src/messages/fr.json` and `src/messages/en.json` — fr is the reference. See
`.kiro/steering/i18n-translations.md`.

### Database migrations

All schema changes go in `supabase/migrations/YYYYMMDD00000N_description.sql`.
**Never** put migration SQL in `scripts/` or `src/`. See
`.kiro/steering/database-migrations.md`.

### IGDB field tracking

Adding a new synchronizable IGDB field requires updates in 4+ files
(field-tracking constants, sync map, form labels, import script). Full checklist
in `.kiro/steering/igdb-field-tracking.md`.

## Conventions

- **File size**: max 300 lines; 150 for React components; 100 for hooks. Split
  when exceeded.
- **One hook per file** in `src/hooks/`. Naming: `useCamelCase.ts`.
- **Types**: shared types go in `src/types/<domain>.ts`. Types used by a single
  file may stay inline. Never create `types.ts` colocated with components.
- **Styling**: glassmorphism design system — use `.glass-*` utility classes from
  `globals.css` before reinventing. Gradients must follow the cyan→violet
  reference (`from-cyan-500 to-violet-500`). Always support dark mode. See
  `.kiro/steering/design-glassmorphism.md`.
- **Icons**: `@iconify/react` only. Never `lucide-react`, `heroicons`, etc.
- **Mobile-first**: base classes = mobile, then `sm: md: lg:`. Never `max-md:`
  as the primary approach. Custom breakpoint `xs: 475px`. Touch targets ≥ 44px.
  Inputs must be `text-base` (≥16px) to avoid iOS zoom. See
  `.kiro/steering/frontend-mobile-first.md`.
- **Data fetching (client)**: SWR always. Don't reimplement
  caching/revalidation.
- **No hardcoded UI strings** — always use `next-intl`.

## Git workflow

- Work on `dev` branch. CI only runs on PRs from `dev` → `main`. Never push
  directly to `main`.
- Commit messages are enforced by `.githooks/commit-msg` to match
  `<type>: <description>` where type ∈ {feat, fix, refactor, docs, ci, chore,
  style, test, perf}. Include `#N` after the type when working on an issue:
  `fix: #27 replace next/link with i18n navigation`.
- See `.kiro/steering/git-auto-commit.md` and
  `.kiro/steering/github-workflow.md`.

## Additional steering docs

`.kiro/steering/` contains the authoritative conventions. Read the relevant file
when touching the related area:

- `project-architecture.md` — full hook/component/service inventory
- `code-quality.md` — file organization, placement rules, SWR usage
- `testing.md` — Vitest-only, test colocation, targeted commands
- `database-migrations.md` — Supabase-only migration rules
- `i18n-translations.md` — bilingual key requirements
- `design-glassmorphism.md` — design system + gradient rules
- `frontend-mobile-first.md` — responsive patterns + breakpoints
- `git-auto-commit.md` / `github-workflow.md` — commit/issue workflow
- `documentation.md` — when to update `docs/`

## Claude Code skills

`.claude/skills/` holds on-demand references. They activate via file-path or
keyword match in their `description`:

- **`igdb-api-expert`** — full IGDB API reference (78 endpoints, APICalypse,
  PopScore, webhooks). Activates on `igdbService*`, `igdb-sync*`,
  `igdb-fetcher*`, `src/types/igdb.ts`, `GameFormSyncTab*`,
  `scripts/igdb-import/**`. Points at `.kiro/skills/igdb-api-expert.md` — read
  it in full before answering IGDB questions.
- **`supabase-expert`** — three-client model, API route patterns, RLS
  migrations. Activates on `src/lib/supabase*`, `src/app/api/**`,
  `supabase/migrations/**`.
- **`nextjs-app-router`** — three page patterns, i18n nav, async `params`.
  Activates on `src/app/**`, `src/proxy.ts`, `src/i18n/**`.
- **`igdb-field-tracking`** — 4-file checklist when adding a synchronizable IGDB
  field. Activates on `field-tracking*`, `igdb-sync*`, `GameFormSyncTab*`,
  `scripts/igdb-import/game-importer*`.
- **`spec-final-validation`** — mandatory tests+lint+build+README block for spec
  `tasks.md`. Activates when writing `.kiro/specs/**/tasks.md`.

## Claude Code hooks

`.claude/settings.json` registers a `PostToolUse` hook on `Write|Edit` that runs
`.claude/hooks/run-related-tests.sh`. When a `.ts`/`.tsx` file under `src/` or
`test/` is modified, the hook injects a reminder to run the targeted Vitest
command (`bunx vitest run --related <file>` for source, `bunx vitest run <file>`
for a test) at the next checkpoint — never the full suite, no redirections.

## MCP servers

Configured in `.mcp.json` (gitignored — contains API tokens). Template in
`.mcp.example.json`. Three servers: `vercel` (HTTP), `notion` (stdio, most write
tools denied), `github` (stdio). Pre-approvals and denials live under
`permissions` in `.claude/settings.json`.

<!-- rtk-instructions v2 -->
# RTK (Rust Token Killer) - Token-Optimized Commands

## Golden Rule

**Always prefix commands with `rtk`**. If RTK has a dedicated filter, it uses it. If not, it passes through unchanged. This means RTK is always safe to use.

**Important**: Even in command chains with `&&`, use `rtk`:
```bash
# ❌ Wrong
git add . && git commit -m "msg" && git push

# ✅ Correct
rtk git add . && rtk git commit -m "msg" && rtk git push
```

## RTK Commands by Workflow

### Build & Compile (80-90% savings)
```bash
rtk cargo build         # Cargo build output
rtk cargo check         # Cargo check output
rtk cargo clippy        # Clippy warnings grouped by file (80%)
rtk tsc                 # TypeScript errors grouped by file/code (83%)
rtk lint                # ESLint/Biome violations grouped (84%)
rtk prettier --check    # Files needing format only (70%)
rtk next build          # Next.js build with route metrics (87%)
```

### Test (60-99% savings)
```bash
rtk cargo test          # Cargo test failures only (90%)
rtk go test             # Go test failures only (90%)
rtk jest                # Jest failures only (99.5%)
rtk vitest              # Vitest failures only (99.5%)
rtk playwright test     # Playwright failures only (94%)
rtk pytest              # Python test failures only (90%)
rtk rake test           # Ruby test failures only (90%)
rtk rspec               # RSpec test failures only (60%)
rtk test <cmd>          # Generic test wrapper - failures only
```

### Git (59-80% savings)
```bash
rtk git status          # Compact status
rtk git log             # Compact log (works with all git flags)
rtk git diff            # Compact diff (80%)
rtk git show            # Compact show (80%)
rtk git add             # Ultra-compact confirmations (59%)
rtk git commit          # Ultra-compact confirmations (59%)
rtk git push            # Ultra-compact confirmations
rtk git pull            # Ultra-compact confirmations
rtk git branch          # Compact branch list
rtk git fetch           # Compact fetch
rtk git stash           # Compact stash
rtk git worktree        # Compact worktree
```

Note: Git passthrough works for ALL subcommands, even those not explicitly listed.

### GitHub (26-87% savings)
```bash
rtk gh pr view <num>    # Compact PR view (87%)
rtk gh pr checks        # Compact PR checks (79%)
rtk gh run list         # Compact workflow runs (82%)
rtk gh issue list       # Compact issue list (80%)
rtk gh api              # Compact API responses (26%)
```

### JavaScript/TypeScript Tooling (70-90% savings)
```bash
rtk pnpm list           # Compact dependency tree (70%)
rtk pnpm outdated       # Compact outdated packages (80%)
rtk pnpm install        # Compact install output (90%)
rtk npm run <script>    # Compact npm script output
rtk npx <cmd>           # Compact npx command output
rtk prisma              # Prisma without ASCII art (88%)
```

### Files & Search (60-75% savings)
```bash
rtk ls <path>           # Tree format, compact (65%)
rtk read <file>         # Code reading with filtering (60%)
rtk grep <pattern>      # Search grouped by file (75%)
rtk find <pattern>      # Find grouped by directory (70%)
```

### Analysis & Debug (70-90% savings)
```bash
rtk err <cmd>           # Filter errors only from any command
rtk log <file>          # Deduplicated logs with counts
rtk json <file>         # JSON structure without values
rtk deps                # Dependency overview
rtk env                 # Environment variables compact
rtk summary <cmd>       # Smart summary of command output
rtk diff                # Ultra-compact diffs
```

### Infrastructure (85% savings)
```bash
rtk docker ps           # Compact container list
rtk docker images       # Compact image list
rtk docker logs <c>     # Deduplicated logs
rtk kubectl get         # Compact resource list
rtk kubectl logs        # Deduplicated pod logs
```

### Network (65-70% savings)
```bash
rtk curl <url>          # Compact HTTP responses (70%)
rtk wget <url>          # Compact download output (65%)
```

### Meta Commands
```bash
rtk gain                # View token savings statistics
rtk gain --history      # View command history with savings
rtk discover            # Analyze Claude Code sessions for missed RTK usage
rtk proxy <cmd>         # Run command without filtering (for debugging)
rtk init                # Add RTK instructions to CLAUDE.md
rtk init --global       # Add RTK to ~/.claude/CLAUDE.md
```

## Token Savings Overview

| Category | Commands | Typical Savings |
|----------|----------|-----------------|
| Tests | vitest, playwright, cargo test | 90-99% |
| Build | next, tsc, lint, prettier | 70-87% |
| Git | status, log, diff, add, commit | 59-80% |
| GitHub | gh pr, gh run, gh issue | 26-87% |
| Package Managers | pnpm, npm, npx | 70-90% |
| Files | ls, read, grep, find | 60-75% |
| Infrastructure | docker, kubectl | 85% |
| Network | curl, wget | 65-70% |

Overall average: **60-90% token reduction** on common development operations.
<!-- /rtk-instructions -->