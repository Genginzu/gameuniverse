# Plan de nettoyage de la suite de tests

## Résultat

Nettoyage effectué en 2 passes. Bilan :

| Métrique | Avant | Après | Delta |
|----------|-------|-------|-------|
| Fichiers de tests unitaires | 877 | 535 | -342 (39%) |
| Lignes supprimées | — | — | ~19 300 |

### Fichiers supprimés par catégorie

| Catégorie | Nombre | Raison |
|-----------|--------|--------|
| Tests fantômes (hooks) | 8 | N'importent jamais le code source, testent des objets locaux |
| "module is importable" (UI) | 16 | Boilerplate identique : `expect(Module).toBeDefined()` |
| Stubs "export check" (UI) | 7 | Redondants avec les fichiers `.comprehensive.test` |
| "module is importable" (composants) | 21 | Même pattern appliqué aux skeletons, empty states, etc. |
| Property tests locaux | 22 | Définissent des fonctions locales et les testent, jamais le vrai code |
| "module is importable" batch (265) | 265 | Pattern `import * as ComponentModule` identique sur 265 fichiers |
| Consolidation (doublons) | 3 | button, form, lazy-image : N fichiers → 1 |

### Fichiers conservés (800)

- Tests unitaires sur services/utils/validations (logique métier)
- Property-based tests qui importent du vrai code source
- Tests de composants avec RTL qui vérifient des comportements réels
- Tests d'API routes (appellent les vrais handlers)
- Tests e2e Playwright (86 tests)
- Tests d'intégration

## Règles pour éviter la régression

- ✅ Tout test doit importer et exercer du vrai code depuis `src/`
- ✅ Les property tests doivent tester des fonctions exportées, pas des réimplémentations locales
- ❌ Ne jamais créer de test "module is importable" (`expect(Module).toBeDefined()`)
- ❌ Ne jamais créer de test qui définit une interface/fonction locale et la teste sans toucher `src/`
- ❌ Ne jamais dupliquer un test sous plusieurs suffixes (`.test`, `.comprehensive.test`, `.integration.test`) sans raison claire
