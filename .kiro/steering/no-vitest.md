---
inclusion: always
---

# Testing Framework: Bun Test Only

## Rule

This project uses **Bun's built-in test runner** exclusively. Do NOT use Vitest.

## Imports

Always use:

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

Never use:

```typescript
// ❌ FORBIDDEN
import { ... } from "vitest";
```

## Mocking

Use Bun's mocking utilities:

- `mock()` instead of `vi.fn()`
- `spyOn()` instead of `vi.spyOn()`
- `mock.module()` for module mocking

## Running Tests

```bash
bun test                # Run all tests
bun test --watch        # Watch mode
bun test --run          # Single run
bun test --only-failures # Affiche uniquement les tests en échec (économise du contexte)
```

## Debugging Failed Tests

Quand tu dois corriger des tests en erreur, utilise `--only-failures` pour
n'afficher que les échecs :

```bash
bun test --only-failures
# ou via npm script
bun run test:failures
```

Cela masque les tests qui passent et permet de se concentrer sur les problèmes.

## Why Bun?

- Native TypeScript support
- Faster execution
- Built into the runtime
- No additional dependencies needed
