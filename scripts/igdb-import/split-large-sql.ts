#!/usr/bin/env bun
/**
 * Split SQL files larger than 50,000 lines into parts.
 *
 * Naming convention:
 *   import-games_2022-01-01_2022-12-31_not-notable.sql
 *   => import-games_2022-01-01_2022-12-31_not-notable_part1.sql
 *   => import-games_2022-01-01_2022-12-31_not-notable_part2.sql
 *   ...
 *
 * The reference data block (genres, companies, platforms, ratings, languages)
 * at the top of each file is duplicated into every part so each part is
 * self-contained and can be executed independently.
 */

import { readFile, writeFile, readdir } from "fs/promises";
import { join, basename, dirname, extname } from "path";

const MAX_LINES = 50_000;
const SQL_ROOT = "scripts/igdb-import/dumps/sqls";

/** Recursively find all .sql files */
async function findSqlFiles(dir: string): Promise<string[]> {
  const results: string[] = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...(await findSqlFiles(fullPath)));
    } else if (entry.name.endsWith(".sql")) {
      results.push(fullPath);
    }
  }
  return results;
}

/** Detect the end of the reference data header (genres, companies, platforms, etc.) */
function findHeaderEnd(lines: string[]): number {
  // The header ends when we hit the first "-- === Game:" or "-- === Character:" comment
  // or the first INSERT INTO games/characters statement after the reference block
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith("-- === Game:") || line.startsWith("-- === Character:")) {
      return i;
    }
    // Also detect first game/character insert as header boundary
    if (line.startsWith("INSERT INTO games ") || line.startsWith("INSERT INTO characters (")) {
      return i;
    }
  }
  // No header detected, return 0
  return 0;
}

async function main() {
  const allFiles = await findSqlFiles(SQL_ROOT);
  let splitCount = 0;

  for (const filePath of allFiles) {
    // Skip already-split parts
    if (/_part\d+\.sql$/.test(filePath)) continue;

    const content = await readFile(filePath, "utf-8");
    const lines = content.split("\n");

    if (lines.length <= MAX_LINES) continue;

    const name = basename(filePath);
    const dir = dirname(filePath);
    const ext = extname(filePath);
    const base = name.slice(0, -ext.length); // remove .sql

    console.log(`[Split] ${name} (${lines.length} lines)`);

    const headerEnd = findHeaderEnd(lines);
    const header = headerEnd > 0 ? lines.slice(0, headerEnd) : [];
    const body = headerEnd > 0 ? lines.slice(headerEnd) : lines;

    // Calculate effective max for body lines per part
    const bodyMaxPerPart = MAX_LINES - header.length;
    if (bodyMaxPerPart <= 0) {
      console.warn(`  ⚠ Header alone is ${header.length} lines, skipping`);
      continue;
    }

    const totalParts = Math.ceil(body.length / bodyMaxPerPart);

    for (let p = 0; p < totalParts; p++) {
      const partLines = body.slice(p * bodyMaxPerPart, (p + 1) * bodyMaxPerPart);
      const partContent =
        header.length > 0 ? [...header, "", ...partLines].join("\n") : partLines.join("\n");

      const partName = `${base}_part${p + 1}${ext}`;
      const partPath = join(dir, partName);
      await writeFile(partPath, partContent, "utf-8");
      console.log(`  → ${partName} (${(header.length + partLines.length).toLocaleString()} lines)`);
    }

    console.log(`  ✓ Original kept: ${name}`);
    splitCount++;
  }

  console.log(`\n[Split] Done. Split ${splitCount} files.`);
}

main().catch(console.error);
