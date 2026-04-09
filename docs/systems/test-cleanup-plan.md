# Plan de nettoyage de la suite de tests

## Contexte

- 877 fichiers de tests unitaires, ~5700 tests, suite complète en 10+ min
- Beaucoup de tests à valeur nulle qui gonflent la suite sans protéger contre de vrais bugs

## Phase 1 — Supprimer les tests "fantômes" (8 fichiers)

Tests qui n'importent jamais de code source, créent des objets locaux et les vérifient.

| Fichier | Problème |
|---------|----------|
| `test/unit/hooks/useAuth.test.ts` | Teste `null === null` sur des objets locaux |
| `test/unit/hooks/useAuth.logic.test.ts` | Définit une interface locale et teste des objets littéraux |
| `test/unit/hooks/useAuth.comprehensive.test.ts` | Appelle les mocks directement, jamais le hook |
| `test/unit/hooks/useAuth.property.test.ts` | Teste un reducer local, pas le vrai hook |
| `test/unit/hooks/useImageLoading.test.ts` | Teste des objets d'état locaux |
| `test/unit/hooks/useImageLoading.comprehensive.test.ts` | Définit des helpers locaux et les teste |
| `test/unit/hooks/useGameLibraryStatus.test.ts` | Appelle `fetch()` directement, pas le hook |
| `test/unit/hooks/useGameLibraryStatus.comprehensive.test.ts` | Teste des objets d'état locaux |

Fichiers conservés (testent le vrai code) :
- `useAuth.integration.test.ts` ✅
- `useGameLibraryStatus.integration.test.ts` ✅
- `useImageLoading.integration.test.ts` ✅

## Phase 2 — Supprimer les tests "module is importable" (16 fichiers)

Tests identiques qui font uniquement `expect(Module).toBeDefined()`. Aucune valeur : si le module n'est pas importable, le build casse déjà.

| Fichier |
|---------|
| `test/unit/components/ui/alert.test.tsx` |
| `test/unit/components/ui/card.test.tsx` |
| `test/unit/components/ui/carousel.test.tsx` |
| `test/unit/components/ui/checkbox.test.tsx` |
| `test/unit/components/ui/dialog.test.tsx` |
| `test/unit/components/ui/form-skeleton.test.tsx` |
| `test/unit/components/ui/icon-picker.test.tsx` |
| `test/unit/components/ui/list-skeleton.test.tsx` |
| `test/unit/components/ui/loading-state.test.tsx` |
| `test/unit/components/ui/NavigationProgress.test.tsx` |
| `test/unit/components/ui/page-loading.test.tsx` |
| `test/unit/components/ui/select.test.tsx` |
| `test/unit/components/ui/spinner.test.tsx` |
| `test/unit/components/ui/textarea.test.tsx` |
| `test/unit/components/ui/toast.test.tsx` |
| `test/unit/components/ui/toaster.test.tsx` |

## Phase 3 — Supprimer les stubs "export check" (7 fichiers)

Tests qui vérifient uniquement que le composant s'exporte, alors qu'un fichier `.comprehensive.test.tsx` existe déjà et couvre tout ça + plus.

| Fichier à supprimer | Couvert par |
|---------------------|-------------|
| `test/unit/components/ui/input.test.tsx` | `input.comprehensive.test.tsx` |
| `test/unit/components/ui/label.test.tsx` | `label.comprehensive.test.tsx` |
| `test/unit/components/ui/skeleton.test.tsx` | `skeleton.comprehensive.test.tsx` |
| `test/unit/components/ui/form.test.tsx` | `form.comprehensive.test.tsx` |
| `test/unit/components/ui/loading-button.test.tsx` | `loading-button.comprehensive.test.tsx` |
| `test/unit/components/ui/loading-spinner.test.tsx` | `loading-spinner.comprehensive.test.tsx` |
| `test/unit/components/ui/game-universe-logo.test.tsx` | `game-universe-logo.comprehensive.test.tsx` |

## Phase 4 — Consolider les doublons (3 groupes, 6 → 3 fichiers)

| Groupe | Fichiers à fusionner | Résultat |
|--------|---------------------|----------|
| Button | `button.test.tsx` + `button.comprehensive.test.tsx` | `button.test.tsx` |
| Form | `form.comprehensive.test.tsx` + `form.integration.test.tsx` | `form.test.tsx` |
| LazyImage | `lazy-image.comprehensive.test.tsx` + `lazy-image.integration.test.tsx` | `lazy-image.test.tsx` |

## Résumé

| Action | Fichiers | Impact |
|--------|----------|--------|
| Suppression phase 1 | 8 | Retire ~200+ tests fantômes |
| Suppression phase 2 | 16 | Retire ~16 tests boilerplate |
| Suppression phase 3 | 7 | Retire ~21 tests redondants |
| Consolidation phase 4 | 6 → 3 | Simplifie la maintenance |
| **Total** | **-34 fichiers** | Suite plus rapide, plus lisible |

## Ce qu'on garde

- Tests unitaires sur services/utils/validations (logique métier réelle)
- Property-based tests sur fonctions pures (pagination, filtres, slugs)
- Tests de composants avec RTL qui vérifient des comportements réels
- Tests d'API routes
- Tests e2e Playwright (86 tests, parcours utilisateur)
- Tests d'intégration qui exercent le vrai code
