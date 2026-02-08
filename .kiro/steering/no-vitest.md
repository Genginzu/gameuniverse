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
bun test           # Run all tests
bun test --watch   # Watch mode
bun test --run     # Single run
```

## Why Bun?

- Native TypeScript support
- Faster execution
- Built into the runtime
- No additional dependencies needed
