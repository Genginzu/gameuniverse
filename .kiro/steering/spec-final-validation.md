---
inclusion: fileMatch
fileMatchPattern: ".kiro/specs/**/tasks.md"
---

# Validation Finale des Specs

## Règle

Chaque spec doit **obligatoirement** inclure comme dernières tâches une
validation complète de l'application.

## Tâches Finales Obligatoires

À la fin de chaque fichier `tasks.md`, les trois dernières tâches doivent être :

### 1. Exécution des Tests

```bash
bun test --run
```

- Exécuter tous les tests de l'application
- Vérifier que tous les tests passent
- Si des tests échouent, les corriger avant de continuer

### 2. Lint du Code

```bash
bun run lint
```

- Exécuter le linter sur tout le projet
- Vérifier qu'il n'y a pas d'erreurs de lint
- Corriger les erreurs de lint si nécessaire

### 3. Build de Production

```bash
bun run build
```

- Exécuter le build de production
- Vérifier qu'il n'y a pas d'erreurs de compilation
- Si des erreurs sont détectées, les corriger

## Format des Tâches

Ajouter ces tâches à la fin du fichier `tasks.md` :

```markdown
## Task X: Exécution des tests complets

- [ ] Exécuter `bun test --run`
- [ ] Vérifier que tous les tests passent
- [ ] Corriger les tests en échec si nécessaire

## Task X+1: Lint du code

- [ ] Exécuter `bun run lint`
- [ ] Vérifier qu'il n'y a pas d'erreurs de lint
- [ ] Corriger les erreurs de lint si nécessaire

## Task X+2: Build de production

- [ ] Exécuter `bun run build`
- [ ] Vérifier qu'il n'y a pas d'erreurs de compilation
- [ ] Corriger les erreurs de build si nécessaire
```

## Pourquoi ?

- Garantir que les nouvelles fonctionnalités n'introduisent pas de régressions
- S'assurer que le code respecte les standards de qualité
- S'assurer que l'application reste déployable
- Détecter les erreurs de typage et de compilation tôt
- Maintenir la qualité du code
