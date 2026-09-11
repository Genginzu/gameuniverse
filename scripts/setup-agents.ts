/**
 * Ensures the agent-config symlinks exist and point at the canonical `.agents/`
 * source of truth. Runs automatically on `bun install` (via the `prepare`
 * script) and can be run manually:
 *
 *   bun scripts/setup-agents.ts
 *
 * Safe and idempotent: correct symlinks are left untouched, wrong ones are
 * recreated, and real (non-symlink) files/dirs are never deleted — they are
 * reported so a human can resolve the conflict.
 *
 * Windows note: git stores these as symlinks. On a checkout without symlink
 * support they materialise as small text files containing the target path;
 * this script detects that case and replaces them with real links. Directory
 * links use 'dir' symlinks (requires Developer Mode); if that fails, falls
 * back to 'junction' (no privileges, but git may not record it as a symlink).
 */
import { lstatSync, readFileSync, readlinkSync, renameSync, rmSync, symlinkSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';

export type Kind = 'dir' | 'file';

const ROOT = resolve(import.meta.dirname, '..');
const IS_WIN = process.platform === 'win32';

export const LINKS: { path: string; target: string; kind: Kind }[] = [
  { path: '.claude', target: '.agents', kind: 'dir' },
  { path: '.kiro', target: '.agents', kind: 'dir' },
  { path: 'CLAUDE.md', target: 'AGENTS.md', kind: 'file' },
];

function ensure(linkPath: string, target: string, kind: Kind): string {
  const abs = join(ROOT, linkPath);
  const absTarget = join(ROOT, target);
  const linkBody = relative(dirname(abs), absTarget).split(sep).join('/');
  const st = lstatSync(abs, { throwIfNoEntry: false });

  if (st?.isSymbolicLink()) {
    const cur = readlinkSync(abs);
    if (resolve(dirname(abs), cur) === absTarget) return 'ok';
  } else if (st) {
    let content: string | null = null;
    if (st.isFile()) {
      try {
        content = readFileSync(abs, 'utf8').trim();
      } catch {
        content = null;
      }
    }
    if (content !== linkBody) {
      return `skip (real ${st.isDirectory() ? 'directory' : 'file'} present — resolve manually)`;
    }
  }

  const tmp = `${abs}.tmp-${process.pid}`;
  try {
    if (IS_WIN && kind === 'dir') {
      try {
        symlinkSync(linkBody, tmp, 'dir');
      } catch {
        symlinkSync(absTarget, tmp, 'junction');
      }
    } else {
      symlinkSync(linkBody, tmp, kind === 'dir' ? 'dir' : 'file');
    }
    if (st) rmSync(abs, { recursive: true, force: true });
    renameSync(tmp, abs);
    return 'created';
  } catch (e) {
    rmSync(tmp, { recursive: true, force: true });
    return `error: ${(e as Error).message}`;
  }
}

let hadWarning = false;
if (import.meta.main) {
  for (const { path, target, kind } of LINKS) {
    const result = ensure(path, target, kind);
    const ok = result === 'ok' || result === 'created';
    if (!ok) hadWarning = true;
    console.log(`${ok ? 'OK' : 'WARN'}  ${path} -> ${target}: ${result}`);
  }

  if (hadWarning) {
    console.log(
      [
        '',
        'WARN: Some agent symlinks could not be created automatically.',
        '  On Windows, enable Developer Mode or run in an elevated shell, then re-run:',
        '  bun scripts/setup-agents.ts',
      ].join('\n'),
    );
  }
}
