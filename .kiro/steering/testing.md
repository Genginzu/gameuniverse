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

### Stratégie : tests ciblés (pas de suite complète)

La suite complète (`bun run test:all`) dure **10+ minutes**. Ne **jamais** la
lancer pendant le développement. Lancer uniquement les tests liés aux fichiers
modifiés.

#### Correspondance fichier source → fichier test

| Fichier source modifié                    | Tests à lancer                                          |
| ----------------------------------------- | ------------------------------------------------------- |
| `src/components/games/GameCard.tsx`       | `bunx vitest run test/unit/components/games/`           |
| `src/hooks/useGameForm.ts`               | `bunx vitest run test/unit/hooks/useGameForm.test.ts`   |
| `src/lib/services/playerService.ts`      | `bunx vitest run test/unit/lib/services/playerService*` |
| `src/lib/utils/slug-utils.ts`            | `bunx vitest run test/unit/lib/utils/slug*`             |
| `src/app/api/admin/games/route.ts`       | `bunx vitest run test/unit/api/admin*`                  |

#### Règles d'exécution

- ✅ Lancer `bunx vitest run test/unit/<dossier-correspondant>/` pour les
  fichiers modifiés
- ✅ Si plusieurs domaines sont touchés, lancer plusieurs commandes ciblées
- ✅ Utiliser `bunx vitest run test/unit/` (tout le dossier unit) uniquement si
  les modifications sont transversales (ex : utilitaire partagé, type global)
- ✅ `bun run test:all` uniquement si l'utilisateur le demande explicitement
- ❌ Ne **jamais** lancer `bun run test:all` automatiquement
- ❌ Ne **jamais** ajouter de redirection à une commande de test (`2>&1`,
  `> fichier`, `| tee`, etc.)

```bash
# ✅ Tests ciblés (préféré)
bunx vitest run test/unit/components/games/
bunx vitest run test/unit/hooks/useGameForm.test.ts
bunx vitest run test/unit/lib/services/playerService*

# ✅ Tous les tests unitaires (si modifications transversales)
bunx vitest run test/unit/

# ✅ Suite complète (uniquement sur demande explicite de l'utilisateur)
bun run test:all

# Mode watch
bun run test:ui
```

## Patterns interdits

- ❌ Importer depuis `bun:test`
- ❌ Utiliser `mock()` ou `spyOn()` de `bun:test`
- ❌ Utiliser `mock.module()` — utiliser `vi.mock()` à la place
- ❌ Créer des `src/**/__tests__/`
- ❌ Placer des tests dans `src/`
- ❌ Utiliser l'extension `.vitest.ts` / `.vitest.tsx`
- ❌ Ajouter des redirections aux commandes de test
