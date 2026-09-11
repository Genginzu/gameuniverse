---
inclusion: always
---

graphify: A knowledge graph of this project lives in `graphify-out/`. For codebase, architecture, or dependency questions, when `graphify-out/graph.json` exists, first run `graphify query "<question>"` (or `graphify path "<A>" "<B>"` / `graphify explain "<concept>"`). These return a scoped subgraph, usually much smaller than `GRAPH_REPORT.md` or raw grep output. Read `GRAPH_REPORT.md` only for broad architecture review or when those commands do not surface enough context. Building or updating a graph is a different job: load the `graphify` skill (`.agents/skills/graphify/SKILL.md`).

The graph is gitignored. Generate it with: `graphify . --code-only` (covers the entire repo: `src/`, `scripts/`, `supabase/`, `test/`). Update after code changes: `graphify update .`. SQL support requires `graphifyy[sql]` (`uv tool install "graphifyy[sql]"`).
