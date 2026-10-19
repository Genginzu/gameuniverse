---
inclusion: always
---

# Base de données Supabase : Migrations, Seeds & Workflow local

## Migrations

### Règle

Toute modification du schéma de la base de données (ajout/suppression de
colonnes, tables, contraintes, index, fonctions, politiques RLS, triggers, etc.)
**doit** être réalisée via un fichier de migration dans `supabase/migrations/`.

### Convention de nommage

```
supabase/migrations/YYYYMMDD00000N_description.sql
```

- La date est incrémentale par rapport à la dernière migration existante.
- Le suffixe `N` est un numéro de séquence (commencer à `1`).
- La description utilise des underscores et décrit brièvement le changement.

### Contenu d'une migration

- SQL pur, pas de code applicatif.
- Utiliser `IF NOT EXISTS` / `IF EXISTS` quand c'est pertinent pour
  l'idempotence.
- Ajouter un commentaire en en-tête décrivant l'objectif de la migration.
- Inclure les `COMMENT ON` pour documenter les nouvelles colonnes/tables.

### Privilèges : aucun accès automatique (depuis `20261018000017`)

Les nouveaux objets du schéma `public` (tables, séquences, fonctions) ne sont
plus accordés automatiquement à `anon` / `authenticated` : seul `service_role`
y a accès. La clé anon et le JWT étant publics, tout objet accordé est
appelable directement via PostgREST (`/rest/v1`, `/rest/v1/rpc`).

- ✅ Table lue ou écrite par les clients : `ENABLE ROW LEVEL SECURITY`, policies,
  puis `GRANT` explicite des seuls droits nécessaires
  (`GRANT SELECT ON public.ma_table TO anon, authenticated;`).
- ✅ RPC appelée par les clients : `GRANT EXECUTE ON FUNCTION ... TO authenticated`
  (et `anon` seulement si public). `SECURITY DEFINER` uniquement si nécessaire,
  avec `SET search_path` et un contrôle `auth.uid()` / `public.is_admin()` dans
  le corps. Ne jamais faire confiance à un id d'utilisateur passé en paramètre.
- ✅ Objet serveur uniquement (jobs, compteurs, journaux) : aucun `GRANT` client,
  RLS activé sans policy.
- ✅ Colonnes sensibles (prix, statut de paiement, soldes, notes, rôles, ids
  Stripe, tokens) : trigger `BEFORE INSERT OR UPDATE` qui les fige pour
  `authenticated` / `anon` ; écriture via le service role.
- ❌ Ne **jamais** remettre de `ALTER DEFAULT PRIVILEGES ... GRANT ... TO anon,
  authenticated` ni de `GRANT ... ON ALL TABLES / ALL FUNCTIONS`.
- ❌ Ne **jamais** lire `user_metadata` (modifiable par l'utilisateur) dans une
  policy : utiliser `public.is_admin()` (lit `app_metadata`).

Référence : `docs/systems/database-privileges.md`.

### Emplacements interdits

- ❌ Ne **jamais** placer de fichiers SQL de migration dans `scripts/`.
- ❌ Ne **jamais** modifier le schéma directement via l'interface Supabase ou
  des scripts ad-hoc sans migration correspondante.
- ❌ Ne **jamais** mettre de SQL de migration dans le code applicatif (`src/`).

## Seeds

### Emplacement

Les fichiers de seed sont dans `supabase/seeds/`. Ils sont exécutés
automatiquement après les migrations lors d'un `supabase db reset`, configurés
dans `supabase/config.toml` :

```toml
[db.seed]
sql_paths = ['./seeds/*.sql']
```

### Convention de nommage

```
supabase/seeds/NN_description.sql
```

- Préfixe numérique `NN` pour contrôler l'ordre d'exécution.
- Les fichiers sont exécutés dans l'ordre alphabétique (glob).

### Contenu actuel

| Fichier            | Contenu                                          |
| ------------------ | ------------------------------------------------ |
| `01_languages.sql` | Langues du site (fr, en) dans `public.languages` |

### Règles

- ✅ Les seeds ne contiennent que des **données de référence** nécessaires au
  fonctionnement de l'app (langues, rôles, catalogues, etc.).
- ✅ Utiliser `ON CONFLICT DO NOTHING` pour l'idempotence.
- ✅ Les données de référence déjà seedées dans les migrations (character_roles,
  achievement_catalog, supported_languages, storage buckets) n'ont **pas**
  besoin d'être dupliquées dans les seeds.
- ❌ Ne **jamais** mettre de données sample/fictives dans les seeds. Les données
  réelles viennent du dump de production.
- ❌ Ne **jamais** mettre de seeds dans les migrations. Les migrations gèrent le
  schéma, les seeds gèrent les données initiales.
- ⚠️ Exception : les données de référence indispensables au schéma (ex : langues
  référencées par des FK dans les migrations) peuvent rester dans les migrations
  pour garantir l'intégrité lors du `db reset`.

## Workflow local

1. `npx supabase db reset` — applique migrations + seeds (base vierge)
2. Import du dump de prod si nécessaire :
   ```bash
   cmd /c "docker exec -i supabase_db_gameuniverse psql -U postgres -d postgres < scripts/dumps/dump_prod.sql"
   ```
