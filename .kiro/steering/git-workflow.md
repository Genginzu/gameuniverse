---
inclusion: always
---

# Git & GitHub : Workflow complet

## Repository

- **Owner** : `DarkenNights`
- **Repo** : `gameuniverse`
- **URL** : https://github.com/DarkenNights/gameuniverse

## Commit automatique (sans push)

### Règle

À la fin de chaque modification significative (nouvelle fonctionnalité, fix,
refactoring structurant, mise à jour de documentation, changement de
configuration), **commit** les changements sans attendre que l'utilisateur le
demande. Ne **jamais** push automatiquement — l'utilisateur gère les push
manuellement.

### Quand commit

- ✅ Fin d'une feature ou d'un fix complet
- ✅ Modification structurante (réorganisation de fichiers, nouveau steering)
- ✅ Mise à jour de configuration (CI, hooks, package.json)
- ✅ Mise à jour de documentation
- ✅ Migration de base de données
- ⚠️ Ne **pas** commit un travail en cours ou incomplet

### Convention de commit

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

### Règles de commit

- ✅ Ne commit que les fichiers liés à la modification en cours
- ✅ Vérifier `git status` avant de commit pour éviter des changements parasites
- ✅ Un commit par changement logique — ne pas mélanger feature + fix + docs
- ❌ Ne **jamais** commit de secrets, tokens ou fichiers sensibles
- ❌ Ne **jamais** push automatiquement

## Workflow : Issue → dev → Clôture

Quand l'utilisateur demande de travailler sur une issue GitHub :

1. **Implémenter** les changements demandés dans l'issue sur `dev`
2. **Vérifier la qualité** — lancer lint et tests ciblés :
   - `bun run lint` — corriger les erreurs/warnings si nécessaire
   - `bunx vitest run test/unit/<dossiers-concernés>/` — lancer uniquement les
     tests liés aux fichiers modifiés (voir `testing.md` pour la correspondance)
   - Ne **pas** lancer `bun run test:all` (10+ min) sauf demande explicite
3. **Commit & push** sur `dev`
4. **Clôturer l'issue**

## CI

Le CI se déclenche uniquement lors de la création d'une PR de `dev` vers `main`.
Pas de CI sur les push directs sur `dev`.

## Règles générales

- ✅ Travailler directement sur `dev` pour les issues
- ✅ Toujours lancer lint + tests ciblés avant de push
- ✅ Corriger les erreurs détectées avant de commit
- ✅ `bun run test:all` uniquement sur demande explicite de l'utilisateur
- ❌ Ne **jamais** push directement sur `main`
