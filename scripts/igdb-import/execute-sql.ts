#!/usr/bin/env bun
/**
 * Execute SQL files against Supabase via direct Postgres connection.
 *
 * Usage:
 *   bun run scripts/igdb-import/execute-sql.ts scripts/igdb-import/dumps/sqls/import-games_*.sql
 *
 * Requires DATABASE_URL in .env.local:
 *   DATABASE_URL='postgresql://postgres.REF:PASSWORD@aws-X-region.pooler.supabase.com:5432/postgres'
 *
 * Use single quotes around the URL to avoid shell interpolation of special chars.
 */

import postgres from "postgres";
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import { basename } from "path";

async function main() {
  const files = process.argv.slice(2);

  if (files.length === 0) {
    console.error("Usage: bun run scripts/igdb-import/execute-sql.ts <file1.sql> [file2.sql]");
    process.exit(1);
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("Error: DATABASE_URL environment variable is required.");
    process.exit(1);
  }

  // Parse URL explicitly to avoid dotenv escaping issues with $ in passwords
  const url = new URL(databaseUrl);
  const sql = postgres({
    host: url.hostname,
    port: Number(url.port) || 5432,
    database: url.pathname.slice(1) || "postgres",
    username: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    max: 1,
    idle_timeout: 30,
    connect_timeout: 30,
  });

  console.log(
    `[SQL] Connecting to ${url.hostname}:${url.port} as ${decodeURIComponent(url.username)}...`
  );

  for (const filePath of files) {
    if (!existsSync(filePath)) {
      console.error(`[SQL] File not found: ${filePath}`);
      continue;
    }

    const fileName = basename(filePath);
    console.log(`\n[SQL] Executing ${fileName}...`);

    const content = await readFile(filePath, "utf-8");
    const startTime = Date.now();

    try {
      await sql.unsafe(content);
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`[SQL] ✓ ${fileName} completed in ${duration}s`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`[SQL] ✗ ${fileName} failed: ${msg}`);
    }
  }

  await sql.end();
  console.log("\n[SQL] Done.");
}

main().catch(console.error);
