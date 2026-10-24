/**
 * Workaround for "Failed to load external module <pkg>-<hash>" with `bun --bun next dev`.
 *
 * Turbopack resolves server externals (resend, postcss…) through hashed aliases
 * that it links into `.next/dev/node_modules` lazily, after the dev server has
 * started. Bun caches the content of that directory on first lookup, so links
 * added later stay invisible until the process exits, and Turbopack recreates
 * them on every start. Node does not cache, which is why the bug is Bun-only
 * (vercel/next.js#86866).
 *
 * Bun does find aliases that already exist one level up, in `.next/node_modules`
 * (this is why worktrees that ran `next build` are not affected). This script
 * mirrors the dev aliases there before the dev server starts:
 *
 *   bun scripts/dev/link-turbopack-externals.ts
 *
 * Run automatically by `bun run dev`. On a fresh `.next` the aliases do not
 * exist yet: restart the dev server once after the first compilation.
 */
import { existsSync, mkdirSync, readdirSync, realpathSync, symlinkSync } from "node:fs";
import path from "node:path";

const NEXT_DIR = path.resolve(import.meta.dirname, "../../.next");
const DEV_ALIASES_DIR = path.join(NEXT_DIR, "dev", "node_modules");
const MIRROR_DIR = path.join(NEXT_DIR, "node_modules");

function listAliases(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (!entry.name.startsWith("@")) return [entry.name];
    // Scoped packages are nested one level deeper (`@scope/name-<hash>`).
    return readdirSync(path.join(directory, entry.name)).map((name) => `${entry.name}/${name}`);
  });
}

function mirrorAlias(alias: string): boolean {
  const mirrorPath = path.join(MIRROR_DIR, alias);
  if (existsSync(mirrorPath)) return false;

  const target = realpathSync(path.join(DEV_ALIASES_DIR, alias));
  mkdirSync(path.dirname(mirrorPath), { recursive: true });
  symlinkSync(target, mirrorPath, "junction");
  return true;
}

function linkTurbopackExternals(): void {
  if (!existsSync(DEV_ALIASES_DIR)) return;

  const created = listAliases(DEV_ALIASES_DIR).filter((alias) => {
    try {
      return mirrorAlias(alias);
    } catch (error) {
      console.warn(`[link-turbopack-externals] skipped ${alias}:`, error);
      return false;
    }
  });

  if (created.length > 0) {
    console.log(`[link-turbopack-externals] linked ${created.join(", ")}`);
  }
}

linkTurbopackExternals();
