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

## Règles

- ✅ Travailler directement sur `dev` pour les issues
- ✅ Toujours lancer lint + tests ciblés avant de push
- ✅ Corriger les erreurs détectées avant de commit
- ✅ `bun run test:all` uniquement sur demande explicite de l'utilisateur
- ❌ Ne **jamais** push directement sur `main`
