<#
.SYNOPSIS
  Recupere le Storage apres suppression accidentelle des buckets :
  recree les buckets (avatars, banners, post-images) puis re-uploade les
  fichiers depuis scripts/dumps/storage/ aux bonnes cles.

.PARAMETER ProjectRef
  Reference du projet cible.

.PARAMETER DbUrl
  Connection string URI du projet cible (port 5432). Si omis, demande interactif.
#>
param(
  [Parameter(Mandatory = $true)] [string]$ProjectRef,
  [string]$DbUrl
)

$ErrorActionPreference = "Stop"
$PgImage = "public.ecr.aws/supabase/postgres:17.6.1.167"
$base = Join-Path $PSScriptRoot "storage"

if (-not $DbUrl) {
  $sec = Read-Host -AsSecureString "Connection string URI du projet cible (port 5432)"
  $DbUrl = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec)
  )
}

Write-Host "==> Recreation des buckets" -ForegroundColor Cyan
$sql = @'
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('avatars','avatars',true,5242880,ARRAY['image/jpeg','image/png','image/webp','image/gif']),
  ('banners','banners',true,5242880,ARRAY['image/jpeg','image/png','image/webp','image/gif']),
  ('post-images','post-images',true,5242880,ARRAY['image/jpeg','image/png','image/webp','image/gif'])
ON CONFLICT (id) DO NOTHING;
'@
docker run --rm -i $PgImage psql $DbUrl -v "ON_ERROR_STOP=1" -c $sql

Write-Host "==> Re-upload des fichiers (cles exactes, source relative)" -ForegroundColor Cyan
foreach ($b in @('avatars', 'banners', 'post-images')) {
  # L'export a telecharge dans storage/<bucket>/<bucket>/<cle>
  $root = Join-Path $base "$b\$b"
  if (-not (Test-Path $root)) { $root = Join-Path $base $b }  # fallback si structure a plat
  Get-ChildItem -Recurse -File $root | ForEach-Object {
    $key = $_.FullName.Substring((Resolve-Path $root).Path.Length).TrimStart('\').Replace('\', '/')
    Push-Location $_.DirectoryName
    # Source RELATIVE obligatoire (le CLI parse mal les chemins absolus Windows).
    npx supabase storage cp $_.Name "ss:///$b/$key" --project-ref $ProjectRef --experimental
    Pop-Location
    Write-Host "    $b <= $key" -ForegroundColor DarkCyan
  }
}

Write-Host "`n==> Verification" -ForegroundColor Green
foreach ($b in @('avatars', 'banners', 'post-images')) {
  Write-Host "--- $b ---"
  npx supabase storage ls -r "ss:///$b" --project-ref $ProjectRef --experimental
}
