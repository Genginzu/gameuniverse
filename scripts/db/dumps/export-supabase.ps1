<#
.SYNOPSIS
  Export complet d'un projet Supabase hébergé (schéma + données + rôles + Storage),
  rejouable pour le recréer.

.DESCRIPTION
  Produit dans scripts/dumps/ :
    - roles.sql        : rôles du cluster (--role-only)
    - schema.sql       : schéma complet (tables, vues, fonctions, RLS, triggers...)
    - data.sql         : données uniquement (COPY), rejouable après le schéma
    - storage/<bucket> : fichiers binaires de chaque bucket Storage

  Le CLI Supabase exécute pg_dump dans Docker : aucune install Postgres locale requise.

  ORDRE DE RESTAURATION : roles.sql -> schema.sql -> data.sql -> Storage (re-upload)

.PARAMETER ProjectRef
  Référence du projet Supabase (visible dans l'URL du dashboard).

.PARAMETER Schemas
  Schémas à inclure dans le dump de données. Par défaut : public.
  Ajouter "auth" pour exporter aussi les utilisateurs (auth.users, etc.).

.PARAMETER SkipStorage
  Ne pas exporter les fichiers du Storage.

.EXAMPLE
  ./scripts/dumps/export-supabase.ps1 -ProjectRef kwlomzswurveyywcoivy -Schemas "public,auth"

.NOTES
  - Prérequis Storage : être authentifié via `npx supabase login`.
  - Le mot de passe DB est demandé de façon interactive (jamais stocké/commité).
#>
param(
  [Parameter(Mandatory = $true)]
  [string]$ProjectRef,

  [string]$Schemas = "public",

  [switch]$SkipStorage
)

$ErrorActionPreference = "Stop"
$OutDir = $PSScriptRoot
$Password = Read-Host -AsSecureString "Mot de passe de la base Postgres distante"
$PlainPwd = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto(
  [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($Password)
)

Write-Host "==> 1/4 Export des roles (roles.sql)" -ForegroundColor Cyan
npx supabase db dump --project-ref $ProjectRef -p $PlainPwd --role-only `
  -f (Join-Path $OutDir "roles.sql")

Write-Host "==> 2/4 Export du schema (schema.sql)" -ForegroundColor Cyan
npx supabase db dump --project-ref $ProjectRef -p $PlainPwd `
  -f (Join-Path $OutDir "schema.sql")

Write-Host "==> 3/4 Export des donnees (data.sql, COPY)" -ForegroundColor Cyan
npx supabase db dump --project-ref $ProjectRef -p $PlainPwd --data-only --use-copy `
  --schema $Schemas `
  -f (Join-Path $OutDir "data.sql")

if ($SkipStorage) {
  Write-Host "==> 4/4 Storage ignore (--SkipStorage)" -ForegroundColor Yellow
}
else {
  Write-Host "==> 4/4 Export des fichiers Storage" -ForegroundColor Cyan
  Write-Host "    (necessite 'npx supabase login' au prealable)" -ForegroundColor DarkGray

  $StorageDir = Join-Path $OutDir "storage"
  New-Item -ItemType Directory -Force -Path $StorageDir | Out-Null

  # Liste les buckets à la racine du Storage (une ligne par bucket).
  $buckets = npx supabase storage ls "ss:///" --project-ref $ProjectRef --experimental |
    ForEach-Object { $_.Trim().TrimEnd('/') } |
    Where-Object { $_ -ne "" }

  if (-not $buckets) {
    Write-Host "    Aucun bucket trouve (ou non authentifie)." -ForegroundColor Yellow
  }
  # Le CLI storage cp exige une destination RELATIVE (les chemins absolus
  # Windows type C:\ ne telechargent rien) et un slash final sur la source.
  Push-Location $StorageDir
  try {
    foreach ($bucket in $buckets) {
      Write-Host "    - bucket '$bucket'" -ForegroundColor DarkCyan
      New-Item -ItemType Directory -Force -Path $bucket | Out-Null
      npx supabase storage cp -r "ss:///$bucket/" $bucket --project-ref $ProjectRef --experimental -j 4
    }
  }
  finally {
    Pop-Location
  }
}

Write-Host "`nExport termine dans $OutDir" -ForegroundColor Green
Write-Host "Restauration : roles.sql -> schema.sql -> data.sql -> re-upload Storage" -ForegroundColor Green
