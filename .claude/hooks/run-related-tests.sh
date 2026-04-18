#!/bin/bash
# PostToolUse hook: when Claude writes or edits a .ts/.tsx file under
# src/ or test/, emit additionalContext reminding the assistant to run
# the targeted Vitest tests (never the full suite, no redirections).
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

case "$rel" in
  src/*.ts|src/*.tsx|src/**/*.ts|src/**/*.tsx)
    cmd="bunx vitest run --related \"$rel\""
    kind="source file"
    ;;
  test/*.test.ts|test/*.test.tsx|test/**/*.test.ts|test/**/*.test.tsx)
    cmd="bunx vitest run \"$rel\""
    kind="test file"
    ;;
  *)
    exit 0
    ;;
esac

# Emit additionalContext for the assistant. No auto-run — the assistant
# decides when it has reached a good checkpoint.
node -e '
  const rel = process.argv[1];
  const cmd = process.argv[2];
  const kind = process.argv[3];
  const msg = `A ${kind} was just modified: ${rel}\n\n`
    + `When you reach a stopping point, run the targeted Vitest command:\n`
    + `  ${cmd}\n\n`
    + `Rules: never run the full suite (bun run test:all). Never append redirections `
    + `(2>&1, | tee, > file). If --related finds no matching test, that is fine.`;
  const out = {
    hookSpecificOutput: {
      hookEventName: "PostToolUse",
      additionalContext: msg
    }
  };
  process.stdout.write(JSON.stringify(out));
' "$rel" "$cmd" "$kind"
