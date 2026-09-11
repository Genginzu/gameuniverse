---
inclusion: always
---

# Git & GitHub : Workflow complet

## Repository

- **Owner** : `Genginzu`
- **Repo** : `gameuniverse`
- **URL** : https://github.com/Genginzu/gameuniverse

## Workflow en 3 phases : modification → validation → push

Le travail suit **toujours** trois phases distinctes, dans cet ordre. Ne
**jamais** sauter une phase.

### Phase 1 — Modification

Implémenter les changements demandés (feature, fix, refactor, doc, etc.).

- ✅ Modifier les fichiers nécessaires
- ✅ Vérifier les diagnostics TypeScript inline (via `code` get_diagnostics)
- ❌ Ne **pas** lancer `lint`, `test`, `type-check` ou `build` à ce stade
- ❌ Ne **pas** commit à ce stade

### Phase 2 — Validation utilisateur (obligatoire)

Une fois la modification effectuée, **demander explicitement à l'utilisateur
si la modification lui convient** avant toute étape de validation technique.

- ✅ Résumer brièvement ce qui a été fait
- ✅ Inviter l'utilisateur à tester visuellement / fonctionnellement
- ✅ Attendre une réponse de l'utilisateur (validation, ajustements, ou push)
- ✅ Si l'utilisateur demande des ajustements → retour Phase 1 (sans
  lint/test/build entre-temps), puis nouvelle demande de validation
- ❌ Ne **jamais** enchaîner automatiquement sur lint/test/build/commit/push
  juste après une modification
- ❌ Ne **jamais** présumer que la modif est validée parce qu'elle compile

Phrase type pour clore la phase :

> « Teste visuellement et dis-moi si ça te convient. Si tu veux des
> ajustements je les fais avant de passer aux vérifications et au commit. »

### Phase 3 — Push (déclenché par l'utilisateur uniquement)

Quand **et seulement quand** l'utilisateur demande explicitement de push (ou
emploie un terme équivalent : « push », « envoie », « commit + push », « tu
peux pousser »), exécuter dans cet ordre **strict** :

1. **`bun run lint`** — corriger les erreurs/warnings éventuels
2. **`bunx vitest run test/unit/<dossiers-concernés>/`** — tests ciblés sur
   les fichiers modifiés (voir `testing.md` pour la correspondance). Ne
   **pas** lancer `bun run test:all` sauf demande explicite
3. **`bun run type-check`** — vérifier qu'il n'y a pas d'erreurs TypeScript
4. **`bun run build`** — vérifier que le build de production passe
5. **`git status`** + **`git add`** ciblé + **`git commit`** avec message
   conventionnel (incluant `#N` si lié à une issue)
6. **`git push`** sur la branche courante (jamais sur `main` sans demande
   explicite)

Si une étape échoue, **corriger** l'erreur, puis **reprendre à l'étape qui a
échoué**. Ne pas push tant que toutes les étapes ne passent pas.

> ⚠️ Phase 3 = uniquement après une demande explicite. Si l'utilisateur dit
> simplement « ok » ou « ça marche », c'est une validation Phase 2, pas un
> ordre de push.

## Convention de commit

Le message doit respecter le format imposé par le hook `commit-msg` :

```
<type>: <description courte>
```

Types autorisés : `feat`, `fix`, `refactor`, `docs`, `ci`, `chore`, `style`,
`test`, `perf`

### Référence aux issues

Si le travail en cours est lié à une issue GitHub, **toujours** inclure le
numéro de l'issue dans le message de commit.

Format : placer `#N` juste après le `<type>:`.

```
fix: #27 replace next/link with i18n navigation
perf: #31 lazy load recharts components
feat: #42 add player stats dashboard
```

- ✅ Chaque commit lié à une issue **doit** contenir `#N` dans le titre
- ✅ Si plusieurs commits sont nécessaires pour une même issue, chacun porte le
  numéro
- ❌ Ne **jamais** omettre le numéro d'issue quand on travaille sur une issue

## Règles de commit

- ✅ Ne commit que les fichiers liés à la modification en cours
- ✅ Vérifier `git status` avant de commit pour éviter des changements parasites
- ✅ Un commit par changement logique — ne pas mélanger feature + fix + docs
- ❌ Ne **jamais** commit de secrets, tokens ou fichiers sensibles
- ❌ Ne **jamais** push automatiquement (sans demande utilisateur)
- ❌ Ne **jamais** commit avant la validation utilisateur (Phase 2)

## Branches

- **`main`** — branche de tronc, déployée. **Plus de branche `dev`.**
- **Branches de travail** — branche courte par feature/fix créée depuis `main`,
  fusionnée dans `main` via PR. La refonte éditoriale vit sur la branche longue
  `design/editorial-refonte`, qui sera fusionnée dans `main` (et **non** `dev`).
- ❌ Ne **jamais** push directement sur `main` : toujours passer par une PR.

## Workflow : Issue GitHub

Quand l'utilisateur demande de travailler sur une issue GitHub :

1. **Phase 1** — Implémenter les changements sur la branche de travail courante
   (ex `design/editorial-refonte`) ou une branche dédiée créée depuis `main`.
2. **Phase 2** — Demander la validation utilisateur (le développement n'est
   considéré terminé qu'après validation visuelle/fonctionnelle).
3. **Phase 3** — Sur demande utilisateur : lint + tests ciblés + type-check +
   build + commit + push sur la branche courante.
4. **Intégration** — Ouvrir une PR vers `main`. Quand le CI de la PR passe,
   l'utilisateur demande **explicitement** le squash and merge (jamais
   automatique).
5. **Clôturer l'issue** uniquement après le merge dans `main`.

## CI

Le CI (`.github/workflows/ci.yml`) se déclenche sur les **PR vers `main`** (et
`workflow_dispatch`). Il ignore les changements purement docs (`docs/**`,
`**/*.md`, `.kiro/**`, `.vscode/**`). Jobs : `lint`, `type-check`,
`unit-tests` (shards api/components/hooks/lib/scripts), `build`, puis `e2e`
(Playwright, 4 shards). Tous doivent passer avant le squash and merge.

## Squash and merge

- ✅ Ouvrir une PR de la branche de travail vers `main`.
- ✅ Attendre que **tout le CI de la PR passe**.
- ✅ Le **squash and merge** est déclenché **uniquement** sur demande explicite
  de l'utilisateur — jamais automatiquement.
- ❌ Pas d'auto-merge : ne **jamais** merger une PR sans que l'utilisateur le
  demande explicitement.

## Release : release-please

Les releases sont **automatisées par release-please** sur `main`. À chaque merge
dans `main`, release-please maintient une **PR de release** dédiée (branche
`release-please--branches--main--components--gameuniverse`) qui accumule le bump
de version + le `CHANGELOG`. Merger cette PR crée le tag / la release.

- ✅ La **convention de commit** (`feat`, `fix`, `perf`, etc.) pilote le
  versioning : `feat` → minor, `fix` / `perf` → patch, `feat!` ou
  `BREAKING CHANGE` → major. `docs` / `chore` / `refactor` / `test` / `ci` /
  `style` n'émettent pas de release mais peuvent apparaître au changelog.
- ✅ Rédiger des messages de commit propres et conventionnels : ils deviennent
  les entrées du `CHANGELOG`.
- ❌ Ne **jamais** éditer manuellement la version ou le `CHANGELOG` : c'est
  release-please qui les gère.
- ❌ Ne **jamais** merger la PR de release sans demande explicite de
  l'utilisateur.

## Règles générales

- ✅ Travailler sur une branche fusionnée dans `main` via PR (plus de `dev`).
- ✅ Toujours obtenir la validation utilisateur (Phase 2) avant Phase 3.
- ✅ Toujours enchaîner lint + tests ciblés + type-check + build avant push.
- ✅ Corriger les erreurs détectées avant de commit/push.
- ✅ `bun run test:all` uniquement sur demande explicite de l'utilisateur.
- ❌ Ne **jamais** push directement sur `main` (passer par une PR).
- ❌ Ne **jamais** lancer lint/test/build entre Phase 1 et Phase 2.
