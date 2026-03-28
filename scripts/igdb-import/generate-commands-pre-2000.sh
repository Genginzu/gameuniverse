#!/bin/bash
# Generate dump + execute commands for games before 2000
# 3 variants per year: all, notable-only, not-notable

BASE="bun run scripts/igdb-import/games/index.ts"
EXEC="bun run scripts/igdb-import/execute-sql.ts"
SQL_DIR="scripts/igdb-import/dumps/sqls"

for YEAR in $(seq 1970 1999); do
  FROM="${YEAR}-01-01"
  TO="${YEAR}-12-31"

  echo "# === ${YEAR} ==="
  echo ""

  echo "# All games"
  echo "${BASE} --from=${FROM} --to=${TO} --source=dump"
  echo "${EXEC} ${SQL_DIR}/import-games_${FROM}_${TO}.sql"
  echo ""

  echo "# Notable only"
  echo "${BASE} --from=${FROM} --to=${TO} --source=dump --notable-only"
  echo "${EXEC} ${SQL_DIR}/import-games_${FROM}_${TO}_notable.sql"
  echo ""

  echo "# Not notable"
  echo "${BASE} --from=${FROM} --to=${TO} --source=dump --not-notable"
  echo "${EXEC} ${SQL_DIR}/import-games_${FROM}_${TO}_not-notable.sql"
  echo ""
done
