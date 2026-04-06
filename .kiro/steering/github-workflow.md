---
inclusion: always
---

# GitHub : Repository & Workflow Issues

## Repository

- **Owner** : `DarkenNights`
- **Repo** : `gameuniverse`
- **URL** : https://github.com/DarkenNights/gameuniverse

## Workflow : Issue → Branche → PR → CI → Clôture

Quand l'utilisateur demande de travailler sur une issue GitHub :

1. **Créer une branche** depuis `dev` nommée selon l'issue (ex :
   `feat/42-nom-court` ou `fix/42-nom-court`)
2. **Implémenter** les changements demandés dans l'issue
3. **Commit & push** sur la branche créée
4. **Créer une PR** vers `dev` en référençant l'issue dans le body
   (`Closes #XX`)
5. **Vérifier le CI** — attendre que les checks passent
6. **Merger la PR** vers `dev` une fois le CI passé
7. **Clôturer l'issue** après le merge

## Règles

- ✅ Toujours créer la PR vers `dev`, jamais vers `main`
- ✅ Référencer l'issue dans le body de la PR (`Closes #XX`)
- ✅ Ne clôturer l'issue que si le CI est passé et la PR mergée
- ✅ Si le CI échoue, corriger les erreurs avant de clôturer
- ❌ Ne **jamais** push directement sur `dev` ou `main` pour un travail lié à
  une issue
