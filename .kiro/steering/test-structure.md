---
inclusion: always
---

# Test Structure Guidelines

## Rule

All tests MUST be placed in the centralized `test/` directory. Do NOT create
`__tests__/` directories inside `src/`.

All tests use **Vitest** as the sole test runner. See `no-vitest.md` steering
file for detailed conventions.

## Directory Structure

```
test/
├── unit/                    # Unit tests (all run in parallel)
│   ├── api/                # API route tests
│   │   └── admin/
│   ├── hooks/              # Hook tests
│   ├── lib/                # Library/utility tests
│   │   ├── services/
│   │   └── utils/
│   └── components/         # Component tests
│       ├── characters/
│       ├── games/
│       ├── library/
│       ├── players/
│       ├── settings/
│       ├── shared/
│       └── ui/
├── integration/            # Integration tests
├── scripts/                # Script tests
├── setup-vitest.ts         # Vitest setup (jsdom, next mocks)
└── setup.test.ts           # Setup verification
```

## File Naming Conventions

- All tests: `*.test.ts` or `*.test.tsx`
- Property-based tests: `*.property.test.ts`

## Import Paths

- Use alias paths (`@/lib/utils`) — resolved by vitest.config.ts

## Forbidden Patterns

- ❌ Do NOT create `src/**/__tests__/` directories
- ❌ Do NOT place test files alongside source files in `src/`
- ❌ Do NOT import from `bun:test`
- ❌ Do NOT use `.vitest.ts` / `.vitest.tsx` extensions — all tests are
  `*.test.ts` / `*.test.tsx` now

## Running Tests

**IMPORTANT**: Pour lancer TOUS les tests, utiliser uniquement
`bun run test:all`. Ne rien ajouter après cette commande (pas de flags, pas de
chemins, pas de `2>&1`).

**INTERDIT** : Ne **jamais** ajouter de redirection à une commande de test,
quelle qu'elle soit (`bun run test:all`, `bunx vitest run`, `npx vitest run`,
etc.). Cela inclut `2>&1`, `> fichier`, `| tee`, ou tout autre opérateur de
redirection shell. La redirection casse le formatage de la sortie et empêche
l'utilisateur de voir les résultats en temps réel pour pouvoir aider au
débogage.

```bash
# ✅ Run ALL tests (ne rien ajouter après)
bun run test:all

# Run tests in watch mode
bun run test:ui

# Run a specific test file
bunx vitest run test/unit/lib/utils/myUtil.test.ts
```

## Isolation avec Vitest

Vitest isole chaque fichier de test dans son propre module scope. Les
`vi.mock()` ne fuient pas entre fichiers. Il n'y a donc plus besoin d'un dossier
`test/isolated/` séparé — tous les tests vont dans `test/unit/`.

- ✅ `vi.mock()` est automatiquement scopé au fichier
- ✅ Les modifications de `globalThis.fetch` dans `beforeEach`/`afterEach` sont
  sûres en parallèle
- ❌ Ne **jamais** recréer de dossier `test/isolated/`

## Durée des Tests

La suite de tests est complète et donc relativement longue à exécuter. Quand une
tâche lance `bun run test:all` (ou toute commande exécutant l'ensemble des
tests), il faut **impérativement attendre que tous les tests soient terminés**
avant de passer à la tâche suivante.
