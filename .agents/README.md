# `.agents/` — canonical agent configuration

This directory is the **single, tool-agnostic source of truth** for all AI-agent
configuration in this repo: instructions, skills, steering rules, and specs.

Tool-specific directories are **symlinks** to this one, so every assistant reads
the same files:

```
.agents/            <- real directory (edit here)
.claude  -> .agents  <- symlink (Claude Code)
.kiro    -> .agents  <- symlink (Kiro)

CLAUDE.md -> AGENTS.md  <- symlink (root instructions)
```

`AGENTS.md` is the real file; `CLAUDE.md` is the symlink beside it.
Write new content in `AGENTS.md`, and reference it by that name.

## Layout

| Path | Consumed by | Purpose |
|------|-------------|---------|
| `settings.json` | Claude Code | Hooks / permissions (Kiro ignores it) |
| `steering/` | Kiro | Always/auto-included rule files (Claude ignores it) |
| `skills/<name>/SKILL.md` | Claude Code | On-demand skills with frontmatter activation |
| `skills/<name>.md` | Kiro | Kiro-format skills with `inclusion` frontmatter |
| `specs/` | Kiro | Feature specs (requirements / design / tasks) |
| `agents/` | Kiro | Custom agent definitions |
| `hooks/` | Claude Code + Kiro | Hook scripts (`.sh` for Claude, `.kiro.hook` for Kiro) |
| `settings/` | Kiro | Kiro-specific settings (LSP, MCP example) |

Each tool reads the paths it understands and ignores the rest — that is why one
shared directory can back all of them.

The root `AGENTS.md` (with `CLAUDE.md` symlinked to it) holds the project-wide
instructions and knowledge base.

## Editing rules

- **Edit files here (`.agents/...`).** Never edit through the `.claude/` or `.kiro/`
  symlinks — it is the same file, but referencing the real path avoids confusion.
- Cross-references between files should use `.agents/...` paths, not `.claude/...` or
  `.kiro/...`, so they survive even if a symlink is missing.
- **Adding a skill is one directory.** `skills/<name>/SKILL.md` with `name` and
  `description` in the frontmatter, and Claude Code finds it on its own. For Kiro,
  add a flat `skills/<name>.md` with `inclusion` frontmatter if needed.

## Recreating the symlinks

Git stores the symlinks, so a normal clone on macOS/Linux just works. If they are
missing (e.g. a fresh checkout on Windows without symlink support), run:

```bash
bun scripts/setup-agents.ts
```

This also runs automatically on `bun install` via the `prepare` script.
