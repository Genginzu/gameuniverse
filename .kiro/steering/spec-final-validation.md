---
inclusion: fileMatch
fileMatchPattern: ".kiro/specs/**/tasks.md"
---

# Validation Finale des Specs

## Règle

Chaque spec doit **obligatoirement** inclure comme dernières tâches une
validation complète de l'application.

## Tâches Finales Obligatoires

À la fin de chaque fichier `tasks.md`, les dernières tâches doivent être :

### 1. Suppression des tests obsolètes

Avant d'exécuter les tests, **identifier et supprimer** les anciens tests qui
ne servent plus :

- Tests dont le fichier source a été supprimé ou déplacé
- Tests qui couvrent du code retiré pendant la spec
- `it.skip` / `describe.skip` sans raison documentée
- Mocks/fixtures orphelins dans `test/`

Procédure :

- Comparer la liste des fichiers modifiés/supprimés par la spec avec les
  fichiers de `test/unit/`, `test/integration/`, `test/scripts/`
- Supprimer les fichiers de test entiers ou les `it()` / `describe()`
  individuels correspondants
- Vérifier qu'aucun import cassé ne reste

**INTERDIT** : Ne **jamais** « commenter » un test pour le faire passer ni
laisser un test référençant un fichier inexistant. Voir aussi le steering
`testing.md` section « Maintenance des tests ».

### 2. Exécution des Tests

```bash
bun run test:all
```

- Exécuter tous les tests de l'application (parallèles + isolés)
- Vérifier que tous les tests passent
- Si des tests échouent, les corriger avant de continuer

**IMPORTANT**: Utiliser `bun run test:all` et non `bun test` pour inclure les
tests isolés.

**INTERDIT** : Ne **jamais** ajouter `2>&1` à la fin d'une commande de test.
Exécuter la commande telle quelle, sans redirection.

**ANTI-DOUBLON** : Si la dernière tâche d'implémentation (ou un checkpoint
final) exécute déjà `bun run test:all`, ne pas ajouter cette tâche une seconde
fois. Passer directement au lint.

### 3. Lint du Code

```bash
bun run lint
```

- Exécuter le linter sur tout le projet
- Vérifier qu'il n'y a pas d'erreurs ni de warnings de lint
- Corriger les erreurs et les warnings de lint si nécessaire

### 4. Build de Production

```bash
bun run build
```

- Exécuter le build de production
- Vérifier qu'il n'y a pas d'erreurs de compilation
- Si des erreurs sont détectées, les corriger

### 5. README de la Fonctionnalité

- Créer un fichier `docs/features/{domaine}/ma-feature.md (kebab-case)`
  documentant la fonctionnalité
- Le README doit contenir :
  - **Description** : résumé de ce qui a été implémenté
  - **Accès** : comment accéder à la fonctionnalité (routes, URLs, navigation)
  - **Prérequis** : configuration ou permissions nécessaires
  - **Utilisation** : guide rapide des principales actions disponibles

## Format des Tâches

Ajouter ces tâches à la fin du fichier `tasks.md` :

```markdown
## Task X: Suppression des tests obsolètes

- [ ] Identifier les fichiers source modifiés/supprimés par la spec
- [ ] Supprimer les fichiers de test correspondants devenus inutiles
      (`test/unit/...`, `test/integration/...`, `test/scripts/...`)
- [ ] Supprimer les `it()` / `describe()` individuels qui ciblent du code
      retiré
- [ ] Supprimer les mocks/fixtures orphelins
- [ ] Vérifier qu'aucun import cassé ne reste

## Task X+1: Exécution des tests complets (si pas déjà fait dans la tâche précédente)

- [ ] Exécuter `bun run test:all`
- [ ] Vérifier que tous les tests passent (parallèles + isolés)
- [ ] Corriger les tests en échec si nécessaire

## Task X+2: Lint du code (ou Task X si les tests sont déjà couverts)

- [ ] Exécuter `bun run lint`
- [ ] Vérifier qu'il n'y a pas d'erreurs de lint
- [ ] Corriger les erreurs de lint si nécessaire

## Task X+3: Build de production

- [ ] Exécuter `bun run build`
- [ ] Vérifier qu'il n'y a pas d'erreurs de compilation
- [ ] Corriger les erreurs de build si nécessaire

## Task X+4: README de la fonctionnalité

- [ ] Créer `docs/features/{domaine}/ma-feature.md (kebab-case)`
- [ ] Documenter ce qui a été implémenté, comment y accéder, les prérequis et
      l'utilisation
```

## Pourquoi ?

- Garantir que les nouvelles fonctionnalités n'introduisent pas de régressions
- S'assurer que le code respecte les standards de qualité
- S'assurer que l'application reste déployable
- Détecter les erreurs de typage et de compilation tôt
- Maintenir la qualité du code
- Documenter chaque fonctionnalité pour faciliter l'onboarding et la maintenance
