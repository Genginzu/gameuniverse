---
inclusion: fileMatch
fileMatchPattern: "**/field-tracking*,**/igdb-sync*,**/igdb-fields/**,**/GameFormSyncTab*,**/bulkFieldSync*,**/webhook-diff-applier*,**/admin-games*"
---

# IGDB Field Tracking : registre des champs synchronisables

## Contexte

Le suivi des modifications manuelles (`game_field_overrides`) porte sur 17
catégories de champs synchronisables depuis IGDB (union `TrackableField` dans
`src/types/admin-games.ts`). Toute la connaissance par champ vit dans **un
registre unique** sous `src/lib/services/igdb-fields/` :

| Fichier                  | Côté         | Contenu                                                                            |
| ------------------------ | ------------ | ---------------------------------------------------------------------------------- |
| `registry.ts`            | client + srv | `TRACKED_FIELD_REGISTRY` : label i18n, clés payload webhook, alias bulk, détecteur |
| `change-detectors.ts`    | client + srv | Détecteurs formulaire admin vs DB (`detectXxxChange`)                              |
| `sync-map.ts`            | serveur      | `FIELD_SYNC_MAP` : fonction de sync IGDB → Supabase par champ                      |
| `override-aware-sync.ts` | serveur      | `syncTrackedFields()` : seam unique qui saute les champs overridés                 |

`registry.ts` et `change-detectors.ts` ne doivent **jamais** importer de code
serveur (ils sont importés par `GameFormSyncTab`, composant client).

Tout en est dérivé : `TRACKABLE_FIELDS`, `detectChangedFields()`,
`trackedFieldLabelKey()`, `BULK_FIELD_TO_OVERRIDE`, `BULK_IMPORTABLE_COLUMNS`,
`WEBHOOK_TRACKED_PAYLOAD_KEYS`.

## Ajouter un champ

1. Ajouter le membre à `TrackableField` (`src/types/admin-games.ts`). Le
   compilateur signale alors les deux `Record<TrackableField, …>` à compléter.
2. Ajouter l'entrée dans `TRACKED_FIELD_REGISTRY` (`registry.ts`) :
   - `labelKey` : clé sous `admin.games.form`, présente dans **`fr.json` et
     `en.json`**.
   - `webhookPayloadKeys` : clés du payload webhook IGDB qui pilotent ce champ
     (`[]` si le webhook ne le gère pas).
   - `bulkImport` : `{ alias, missingColumn }` si le champ est importable en
     masse (ajouter l'alias à `BulkFieldAlias`), sinon `null`.
   - `detect` : détecteur dans `change-detectors.ts` (ajouter le champ à
     `CurrentGameData` et au chargement des données courantes du PUT
     `src/app/api/admin/games/[id]/route.ts`), ou **`null` explicite** si le
     champ n'est pas éditable via le formulaire admin (ex : `popularity`,
     `similar_games`).
3. Ajouter la fonction de sync dans `igdb-sync-fields.ts` /
   `igdb-sync-fields-extended.ts` et l'enregistrer dans `FIELD_SYNC_MAP`
   (`sync-map.ts`) via `fromGame()` (besoin du jeu IGDB complet) ou
   `fromIgdbId()` (endpoint dédié).
4. Si `webhookPayloadKeys` change, mettre à jour `TRACKABLE_PAYLOAD_KEYS` dans
   `supabase/functions/_shared/webhook-diff-applier.ts` (Deno, ne peut pas
   importer `src/`). Le test `registry.test.ts` échoue tant que les deux listes
   divergent.

## Synchronisation

- Toute sync qui doit respecter les overrides passe par
  `syncTrackedFields(supabase, { gameId, igdbId, fields, respectOverrides })`.
  Ne jamais appeler les fonctions `syncXxx` directement depuis une route.
- Points d'entrée : `syncGameField` / `syncAllGameFields` (`igdb-sync.ts`,
  utilisés par l'admin, `/api/games/[slug]/sync` et
  `scripts/igdb-import/games/game-sync.ts`), `syncSingleField`
  (`bulkFieldSync.ts`), `/api/admin/global-sync/enrich`.

## Checklist rapide

```
☐ TrackableField mis à jour (src/types/admin-games.ts)
☐ Entrée TRACKED_FIELD_REGISTRY (label, payload keys, bulk, detect ou null)
☐ CurrentGameData + chargement PUT admin si detect non null
☐ Fonction de sync + entrée FIELD_SYNC_MAP
☐ Traductions fr.json et en.json
☐ TRACKABLE_PAYLOAD_KEYS Deno aligné si payload keys modifiées
☐ bunx vitest run src/lib/services/igdb-fields/
```
