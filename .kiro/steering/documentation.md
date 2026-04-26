---
inclusion: always
---

# Documentation : Mise à jour continue

## Règle

À la fin de chaque modification significative du projet (nouvelle
fonctionnalité, changement d'architecture, modification de configuration,
nouveau workflow, suppression de feature, etc.), **évaluer** si la documentation
dans `docs/` doit être mise à jour ou créée.

## Quand documenter

- ✅ Ajout d'une nouvelle fonctionnalité → créer un fichier dans le dossier
  approprié sous `docs/features/`
- ✅ Modification d'une fonctionnalité existante → mettre à jour le fichier
  correspondant
- ✅ Changement d'architecture ou de stack → mettre à jour
  `docs/setup/development.md`
- ✅ Nouveau process de déploiement → mettre à jour
  `docs/setup/deployment-checklist.md`
- ✅ Nouveau système transversal → créer dans `docs/systems/`
- ✅ Suppression d'une fonctionnalité → supprimer le fichier correspondant
- ✅ Mettre à jour `docs/README.md` (index) quand un fichier est ajouté/supprimé
- ⚠️ Correction de bug mineure, refactoring interne sans impact API/UI → pas de
  mise à jour nécessaire

## Structure

```
docs/
├── README.md                    # Index général avec liens vers tout
├── setup/                       # Setup, déploiement, architecture
├── features/
│   ├── games/                   # Fonctionnalités liées aux jeux
│   ├── players/                 # Profil joueur, stats, social
│   ├── characters/              # Personnages
│   ├── admin/                   # Panneau d'administration
│   ├── library/                 # Bibliothèque
│   └── pricing/                 # Système de prix
├── systems/                     # Systèmes transversaux (erreurs, search, etc.)
├── igdb/                        # Documentation spécifique IGDB
└── ideas/                       # Idées et réflexions projet
```

## Nommage des fichiers

- Utiliser le **kebab-case** : `mon-fichier.md`
- Noms courts et descriptifs, pas de préfixe `README_`

## Contenu attendu d'un fichier fonctionnalité

Chaque fichier de fonctionnalité doit contenir :

- **Description** : résumé de ce qui a été implémenté
- **Accès** : comment accéder à la fonctionnalité (routes, URLs, navigation)
- **Prérequis** : configuration ou permissions nécessaires
- **Utilisation** : guide rapide des principales actions disponibles

## Interdictions

- ❌ Ne **jamais** laisser une documentation obsolète après une modification
  majeure.
- ❌ Ne **jamais** créer de documentation en dehors de `docs/` (pas de `.md`
  éparpillés dans `src/`).
- ❌ Ne **jamais** documenter uniquement en commentaires de code ce qui mérite
  un README.
