<#
.SYNOPSIS
  Importe un export Supabase (schema via migrations + data + Storage) dans un projet cible.

.DESCRIPTION
  Recree fidelement un projet Supabase a partir :
    - des migrations du repo (schema public, buckets, policies storage, triggers, ref data)
    - des dumps produits par export-supabase.ps1 (data.sql, storage/)

  Etapes :
    1. supabase db push            -> recree toute la structure + donnees de reference
    2. prepare : vide les tables public, desactive les triggers USER, drop trigger auth
    3. import data.sql             -> donnees public + auth (triggers neutralises)
    4. finalize : reactive triggers USER, recree le trigger auth
    5. re-upload du Storage

  Pourquoi ne pas utiliser session_replication_role : Supabase interdit ce parametre
  (permission denied, role non-superuser). On desactive donc les triggers USER table
  par table (autorise au proprietaire) et on drop/recree le trigger sur auth.users.

.PARAMETER ProjectRef
  Reference du projet Supabase CIBLE.

.PARAMETER DbUrl
  Connection string URI du projet cible (connexion directe/session, port 5432).
  Dashboard cible -> Project Settings -> Database -> Connection string -> URI.
  Si omis, demande de facon interactive.

.PARAMETER SkipStorage
  Ne pas re-uploader les fichiers du Storage.

.EXAMPLE
  ./scripts/dumps/import-supabase.ps1 -ProjectRef vilgzbeifmimflyttwhr

.NOTES
  Prerequis : Docker, `npx supabase login` (pour le Storage).
#>
param(
  [Parameter(Mandatory = $true)]
  [string]$ProjectRef,

  [string]$DbUrl,

  [switch]$SkipStorage
)

$ErrorActionPreference = "Stop"
$OutDir = $PSScriptRoot
$PgImage = "public.ecr.aws/supabase/postgres:17.6.1.167"

if (-not $DbUrl) {
  $sec = Read-Host -AsSecureString "Connection string URI du projet cible (port 5432)"
  $DbUrl = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec)
  )
}

function Invoke-PsqlFile {
  param([string]$File)
  docker run --rm -i -v "${OutDir}:/d" $PgImage psql $DbUrl -v "ON_ERROR_STOP=1" -f "/d/$File"
}
function Invoke-PsqlCmd {
  param([string]$Sql)
  docker run --rm -i $PgImage psql $DbUrl -v "ON_ERROR_STOP=1" -c $Sql
}

# --- Etape 1 : structure via migrations -------------------------------------
Write-Host "==> 1/5 db push (schema + buckets + policies + ref data)" -ForegroundColor Cyan
npx supabase db push --db-url $DbUrl

# --- Etape 2 : preparation (fichier SQL genere) -----------------------------
Write-Host "==> 2/5 Preparation (vidage + desactivation triggers)" -ForegroundColor Cyan
$prep = @'
-- Desactive les triggers applicatifs (USER) sur toutes les tables public.
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('ALTER TABLE public.%I DISABLE TRIGGER USER', r.tablename);
  END LOOP;
END $$;

-- Vide toutes les tables public (les migrations ont seede des donnees de
-- reference qui entreraient en conflit avec data.sql).
DO $$
DECLARE stmt text;
BEGIN
  SELECT 'TRUNCATE ' || string_agg(format('public.%I', tablename), ', ') || ' CASCADE'
    INTO stmt
  FROM pg_tables WHERE schemaname = 'public';
  IF stmt IS NOT NULL THEN EXECUTE stmt; END IF;
END $$;

-- Retire le trigger auth pour eviter la double-insertion dans profiles.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
'@
Set-Content -Path (Join-Path $OutDir "_prep.sql") -Value $prep -Encoding UTF8
Invoke-PsqlFile -File "_prep.sql"

# --- Etape 3 : import des donnees -------------------------------------------
Write-Host "==> 3/5 Import data.sql" -ForegroundColor Cyan
Invoke-PsqlFile -File "data.sql"

# --- Etape 4 : finalisation -------------------------------------------------
Write-Host "==> 4/5 Finalisation (reactivation triggers)" -ForegroundColor Cyan
$finalize = @'
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE TRIGGER USER', r.tablename);
  END LOOP;
END $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
'@
Set-Content -Path (Join-Path $OutDir "_finalize.sql") -Value $finalize -Encoding UTF8
Invoke-PsqlFile -File "_finalize.sql"

Remove-Item (Join-Path $OutDir "_prep.sql"), (Join-Path $OutDir "_finalize.sql") -ErrorAction SilentlyContinue

# --- Etape 5 : Storage ------------------------------------------------------
if ($SkipStorage) {
  Write-Host "==> 5/5 Storage ignore (--SkipStorage)" -ForegroundColor Yellow
}
else {
  Write-Host "==> 5/5 Re-upload Storage" -ForegroundColor Cyan
  $StorageDir = Join-Path $OutDir "storage"
  foreach ($b in @('avatars', 'banners', 'post-images')) {
    # L'export telecharge dans storage/<bucket>/<bucket>/<cle> (le CLI ajoute
    # le nom du bucket comme dossier). On lit ce niveau et on uploade chaque
    # fichier a sa cle exacte.
    $root = Join-Path $StorageDir "$b\$b"
    if (-not (Test-Path $root)) { $root = Join-Path $StorageDir $b }
    if (-not (Test-Path $root)) { continue }
    Write-Host "    - bucket '$b'" -ForegroundColor DarkCyan
    Get-ChildItem -Recurse -File $root | ForEach-Object {
      $key = $_.FullName.Substring((Resolve-Path $root).Path.Length).TrimStart('\').Replace('\', '/')
      Push-Location $_.DirectoryName
      # Source RELATIVE obligatoire : le CLI parse mal les chemins absolus Windows.
      # Cle de destination explicite : evite le nesting de `cp -r`.
      npx supabase storage cp $_.Name "ss:///$b/$key" --project-ref $ProjectRef --experimental
      Pop-Location
    }
  }
}

Write-Host "`nImport termine dans le projet $ProjectRef" -ForegroundColor Green
Write-Host "Pense a re-saisir les secrets/env et a deployer les edge functions." -ForegroundColor Green
