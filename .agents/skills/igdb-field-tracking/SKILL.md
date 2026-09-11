---
name: igdb-field-tracking
description:
  Checklist for adding a new synchronizable IGDB field. The change must land in
  4+ files consistently (tracking constants, sync map, form labels + i18n, bulk
  import script). Activate when touching `field-tracking*`, `igdb-sync*`,
  `GameFormSyncTab*`, `scripts/igdb-import/game-importer*`, or admin-games files
  that deal with IGDB field synchronization.
---

# Skill: IGDB Field Tracking — Adding a new field

Full procedure: `.kiro/steering/igdb-field-tracking.md`. The manual-edit
tracking system uses a fixed list of trackable field categories. Adding a new
synchronizable IGDB field requires coordinated updates across the following
files.

## Files to edit

### 1. `src/lib/utils/field-tracking.ts`

- Add the field name to `TRACKABLE_FIELDS`
- Add the matching type in `TrackableField` (in `src/types/admin-games.ts`)
- Add comparison logic in `detectChangedFields()`:
  - Create a `hasXxxChanged()` helper if comparison is complex
  - Use `normalizeString` / `normalizeNumber` for simple fields
- Update the `CurrentGameData` interface if needed

### 2. `src/lib/services/igdb-sync.ts` + `igdb-sync-fields.ts`

- Add a sync function in `src/lib/services/igdb-sync-fields.ts` mapping IGDB →
  Supabase shape
- Register that function in the `FIELD_SYNC_MAP` of `igdb-sync.ts`

### 3. `src/components/admin/games/GameFormSyncTab.tsx`

- Add an entry in `FIELD_LABEL_KEYS` mapping the new field to its i18n key
- Add translations under `admin.games.form` in **both** `src/messages/fr.json`
  and `src/messages/en.json`

### 4. `scripts/igdb-import/game-importer.ts`

- Update `syncExistingGame()` to include the new field in the
  override-respecting sync logic

## Quick checklist

```
☐ TrackableField type updated (src/types/admin-games.ts)
☐ TRACKABLE_FIELDS updated (src/lib/utils/field-tracking.ts)
☐ detectChangedFields() handles the new field
☐ CurrentGameData interface updated if needed
☐ Sync function added in igdb-sync-fields.ts
☐ FIELD_SYNC_MAP updated (src/lib/services/igdb-sync.ts)
☐ FIELD_LABEL_KEYS updated (GameFormSyncTab.tsx)
☐ fr.json and en.json translations added
☐ syncExistingGame() updated (game-importer.ts)
☐ Property-based and unit tests updated
```
