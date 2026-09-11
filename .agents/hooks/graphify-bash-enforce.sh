#!/bin/bash
# PreToolUse hook (Bash): when Claude is about to run grep/rg/find/fd/ack/ag
# and graphify-out/graph.json exists, emit MANDATORY additionalContext
# forcing graphify query first (scoped subgraph instead of raw grep).
#
# If no graphify graph exists, exit silently — no intervention.
# Reads the hook JSON payload from stdin.

set -uo pipefail

payload=$(cat)

# Extract the command from the payload
cmd=$(node -e '
  let data = "";
  process.stdin.on("data", chunk => data += chunk);
  process.stdin.on("end", () => {
    try {
      const p = JSON.parse(data);
      process.stdout.write((p.tool_input && p.tool_input.command) || "");
    } catch { process.stdout.write(""); }
  });
' <<< "$payload")

if [[ -z "$cmd" ]]; then
  exit 0
fi

repo_root="$(cd "$(dirname "$0")/../.." && pwd)"

# Only intervene if graphify graph exists
if [[ ! -f "$repo_root/graphify-out/graph.json" ]]; then
  exit 0
fi

# Check if the command contains search tools
case "$cmd" in
  *grep*|*"rg "*|*ripgrep*|*"find "*|*"fd "*|*ack*|*"ag "*)
    node -e '
      const msg = `MANDATORY: graphify-out/graph.json exists. You MUST run ` +
        `\`graphify query "<question>"\` before grepping raw files. ` +
        `Only grep after graphify has oriented you, or to modify/debug ` +
        `specific lines. This rule applies to subagents too — include it ` +
        `in every subagent prompt involving code exploration.`;
      process.stdout.write(JSON.stringify({
        hookSpecificOutput: { hookEventName: "PreToolUse", additionalContext: msg }
      }));
    '
    ;;
esac
