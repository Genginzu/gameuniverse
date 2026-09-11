---
inclusion: fileMatch
fileMatchPattern: "**/field-tracking*,**/igdb-sync*,**/GameFormSyncTab*,**/igdb-import/game-importer*,**/admin-games*"
---

# IGDB Field Tracking : Ajout d'un nouveau champ

## Contexte

Le système de suivi des modifications manuelles repose sur une liste de 13
catégories de champs synchronisables depuis IGDB. Quand un nouveau champ
synchronisable est ajouté au schéma d'un jeu, 4 fichiers doivent être mis à
jour.

## Procédure

### 1. `src/lib/utils/field-tracking.ts`

- Ajouter le nom du champ dans la constante `TRACKABLE_FIELDS`
- Ajouter le type correspondant dans `TrackableField` (dans
  `src/types/admin-games.ts`)
- Ajouter la logique de comparaison dans `detectChangedFields()` :
  - Créer un helper `hasXxxChanged()` si la comparaison est complexe
  - Utiliser `normalizeString` / `normalizeNumber` pour les champs simples
- Mettre à jour l'interface `CurrentGameData` si nécessaire

### 2. `src/lib/services/igdb-sync.ts`

- Ajouter une fonction de synchronisation dans
  `src/lib/services/igdb-sync-fields.ts`
- Enregistrer cette fonction dans le `FIELD_SYNC_MAP` de `igdb-sync.ts`
- La fonction doit mapper la donnée IGDB vers le format Supabase

### 3. `src/components/admin/games/GameFormSyncTab.tsx`

- Ajouter une entrée dans `FIELD_LABEL_KEYS` mappant le nouveau champ vers sa
  clé i18n
- Ajouter les traductions dans `src/messages/fr.json` et `src/messages/en.json`
  sous `admin.games.form`

### 4. `scripts/igdb-import/game-importer.ts`

- Mettre à jour `syncExistingGame()` pour inclure le nouveau champ dans la
  logique de synchronisation respectant les overrides

## Checklist rapide

```
☐ TrackableField type mis à jour (src/types/admin-games.ts)
☐ TRACKABLE_FIELDS mis à jour (src/lib/utils/field-tracking.ts)
☐ detectChangedFields() gère le nouveau champ
☐ CurrentGameData interface mise à jour si nécessaire
☐ Fonction de sync ajoutée dans igdb-sync-fields.ts
☐ FIELD_SYNC_MAP mis à jour (src/lib/services/igdb-sync.ts)
☐ FIELD_LABEL_KEYS mis à jour (GameFormSyncTab.tsx)
☐ Traductions fr.json et en.json ajoutées
☐ syncExistingGame() mis à jour (game-importer.ts)
☐ Tests property-based et unitaires mis à jour
```
