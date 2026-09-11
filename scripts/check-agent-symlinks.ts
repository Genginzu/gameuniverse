#!/usr/bin/env bun
/**
 * check-agent-symlinks.ts
 *
 * Verifies that the agent-config symlinks exist, are symlinks, and point at
 * the correct target. Also checks that steering cross-references resolve.
 *
 *   bun scripts/check-agent-symlinks.ts
 *
 * Exit 0 if all good, 1 if any check fails.
 */
import { lstatSync, readFileSync, readlinkSync, existsSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { LINKS } from './setup-agents';

const ROOT = resolve(import.meta.dirname, '..');
let failed = 0;

function fail(msg: string) {
  console.error(`  FAIL  ${msg}`);
  failed++;
}

// Check 1: each declared symlink exists and is correct
for (const { path, target } of LINKS) {
  const abs = join(ROOT, path);
  const absTarget = join(ROOT, target);
  const st = lstatSync(abs, { throwIfNoEntry: false });

  if (!st) {
    fail(`${path} does not exist — run: bun scripts/setup-agents.ts`);
    continue;
  }
  if (!st.isSymbolicLink()) {
    fail(`${path} is not a symlink (got ${st.isDirectory() ? 'directory' : 'file'}) — resolve manually`);
    continue;
  }
  const cur = readlinkSync(abs);
  if (resolve(dirname(abs), cur) !== absTarget) {
    fail(`${path} points to ${cur}, expected ${target}`);
    continue;
  }
  if (!existsSync(absTarget)) {
    fail(`${path} -> ${target} but target does not exist`);
    continue;
  }
  console.log(`  OK    ${path} -> ${target}`);
}

// Check 2: steering cross-references resolve
// Only check paths that look like real file references: must contain '/' or
// start with '.' — bare filenames like "types.ts" or "fr.json" are examples, not refs.
const steeringDir = join(ROOT, '.agents', 'steering');
if (existsSync(steeringDir)) {
  const { readdirSync } = await import('node:fs');
  for (const file of readdirSync(steeringDir)) {
    if (!file.endsWith('.md')) continue;
    const content = readFileSync(join(steeringDir, file), 'utf8');
    const refs = content.matchAll(/`([^`]+\.(?:md|ts|tsx|js|json))`/g);
    for (const ref of refs) {
      const refPath = ref[1];
      // Skip URLs, bare filenames (no /), globs, and commands (spaces)
      if (refPath.startsWith('http') || refPath.includes('://')) continue;
      if (!refPath.includes('/')) continue;
      if (refPath.includes('*')) continue;
      if (refPath.includes(' ')) continue;
      // Resolve relative to repo root, not steering dir
      const resolved = join(ROOT, refPath);
      if (!existsSync(resolved)) {
        fail(`steering/${file}: reference \`${refPath}\` does not resolve`);
      }
    }
  }
}

if (failed > 0) {
  console.error(`\n${failed} check(s) failed.`);
  process.exit(1);
}
console.log('\nAll agent symlink checks passed.');
