# Export / recréation d'un projet Supabase

Sauvegarde complète et rejouable du projet Supabase hébergé.

## Ce qui est exporté

| Volet            | Couvert par                         | Fichier      |
| ---------------- | ----------------------------------- | ------------ |
| Rôles cluster    | `supabase db dump --role-only`      | `roles.sql`  |
| Schéma (DDL)     | `supabase db dump`                  | `schema.sql` |
| Données (COPY)   | `supabase db dump --data-only`      | `data.sql`   |
| Fichiers Storage | `supabase storage cp -r`            | `storage/<bucket>/` |
| Edge functions   | déjà dans le repo                   | `supabase/functions/` |
| Config projet    | déjà dans le repo                   | `supabase/config.toml` |
| Migrations       | déjà dans le repo                   | `supabase/migrations/` |

> Le CLI exécute `pg_dump` dans Docker : aucune installation Postgres locale
> n'est nécessaire.

## Ce qui n'est PAS exporté

- **Secrets des edge functions** et variables d'environnement du projet
  (à re-saisir dans le nouveau projet).
- **Config Auth avancée** côté dashboard (providers OAuth, templates email) —
  déjà partiellement dans `config.toml`, mais les secrets sont à re-saisir.

## Prérequis

```powershell
npx supabase login   # requis pour l'export Storage (token d'accès)
```

Le mot de passe de la base est demandé de façon interactive par le script et
n'est jamais écrit sur disque.

## Export

```powershell
# Tout (DB + Storage) — inclut les utilisateurs auth
./scripts/dumps/export-supabase.ps1 -ProjectRef kwlomzswurveyywcoivy -Schemas "public,auth"

# Sans les fichiers Storage
./scripts/dumps/export-supabase.ps1 -ProjectRef kwlomzswurveyywcoivy -SkipStorage
```

Le `project-ref` se trouve dans l'URL du dashboard Supabase
(`https://supabase.com/dashboard/project/<project-ref>`).

## Recréation (restauration)

Un script automatise tout : `import-supabase.ps1`.

```powershell
npx supabase login    # requis pour le Storage
./scripts/dumps/import-supabase.ps1 -ProjectRef <ref-cible>
# La connection string (URI, port 5432) est demandée de façon interactive.
```

Le script enchaîne :

1. `supabase db push` — recrée schéma, buckets, policies storage, triggers,
   données de référence à partir des migrations du repo.
2. **Préparation** — vide les tables `public` (évite les conflits avec les
   données de référence seedées par les migrations), désactive les triggers
   `USER`, et retire le trigger `on_auth_user_created`.
3. `data.sql` — importe les données `public` + `auth`.
4. **Finalisation** — réactive les triggers et recrée le trigger auth.
5. Re-upload des fichiers Storage.

### Pourquoi cette gymnastique sur les triggers

- Supabase interdit `SET session_replication_role = replica` (rôle non
  superuser → `permission denied`). On désactive donc les triggers `USER`
  table par table (autorisé au propriétaire).
- Sinon, à l'import, des triggers `AFTER INSERT` se déclencheraient : appels
  HTTP vers des edge functions (`igdb_webhook_event_to_processor`), compteurs
  de popularité faussés, double-insertion dans `profiles` via le trigger auth.

### Restauration manuelle (sans le script)

```powershell
# psql via l'image Docker Postgres (aucune install locale)
$img = "public.ecr.aws/supabase/postgres:17.6.1.167"
docker run --rm -i -v "${PWD}/scripts/dumps:/d" $img psql "<uri>" -f /d/data.sql
```

### Base locale (Docker)

```bash
npx supabase start
npx supabase db reset                # migrations + seeds sur une base vierge
# importer uniquement les données :
cmd /c "docker exec -i supabase_db_gameuniverse psql -U postgres -d postgres < scripts/dumps/data.sql"
```

### Restaurer les fichiers Storage manuellement

Contraintes du CLI `storage cp` (contournées par le script) :

- **Source relative obligatoire** : un chemin absolu Windows (`C:\...`) est pris
  pour un schéma d'URL → erreur « Unsupported operation ». Se placer dans le
  dossier (`Push-Location`) et passer un chemin relatif.
- **Clé de destination explicite** : `cp -r` ajoute le nom du dossier source
  comme préfixe (nesting `bucket/bucket/...`). Uploader fichier par fichier avec
  la clé exacte évite ce problème.
- ⚠️ **`storage rm -r ss:///<bucket>` supprime le bucket lui-même**, pas
  seulement son contenu. Après ça il faut recréer le bucket (INSERT dans
  `storage.buckets`) avant de ré-uploader.

```powershell
$ref = "<ref-cible>"
$base = "scripts\dumps\storage"
foreach ($b in @('avatars','banners','post-images')) {
  $root = Join-Path $base "$b\$b"          # l'export nest sous <bucket>/<bucket>/
  Get-ChildItem -Recurse -File $root | ForEach-Object {
    $key = $_.FullName.Substring((Resolve-Path $root).Path.Length).TrimStart('\').Replace('\','/')
    Push-Location $_.DirectoryName
    npx supabase storage cp $_.Name "ss:///$b/$key" --project-ref $ref --experimental
    Pop-Location
  }
}
```

## Finaliser après import

- Re-saisir les **secrets / variables d'env** des edge functions dans le
  dashboard du projet cible.
- Déployer les edge functions : `npx supabase functions deploy`.

## Fichiers ignorés par git

Les dumps (`*.sql`) de ce dossier ne doivent pas être commités (données
potentiellement sensibles / volumineuses). Vérifier le `.gitignore` racine.
