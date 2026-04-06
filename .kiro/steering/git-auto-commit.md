---
inclusion: always
---

# Git : Commit & Push automatique

## Règle

À la fin de chaque modification significative (nouvelle fonctionnalité, fix,
refactoring structurant, mise à jour de documentation, changement de
configuration), **commit et push** les changements sans attendre que
l'utilisateur le demande.

## Quand commit & push

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

## Règles

- ✅ Ne commit que les fichiers liés à la modification en cours (pas de fichiers
  non liés)
- ✅ Vérifier `git status` avant de commit pour éviter d'inclure des changements
  parasites
- ✅ Un commit par changement logique — ne pas mélanger feature + fix + docs
  dans un seul commit
- ❌ Ne **jamais** commit de secrets, tokens ou fichiers sensibles
