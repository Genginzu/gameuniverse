---
inclusion: always
---

# Tests : Vitest uniquement

## Règle

Le projet utilise **Vitest** comme unique framework de test. Ne **jamais**
utiliser `bun:test`.

## Imports

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
```

Pour les tests de composants/hooks :

```typescript
import { render, screen, fireEvent } from "@testing-library/react";
import { renderHook } from "@testing-library/react";
```

## Mocking

| API          | Usage                        |
| ------------ | ---------------------------- |
| `vi.fn()`    | Créer une fonction mock      |
| `vi.spyOn()` | Espionner une méthode        |
| `vi.mock()`  | Mocker un module entier      |

## Structure des tests

Tous les tests doivent être dans le dossier centralisé `test/`. Ne **jamais**
créer de `__tests__/` dans `src/`.

```
test/
├── unit/                    # Tests unitaires (parallèles)
│   ├── api/                # Tests routes API
│   ├── hooks/              # Tests hooks
│   ├── lib/                # Tests utilitaires/services
│   │   ├── services/
│   │   └── utils/
│   └── components/         # Tests composants
├── integration/            # Tests d'intégration
├── scripts/                # Tests de scripts
├── setup-vitest.ts         # Setup Vitest (jsdom, mocks Next)
└── setup.test.ts           # Vérification du setup
```

## Nommage des fichiers

- Tests classiques : `*.test.ts` ou `*.test.tsx`
- Tests property-based : `*.property.test.ts`

## Chemins d'import

- Utiliser les alias (`@/lib/utils`) — résolus par vitest.config.ts

## Isolation

Vitest isole chaque fichier de test dans son propre scope. Les `vi.mock()` ne
fuient pas entre fichiers. Pas besoin de dossier `test/isolated/`.

- ✅ `vi.mock()` est automatiquement scopé au fichier
- ✅ Les modifications de `globalThis.fetch` dans `beforeEach`/`afterEach` sont
  sûres en parallèle
- ❌ Ne **jamais** recréer de dossier `test/isolated/`

## Exécution des tests

**INTERDIT** : Ne **jamais** ajouter de redirection à une commande de test
(`2>&1`, `> fichier`, `| tee`, etc.). La redirection casse le formatage et
empêche le débogage en temps réel.

```bash
# ✅ Lancer TOUS les tests (ne rien ajouter après)
bun run test:all

# Mode watch
bun run test:ui

# Un fichier spécifique
bunx vitest run test/unit/lib/utils/myUtil.test.ts
```

## Durée des tests

La suite de tests est longue. Quand `bun run test:all` est lancé, **attendre
que tous les tests soient terminés** avant de passer à la suite.

## Patterns interdits

- ❌ Importer depuis `bun:test`
- ❌ Utiliser `mock()` ou `spyOn()` de `bun:test`
- ❌ Utiliser `mock.module()` — utiliser `vi.mock()` à la place
- ❌ Créer des `src/**/__tests__/`
- ❌ Placer des tests dans `src/`
- ❌ Utiliser l'extension `.vitest.ts` / `.vitest.tsx`
- ❌ Ajouter des redirections aux commandes de test
