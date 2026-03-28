# Import all games from 2000 to 2026 via dump mode
# For each year: generate SQL (all, notable, not-notable) then execute each
$ErrorActionPreference = "Continue"

$BASE = "bun run scripts/igdb-import/games/index.ts"
#$EXEC = "bun run scripts/igdb-import/execute-sql.ts"
$SQL_DIR = "scripts/igdb-import/dumps/sqls"

for ($YEAR = 2017; $YEAR -le 2026; $YEAR++) {
  $FROM = "$YEAR-01-01"
  $TO = "$YEAR-12-31"

  Write-Host ""
  Write-Host "=== Processing year: $YEAR ===" -ForegroundColor Cyan

  # All games
  Write-Host "[$YEAR] Generating SQL - all games..."
  Invoke-Expression "$BASE --from=$FROM --to=$TO --source=dump"
  #Write-Host "[$YEAR] Executing SQL - all games..."
  #Invoke-Expression "$EXEC $SQL_DIR/import-games_${FROM}_${TO}.sql"

  # Notable only
  Write-Host "[$YEAR] Generating SQL - notable only..."
  Invoke-Expression "$BASE --from=$FROM --to=$TO --source=dump --notable-only"
  #Write-Host "[$YEAR] Executing SQL - notable only..."
  #Invoke-Expression "$EXEC $SQL_DIR/import-games_${FROM}_${TO}_notable.sql"

  # Not notable
  Write-Host "[$YEAR] Generating SQL - not notable..."
  Invoke-Expression "$BASE --from=$FROM --to=$TO --source=dump --not-notable"
  #Write-Host "[$YEAR] Executing SQL - not notable..."
  #Invoke-Expression "$EXEC $SQL_DIR/import-games_${FROM}_${TO}_not-notable.sql"

  Write-Host "[$YEAR] Done" -ForegroundColor Green
}

Write-Host ""
Write-Host "All years 2000-2026 imported." -ForegroundColor Green
