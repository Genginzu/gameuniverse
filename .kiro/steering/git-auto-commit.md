---
inclusion: always
---

# Git : Commit automatique (sans push)

## Règle

À la fin de chaque modification significative (nouvelle fonctionnalité, fix,
refactoring structurant, mise à jour de documentation, changement de
configuration), **commit** les changements sans attendre que l'utilisateur le
demande. Ne **jamais** push automatiquement — l'utilisateur gère les push
manuellement.

## Quand commit

- ✅ Fin d'une feature ou d'un fix complet
- ✅ Modification structurante (réorganisation de fichiers, nouveau steering)
- ✅ Mise à jour de configuration (CI, hooks, package.json)
- ✅ Mise à jour de documentation
- ✅ Migration de base de données
- ⚠️ Ne **pas** commit un travail en cours ou incomplet

## Convention de commit

Le message doit respecter le format imposé par le hook `commit-msg` :

```
<type>: <description courte>
```

Types autorisés : `feat`, `fix`, `refactor`, `docs`, `ci`, `chore`, `style`,
`test`, `perf`

## Référence aux issues

Si le travail en cours est lié à une issue GitHub, **toujours** inclure le
numéro de l'issue dans le message de commit. GitHub rend `#N` cliquable
automatiquement.

Format : placer `#N` au début du titre du commit, juste après le type.

```
fix: #27 replace next/link with i18n navigation
perf: #31 lazy load recharts components
feat: #42 add player stats dashboard
```

- ✅ Chaque commit lié à une issue **doit** contenir `#N` dans le titre
- ✅ Le `#N` se place juste après le `<type>:` pour être visible immédiatement
- ✅ Si plusieurs commits sont nécessaires pour une même issue, chacun porte le
  numéro
- ❌ Ne **jamais** omettre le numéro d'issue quand on travaille sur une issue

## Règles

- ✅ Ne commit que les fichiers liés à la modification en cours (pas de fichiers
  non liés)
- ✅ Vérifier `git status` avant de commit pour éviter d'inclure des changements
  parasites
- ✅ Un commit par changement logique — ne pas mélanger feature + fix + docs
  dans un seul commit
- ❌ Ne **jamais** commit de secrets, tokens ou fichiers sensibles
- ❌ Ne **jamais** push automatiquement — le push est géré manuellement par
  l'utilisateur
