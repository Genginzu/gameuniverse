---
inclusion: always
---

# Migrations base de données : Supabase uniquement

## Règle

Toute modification du schéma de la base de données (ajout/suppression de
colonnes, tables, contraintes, index, fonctions, politiques RLS, triggers, etc.)
**doit** être réalisée via un fichier de migration dans `supabase/migrations/`.

## Convention de nommage

Les fichiers suivent le format :

```
supabase/migrations/YYYYMMDD00000N_description.sql
```

- La date est incrémentale par rapport à la dernière migration existante.
- Le suffixe `N` est un numéro de séquence (commencer à `1`).
- La description utilise des underscores et décrit brièvement le changement.

Exemple :

```
supabase/migrations/20240215000001_add_game_color_columns.sql
```

## Contenu d'une migration

- SQL pur, pas de code applicatif.
- Utiliser `IF NOT EXISTS` / `IF EXISTS` quand c'est pertinent pour
  l'idempotence.
- Ajouter un commentaire en en-tête décrivant l'objectif de la migration.
- Inclure les `COMMENT ON` pour documenter les nouvelles colonnes/tables.

## Emplacements interdits

- ❌ Ne **jamais** placer de fichiers SQL de migration dans `scripts/`.
- ❌ Ne **jamais** modifier le schéma directement via l'interface Supabase ou
  des scripts ad-hoc sans migration correspondante.
- ❌ Ne **jamais** mettre de SQL de migration dans le code applicatif (`src/`).

## Emplacement obligatoire

- ✅ Toutes les migrations dans `supabase/migrations/` exclusivement.
