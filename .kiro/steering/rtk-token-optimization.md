---
inclusion: always
---

# RTK : Optimisation des tokens shell

## Règle

Préfixer toutes les commandes shell avec `rtk` pour réduire la consommation de
tokens (60-90% d'économie). RTK filtre et compresse les sorties avant qu'elles
n'atteignent le contexte.

## Commandes à préfixer

```bash
# Git
rtk git status
rtk git log
rtk git diff
rtk git add .
rtk git commit -m "message"
rtk git push

# Tests
rtk vitest run test/unit/...
rtk bun run test:all
rtk bun run lint

# Build
rtk bun run build
rtk tsc

# Fichiers (quand shell est nécessaire)
rtk ls
rtk find "*.ts" src/
rtk grep "pattern" .
```

## Exceptions (ne PAS préfixer)

- ❌ `cd` (changement de répertoire)
- ❌ `echo` / `export` (variables d'environnement)
- ❌ `rtk gain` / `rtk discover` (méta-commandes RTK elles-mêmes)
- ❌ Commandes interactives nécessitant un input utilisateur

## Règles

- ✅ Toujours préfixer `git`, `bun`, `bunx`, `vitest`, `tsc`, `ls`, `find`,
  `grep` avec `rtk`
- ✅ Utiliser les outils dédiés (read, write, glob, grep tool) quand disponibles
  — RTK ne s'applique qu'aux commandes shell
- ✅ Si une commande RTK échoue, relancer sans `rtk` pour le debug
