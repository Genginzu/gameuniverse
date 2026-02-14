# Implementation Plan: Admin Game Color Preview

## Overview

Créer un composant `GameColorPreview` qui affiche un aperçu en temps réel des
couleurs dans le formulaire admin d'édition de jeu. Le composant est intégré
dans l'onglet Général, observe les champs couleur via `form.watch()`, et
reproduit les patterns visuels de la page détail publique.

## Tasks

- [x] 1. Create the GameColorPreview component
  - [x] 1.1 Create `src/components/admin/games/GameColorPreview.tsx`
    - Accept props: `form: UseFormReturn<AdminGameFormData>`,
      `genres: AdminGenre[]`, `t: (key: string) => string`
    - Use `form.watch()` to observe `background_color`, `accent_color`,
      `label_color`, `text_color`, `translations.0.title`, `cover_image_url`,
      `genres`
    - Call `buildGameColors()` with watched color values to derive `GameColors`
      object
    - Render a miniature preview with:
      - Background area using `colors.backgroundColor` with gradient overlay
        matching `GameHeroSection` pattern
      - Cover image thumbnail (or placeholder icon if no URL)
      - Title text styled with `colors.textColor` (or italic placeholder if no
        title)
      - Genre badges from selected genres resolved via `genres` prop
      - 2-3 simulated overview cards with `border-slate-700` / `bg-slate-800/50`
        styling, icons in `colors.accent`, labels in `colors.labelColor`, values
        in `colors.textColor`
    - Responsive: use `sm:grid-cols` layout that stacks on small screens
    - Keep component under 150 lines
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4,
      4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2_

  - [x] 1.2 Write property tests for GameColorPreview
    - Create
      `test/unit/components/admin/games/GameColorPreview.property.test.ts`
    - Use `fast-check` with `bun:test`
    - **Property 2: All four color roles applied in preview**
    - **Property 3: Gradient overlay contains backgroundColor**
    - **Validates: Requirements 1.4, 4.1, 4.2, 4.3, 4.4**

  - [x] 1.3 Write unit tests for GameColorPreview
    - Create `test/unit/components/admin/games/GameColorPreview.test.tsx`
    - Test rendering with title, cover image, and genres present (Requirements
      2.1, 2.2, 2.3)
    - Test rendering with placeholder content when no contextual data
      (Requirement 2.4)
    - Test overview cards have correct CSS classes (Requirement 4.5)

- [x] 2. Write property test for buildGameColors default merging
  - [x] 2.1 Add property test to
        `test/unit/lib/utils/game-utils.property.test.ts`
    - Use `fast-check` with `bun:test`
    - **Property 1: buildGameColors default merging**
    - For any combination of hex color strings or null/undefined inputs, verify
      output matches provided values or defaults
    - Minimum 100 iterations
    - **Validates: Requirements 1.3, 5.1, 5.2**

- [x] 3. Integrate GameColorPreview into the form
  - [x] 3.1 Update `GameFormGeneralTab` to render `GameColorPreview`
    - Add `genres: AdminGenre[]` to `GeneralTabProps` interface
    - Import and render `<GameColorPreview form={form} genres={genres} t={t} />`
      after `<GameFormColorFields>`
    - _Requirements: 3.1, 3.2_

  - [x] 3.2 Update `GameForm` to pass `genres` to `GameFormGeneralTab`
    - Pass `genres` prop in the `activeTab === "general"` render branch
    - _Requirements: 3.1_

- [x] 4. Exécution des tests complets
  - [x] 4.1 Exécuter `bun run test:all`
  - [x] 4.2 Vérifier que tous les tests passent (parallèles + isolés)
  - [x] 4.3 Corriger les tests en échec si nécessaire

- [x] 5. Lint du code
  - [x] 5.1 Exécuter `bun run lint`
  - [x] 5.2 Vérifier qu'il n'y a pas d'erreurs de lint
  - [x] 5.3 Corriger les erreurs de lint si nécessaire

- [x] 6. Build de production
  - [x] 6.1 Exécuter `bun run build`
  - [x] 6.2 Vérifier qu'il n'y a pas d'erreurs de compilation
  - [x] 6.3 Corriger les erreurs de build si nécessaire

- [x] 7. README de la fonctionnalité
  - [x] 7.1 Créer `docs/README_ADMIN_GAME_COLOR_PREVIEW.md`
  - [x] 7.2 Documenter ce qui a été implémenté, comment y accéder, les prérequis
        et l'utilisation

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- No database migration needed — this is a purely front-end feature
- `buildGameColors()` already handles null/undefined with defaults, so
  Requirement 5 is covered without new logic
- Property tests use `fast-check` library with Bun's test runner
- All tests go in `test/` directory per workspace rules
