---
name: igdb-api-expert
description: Expert reference for the IGDB (Internet Game Database) API. Activate when working on IGDB imports, synchronization, APICalypse queries, PopScore/popularity primitives, IGDB webhooks, images, or any code touching `igdbService`, `igdb-sync*`, `igdb-fetcher*`, `src/types/igdb.ts`, `GameFormSyncTab`, or `scripts/igdb-import/**`.
---

# Skill: IGDB API Expert — GameUniverse

The full reference (78 endpoints, APICalypse grammar, image sizes, tag numbers, enum-to-table migration, PopScore, webhooks, data dumps, project integration) lives in `.kiro/skills/igdb-api-expert.md`.

**Before answering any IGDB-related question, read `.kiro/skills/igdb-api-expert.md` in full.** It is the single source of truth and supersedes any training-data knowledge of the IGDB API (which predates the enum→table migration).

## When to activate this skill

Activate and load the reference when the user's message or the modified file touches any of:

- IGDB (as a word or part of an identifier)
- Game or character imports from an external source
- Game data synchronization
- APICalypse / Apicalypse queries
- PopScore / popularity primitives
- IGDB webhooks
- References to `igdbService`, `igdb-fetcher`, `igdb-sync`, `igdb-import`
- IGDB endpoints (`/games`, `/characters`, `/platforms`, etc.)
- Files under `scripts/igdb-import/**`
- `src/lib/services/igdbService.ts` or `src/types/igdb.ts`

## Project integration cheat sheet

- **Service**: `src/lib/services/igdbService.ts` (class `IGDBService`, OAuth2 token cache, image URL builder, search, details, time-to-beat, age ratings, versions, DLCs, character batches)
- **Types**: `src/types/igdb.ts`
- **Bulk import CLI**: `scripts/igdb-import/` (games, characters, shared utilities)
- **Env vars**: `IGDB_CLIENT_ID`, `IGDB_CLIENT_SECRET`, `IGDB_WEBHOOK_SECRET`
- **Webhook endpoint**: `POST /api/webhooks/igdb?entity={type}&method={method}`
- **Audit table**: `igdb_webhook_events`
- **Admin page**: `/admin/webhooks`
