---
inclusion: always
---

# Test Structure Guidelines

## Rule

All tests MUST be placed in the centralized `test/` directory. Do NOT create
`__tests__/` directories inside `src/`.

## Directory Structure

```
test/
├── unit/                    # Unit tests (run in parallel)
│   ├── hooks/              # Hook tests
│   ├── lib/                # Library/utility tests
│   │   ├── services/       # Service tests
│   │   └── utils/          # Utility tests
│   └── components/         # Component tests
│       ├── characters/
│       ├── games/
│       ├── library/
│       ├── players/
│       ├── settings/
│       ├── shared/
│       └── ui/
├── isolated/               # Tests with mock conflicts (run sequentially)
│   ├── api/               # API tests needing isolation
│   ├── components/        # Component tests needing isolation
│   ├── hooks/             # Hook tests needing isolation
│   └── lib/               # Library tests needing isolation
├── integration/            # Integration tests
│   ├── auth/
│   ├── i18n/
│   └── middleware/
├── scripts/                # Script tests
│   └── igdb-import/
├── setup.ts                # Global test setup
└── setup.test.ts           # Setup verification tests
```

## Isolated Tests

Tests in `test/isolated/` have mock conflicts with other tests due to Bun's
module caching. They pass individually but fail when run in parallel.

These tests are run sequentially via `bun scripts/run-isolated-tests.ts`.

## File Naming Conventions

- Unit tests: `*.test.ts` or `*.test.tsx`
- Property-based tests: `*.property.test.ts`
- Comprehensive tests: `*.comprehensive.test.ts` or `*.comprehensive.test.tsx`

## Import Paths

When importing from source files, use relative paths from the test directory:

```typescript
// ✅ Correct
import { myFunction } from "../../../src/lib/utils";
import { MyComponent } from "../../../../src/components/shared/MyComponent";

// ❌ Incorrect - Do not use alias paths in tests
import { myFunction } from "@/lib/utils";
```

## Forbidden Patterns

- ❌ Do NOT create `src/**/__tests__/` directories
- ❌ Do NOT place test files alongside source files in `src/`
- ❌ Do NOT use Vitest - use Bun's built-in test runner

## Testing Framework

Use Bun's built-in test runner exclusively:

```typescript
import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  mock,
  spyOn,
} from "bun:test";
```

## Running Tests

**IMPORTANT**: Always use `bun run test:all` to run the complete test suite.
Using `bun test` alone will skip isolated tests and may miss failures.

```bash
# ✅ RECOMMENDED: Run ALL tests (parallel + isolated)
bun run test:all

# Run with coverage
bun run test:all:coverage

# Run parallel tests only (NOT recommended for full validation)
bun run test

# Run isolated tests only (sequential)
bun run test:isolated

# Debug failing tests
bun run test:failures
```

## When to Move Tests to Isolated

Move a test to `test/isolated/` if it:

- Modifies `global.fetch` or other globals
- Uses `mock.module()` that conflicts with other tests
- Passes individually but fails when run in parallel
- Has timing-sensitive assertions

## Durée des Tests

La suite de tests est complète et donc relativement longue à exécuter. Quand une
tâche lance `bun run test:all` (ou toute commande exécutant l'ensemble des
tests), il faut **impérativement attendre que tous les tests soient terminés**
avant de passer à la tâche suivante. Ne pas interrompre ni considérer les tests
comme passés avant d'avoir reçu le résultat final complet. Cela s'applique à
**toute tâche** qui lance les tests, pas uniquement la validation finale.

## Coverage Target

Maintain minimum 90% line coverage across the codebase.
