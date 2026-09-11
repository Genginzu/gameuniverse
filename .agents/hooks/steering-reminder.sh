#!/bin/bash
# PreToolUse hook (Read|Glob): when Claude is about to read a source file,
# emit additionalContext orienting the agent BEFORE it reads the file.
#
# Priority:
#   1. If graphify-out/graph.json exists → MANDATORY: use graphify query first
#      (scoped subgraph instead of reading the full file).
#   2. Otherwise → remind about the relevant .agents/steering/ doc(s).
#
# Reads the hook JSON payload from stdin.

set -uo pipefail

payload=$(cat)

file_path=$(node -e '
  let data = "";
  process.stdin.on("data", chunk => data += chunk);
  process.stdin.on("end", () => {
    try {
      const p = JSON.parse(data);
      const fp = (p.tool_input && (p.tool_input.file_path || p.tool_input.path)) || "";
      process.stdout.write(fp);
    } catch { process.stdout.write(""); }
  });
' <<< "$payload")

if [[ -z "$file_path" ]]; then
  exit 0
fi

repo_root="$(cd "$(dirname "$0")/../.." && pwd)"
rel="${file_path#$repo_root/}"
rel="${rel//\\//}"

# Only trigger for source code files (not .md, .json, config, etc.)
case "$rel" in
  *.ts|*.tsx|*.js|*.jsx|*.sql)
    ;;
  .agents/specs/*/tasks.md|.kiro/specs/*/tasks.md)
    ;;
  *)
    exit 0
    ;;
esac

# Priority 1: graphify enforcement
if [[ -f "$repo_root/graphify-out/graph.json" ]]; then
  node -e '
    const rel = process.argv[1];
    const msg = `MANDATORY: graphify-out/graph.json exists. You MUST run ` +
      `\`graphify query "<question>"\` (or \`graphify path "<A>" "<B>"\` / ` +
      `\`graphify explain "<concept>"\`) before reading ${rel}. ` +
      `These return a scoped subgraph — usually much smaller than the full file. ` +
      `Only read the raw file after graphify has oriented you, or to modify/debug ` +
      `specific lines.`;
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: { hookEventName: "PreToolUse", additionalContext: msg }
    }));
  ' "$rel"
  exit 0
fi

# Priority 2: steering doc reminder (fallback when no graphify graph)

# Map file path to relevant steering doc(s).
# First matching pattern wins — keep specific patterns before general ones.
steering=""
case "$rel" in
  src/app/api/*)
    steering="project-architecture.md code-quality.md"
    ;;
  src/app/*)
    steering="project-architecture.md"
    ;;
  src/hooks/*)
    steering="project-architecture.md code-quality.md"
    ;;
  src/lib/services/igdb*|src/types/igdb*|src/hooks/igdb*|scripts/igdb-import/*)
    steering="igdb-field-tracking.md project-architecture.md"
    ;;
  src/lib/services/recommendation/*)
    steering="project-architecture.md code-quality.md"
    ;;
  src/lib/services/*)
    steering="project-architecture.md code-quality.md"
    ;;
  src/lib/supabase*)
    steering="project-architecture.md"
    ;;
  src/components/*)
    steering="design-glassmorphism.md frontend-mobile-first.md styles-organization.md"
    ;;
  src/messages/*)
    steering="i18n-translations.md"
    ;;
  src/types/*)
    steering="code-quality.md"
    ;;
  supabase/migrations/*)
    steering="database.md"
    ;;
  test/*)
    steering="testing.md"
    ;;
  .agents/specs/*/tasks.md|.kiro/specs/*/tasks.md)
    steering="spec-final-validation.md"
    ;;
  *)
    exit 0
    ;;
esac

# Emit additionalContext pointing to the steering doc(s).
node -e '
  const rel = process.argv[1];
  const steering = process.argv[2].split(" ");
  const docs = steering.map(d => "`.agents/steering/" + d + "`").join(" and ");
  const msg = `You are about to read ${rel}. Before interpreting or modifying it, ` +
    `make sure you have read ${docs} in this session — ` +
    `these define the conventions that apply to this area ` +
    `(design system, three-client Supabase model, i18n, testing, etc.). ` +
    `If you have not read them yet, read the relevant doc(s) first or grep ` +
    `for the key rules instead of reading the full file.`;
  const out = {
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      additionalContext: msg
    }
  };
  process.stdout.write(JSON.stringify(out));
' "$rel" "$steering"
