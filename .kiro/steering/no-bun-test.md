---
inclusion: always
---

# Testing Framework: Vitest Only

## Rule

This project uses **Vitest** as its sole test runner. Do NOT use `bun:test`.

## Imports

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
```

For component/hook tests, also import from `@testing-library/react`:

```typescript
import { render, screen, fireEvent } from "@testing-library/react";
import { renderHook } from "@testing-library/react";
```

## Mocking

| API          | Usage                     |
| ------------ | ------------------------- |
| `vi.fn()`    | Create a mock function    |
| `vi.spyOn()` | Spy on an existing method |
| `vi.mock()`  | Mock an entire module     |

## Import Paths

- Use alias paths (`@/lib/utils`) — resolved by vitest.config.ts

## File Naming

- All tests: `*.test.ts` or `*.test.tsx`
- Property-based tests: `*.property.test.ts`

## Forbidden Patterns

- ❌ Do NOT import from `bun:test`
- ❌ Do NOT use `mock()` or `spyOn()` from `bun:test`
- ❌ Do NOT use `mock.module()` — use `vi.mock()` instead

## Running Tests

**INTERDIT** : Ne **jamais** ajouter de redirection à une commande de test,
quelle qu'elle soit. Cela inclut `2>&1`, `> fichier`, `| tee`, ou tout autre
opérateur de redirection shell. La redirection casse le formatage de la sortie
et empêche l'utilisateur de voir les résultats en temps réel pour pouvoir aider
au débogage.

```bash
# ✅ Run ALL tests (ne rien ajouter après)
bun run test:all

# Run tests in watch mode
bun run test:ui

# Run a specific test file
bunx vitest run test/unit/lib/utils/myUtil.test.ts
```

## Forbidden Execution Patterns

- ❌ `bun run test:all 2>&1`
- ❌ `npx vitest run 2>&1`
- ❌ `bunx vitest run 2>&1`
- ❌ `bun run test:all > output.txt`
- ❌ `bunx vitest run | tee log.txt`
- ❌ Toute commande de test avec un opérateur de redirection (`>`, `>>`, `2>`,
  `2>&1`, `|`, `| tee`, etc.)
- ✅ `bun run test:all`
- ✅ `bunx vitest run test/unit/...`
