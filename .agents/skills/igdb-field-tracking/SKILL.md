---
name: igdb-field-tracking
description:
  Procedure for adding or changing a synchronizable IGDB game field. All
  per-field knowledge lives in one registry under
  `src/lib/services/igdb-fields/`. Activate when touching `field-tracking*`,
  `igdb-sync*`, `igdb-fields/**`, `GameFormSyncTab*`, `bulkFieldSync*`,
  `webhook-diff-applier*`, or admin-games files that deal with IGDB field
  synchronization.
---

# Skill: IGDB Field Tracking

Full procedure: `.agents/steering/igdb-field-tracking.md`.

## Where things live

- `TrackableField` union (18 members): `src/types/admin-games.ts`
- `src/lib/services/igdb-fields/registry.ts` (client-safe):
  `TRACKED_FIELD_REGISTRY` with one entry per field (`labelKey`,
  `webhookPayloadKeys`, `bulkImport`, `detect`). Derives `TRACKABLE_FIELDS`,
  `detectChangedFields`, `trackedFieldLabelKey`, `BULK_FIELD_TO_OVERRIDE`,
  `BULK_IMPORTABLE_COLUMNS`, `WEBHOOK_TRACKED_PAYLOAD_KEYS`.
- `src/lib/services/igdb-fields/change-detectors.ts` (client-safe): admin form
  vs DB detectors.
- `src/lib/services/igdb-fields/sync-map.ts` (server): `FIELD_SYNC_MAP`.
- `src/lib/services/igdb-fields/override-aware-sync.ts` (server):
  `syncTrackedFields()`, the only seam that runs sync functions while skipping
  overridden fields.

## Adding a field

1. Add the member to `TrackableField`; the compiler then flags
   `TRACKED_FIELD_REGISTRY` and `FIELD_SYNC_MAP`.
2. Add the registry entry. Use `detect: null` only for fields the admin form
   cannot edit (today: `popularity`, `similar_games`); otherwise add a detector
   and the matching `CurrentGameData` property + PUT current-data loading.
3. Add the sync function in `igdb-sync-fields*.ts` and register it in
   `FIELD_SYNC_MAP`.
4. Add the label key to both `src/messages/fr.json` and `src/messages/en.json`
   under `admin.games.form`.
5. Keep `TRACKABLE_PAYLOAD_KEYS` in
   `supabase/functions/_shared/webhook-diff-applier.ts` aligned (enforced by
   `registry.test.ts`).
6. Run `bunx vitest run src/lib/services/igdb-fields/`.
