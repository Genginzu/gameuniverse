---
inclusion: always
---

# Documentation : Mise à jour continue

## Règle

À la fin de chaque modification significative du projet (nouvelle fonctionnalité,
changement d'architecture, modification de configuration, nouveau workflow,
suppression de feature, etc.), **évaluer** si la documentation dans `docs/` doit
être mise à jour ou créée.

## Quand documenter

- ✅ Ajout d'une nouvelle fonctionnalité → créer `docs/dev/README_{FEATURE}.md`
- ✅ Modification d'une fonctionnalité existante → mettre à jour le README
  correspondant dans `docs/dev/`
- ✅ Changement d'architecture ou de stack → mettre à jour
  `docs/dev/DEVELOPMENT.md`
- ✅ Nouveau process de déploiement → mettre à jour
  `docs/dev/DEPLOYMENT_CHECKLIST.md`
- ✅ Suppression d'une fonctionnalité → archiver ou supprimer le README
  correspondant
- ⚠️ Correction de bug mineure, refactoring interne sans impact API/UI → pas de
  mise à jour nécessaire

## Structure

```
docs/
├── dev/                  # Documentation technique des fonctionnalités
│   ├── README_*.md       # Un fichier par fonctionnalité
│   ├── DEVELOPMENT.md    # Setup, architecture, stack
│   └── DEPLOYMENT_CHECKLIST.md
├── igdb/                 # Documentation spécifique IGDB
└── Ideas/                # Idées et réflexions projet
```

## Contenu attendu d'un README fonctionnalité

Chaque `docs/dev/README_{FEATURE}.md` doit contenir :

- **Description** : résumé de ce qui a été implémenté
- **Accès** : comment accéder à la fonctionnalité (routes, URLs, navigation)
- **Prérequis** : configuration ou permissions nécessaires
- **Utilisation** : guide rapide des principales actions disponibles

## Interdictions

- ❌ Ne **jamais** laisser une documentation obsolète après une modification
  majeure.
- ❌ Ne **jamais** créer de documentation en dehors de `docs/` (pas de `.md`
  éparpillés dans `src/`).
- ❌ Ne **jamais** documenter uniquement en commentaires de code ce qui mérite un
  README.
