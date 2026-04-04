#!/usr/bin/env bun
/**
 * Fix multi-line SQL statements by joining continuation lines.
 * Some game descriptions contain newlines that break the SQL when split by line.
 * This script joins any line that doesn't start with a SQL keyword back to the previous line.
 */

import { readFile, writeFile, readdir } from "fs/promises";
import { join } from "path";

const SQL_ROOT = "scripts/igdb-import/dumps/sqls";

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

const SQL_LINE_STARTS =
  /^(INSERT |DELETE |UPDATE |SELECT |CREATE |ALTER |DROP |BEGIN|COMMIT|ROLLBACK|--|$)/;

async function main() {
  const files = await findSqlFiles(SQL_ROOT);
  let fixedCount = 0;

  for (const filePath of files) {
    const content = await readFile(filePath, "utf-8");
    const lines = content.split("\n");
    const merged: string[] = [];
    let changed = false;

    for (const line of lines) {
      const trimmed = line.trimStart();
      if (merged.length > 0 && trimmed.length > 0 && !SQL_LINE_STARTS.test(trimmed)) {
        // This is a continuation line — join it to the previous
        merged[merged.length - 1] += " " + trimmed;
        changed = true;
      } else {
        merged.push(line);
      }
    }

    if (changed) {
      await writeFile(filePath, merged.join("\n"), "utf-8");
      fixedCount++;
    }
  }

  console.log(`[Fix] Fixed ${fixedCount} files with multi-line SQL statements.`);
}

main().catch(console.error);
