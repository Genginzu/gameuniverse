---
inclusion: always
---

# GitHub : Repository & Workflow Issues

## Repository

- **Owner** : `DarkenNights`
- **Repo** : `gameuniverse`
- **URL** : https://github.com/DarkenNights/gameuniverse

## Workflow : Issue → dev → Clôture

Quand l'utilisateur demande de travailler sur une issue GitHub :

1. **Implémenter** les changements demandés dans l'issue sur `dev`
2. **Vérifier la qualité** — lancer lint, tests et build :
   - `bun run lint` — corriger les erreurs/warnings si nécessaire
   - `bun run test:all` — corriger les tests en échec si nécessaire
   - `bun run build` — corriger les erreurs de compilation si nécessaire
3. **Commit & push** sur `dev`
4. **Clôturer l'issue**

## CI

Le CI se déclenche uniquement lors de la création d'une PR de `dev` vers `main`.
Pas de CI sur les push directs sur `dev`.

## Règles

- ✅ Travailler directement sur `dev` pour les issues
- ✅ Toujours lancer lint + tests + build avant de push
- ✅ Corriger les erreurs détectées avant de commit
- ❌ Ne **jamais** push directement sur `main`
