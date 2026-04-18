---
name: spec-final-validation
description: Required final tasks for any feature spec — full test run, lint, production build, and a feature README under `docs/features/`. Activate when writing or reviewing `.kiro/specs/**/tasks.md`, or when the user asks to finalize/close a spec.
---

# Skill: Spec Final Validation

Full rules: `.kiro/steering/spec-final-validation.md`. Every spec's `tasks.md` must end with the four tasks below, in order.

## Mandatory final tasks

### 1. Tests

```bash
bun run test:all
```

- Runs all tests (parallel + isolated)
- Fix failing tests before continuing
- **Never** append `2>&1` or any redirection
- **Anti-duplicate**: if the last implementation task already runs `bun run test:all`, skip this task and go straight to lint.

### 2. Lint

```bash
bun run lint
```

- No lint errors or warnings
- Fix before continuing

### 3. Production build

```bash
bun run build
```

- No compilation errors
- Fix before continuing

### 4. Feature README

Create `docs/features/{domain}/{feature-name}.md` (kebab-case) containing:

- **Description** — what was implemented
- **Accès** — routes, URLs, navigation to reach the feature
- **Prérequis** — required configuration or permissions
- **Utilisation** — quick guide to the main actions

## Task block to append to `tasks.md`

```markdown
## Task X: Exécution des tests complets (si pas déjà fait dans la tâche précédente)

- [ ] Exécuter `bun run test:all`
- [ ] Vérifier que tous les tests passent (parallèles + isolés)
- [ ] Corriger les tests en échec si nécessaire

## Task X+1: Lint du code

- [ ] Exécuter `bun run lint`
- [ ] Vérifier qu'il n'y a pas d'erreurs de lint
- [ ] Corriger les erreurs de lint si nécessaire

## Task X+2: Build de production

- [ ] Exécuter `bun run build`
- [ ] Vérifier qu'il n'y a pas d'erreurs de compilation
- [ ] Corriger les erreurs de build si nécessaire

## Task X+3: README de la fonctionnalité

- [ ] Créer `docs/features/{domaine}/ma-feature.md` (kebab-case)
- [ ] Documenter ce qui a été implémenté, comment y accéder, les prérequis et l'utilisation
```

## Why

- No regressions when merging new features
- Code stays deployable
- Catches typing/compilation errors early
- Every feature is onboardable via its README
